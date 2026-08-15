from datetime import datetime, date, timezone
from typing import Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.core.database import get_db
from app.core.security import require_feature
from app.models.finance import Facture, FactureLigne, Paiement
from app.models.partenaire import Partenaire
from app.models.enums import StatutFacture, ModePaiement, StatutPaiement
from app.schemas.finance import (
  FactureCreate,
  FactureUpdate,
  FactureResponse,
  FactureListResponse,
  PaiementCreate,
  PaiementResponse,
)
from app.services.pdf_finance_service import generate_facture_pdf

router = APIRouter(prefix="/factures", tags=["Finances — Facturation & Règlements"])


@router.get("", response_model=FactureListResponse, summary="List Invoices with Financial Totals", dependencies=[Depends(require_feature("view_facture"))])
def list_factures(
  search: Optional[str] = Query(None),
  statut: Optional[StatutFacture] = Query(None),
  client_id: Optional[str] = Query(None),
  db: Session = Depends(get_db),
):
  query = db.query(Facture).filter(Facture.archived_at.is_(None))

  if statut:
    query = query.filter(Facture.statut == statut)
  if client_id:
    try:
      query = query.filter(Facture.client_id == UUID(client_id))
    except Exception:
      pass
  if search:
    search_pattern = f"%{search}%"
    query = query.outerjoin(Partenaire, Facture.client_id == Partenaire.id).filter(
      or_(
        Facture.numero.ilike(search_pattern),
        Partenaire.nom_commercial.ilike(search_pattern)
      )
    )

  factures = query.order_by(desc(Facture.created_at)).all()

  total_ca = sum(f.total_ttc for f in factures)
  total_encaisse = sum(f.montant_paye for f in factures)
  total_creances = sum(f.montant_restant for f in factures)

  items = []
  for f in factures:
    client_name = f.client.nom_commercial if f.client else "Client"
    resp = FactureResponse.model_validate(f)
    resp.client_nom = client_name
    items.append(resp)

  return FactureListResponse(
    items=items,
    total=len(items),
    total_chiffre_affaires=total_ca,
    total_encaisse=total_encaisse,
    total_creances=total_creances,
  )


@router.get("/{id}", response_model=FactureResponse, summary="Get Invoice Detail & Payment Ledger", dependencies=[Depends(require_feature("view_facture"))])
def get_facture_detail(id: str, db: Session = Depends(get_db)):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Facture invalide")

  facture = db.query(Facture).filter(Facture.id == u_id, Facture.archived_at.is_(None)).first()
  if not facture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")

  client_name = facture.client.nom_commercial if facture.client else "Client"
  resp = FactureResponse.model_validate(facture)
  resp.client_nom = client_name
  return resp


@router.post("", response_model=FactureResponse, status_code=status.HTTP_201_CREATED, summary="Create Invoice", dependencies=[Depends(require_feature("create_facture"))])
def create_facture(payload: FactureCreate, db: Session = Depends(get_db)):
  try:
    client_uuid = UUID(payload.client_id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identifiant client invalide")

  client = db.query(Partenaire).filter(Partenaire.id == client_uuid).first()
  if not client:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client spécifié introuvable")

  if not payload.numero:
    count = db.query(Facture).count() + 1
    numero = f"INV-{datetime.now().year}-{count:03d}"
  else:
    numero = payload.numero

  total_ht = 0.0
  ligne_objects = []
  for lig in payload.lignes:
    tot = lig.quantite * lig.prix_unitaire
    total_ht += tot
    ligne_objects.append(
      FactureLigne(
        id=uuid4(),
        service=lig.service,
        description=lig.description,
        quantite=lig.quantite,
        prix_unitaire=lig.prix_unitaire,
        total_ligne=tot,
      )
    )

  tva_montant = total_ht * (payload.taux_tva / 100.0)
  total_ttc = total_ht + tva_montant

  contrat_u = UUID(payload.contrat_id) if payload.contrat_id else None
  devis_u = UUID(payload.devis_id) if payload.devis_id else None
  facture = Facture(
    id=uuid4(),
    numero=numero,
    client_id=client_uuid,
    contrat_id=contrat_u,
    devis_id=devis_u,
    date_emission=payload.date_emission,
    date_echeance=payload.date_echeance,
    mode_reglement=payload.mode_reglement,
    statut=StatutFacture.EN_ATTENTE,
    total_ht=total_ht,
    taux_tva=payload.taux_tva,
    montant_tva=tva_montant,
    total_ttc=total_ttc,
    montant_paye=0.0,
    montant_restant=total_ttc,
    notes=payload.notes,
    lignes=ligne_objects,
  )

  db.add(facture)
  db.commit()
  db.refresh(facture)

  try:
    pdf_url = generate_facture_pdf(facture, client)
    facture.url_pdf = pdf_url
    db.commit()
    db.refresh(facture)
  except Exception as e:
    print(f"Warning: PDF generation failed: {e}")

  resp = FactureResponse.model_validate(facture)
  resp.client_nom = client.nom_commercial
  return resp


@router.post("/{id}/paiements", response_model=PaiementResponse, summary="Record Payment on Invoice", dependencies=[Depends(require_feature("record_paiement"))])
def record_payment(id: str, payload: PaiementCreate, db: Session = Depends(get_db)):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Facture invalide")

  facture = db.query(Facture).filter(Facture.id == u_id, Facture.archived_at.is_(None)).first()
  if not facture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")

  if payload.montant <= 0:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le montant du paiement doit être supérieur à 0.")

  if payload.montant >(facture.montant_restant + 0.01):
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Le montant saisi ({payload.montant:,.2f} DZD) dépasse le reste à payer ({facture.montant_restant:,.2f} DZD).",
    )

  paiement = Paiement(
    id=uuid4(),
    facture_id=facture.id,
    date=payload.date,
    montant=payload.montant,
    mode=payload.mode,
    reference=payload.reference,
    banque=payload.banque,
    statut=StatutPaiement.VALIDE,
    notes=payload.notes,
  )
  db.add(paiement)

  facture.montant_paye += payload.montant
  facture.montant_restant = max(0.0, facture.total_ttc - facture.montant_paye)

  if facture.montant_restant <= 0.01:
    facture.statut = StatutFacture.PAYE
  else:
    facture.statut = StatutFacture.PARTIEL

  db.commit()
  db.refresh(paiement)
  db.refresh(facture)

  try:
    pdf_url = generate_facture_pdf(facture, facture.client)
    facture.url_pdf = pdf_url
    db.commit()
  except Exception:
    pass

  return PaiementResponse.model_validate(paiement)


@router.post("/{id}/generate-pdf", summary="Generate or Regenerate Invoice PDF")
def generate_pdf_endpoint(id: str, db: Session = Depends(get_db)):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Facture invalide")

  facture = db.query(Facture).filter(Facture.id == u_id, Facture.archived_at.is_(None)).first()
  if not facture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")

  pdf_url = generate_facture_pdf(facture, facture.client)
  facture.url_pdf = pdf_url
  db.commit()

  return {"url_pdf": pdf_url, "message": "Document PDF de la facture généré avec succès."}


@router.delete("/{id}", summary="Archive Invoice", dependencies=[Depends(require_feature("edit_facture"))])
def delete_facture(id: str, db: Session = Depends(get_db)):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Facture invalide")

  facture = db.query(Facture).filter(Facture.id == u_id).first()
  if not facture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")

  facture.archived_at = datetime.now(timezone.utc)
  db.commit()
  return {"message": "Facture archivée avec succès"}
