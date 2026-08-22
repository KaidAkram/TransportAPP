from datetime import datetime, timezone, date as dt_date
import math
from typing import Optional, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_feature
from app.models.vehicule import Vehicule, Constat
from app.models.document import Document
from app.models.intervention import Intervention
from app.models.enums import StatutVehicule
from app.schemas.vehicule import (
  VehiculeCreate,
  VehiculeUpdate,
  VehiculeRead,
  VehiculeDetail,
  VehiculeListResponse,
  DocumentSummary,
  ConstatSummary,
  InterventionSummary,
)
from app.schemas.document import DocumentCreate, DocumentRead
from app.schemas.constat import ConstatCreate, ConstatRead, ConstatUpdate
from app.services.document_service import compute_validity_status

router = APIRouter(prefix="/vehicules", tags=["Module 1 — Gestion des Véhicules"])


@router.get("", response_model=VehiculeListResponse, summary="List Fleet Vehicles", dependencies=[Depends(require_feature("view_vehicle"))])
def list_vehicules(
  search: Optional[str] = Query(None, description="Search by immatriculation, marque, or modele"),
  statut: Optional[StatutVehicule] = Query(None, description="Filter by operational status"),
  type: Optional[str] = Query(None, description="Filter by vehicle category/type"),
  include_archived: bool = Query(False, description="Include archived / soft-deleted vehicles"),
  page: int = Query(1, ge=1, description="Page number"),
  per_page: int = Query(10, ge=1, le=100, description="Items per page"),
  db: Session = Depends(get_db),
):
  query = db.query(Vehicule)

  if not include_archived:
    query = query.filter(Vehicule.archived_at.is_(None))

  if search:
    search_pattern = f"%{search}%"
    query = query.filter(
      or_(
        Vehicule.immatriculation.ilike(search_pattern),
        Vehicule.marque.ilike(search_pattern),
        Vehicule.modele.ilike(search_pattern),
      )
    )

  if statut:
    query = query.filter(Vehicule.statut == statut)

  if type:
    query = query.filter(Vehicule.type.ilike(type))

  total = query.count()
  total_pages = math.ceil(total / per_page) if total >0 else 1

  vehicles = (
    query.order_by(desc(Vehicule.created_at))
    .offset((page - 1) * per_page)
    .limit(per_page)
    .all()
  )

  return VehiculeListResponse(
    items=vehicles,
    total=total,
    page=page,
    per_page=per_page,
    total_pages=total_pages,
  )


@router.get("/{vehicule_id}", response_model=VehiculeDetail, summary="Get Vehicle Detail & Dossier", dependencies=[Depends(require_feature("view_vehicle"))])
def get_vehicule(vehicule_id: UUID, db: Session = Depends(get_db)):
  vehicule = db.query(Vehicule).filter(Vehicule.id == vehicule_id).first()
  if not vehicule:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail=f"Véhicule avec l'identifiant {vehicule_id} introuvable.",
    )

  docs = (
    db.query(Document)
    .filter(Document.entity_type == "vehicule", Document.entity_id == vehicule_id, Document.archived_at.is_(None))
    .all()
  )

  for doc in docs:
    doc.statut_validite = compute_validity_status(doc.date_expiration)

  constats = (
    db.query(Constat)
    .filter(Constat.vehicule_id == vehicule_id, Constat.archived_at.is_(None))
    .order_by(desc(Constat.date))
    .all()
  )

  interventions = (
    db.query(Intervention)
    .filter(Intervention.vehicule_id == vehicule_id)
    .order_by(desc(Intervention.date))
    .all()
  )

  valides = sum(1 for d in docs if d.statut_validite == "Valide")
  expires = sum(1 for d in docs if d.statut_validite == "Expiré")
  alertes = sum(1 for d in docs if d.statut_validite == "Expire bientôt")

  return VehiculeDetail(
    id=vehicule.id,
    immatriculation=vehicule.immatriculation,
    marque=vehicule.marque,
    modele=vehicule.modele,
    type=vehicule.type,
    nombre_places=vehicule.nombre_places,
    annee=vehicule.annee,
    date_mise_circulation=vehicule.date_mise_circulation,
    kilometrage_actuel=vehicule.kilometrage_actuel,
    statut=vehicule.statut,
    cout_total=vehicule.cout_total,
    created_at=vehicule.created_at,
    updated_at=vehicule.updated_at,
    archived_at=vehicule.archived_at,
    documents=[DocumentSummary.model_validate(d) for d in docs],
    constats=[ConstatSummary.model_validate(c) for c in constats],
    interventions=[
      InterventionSummary(
        id=it.id,
        numero=it.numero,
        type=it.type.value if hasattr(it.type, "value") else str(it.type),
        categorie=it.categorie,
        date=it.date,
        kilometrage=it.kilometrage,
        travail_effectue=it.travail_effectue,
        cout_total=it.cout_total,
        statut=it.statut.value if hasattr(it.statut, "value") else str(it.statut),
        mecanicien_nom=(
          f"{it.mecanicien_responsable.nom} {it.mecanicien_responsable.prenom}"
          if it.mecanicien_responsable
          else "Atelier"
        ),
      )
      for it in interventions
    ],
    total_constats=len(constats),
    total_interventions=len(interventions),
    documents_valides=valides,
    documents_expires=expires,
    documents_alertes=alertes,
  )


@router.post("", response_model=VehiculeRead, status_code=status.HTTP_201_CREATED, summary="Create New Vehicle", dependencies=[Depends(require_feature("create_vehicle"))])
def create_vehicule(data: VehiculeCreate, db: Session = Depends(get_db)):
  if data.immatriculation and data.immatriculation.strip():
    final_immatriculation = data.immatriculation.strip()
    existing = db.query(Vehicule).filter(Vehicule.immatriculation == final_immatriculation).first()
    if existing:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Un véhicule avec l'immatriculation '{final_immatriculation}'existe déjà.",
      )
  else:
    prefix = f"VEH-{datetime.now().year}-"
    result = db.query(Vehicule.immatriculation).filter(Vehicule.immatriculation.like(f"{prefix}%")).order_by(Vehicule.immatriculation.desc()).first()
    if result and result[0]:
      try:
        last_num = int(result[0].split("-")[-1])
        final_immatriculation = f"{prefix}{last_num + 1:04d}"
      except ValueError:
        final_immatriculation = f"{prefix}0001"
    else:
      final_immatriculation = f"{prefix}0001"

  vehicule = Vehicule(
    id=uuid4(),
    immatriculation=final_immatriculation,
    marque=data.marque.strip(),
    modele=data.modele.strip(),
    type=data.type.strip(),
    nombre_places=data.nombre_places,
    annee=data.annee,
    date_mise_circulation=data.date_mise_circulation,
    kilometrage_actuel=data.kilometrage_actuel,
    statut=data.statut,
    cout_total=data.cout_total,
  )
  db.add(vehicule)
  db.commit()
  db.refresh(vehicule)
  return vehicule


@router.put("/{vehicule_id}", response_model=VehiculeRead, summary="Update Vehicle Information", dependencies=[Depends(require_feature("edit_vehicle"))])
def update_vehicule(vehicule_id: UUID, data: VehiculeUpdate, db: Session = Depends(get_db)):
  vehicule = db.query(Vehicule).filter(Vehicule.id == vehicule_id).first()
  if not vehicule:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Véhicule introuvable.",
    )

  if data.immatriculation and data.immatriculation != vehicule.immatriculation:
    existing = db.query(Vehicule).filter(Vehicule.immatriculation == data.immatriculation).first()
    if existing:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"L'immatriculation '{data.immatriculation}'est déjà attribuée.",
      )
    vehicule.immatriculation = data.immatriculation.strip()

  update_dict = data.model_dump(exclude_unset=True)
  for field, value in update_dict.items():
    if field != "immatriculation"and value is not None:
      setattr(vehicule, field, value)

  db.commit()
  db.refresh(vehicule)
  return vehicule


@router.patch("/{vehicule_id}/archive", response_model=VehiculeRead, summary="Archive / Soft-Delete Vehicle", dependencies=[Depends(require_feature("archive_vehicle"))])
def archive_vehicule(vehicule_id: UUID, db: Session = Depends(get_db)):
  vehicule = db.query(Vehicule).filter(Vehicule.id == vehicule_id).first()
  if not vehicule:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Véhicule introuvable.")

  vehicule.archived_at = datetime.now(timezone.utc)
  vehicule.statut = StatutVehicule.HORS_SERVICE
  db.commit()
  db.refresh(vehicule)
  return vehicule


# ============================================
# Sub-resources: Documents & Constats
# ============================================

@router.get("/{vehicule_id}/documents", response_model=List[DocumentRead], summary="List Vehicle Documents")
def list_vehicule_documents(vehicule_id: UUID, db: Session = Depends(get_db)):
  docs = (
    db.query(Document)
    .filter(Document.entity_type == "vehicule", Document.entity_id == vehicule_id, Document.archived_at.is_(None))
    .order_by(desc(Document.created_at))
    .all()
  )
  for doc in docs:
    doc.statut_validite = compute_validity_status(doc.date_expiration)
  return docs


@router.post("/{vehicule_id}/documents", response_model=DocumentRead, status_code=status.HTTP_201_CREATED, summary="Attach Document to Vehicle")
def create_vehicule_document(vehicule_id: UUID, data: DocumentCreate, db: Session = Depends(get_db)):
  vehicule = db.query(Vehicule).filter(Vehicule.id == vehicule_id).first()
  if not vehicule:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Véhicule introuvable.")

  validity = compute_validity_status(data.date_expiration)
  doc = Document(
    id=uuid4(),
    nom=data.nom.strip(),
    type=data.type.strip(),
    url_fichier=data.url_fichier.strip(),
    date_emission=data.date_emission,
    date_expiration=data.date_expiration,
    statut_validite=validity,
    entity_type="vehicule",
    entity_id=vehicule_id,
  )
  db.add(doc)
  db.commit()
  db.refresh(doc)
  return doc


@router.get("/{vehicule_id}/constats", response_model=List[ConstatRead], summary="List Vehicle Accident Reports")
def list_vehicule_constats(vehicule_id: UUID, db: Session = Depends(get_db)):
  return (
    db.query(Constat)
    .filter(Constat.vehicule_id == vehicule_id, Constat.archived_at.is_(None))
    .order_by(desc(Constat.date))
    .all()
  )


@router.post("/{vehicule_id}/constats", response_model=ConstatRead, status_code=status.HTTP_201_CREATED, summary="Declare Vehicle Accident / Constat")
def create_vehicule_constat(vehicule_id: UUID, data: ConstatCreate, db: Session = Depends(get_db)):
  vehicule = db.query(Vehicule).filter(Vehicule.id == vehicule_id).first()
  if not vehicule:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Véhicule introuvable.")

  constat = Constat(
    id=uuid4(),
    vehicule_id=vehicule_id,
    chauffeur_id=data.chauffeur_id,
    date=data.date,
    heure=data.heure,
    lieu=data.lieu.strip(),
    circonstances=data.circonstances.strip(),
    dommages=data.dommages.strip(),
    tiers_implique=data.tiers_implique,
    infos_tiers=data.infos_tiers,
  )
  db.add(constat)
  db.commit()
  db.refresh(constat)
  return constat


@router.put("/{vehicule_id}/constats/{constat_id}", response_model=ConstatRead, summary="Update Constat Status / Assurance")
def update_vehicule_constat(vehicule_id: UUID, constat_id: UUID, data: ConstatUpdate, db: Session = Depends(get_db)):
  constat = db.query(Constat).filter(Constat.id == constat_id, Constat.vehicule_id == vehicule_id).first()
  if not constat:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Constat introuvable.")

  update_data = data.model_dump(exclude_unset=True)
  for key, value in update_data.items():
    setattr(constat, key, value)

  db.commit()
  db.refresh(constat)
  return constat
