from datetime import datetime, date, timezone
from typing import Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
import os

from app.core.database import get_db
from app.core.security import require_feature
from app.models.finance import Facture
from app.models.partenaire import Partenaire
from app.models.enums import StatutFacture, ModePaiement
from app.schemas.finance import (
  FactureCreate,
  FactureResponse,
  FactureListResponse,
  EncaissementFacture,
)

router = APIRouter(prefix="/factures", tags=["Finances — Facturation"])

STATIC_DOCS = os.path.join(
  os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "assets", "documents"
)


@router.get("", response_model=FactureListResponse, summary="List Invoices", dependencies=[Depends(require_feature("view_facture"))])
def list_factures(
  search: Optional[str] = Query(None),
  statut: Optional[StatutFacture] = Query(None),
  client_id: Optional[str] = Query(None),
  sort_by: Optional[str] = Query(None, description="Field to sort by"),
  sort_order: Optional[str] = Query("asc", description="Sort order: asc or desc"),
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
        Partenaire.nom_commercial.ilike(search_pattern),
      )
    )

  if sort_by and hasattr(Facture, sort_by):
    col = getattr(Facture, sort_by)
    query = query.order_by(desc(col) if sort_order == "desc" else col.asc())
  else:
    query = query.order_by(desc(Facture.created_at))

  factures = query.all()

  total_montant = sum(f.montant_facture for f in factures)
  total_encaisse = sum(f.montant_facture for f in factures if f.statut == StatutFacture.PAYEE)
  total_en_attente = sum(f.montant_facture for f in factures if f.statut == StatutFacture.EN_ATTENTE)

  items = []
  for f in factures:
    client_name = f.client.nom_commercial if f.client else "Client"
    resp = FactureResponse.model_validate(f)
    resp.client_nom = client_name
    items.append(resp)

  return FactureListResponse(
    items=items,
    total=len(items),
    total_montant=total_montant,
    total_encaisse=total_encaisse,
    total_en_attente=total_en_attente,
  )


@router.get("/{id}", response_model=FactureResponse, summary="Get Invoice Detail", dependencies=[Depends(require_feature("view_facture"))])
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
    client_uuid = UUID(str(payload.client_id))
  except Exception:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identifiant client invalide")

  client = db.query(Partenaire).filter(Partenaire.id == client_uuid).first()
  if not client:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client spécifié introuvable")

  existing_facture = db.query(Facture).filter(Facture.numero == payload.numero).first()
  if existing_facture:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Une facture avec ce numéro existe déjà.")

  numero = payload.numero

  facture = Facture(
    id=uuid4(),
    numero=numero,
    client_id=client_uuid,
    date_facture=payload.date_facture,
    mois_realisation=payload.mois_realisation,
    montant_facture=payload.montant_facture,
    statut=StatutFacture.EN_ATTENTE,
    remarques=payload.remarques,
  )

  db.add(facture)
  db.commit()
  db.refresh(facture)

  resp = FactureResponse.model_validate(facture)
  resp.client_nom = client.nom_commercial
  return resp


@router.post("/{id}/encaisser", response_model=FactureResponse, summary="Encaisser une Facture (Passer au statut PAYEE)", dependencies=[Depends(require_feature("record_paiement"))])
def encaisser_facture(
  id: str,
  mode_reglement: ModePaiement = Form(...),
  date_reglement: str = Form(...),
  document: Optional[UploadFile] = File(None),
  db: Session = Depends(get_db),
):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Facture invalide")

  facture = db.query(Facture).filter(Facture.id == u_id, Facture.archived_at.is_(None)).first()
  if not facture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")

  if facture.statut == StatutFacture.PAYEE:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cette facture est déjà payée.")

  if facture.statut == StatutFacture.ANNULEE:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible d'encaisser une facture annulée.")

  facture.mode_reglement = mode_reglement
  try:
    facture.date_reglement = datetime.strptime(date_reglement, "%Y-%m-%d").date()
  except ValueError:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Format de date invalide (attendu: YYYY-MM-DD)")

  if document and document.filename:
    try:
      doc_dir = os.path.join(STATIC_DOCS, "reglements")
      os.makedirs(doc_dir, exist_ok=True)
      safe_name = f"reglement_{facture.numero}_{document.filename.replace(' ', '_')}"
      file_path = os.path.join(doc_dir, safe_name)
      content = await_document_read(document)
      with open(file_path, "wb") as f:
        f.write(content)
      facture.url_document_reglement = f"/assets/documents/reglements/{safe_name}"
    except Exception as e:
      print(f"Warning: document upload failed: {e}")

  facture.statut = StatutFacture.PAYEE
  db.commit()
  db.refresh(facture)

  resp = FactureResponse.model_validate(facture)
  resp.client_nom = facture.client.nom_commercial if facture.client else "Client"
  return resp


async def await_document_read(document: UploadFile) -> bytes:
  return await document.read()


@router.post("/{id}/annuler", response_model=FactureResponse, summary="Annuler une Facture", dependencies=[Depends(require_feature("edit_facture"))])
def annuler_facture(id: str, db: Session = Depends(get_db)):
  try:
    u_id = UUID(id)
  except Exception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identifiant Facture invalide")

  facture = db.query(Facture).filter(Facture.id == u_id, Facture.archived_at.is_(None)).first()
  if not facture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")

  if facture.statut == StatutFacture.PAYEE:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible d'annuler une facture déjà payée.")

  facture.statut = StatutFacture.ANNULEE
  db.commit()
  db.refresh(facture)

  resp = FactureResponse.model_validate(facture)
  resp.client_nom = facture.client.nom_commercial if facture.client else "Client"
  return resp


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
