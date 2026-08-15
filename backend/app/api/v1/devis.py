from datetime import datetime, date, timezone
from typing import Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.core.database import get_db
from app.core.security import require_feature
from app.models.finance import Devis, DevisLigne
from app.models.partenaire import Partenaire
from app.models.contrat import Contrat
from app.models.enums import StatutDevis, StatutContrat
from app.schemas.finance import (
  DevisCreate,
  DevisUpdate,
  DevisResponse,
  DevisListResponse,
)
from app.services.pdf_finance_service import generate_devis_pdf

router = APIRouter(prefix="/devis", tags=["Finances — Devis Commerciaux"])


@router.get("", response_model=DevisListResponse, summary="List all Commercial Quotations", dependencies=[Depends(require_feature("view_devis"))])
def list_devis(
  search: Optional[str] = Query(None),
  statut: Optional[StatutDevis] = Query(None),
  client_id: Optional[str] = Query(None),
  db: Session = Depends(get_db),
):
  query = db.query(Devis).filter(Devis.archived_at.is_(None))

  if statut:
    query = query.filter(Devis.statut == statut)
  if client_id:
    try:
      query = query.filter(Devis.client_id == UUID(client_id))
    except Exception:
      pass
  if search:
    search_pattern = f"%{search}%"
    query = query.outerjoin(Partenaire, Devis.client_id == Partenaire.id).filter(
      or_(
        Devis.numero.ilike(search_pattern),
        Devis.objet.ilike(search_pattern),
        Partenaire.nom_commercial.ilike(search_pattern)
      )
    )

  devis_list = query.order_by(desc(Devis.created_at)).all()

  items = []
  for d in devis_list:
    client_name = d.client.nom_commercial if d.client else "Client Inconnu"
    resp = DevisResponse.model_validate(d)
    resp.client_nom = client_name
    items.append(resp)

  return DevisListResponse(items=items, total=len(items))


@router.get("/{id}", response_model=DevisResponse, summary="Get Devis Detail", dependencies=[Depends(require_feature("view_devis"))])
def get_devis_detail(id: str, db: Session = Depends(get_db)):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Devis invalide")

  devis = db.query(Devis).filter(Devis.id == u_id, Devis.archived_at.is_(None)).first()
  if not devis:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devis non trouvé")

  client_name = devis.client.nom_commercial if devis.client else "Client Inconnu"
  resp = DevisResponse.model_validate(devis)
  resp.client_nom = client_name
  return resp


@router.post("", response_model=DevisResponse, status_code=status.HTTP_201_CREATED, summary="Create New Devis", dependencies=[Depends(require_feature("create_devis"))])
def create_devis(payload: DevisCreate, db: Session = Depends(get_db)):
  try:
    client_uuid = UUID(str(payload.client_id))
  except Exception:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identifiant client invalide")

  client = db.query(Partenaire).filter(Partenaire.id == client_uuid).first()
  if not client:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client spécifié introuvable")

  if not payload.numero:
    count = db.query(Devis).count() + 1
    numero = f"DEV-{datetime.now().year}-{count:03d}"
  else:
    numero = payload.numero

  total_ht = 0.0
  ligne_objects = []
  for lig in payload.lignes:
    tot = lig.quantite * lig.prix_unitaire
    total_ht += tot
    ligne_objects.append(
      DevisLigne(
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

  devis = Devis(
    id=uuid4(),
    numero=numero,
    client_id=client_uuid,
    date_emission=payload.date_emission,
    date_validite=payload.date_validite,
    statut=StatutDevis.BROUILLON,
    objet=payload.objet,
    conditions_reglement=payload.conditions_reglement,
    total_ht=total_ht,
    taux_tva=payload.taux_tva,
    montant_tva=tva_montant,
    total_ttc=total_ttc,
    lignes=ligne_objects,
  )

  db.add(devis)
  db.commit()
  db.refresh(devis)

  try:
    pdf_url = generate_devis_pdf(devis, client)
    devis.url_pdf = pdf_url
    db.commit()
    db.refresh(devis)
  except Exception as e:
    print(f"Warning: PDF generation failed: {e}")

  resp = DevisResponse.model_validate(devis)
  resp.client_nom = client.nom_commercial
  return resp


@router.put("/{id}", response_model=DevisResponse, summary="Update Devis", dependencies=[Depends(require_feature("edit_devis"))])
def update_devis(id: str, payload: DevisUpdate, db: Session = Depends(get_db)):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Devis invalide")

  devis = db.query(Devis).filter(Devis.id == u_id, Devis.archived_at.is_(None)).first()
  if not devis:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devis non trouvé")

  if payload.client_id:
    try:
      devis.client_id = UUID(str(payload.client_id))
    except Exception:
      pass
  if payload.date_validite:
    devis.date_validite = payload.date_validite
  if payload.statut:
    devis.statut = payload.statut
  if payload.objet:
    devis.objet = payload.objet
  if payload.conditions_reglement is not None:
    devis.conditions_reglement = payload.conditions_reglement
  if payload.taux_tva is not None:
    devis.taux_tva = payload.taux_tva

  if payload.lignes is not None:
    db.query(DevisLigne).filter(DevisLigne.devis_id == devis.id).delete()
    total_ht = 0.0
    for lig in payload.lignes:
      tot = lig.quantite * lig.prix_unitaire
      total_ht += tot
      db.add(
        DevisLigne(
          id=uuid4(),
          devis_id=devis.id,
          service=lig.service,
          description=lig.description,
          quantite=lig.quantite,
          prix_unitaire=lig.prix_unitaire,
          total_ligne=tot,
        )
      )
    devis.total_ht = total_ht
    devis.montant_tva = total_ht * (devis.taux_tva / 100.0)
    devis.total_ttc = total_ht + devis.montant_tva

  db.commit()
  db.refresh(devis)

  resp = DevisResponse.model_validate(devis)
  resp.client_nom = devis.client.nom_commercial if devis.client else "Client"
  return resp


@router.post("/{id}/convertir-contrat", summary="Convert Accepted Devis to Active Contract", dependencies=[Depends(require_feature("convert_devis_to_contrat"))])
def convertir_devis_en_contrat(id: str, db: Session = Depends(get_db)):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Devis invalide")

  devis = db.query(Devis).filter(Devis.id == u_id, Devis.archived_at.is_(None)).first()
  if not devis:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devis non trouvé")

  if devis.contrat_id:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce devis est déjà converti en contrat.")

  ctr_count = db.query(Contrat).count() + 1
  ref_contrat = f"CTR-{datetime.now().year}-{ctr_count:03d}"

  nouveau_contrat = Contrat(
    id=uuid4(),
    reference=ref_contrat,
    partenaire_id=devis.client_id,
    objet=f"Exécution suite devis {devis.numero} : {devis.objet}",
    type_contrat="Transport Voyageurs",
    date_debut=devis.date_emission,
    date_fin=devis.date_validite,
    montant=devis.total_ttc,
    statut=StatutContrat.ACTIF,
  )
  db.add(nouveau_contrat)

  devis.statut = StatutDevis.ACCEPTE
  devis.contrat_id = nouveau_contrat.id
  db.commit()

  return {
    "message": "Devis converti avec succès en contrat d'exploitation.",
    "contrat_id": str(nouveau_contrat.id),
    "contrat_reference": nouveau_contrat.reference,
  }


@router.post("/{id}/generate-pdf", summary="Generate or Regenerate Devis PDF")
def generate_pdf_endpoint(id: str, db: Session = Depends(get_db)):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Devis invalide")

  devis = db.query(Devis).filter(Devis.id == u_id, Devis.archived_at.is_(None)).first()
  if not devis:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devis non trouvé")

  pdf_url = generate_devis_pdf(devis, devis.client)
  devis.url_pdf = pdf_url
  db.commit()

  return {"url_pdf": pdf_url, "message": "Document PDF du devis généré avec succès."}


@router.delete("/{id}", summary="Archive Devis", dependencies=[Depends(require_feature("edit_devis"))])
def delete_devis(id: str, db: Session = Depends(get_db)):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Devis invalide")

  devis = db.query(Devis).filter(Devis.id == u_id).first()
  if not devis:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devis non trouvé")

  devis.archived_at = datetime.now(timezone.utc)
  db.commit()
  return {"message": "Devis archivé avec succès"}
