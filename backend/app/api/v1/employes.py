from datetime import datetime, timezone, date as dt_date
import math
from typing import Optional, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_feature
from app.models.employe import Employe, Chauffeur, Mecanicien, Permis
from app.models.document import Document
from app.models.intervention import Intervention
from app.models.enums import StatutEmploye, TypeEmploye
from app.schemas.employe import (
  EmployeCreate,
  EmployeUpdate,
  EmployeRead,
  EmployeDetail,
  EmployeListResponse,
  PermisCreate,
  PermisUpdate,
  PermisRead,
  MechanicInterventionSummary,
)
from app.schemas.document import DocumentCreate, DocumentRead, DocumentSummary
from app.services.document_service import compute_validity_status

router = APIRouter(prefix="/employes", tags=["Module 2 — Gestion des Employés"])


@router.get("", response_model=EmployeListResponse, summary="List Employees (Chauffeurs & Mécaniciens)", dependencies=[Depends(require_feature("view_chauffeur"))])
def list_employes(
  search: Optional[str] = Query(None, description="Search by nom, prenom, or matricule"),
  type_employe: Optional[TypeEmploye] = Query(None, description="Filter by employee type (CHAUFFEUR or MECANICIEN)"),
  statut: Optional[StatutEmploye] = Query(None, description="Filter by HR status"),
  include_archived: bool = Query(False, description="Include soft-deleted employees"),
  page: int = Query(1, ge=1, description="Page number"),
  per_page: int = Query(10, ge=1, le=100, description="Items per page"),
  db: Session = Depends(get_db),
):
  query = db.query(Employe)

  if not include_archived:
    query = query.filter(Employe.archived_at.is_(None))

  if search:
    search_pattern = f"%{search}%"
    query = query.filter(
      or_(
        Employe.matricule.ilike(search_pattern),
        Employe.nom.ilike(search_pattern),
        Employe.prenom.ilike(search_pattern),
        Employe.telephone.ilike(search_pattern),
      )
    )

  if type_employe:
    query = query.filter(Employe.type_employe == type_employe)

  if statut:
    query = query.filter(Employe.statut == statut)

  total = query.count()
  total_pages = math.ceil(total / per_page) if total >0 else 1

  items = (
    query.order_by(desc(Employe.created_at))
    .offset((page - 1) * per_page)
    .limit(per_page)
    .all()
  )

  return EmployeListResponse(
    items=items,
    total=total,
    page=page,
    per_page=per_page,
    total_pages=total_pages,
  )


@router.get("/{employe_id}", response_model=EmployeDetail, summary="Get Detailed Employee Dossier", dependencies=[Depends(require_feature("view_chauffeur"))])
def get_employe(employe_id: UUID, db: Session = Depends(get_db)):
  employe = db.query(Employe).filter(Employe.id == employe_id).first()
  if not employe:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail=f"Employé avec l'identifiant {employe_id} introuvable.",
    )

  docs = (
    db.query(Document)
    .filter(Document.entity_type == "employe", Document.entity_id == employe_id, Document.archived_at.is_(None))
    .all()
  )
  for doc in docs:
    doc.statut_validite = compute_validity_status(doc.date_expiration)

  valides = sum(1 for d in docs if d.statut_validite == "Valide")
  expires = sum(1 for d in docs if d.statut_validite == "Expiré")
  alertes = sum(1 for d in docs if d.statut_validite == "Expire bientôt")

  permis_data = None
  if employe.type_employe == TypeEmploye.CHAUFFEUR:
    permis = db.query(Permis).filter(Permis.chauffeur_id == employe_id).first()
    if permis:
      permis.statut_validite = compute_validity_status(permis.date_expiration)
      permis_data = PermisRead.model_validate(permis)

  interventions_list = []
  if employe.type_employe == TypeEmploye.MECANICIEN:
    interventions = (
      db.query(Intervention)
      .filter(
        or_(
          Intervention.mecanicien_responsable_id == employe_id,
          Intervention.mecaniciens_participants.any(id=employe_id),
        ),
        Intervention.archived_at.is_(None),
      )
      .order_by(desc(Intervention.date))
      .all()
    )
    for inter in interventions:
      immat = inter.vehicule.immatriculation if inter.vehicule else None
      interventions_list.append(
        MechanicInterventionSummary(
          id=inter.id,
          numero=inter.numero,
          vehicule_id=inter.vehicule_id,
          vehicule_immatriculation=immat,
          date=inter.date,
          type=inter.type.value if hasattr(inter.type, "value") else str(inter.type),
          categorie=inter.categorie,
          statut=inter.statut.value if hasattr(inter.statut, "value") else str(inter.statut),
          probleme_constate=inter.probleme_constate,
          travail_effectue=inter.travail_effectue,
          est_responsable=(inter.mecanicien_responsable_id == employe_id),
        )
      )

  return EmployeDetail(
    id=employe.id,
    matricule=employe.matricule,
    nom=employe.nom,
    prenom=employe.prenom,
    photo=employe.photo,
    date_naissance=employe.date_naissance,
    telephone=employe.telephone,
    adresse=employe.adresse,
    date_embauche=employe.date_embauche,
    statut=employe.statut,
    type_employe=employe.type_employe,
    fonction=employe.fonction,
    assurance=getattr(employe, "assurance", None),
    specialite=getattr(employe, "specialite", None),
    type_mecanicien=getattr(employe, "type_mecanicien", None),
    experience=getattr(employe, "experience", None),
    est_responsable=getattr(employe, "est_responsable", None),
    created_at=employe.created_at,
    updated_at=employe.updated_at,
    archived_at=employe.archived_at,
    permis=permis_data,
    documents=[DocumentSummary.model_validate(d) for d in docs],
    interventions=interventions_list,
    total_interventions=len(interventions_list),
    documents_valides=valides,
    documents_alertes=alertes,
    documents_expires=expires,
  )


@router.post("", response_model=EmployeRead, status_code=status.HTTP_201_CREATED, summary="Create Employee", dependencies=[Depends(require_feature("create_chauffeur"))])
def create_employe(data: EmployeCreate, db: Session = Depends(get_db)):
  existing = db.query(Employe).filter(Employe.matricule == data.matricule.strip()).first()
  if existing:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Un employé avec le matricule '{data.matricule}'existe déjà.",
    )

  photo_path = data.photo
  if not photo_path:
    if data.type_employe == TypeEmploye.CHAUFFEUR:
      photo_path = "/assets/avatars/driver_pro.jpg"
    else:
      photo_path = "/assets/avatars/mechanic_pro.jpg"

  if data.type_employe == TypeEmploye.CHAUFFEUR:
    employe = Chauffeur(
      id=uuid4(),
      matricule=data.matricule.strip(),
      nom=data.nom.strip(),
      prenom=data.prenom.strip(),
      photo=photo_path,
      date_naissance=data.date_naissance,
      telephone=data.telephone.strip() if data.telephone else None,
      adresse=data.adresse.strip() if data.adresse else None,
      date_embauche=data.date_embauche,
      statut=data.statut,
      type_employe=TypeEmploye.CHAUFFEUR,
      fonction=data.fonction.strip() if data.fonction else "Chauffeur",
      assurance=data.assurance if data.assurance is not None else True,
    )
    db.add(employe)
    db.flush()

    if data.permis_numero:
      permis = Permis(
        id=uuid4(),
        chauffeur_id=employe.id,
        numero=data.permis_numero.strip(),
        categories=data.permis_categories.strip() if data.permis_categories else "B, D",
        date_obtention=data.permis_date_obtention,
        date_expiration=data.permis_date_expiration,
        scan_permis=data.permis_scan,
      )
      db.add(permis)

  else:
    employe = Mecanicien(
      id=uuid4(),
      matricule=data.matricule.strip(),
      nom=data.nom.strip(),
      prenom=data.prenom.strip(),
      photo=photo_path,
      date_naissance=data.date_naissance,
      telephone=data.telephone.strip() if data.telephone else None,
      adresse=data.adresse.strip() if data.adresse else None,
      date_embauche=data.date_embauche,
      statut=data.statut,
      type_employe=TypeEmploye.MECANICIEN,
      fonction=data.fonction.strip() if data.fonction else "Mécanicien d'Atelier",
      specialite=data.specialite.strip() if data.specialite else "Maintenance Générale",
      type_mecanicien=data.type_mecanicien.strip() if data.type_mecanicien else "Technicien",
      experience=data.experience.strip() if data.experience else None,
      est_responsable=data.est_responsable if data.est_responsable is not None else False,
    )
    db.add(employe)

  db.commit()
  db.refresh(employe)
  return employe


@router.put("/{employe_id}", response_model=EmployeRead, summary="Update Employee Details", dependencies=[Depends(require_feature("edit_chauffeur"))])
def update_employe(employe_id: UUID, data: EmployeUpdate, db: Session = Depends(get_db)):
  employe = db.query(Employe).filter(Employe.id == employe_id).first()
  if not employe:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employé introuvable.")

  update_dict = data.model_dump(exclude_unset=True)
  for field, value in update_dict.items():
    if value is not None:
      setattr(employe, field, value)

  db.commit()
  db.refresh(employe)
  return employe


@router.patch("/{employe_id}/archive", response_model=EmployeRead, summary="Archive / Soft-Delete Employee")
def archive_employe(employe_id: UUID, db: Session = Depends(get_db)):
  employe = db.query(Employe).filter(Employe.id == employe_id).first()
  if not employe:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employé introuvable.")

  employe.archived_at = datetime.now(timezone.utc)
  employe.statut = StatutEmploye.QUITTE
  db.commit()
  db.refresh(employe)
  return employe


# ============================================
# Driver's License (Permis) Sub-routes
# ============================================

@router.get("/{employe_id}/permis", response_model=PermisRead, summary="Get Driver's License")
def get_driver_permis(employe_id: UUID, db: Session = Depends(get_db)):
  chauffeur = db.query(Chauffeur).filter(Chauffeur.id == employe_id).first()
  if not chauffeur:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chauffeur introuvable.")

  permis = db.query(Permis).filter(Permis.chauffeur_id == employe_id).first()
  if not permis:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permis de conduire non enregistré.")

  permis.statut_validite = compute_validity_status(permis.date_expiration)
  return permis


@router.post("/{employe_id}/permis", response_model=PermisRead, status_code=status.HTTP_201_CREATED, summary="Create / Update Driver's License")
def set_driver_permis(employe_id: UUID, data: PermisCreate, db: Session = Depends(get_db)):
  chauffeur = db.query(Chauffeur).filter(Chauffeur.id == employe_id).first()
  if not chauffeur:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chauffeur introuvable.")

  permis = db.query(Permis).filter(Permis.chauffeur_id == employe_id).first()
  if permis:
    permis.numero = data.numero.strip()
    permis.categories = data.categories.strip()
    permis.date_obtention = data.date_obtention
    permis.date_expiration = data.date_expiration
    permis.scan_permis = data.scan_permis
  else:
    permis = Permis(
      id=uuid4(),
      chauffeur_id=employe_id,
      numero=data.numero.strip(),
      categories=data.categories.strip(),
      date_obtention=data.date_obtention,
      date_expiration=data.date_expiration,
      scan_permis=data.scan_permis,
    )
    db.add(permis)

  db.commit()
  db.refresh(permis)
  permis.statut_validite = compute_validity_status(permis.date_expiration)
  return permis


# ============================================
# Generic Employee Documents Sub-routes
# ============================================

@router.get("/{employe_id}/documents", response_model=List[DocumentRead], summary="List Employee Administrative Documents")
def list_employe_documents(employe_id: UUID, db: Session = Depends(get_db)):
  docs = (
    db.query(Document)
    .filter(Document.entity_type == "employe", Document.entity_id == employe_id, Document.archived_at.is_(None))
    .order_by(desc(Document.created_at))
    .all()
  )
  for doc in docs:
    doc.statut_validite = compute_validity_status(doc.date_expiration)
  return docs


@router.post("/{employe_id}/documents", response_model=DocumentRead, status_code=status.HTTP_201_CREATED, summary="Attach Document to Employee")
def create_employe_document(employe_id: UUID, data: DocumentCreate, db: Session = Depends(get_db)):
  employe = db.query(Employe).filter(Employe.id == employe_id).first()
  if not employe:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employé introuvable.")

  validity = compute_validity_status(data.date_expiration)
  doc = Document(
    id=uuid4(),
    nom=data.nom.strip(),
    type=data.type.strip(),
    url_fichier=data.url_fichier.strip(),
    date_emission=data.date_emission,
    date_expiration=data.date_expiration,
    statut_validite=validity,
    entity_type="employe",
    entity_id=employe_id,
  )
  db.add(doc)
  db.commit()
  db.refresh(doc)
  return doc
