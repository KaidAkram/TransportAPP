from datetime import datetime, timezone, date as dt_date
import math
import os
from typing import Optional, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_feature
from app.models.contrat import Caution, Contrat
from app.models.partenaire import Partenaire, Client
from app.models.document import Document
from app.models.enums import TypeCaution, StatutCaution
from app.schemas.caution import (
  CautionCreate,
  CautionUpdate,
  CautionRead,
  CautionDetail,
  CautionListResponse,
)
from app.schemas.document import DocumentSummary
from app.services.pdf_service import generate_caution_pdf
from app.services.document_service import compute_validity_status
from app.models.settings import SystemSettings

router = APIRouter(prefix="/cautions", tags=["Module 4 — Gestion des Cautions Bancaires"])


@router.get("", response_model=CautionListResponse, summary="List Bank Cautions", dependencies=[Depends(require_feature("view_caution"))])
def list_cautions(
  search: Optional[str] = Query(None, description="Search by number, object, or client name"),
  type: Optional[TypeCaution] = Query(None, description="Filter by caution type (SOUMISSION or BONNE_EXECUTION)"),
  statut: Optional[StatutCaution] = Query(None, description="Filter by caution status"),
  client_id: Optional[UUID] = Query(None, description="Filter by client ID"),
  contrat_id: Optional[UUID] = Query(None, description="Filter by contract ID"),
  include_archived: bool = Query(False, description="Include soft-deleted cautions"),
  page: int = Query(1, ge=1, description="Page number"),
  per_page: int = Query(10, ge=1, le=100, description="Items per page"),
  db: Session = Depends(get_db),
):
  query = db.query(Caution)

  if not include_archived:
    query = query.filter(Caution.archived_at.is_(None))

  if search:
    search_pattern = f"%{search}%"
    query = query.join(Partenaire, Caution.client_id == Partenaire.id, isouter=True).filter(
      or_(
        Caution.numero.ilike(search_pattern),
        Caution.objet.ilike(search_pattern),
        Caution.reference_numero.ilike(search_pattern),
        Partenaire.nom_commercial.ilike(search_pattern),
      )
    )

  if type:
    query = query.filter(Caution.type == type)

  if statut:
    query = query.filter(Caution.statut == statut)

  if client_id:
    query = query.filter(Caution.client_id == client_id)

  if contrat_id:
    query = query.filter(Caution.contrat_id == contrat_id)

  total = query.count()
  total_pages = math.ceil(total / per_page) if total >0 else 1

  cautions = (
    query.order_by(desc(Caution.date_emission))
    .offset((page - 1) * per_page)
    .limit(per_page)
    .all()
  )

  items = []
  for c in cautions:
    c_read = CautionRead(
      id=c.id,
      numero=c.numero,
      type=c.type,
      client_id=c.client_id,
      client_nom=c.client.nom_commercial if c.client else None,
      contrat_id=c.contrat_id,
      contrat_reference=c.contrat.reference if c.contrat else c.reference_numero,
      montant=c.montant,
      devise=c.devise or "DZD",
      reference_type=c.reference_type,
      reference_numero=c.reference_numero,
      objet=c.objet,
      date_emission=c.date_emission,
      date_echeance=c.date_echeance,
      statut=c.statut,
      banque_emetteur=c.banque_emetteur or "Banque Nationale d'Algérie (BNA)",
      lieu_demande=c.lieu_demande,
      lieu_soumission=c.lieu_soumission,
      numero_compte_bancaire=c.numero_compte_bancaire,
      societe_nom=c.societe_nom,
      url_caution_pdf=c.url_caution_pdf,
      created_at=c.created_at,
      updated_at=c.updated_at,
      archived_at=c.archived_at,
    )
    items.append(c_read)

  return CautionListResponse(
    items=items,
    total=total,
    page=page,
    per_page=per_page,
    total_pages=total_pages,
  )


@router.get("/{caution_id}", response_model=CautionDetail, summary="Get Detailed Caution Record", dependencies=[Depends(require_feature("view_caution"))])
def get_caution(caution_id: UUID, db: Session = Depends(get_db)):
  c = db.query(Caution).filter(Caution.id == caution_id).first()
  if not c:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caution introuvable.")

  docs = (
    db.query(Document)
    .filter(Document.entity_type == "caution", Document.entity_id == caution_id, Document.archived_at.is_(None))
    .all()
  )
  for doc in docs:
    doc.statut_validite = compute_validity_status(doc.date_expiration)

  return CautionDetail(
    id=c.id,
    numero=c.numero,
    type=c.type,
    client_id=c.client_id,
    client_nom=c.client.nom_commercial if c.client else None,
    contrat_id=c.contrat_id,
    contrat_reference=c.contrat.reference if c.contrat else c.reference_numero,
    montant=c.montant,
    devise=c.devise or "DZD",
    reference_type=c.reference_type,
    reference_numero=c.reference_numero,
    objet=c.objet,
    date_emission=c.date_emission,
    date_echeance=c.date_echeance,
    statut=c.statut,
    banque_emetteur=c.banque_emetteur or "Banque Nationale d'Algérie (BNA)",
    lieu_demande=c.lieu_demande,
    lieu_soumission=c.lieu_soumission,
    numero_compte_bancaire=c.numero_compte_bancaire,
    societe_nom=c.societe_nom,
    url_caution_pdf=c.url_caution_pdf,
    created_at=c.created_at,
    updated_at=c.updated_at,
    archived_at=c.archived_at,
    documents=[DocumentSummary.model_validate(d) for d in docs],
  )


@router.post("", response_model=CautionRead, status_code=status.HTTP_201_CREATED, summary="Create New Caution", dependencies=[Depends(require_feature("create_caution"))])
def create_caution(data: CautionCreate, db: Session = Depends(get_db)):
  if data.numero:
    existing = db.query(Caution).filter(Caution.numero == data.numero.strip()).first()
    if existing:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Une caution avec le numéro '{data.numero}'existe déjà.",
      )
    final_numero = data.numero.strip()
  else:
    final_numero = f"CAU-{datetime.now().year}-{uuid4().hex[:6].upper()}"

  client = db.query(Partenaire).filter(Partenaire.id == data.client_id).first()
  if not client:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail=f"Client avec l'identifiant {data.client_id} introuvable.",
    )

  caution = Caution(
    id=uuid4(),
    numero=final_numero,
    type=data.type,
    client_id=data.client_id,
    contrat_id=data.contrat_id,
    montant=data.montant,
    devise=data.devise.strip() if data.devise else "DZD",
    reference_type=data.reference_type,
    reference_numero=data.reference_numero,
    objet=data.objet.strip(),
    date_emission=data.date_emission,
    date_echeance=data.date_echeance,
    statut=data.statut,
    banque_emetteur=data.banque_emetteur,
    lieu_demande=data.lieu_demande,
    lieu_soumission=data.lieu_soumission,
    numero_compte_bancaire=data.numero_compte_bancaire,
    societe_nom=data.societe_nom,
    url_caution_pdf=data.url_caution_pdf,
  )
  db.add(caution)
  db.commit()
  db.refresh(caution)

  return CautionRead(
    id=caution.id,
    numero=caution.numero,
    type=caution.type,
    client_id=caution.client_id,
    client_nom=client.nom_commercial,
    contrat_id=caution.contrat_id,
    contrat_reference=data.reference_numero,
    montant=caution.montant,
    devise=caution.devise,
    reference_type=caution.reference_type,
    reference_numero=caution.reference_numero,
    objet=caution.objet,
    date_emission=caution.date_emission,
    date_echeance=caution.date_echeance,
    statut=caution.statut,
    banque_emetteur=caution.banque_emetteur,
    lieu_demande=caution.lieu_demande,
    lieu_soumission=caution.lieu_soumission,
    numero_compte_bancaire=caution.numero_compte_bancaire,
    societe_nom=caution.societe_nom,
    url_caution_pdf=caution.url_caution_pdf,
    created_at=caution.created_at,
    updated_at=caution.updated_at,
  )


@router.put("/{caution_id}", response_model=CautionRead, summary="Update Caution", dependencies=[Depends(require_feature("edit_caution"))])
def update_caution(caution_id: UUID, data: CautionUpdate, db: Session = Depends(get_db)):
  caution = db.query(Caution).filter(Caution.id == caution_id).first()
  if not caution:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caution introuvable.")

  update_dict = data.model_dump(exclude_unset=True)
  for field, value in update_dict.items():
    if value is not None:
      setattr(caution, field, value)

  db.commit()
  db.refresh(caution)

  return CautionRead(
    id=caution.id,
    numero=caution.numero,
    type=caution.type,
    client_id=caution.client_id,
    client_nom=caution.client.nom_commercial if caution.client else None,
    contrat_id=caution.contrat_id,
    contrat_reference=caution.contrat.reference if caution.contrat else caution.reference_numero,
    montant=caution.montant,
    devise=caution.devise,
    reference_type=caution.reference_type,
    reference_numero=caution.reference_numero,
    objet=caution.objet,
    date_emission=caution.date_emission,
    date_echeance=caution.date_echeance,
    statut=caution.statut,
    banque_emetteur=caution.banque_emetteur,
    lieu_demande=caution.lieu_demande,
    lieu_soumission=caution.lieu_soumission,
    numero_compte_bancaire=caution.numero_compte_bancaire,
    societe_nom=caution.societe_nom,
    url_caution_pdf=caution.url_caution_pdf,
    created_at=caution.created_at,
    updated_at=caution.updated_at,
  )


@router.delete("/{caution_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete / Archive Caution", dependencies=[Depends(require_feature("edit_caution"))])
def delete_caution(caution_id: UUID, db: Session = Depends(get_db)):
  caution = db.query(Caution).filter(Caution.id == caution_id).first()
  if not caution:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caution introuvable.")

  caution.archived_at = datetime.now(timezone.utc)
  caution.statut = StatutCaution.MAIN_LEVEE
  db.commit()
  return None


@router.post("/{caution_id}/generate-pdf", response_model=CautionRead, summary="Generate Bank Guarantee PDF Certificate", dependencies=[Depends(require_feature("generate_caution_pdf"))])
def generate_caution_document_pdf(caution_id: UUID, db: Session = Depends(get_db)):
  caution = db.query(Caution).filter(Caution.id == caution_id).first()
  if not caution:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caution introuvable.")

  client_nom = caution.client.nom_commercial if caution.client else "Client Bénéficiaire"
  client_adresse = caution.client.adresse if caution.client else "Algérie"
  ref_contrat = caution.contrat.reference if caution.contrat else caution.reference_numero

  settings = db.query(SystemSettings).filter(SystemSettings.singleton_id == "global").first()

  pdf_url = generate_caution_pdf(
    caution_number=caution.numero,
    caution_type=caution.type.value if hasattr(caution.type, "value") else str(caution.type),
    amount=caution.montant,
    devise=caution.devise or "DZD",
    client_name=client_nom,
    client_address=client_adresse,
    objet=caution.objet,
    date_emission=caution.date_emission,
    date_echeance=caution.date_echeance,
    ref_contrat=ref_contrat,
    banque_name=caution.banque_emetteur or "Banque Nationale d'Algérie (BNA)",
    lieu_demande=caution.lieu_demande,
    lieu_soumission=caution.lieu_soumission,
    numero_compte_bancaire=caution.numero_compte_bancaire,
    societe_nom=caution.societe_nom,
    client_societe_nom=caution.client_societe_nom,
    company_name=settings.company_name if settings else None,
    company_nif=settings.company_nif if settings else None,
    company_nis=settings.company_nis if settings else None,
    company_rc=settings.company_rc if settings else None,
    company_ai=settings.company_ai if settings else None,
  )

  serve_url = f"/api/v1/cautions/{caution_id}/pdf"

  existing_doc = (
    db.query(Document)
    .filter(Document.entity_type == "caution", Document.entity_id == caution_id)
    .first()
  )
  if existing_doc:
    existing_doc.url_fichier = serve_url
  else:
    new_doc = Document(
      id=uuid4(),
      nom=f"Acte Officiel {caution.numero}",
      type="Caution Bancaire",
      url_fichier=serve_url,
      date_emission=caution.date_emission,
      date_expiration=caution.date_echeance,
      statut_validite="Valide",
      entity_type="caution",
      entity_id=caution_id,
    )
    db.add(new_doc)

  caution.url_caution_pdf = serve_url
  db.commit()
  db.refresh(caution)

  return CautionRead(
    id=caution.id,
    numero=caution.numero,
    type=caution.type,
    client_id=caution.client_id,
    client_nom=client_nom,
    contrat_id=caution.contrat_id,
    contrat_reference=ref_contrat,
    montant=caution.montant,
    devise=caution.devise,
    reference_type=caution.reference_type,
    reference_numero=caution.reference_numero,
    objet=caution.objet,
    date_emission=caution.date_emission,
    date_echeance=caution.date_echeance,
    statut=caution.statut,
    banque_emetteur=caution.banque_emetteur,
    lieu_demande=caution.lieu_demande,
    lieu_soumission=caution.lieu_soumission,
    numero_compte_bancaire=caution.numero_compte_bancaire,
    societe_nom=caution.societe_nom,
    url_caution_pdf=caution.url_caution_pdf,
    created_at=caution.created_at,
    updated_at=caution.updated_at,
  )


@router.get("/{caution_id}/pdf", summary="Download Caution PDF")
def download_caution_pdf(caution_id: UUID, db: Session = Depends(get_db)):
  caution = db.query(Caution).filter(Caution.id == caution_id).first()
  if not caution:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caution introuvable.")

  sanitized = caution.numero.replace("/", "_").replace("\\", "_")
  filename = f"caution_{sanitized}.pdf"
  filepath = os.path.join(
    os.path.abspath(
      os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend", "public", "assets", "documents", "cautions")
    ),
    filename,
  )

  if os.path.exists(filepath):
    return FileResponse(filepath, media_type="application/pdf", filename=filename, content_disposition_type="inline")

  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Le fichier PDF n'a pas été généré.")
