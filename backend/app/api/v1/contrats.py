from datetime import datetime, timezone, date as dt_date
import math
from typing import Optional, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_feature
from app.models.contrat import Contrat, Avenant, Caution
from app.models.partenaire import Partenaire
from app.models.document import Document
from app.models.enums import StatutContrat
from app.schemas.contrat import (
  ContratCreate,
  ContratUpdate,
  ContratRead,
  ContratDetail,
  ContratListResponse,
  AvenantCreate,
  AvenantRead,
  CautionSummary,
)
from app.schemas.document import DocumentCreate, DocumentRead, DocumentSummary
from app.services.document_service import compute_validity_status

router = APIRouter(prefix="/contrats", tags=["Module 4 — Gestion des Contrats & Avenants"])


def calculate_contract_expiration(date_fin: dt_date) ->tuple[int, str]:
  today = dt_date.today()
  diff = (date_fin - today).days
  if diff < 0:
    return diff, "Expiré"
  elif diff <= 7:
    return diff, f"Expire dans {diff} jour(s)"
  elif diff <= 30:
    return diff, f"Expire dans {diff} jours"
  else:
    return diff, "Valide"


@router.get("", response_model=ContratListResponse, summary="List Commercial Contracts", dependencies=[Depends(require_feature("view_contrat"))])
def list_contrats(
  search: Optional[str] = Query(None, description="Search by reference, objet, or partner name"),
  statut: Optional[StatutContrat] = Query(None, description="Filter by contract status (ACTIF, EXPIRE)"),
  partenaire_id: Optional[UUID] = Query(None, description="Filter by partner ID"),
  type_contrat: Optional[str] = Query(None, description="Filter by contract type"),
  include_archived: bool = Query(False, description="Include soft-deleted contracts"),
  page: int = Query(1, ge=1, description="Page number"),
  per_page: int = Query(10, ge=1, le=100, description="Items per page"),
  db: Session = Depends(get_db),
):
  query = db.query(Contrat)

  if not include_archived:
    query = query.filter(Contrat.archived_at.is_(None))

  if search:
    search_pattern = f"%{search}%"
    query = query.join(Partenaire, isouter=True).filter(
      or_(
        Contrat.reference.ilike(search_pattern),
        Contrat.objet.ilike(search_pattern),
        Partenaire.nom_commercial.ilike(search_pattern),
      )
    )

  if statut:
    query = query.filter(Contrat.statut == statut)

  if partenaire_id:
    query = query.filter(Contrat.partenaire_id == partenaire_id)

  if type_contrat:
    query = query.filter(Contrat.type_contrat.ilike(type_contrat))

  total = query.count()
  total_pages = math.ceil(total / per_page) if total >0 else 1

  contrats = (
    query.order_by(desc(Contrat.created_at))
    .offset((page - 1) * per_page)
    .limit(per_page)
    .all()
  )

  items = []
  for c in contrats:
    days_left, alert = calculate_contract_expiration(c.date_fin)
    
    if days_left < 0 and c.statut == StatutContrat.ACTIF:
      c.statut = StatutContrat.EXPIRE
      db.commit()

    c_read = ContratRead(
      id=c.id,
      reference=c.reference,
      partenaire_id=c.partenaire_id,
      partenaire_nom=c.partenaire.nom_commercial if c.partenaire else None,
      partenaire_role=c.partenaire.role_partenaire.value if c.partenaire else None,
      objet=c.objet,
      type_contrat=c.type_contrat,
      date_debut=c.date_debut,
      date_fin=c.date_fin,
      montant=c.montant,
      devise=c.devise or "DZD",
      mode_facturation=c.mode_facturation,
      conditions_paiement=c.conditions_paiement,
      statut=c.statut,
      jours_restants=days_left,
      alerte_expiration=alert,
      created_at=c.created_at,
      updated_at=c.updated_at,
      archived_at=c.archived_at,
    )
    items.append(c_read)

  return ContratListResponse(
    items=items,
    total=total,
    page=page,
    per_page=per_page,
    total_pages=total_pages,
  )


@router.get("/{contrat_id}", response_model=ContratDetail, summary="Get Detailed Contract Dossier", dependencies=[Depends(require_feature("view_contrat"))])
def get_contrat(contrat_id: UUID, db: Session = Depends(get_db)):
  contrat = db.query(Contrat).filter(Contrat.id == contrat_id).first()
  if not contrat:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrat introuvable.")

  days_left, alert = calculate_contract_expiration(contrat.date_fin)

  avenants = (
    db.query(Avenant)
    .filter(Avenant.contrat_id == contrat_id)
    .order_by(desc(Avenant.date))
    .all()
  )

  cautions = (
    db.query(Caution)
    .filter(Caution.contrat_id == contrat_id)
    .order_by(desc(Caution.date_emission))
    .all()
  )

  docs = (
    db.query(Document)
    .filter(Document.entity_type == "contrat", Document.entity_id == contrat_id, Document.archived_at.is_(None))
    .all()
  )
  for doc in docs:
    doc.statut_validite = compute_validity_status(doc.date_expiration)

  total_amount = contrat.montant
  for av in avenants:
    if av.modif_montant:
      total_amount += av.modif_montant

  return ContratDetail(
    id=contrat.id,
    reference=contrat.reference,
    partenaire_id=contrat.partenaire_id,
    partenaire_nom=contrat.partenaire.nom_commercial if contrat.partenaire else None,
    partenaire_role=contrat.partenaire.role_partenaire.value if contrat.partenaire else None,
    objet=contrat.objet,
    type_contrat=contrat.type_contrat,
    date_debut=contrat.date_debut,
    date_fin=contrat.date_fin,
    montant=contrat.montant,
    devise=contrat.devise or "DZD",
    mode_facturation=contrat.mode_facturation,
    conditions_paiement=contrat.conditions_paiement,
    statut=contrat.statut,
    jours_restants=days_left,
    alerte_expiration=alert,
    created_at=contrat.created_at,
    updated_at=contrat.updated_at,
    archived_at=contrat.archived_at,
    avenants=[AvenantRead.model_validate(a) for a in avenants],
    cautions=[
      CautionSummary(
        id=c.id,
        numero=c.numero,
        type=c.type.value if hasattr(c.type, "value") else str(c.type),
        montant=c.montant,
        devise=c.devise or "DZD",
        statut=c.statut.value if hasattr(c.statut, "value") else str(c.statut),
        date_emission=c.date_emission,
        date_echeance=c.date_echeance,
        url_caution_pdf=c.url_caution_pdf,
      )
      for c in cautions
    ],
    documents=[DocumentSummary.model_validate(d) for d in docs],
    total_avenants=len(avenants),
    total_cautions=len(cautions),
    total_documents=len(docs),
    montant_total_avec_avenants=total_amount,
  )


@router.post("", response_model=ContratRead, status_code=status.HTTP_201_CREATED, summary="Create New Contract", dependencies=[Depends(require_feature("create_contrat"))])
def create_contrat(data: ContratCreate, db: Session = Depends(get_db)):
  existing = db.query(Contrat).filter(Contrat.reference == data.reference.strip()).first()
  if existing:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Un contrat avec la référence '{data.reference}'existe déjà.",
    )

  partner = db.query(Partenaire).filter(Partenaire.id == data.partenaire_id).first()
  if not partner:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail=f"Partenaire avec l'identifiant {data.partenaire_id} introuvable.",
    )

  contrat = Contrat(
    id=uuid4(),
    reference=data.reference.strip(),
    partenaire_id=data.partenaire_id,
    objet=data.objet.strip(),
    type_contrat=data.type_contrat.strip(),
    date_debut=data.date_debut,
    date_fin=data.date_fin,
    montant=data.montant,
    devise=data.devise.strip() if data.devise else "DZD",
    mode_facturation=data.mode_facturation,
    conditions_paiement=data.conditions_paiement,
    statut=data.statut,
  )
  db.add(contrat)
  db.commit()
  db.refresh(contrat)

  days_left, alert = calculate_contract_expiration(contrat.date_fin)
  return ContratRead(
    id=contrat.id,
    reference=contrat.reference,
    partenaire_id=contrat.partenaire_id,
    partenaire_nom=partner.nom_commercial,
    partenaire_role=partner.role_partenaire.value,
    objet=contrat.objet,
    type_contrat=contrat.type_contrat,
    date_debut=contrat.date_debut,
    date_fin=contrat.date_fin,
    montant=contrat.montant,
    devise=contrat.devise,
    mode_facturation=contrat.mode_facturation,
    conditions_paiement=contrat.conditions_paiement,
    statut=contrat.statut,
    jours_restants=days_left,
    alerte_expiration=alert,
    created_at=contrat.created_at,
    updated_at=contrat.updated_at,
  )


@router.put("/{contrat_id}", response_model=ContratRead, summary="Update Contract", dependencies=[Depends(require_feature("edit_contrat"))])
def update_contrat(contrat_id: UUID, data: ContratUpdate, db: Session = Depends(get_db)):
  contrat = db.query(Contrat).filter(Contrat.id == contrat_id).first()
  if not contrat:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrat introuvable.")

  update_dict = data.model_dump(exclude_unset=True)
  for field, value in update_dict.items():
    if value is not None:
      setattr(contrat, field, value)

  db.commit()
  db.refresh(contrat)

  days_left, alert = calculate_contract_expiration(contrat.date_fin)
  return ContratRead(
    id=contrat.id,
    reference=contrat.reference,
    partenaire_id=contrat.partenaire_id,
    partenaire_nom=contrat.partenaire.nom_commercial if contrat.partenaire else None,
    partenaire_role=contrat.partenaire.role_partenaire.value if contrat.partenaire else None,
    objet=contrat.objet,
    type_contrat=contrat.type_contrat,
    date_debut=contrat.date_debut,
    date_fin=contrat.date_fin,
    montant=contrat.montant,
    devise=contrat.devise,
    mode_facturation=contrat.mode_facturation,
    conditions_paiement=contrat.conditions_paiement,
    statut=contrat.statut,
    jours_restants=days_left,
    alerte_expiration=alert,
    created_at=contrat.created_at,
    updated_at=contrat.updated_at,
  )


@router.delete("/{contrat_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete / Archive Contract", dependencies=[Depends(require_feature("edit_contrat"))])
def delete_contrat(contrat_id: UUID, db: Session = Depends(get_db)):
  contrat = db.query(Contrat).filter(Contrat.id == contrat_id).first()
  if not contrat:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrat introuvable.")

  contrat.archived_at = datetime.now(timezone.utc)
  contrat.statut = StatutContrat.EXPIRE
  db.commit()
  return None


# ============================================
# Contract Amendments (Avenants) Sub-routes
# ============================================

@router.get("/{contrat_id}/avenants", response_model=List[AvenantRead], summary="List Contract Amendments")
def list_contract_avenants(contrat_id: UUID, db: Session = Depends(get_db)):
  return (
    db.query(Avenant)
    .filter(Avenant.contrat_id == contrat_id)
    .order_by(desc(Avenant.date))
    .all()
  )


@router.post("/{contrat_id}/avenants", response_model=AvenantRead, status_code=status.HTTP_201_CREATED, summary="Add Amendment (Avenant)", dependencies=[Depends(require_feature("create_avenant"))])
def create_contract_avenant(contrat_id: UUID, data: AvenantCreate, db: Session = Depends(get_db)):
  contrat = db.query(Contrat).filter(Contrat.id == contrat_id).first()
  if not contrat:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrat introuvable.")

  avenant = Avenant(
    id=uuid4(),
    contrat_id=contrat_id,
    numero=data.numero.strip(),
    date=data.date,
    objet=data.objet.strip(),
    description=data.description.strip() if data.description else None,
    modif_montant=data.modif_montant,
    nouvelle_date_fin=data.nouvelle_date_fin,
  )
  db.add(avenant)

  if data.nouvelle_date_fin:
    contrat.date_fin = data.nouvelle_date_fin
  if data.modif_montant:
    contrat.montant += data.modif_montant

  db.commit()
  db.refresh(avenant)
  return avenant


# ============================================
# Contract Documents Sub-routes
# ============================================

@router.get("/{contrat_id}/documents", response_model=List[DocumentRead], summary="List Contract Documents")
def list_contract_documents(contrat_id: UUID, db: Session = Depends(get_db)):
  docs = (
    db.query(Document)
    .filter(Document.entity_type == "contrat", Document.entity_id == contrat_id, Document.archived_at.is_(None))
    .order_by(desc(Document.created_at))
    .all()
  )
  for doc in docs:
    doc.statut_validite = compute_validity_status(doc.date_expiration)
  return docs


@router.post("/{contrat_id}/documents", response_model=DocumentRead, status_code=status.HTTP_201_CREATED, summary="Attach Document to Contract")
def create_contract_document(contrat_id: UUID, data: DocumentCreate, db: Session = Depends(get_db)):
  contrat = db.query(Contrat).filter(Contrat.id == contrat_id).first()
  if not contrat:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrat introuvable.")

  validity = compute_validity_status(data.date_expiration)
  doc = Document(
    id=uuid4(),
    nom=data.nom.strip(),
    type=data.type.strip(),
    url_fichier=data.url_fichier.strip(),
    date_emission=data.date_emission,
    date_expiration=data.date_expiration,
    statut_validite=validity,
    entity_type="contrat",
    entity_id=contrat_id,
  )
  db.add(doc)
  db.commit()
  db.refresh(doc)
  return doc
