from datetime import datetime, timezone, date as dt_date
import math
from typing import Optional, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc, insert, select, extract
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_feature
from app.models.intervention import Intervention, InterventionPiece, intervention_mecaniciens
from app.models.vehicule import Vehicule
from app.models.employe import Employe, Mecanicien
from app.models.stock import Piece, MouvementStock
from app.models.document import Document
from app.models.enums import CategorieIntervention, StatutIntervention, StatutVehicule, TypeMouvement
from app.schemas.intervention import (
  InterventionCreate,
  InterventionUpdate,
  InterventionRead,
  InterventionDetail,
  InterventionListResponse,
  PieceConsommeeItem,
  MecanicienParticipantItem,
)
from app.schemas.document import DocumentSummary
from app.services.document_service import compute_validity_status

router = APIRouter(prefix="/interventions", tags=["Module 6 — Maintenance & Ordres de Travail"])


@router.get("", response_model=InterventionListResponse, summary="List Fleet Maintenance Work Orders", dependencies=[Depends(require_feature("view_intervention"))])
def list_interventions(
  search: Optional[str] = Query(None, description="Search by number, category, problem, or vehicle plate"),
  vehicule_id: Optional[UUID] = Query(None, description="Filter by vehicle"),
  mecanicien_id: Optional[UUID] = Query(None, description="Filter by responsible mechanic"),
  type: Optional[CategorieIntervention] = Query(None, description="Filter by type: PREVENTIVE or CORRECTIVE"),
  statut: Optional[StatutIntervention] = Query(None, description="Filter by status"),
  annee: Optional[int] = Query(None, description="Filter by year (date)"),
  mois: Optional[int] = Query(None, description="Filtrer par mois"),
  page: int = Query(1, ge=1, description="Page number"),
  per_page: int = Query(20, ge=1, le=100, description="Items per page"),
  sort_by: Optional[str] = Query(None, description="Field to sort by"),
  sort_order: Optional[str] = Query("asc", description="Sort order: asc or desc"),
  db: Session = Depends(get_db),
):
  query = db.query(Intervention)

  if search:
    search_pattern = f"%{search}%"
    query = query.join(Vehicule, Intervention.vehicule_id == Vehicule.id, isouter=True).filter(
      or_(
        Intervention.numero.ilike(search_pattern),
        Intervention.categorie.ilike(search_pattern),
        Intervention.probleme_constate.ilike(search_pattern),
        Intervention.travail_effectue.ilike(search_pattern),
        Vehicule.immatriculation.ilike(search_pattern),
      )
    )

  if vehicule_id:
    query = query.filter(Intervention.vehicule_id == vehicule_id)

  if mecanicien_id:
    query = query.filter(Intervention.mecanicien_responsable_id == mecanicien_id)

  if type:
    query = query.filter(Intervention.type == type)

  if statut:
    query = query.filter(Intervention.statut == statut)

  if annee:
    query = query.filter(extract('year', Intervention.date) == annee)
if mois:
    query = query.filter(extract('month', Intervention.date) == mois)

  total = query.count()
  total_pages = math.ceil(total / per_page) if total >0 else 1

  if sort_by and hasattr(Intervention, sort_by):
    col = getattr(Intervention, sort_by)
    query = query.order_by(desc(col) if sort_order == "desc" else col.asc())
  else:
    query = query.order_by(desc(Intervention.date), desc(Intervention.created_at))

  interventions = (
    query.offset((page - 1) * per_page)
    .limit(per_page)
    .all()
  )

  items = []
  for it in interventions:
    items.append(
      InterventionRead(
        id=it.id,
        numero=it.numero,
        vehicule_id=it.vehicule_id,
        vehicule_immatriculation=it.vehicule.immatriculation if it.vehicule else None,
        vehicule_marque=it.vehicule.marque if it.vehicule else None,
        vehicule_modele=it.vehicule.modele if it.vehicule else None,
        mecanicien_responsable_id=it.mecanicien_responsable_id,
        mecanicien_nom_complet=(
          f"{it.mecanicien_responsable.nom} {it.mecanicien_responsable.prenom}"
          if it.mecanicien_responsable
          else "Non assigné"
        ),
        type=it.type,
        categorie=it.categorie,
        date=it.date,
        kilometrage=it.kilometrage,
        probleme_constate=it.probleme_constate,
        diagnostic=it.diagnostic,
        travail_effectue=it.travail_effectue,
        est_externe=it.est_externe,
        prestataire_nom=it.prestataire_nom,
        prestataire_telephone=it.prestataire_telephone,
        cout_main_doeuvre=it.cout_main_doeuvre,
        cout_pieces=it.cout_pieces,
        cout_total=it.cout_total,
        prochaine_date_maintenance=it.prochaine_date_maintenance,
        prochain_kilo_maintenance=it.prochain_kilo_maintenance,
        statut=it.statut,
        created_at=it.created_at,
        updated_at=it.updated_at,
      )
    )

  return InterventionListResponse(
    items=items,
    total=total,
    page=page,
    per_page=per_page,
    total_pages=total_pages,
  )


@router.get("/{intervention_id}", response_model=InterventionDetail, summary="Get Detailed Intervention Record", dependencies=[Depends(require_feature("view_intervention"))])
def get_intervention(intervention_id: UUID, db: Session = Depends(get_db)):
  it = db.query(Intervention).filter(Intervention.id == intervention_id).first()
  if not it:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intervention introuvable.")

  stmt = (
    select(Piece, InterventionPiece.quantite_utilisee, InterventionPiece.prix_unitaire_applique)
    .join(InterventionPiece, Piece.id == InterventionPiece.piece_id)
    .where(InterventionPiece.intervention_id == intervention_id)
  )
  pieces_rows = db.execute(stmt).all()

  pieces_consommees = []
  total_pieces = 0
  for piece_obj, qty, prix_applique in pieces_rows:
    total_pieces += qty
    montant = qty * prix_applique
    pieces_consommees.append(
      PieceConsommeeItem(
        piece_id=piece_obj.id,
        quantite=qty,
        reference=piece_obj.reference,
        designation=piece_obj.designation,
        unite=piece_obj.unite,
        prix_unitaire_applique=prix_applique,
        montant=montant
      )
    )

  mecaniciens_participants = []
  for m in it.mecaniciens_participants:
    mecaniciens_participants.append(
      MecanicienParticipantItem(
        mecanicien_id=m.id,
        nom=m.nom,
        prenom=m.prenom,
        specialite=getattr(m, "specialite", None),
      )
    )

  docs = (
    db.query(Document)
    .filter(Document.entity_type == "intervention", Document.entity_id == intervention_id, Document.archived_at.is_(None))
    .all()
  )
  for doc in docs:
    doc.statut_validite = compute_validity_status(doc.date_expiration)

  return InterventionDetail(
    id=it.id,
    numero=it.numero,
    vehicule_id=it.vehicule_id,
    vehicule_immatriculation=it.vehicule.immatriculation if it.vehicule else None,
    vehicule_marque=it.vehicule.marque if it.vehicule else None,
    vehicule_modele=it.vehicule.modele if it.vehicule else None,
    mecanicien_responsable_id=it.mecanicien_responsable_id,
    mecanicien_nom_complet=(
      f"{it.mecanicien_responsable.nom} {it.mecanicien_responsable.prenom}"
      if it.mecanicien_responsable
      else "Non assigné"
    ),
    type=it.type,
    categorie=it.categorie,
    date=it.date,
    kilometrage=it.kilometrage,
    probleme_constate=it.probleme_constate,
    diagnostic=it.diagnostic,
    travail_effectue=it.travail_effectue,
    est_externe=it.est_externe,
    prestataire_nom=it.prestataire_nom,
    prestataire_telephone=it.prestataire_telephone,
    cout_main_doeuvre=it.cout_main_doeuvre,
    cout_pieces=it.cout_pieces,
    cout_total=it.cout_total,
    prochaine_date_maintenance=it.prochaine_date_maintenance,
    prochain_kilo_maintenance=it.prochain_kilo_maintenance,
    statut=it.statut,
    created_at=it.created_at,
    updated_at=it.updated_at,
    pieces_consommees=pieces_consommees,
    mecaniciens_participants=mecaniciens_participants,
    documents=[DocumentSummary.model_validate(d) for d in docs],
    total_pieces_utilisees=total_pieces,
  )


@router.post("", response_model=InterventionRead, status_code=status.HTTP_201_CREATED, summary="Create Work Order with Atomic Stock Deductions", dependencies=[Depends(require_feature("create_intervention"))])
def create_intervention(data: InterventionCreate, db: Session = Depends(get_db)):
  existing = db.query(Intervention).filter(Intervention.numero == data.numero.strip()).first()
  if existing:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Une intervention avec le numéro '{data.numero}'existe déjà.",
    )

  vehicule = db.query(Vehicule).filter(Vehicule.id == data.vehicule_id).first()
  if not vehicule:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail=f"Véhicule avec l'identifiant {data.vehicule_id} introuvable.",
    )

  pieces_to_deduct = []
  for p_item in data.pieces_utilisees:
    piece = db.query(Piece).filter(Piece.id == p_item.piece_id).first()
    if not piece:
      raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Pièce détachée avec l'identifiant {p_item.piece_id} introuvable.",
      )
    if piece.stock_actuel < p_item.quantite:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Stock insuffisant pour '{piece.designation}'({piece.reference}). Disponible : {piece.stock_actuel} {piece.unite}(s), Requis : {p_item.quantite}.",
      )
    pieces_to_deduct.append((piece, p_item.quantite))

  intervention = Intervention(
    id=uuid4(),
    numero=data.numero.strip().upper(),
    vehicule_id=data.vehicule_id,
    mecanicien_responsable_id=data.mecanicien_responsable_id,
    type=data.type,
    categorie=data.categorie.strip(),
    date=data.date,
    kilometrage=data.kilometrage,
    probleme_constate=data.probleme_constate.strip() if data.probleme_constate else None,
    diagnostic=data.diagnostic.strip() if data.diagnostic else None,
    travail_effectue=data.travail_effectue.strip() if data.travail_effectue else None,
    est_externe=data.est_externe,
    prestataire_nom=data.prestataire_nom.strip() if data.prestataire_nom else None,
    prestataire_telephone=data.prestataire_telephone.strip() if data.prestataire_telephone else None,
    cout_main_doeuvre=data.cout_main_doeuvre,
    cout_pieces=0.0,
    cout_total=0.0,
    prochaine_date_maintenance=data.prochaine_date_maintenance,
    prochain_kilo_maintenance=data.prochain_kilo_maintenance,
    statut=data.statut,
  )
  db.add(intervention)
  db.flush()

  cout_pieces_total = 0.0

  for piece, qty in pieces_to_deduct:
    piece.stock_actuel -= qty
    
    prix_applique = piece.prix_unitaire_moyen
    cout_pieces_total += (prix_applique * qty)

    mouvement = MouvementStock(
      id=uuid4(),
      piece_id=piece.id,
      type=TypeMouvement.SORTIE,
      quantite=qty,
      date=data.date,
      motif=f"Consommation atelier Intervention {intervention.numero} ({data.categorie})",
      intervention_id=intervention.id,
      reference_document=f"OT-{intervention.numero}",
    )
    db.add(mouvement)

    int_piece = InterventionPiece(
      intervention_id=intervention.id,
      piece_id=piece.id,
      quantite_utilisee=qty,
      prix_unitaire_applique=prix_applique
    )
    db.add(int_piece)

  intervention.cout_pieces = cout_pieces_total
  intervention.cout_total = data.cout_main_doeuvre + cout_pieces_total

  for mec_id in data.mecaniciens_participants_ids:
    db.execute(
      insert(intervention_mecaniciens).values(
        intervention_id=intervention.id,
        mecanicien_id=mec_id,
      )
    )

  if data.kilometrage >vehicule.kilometrage_actuel:
    vehicule.kilometrage_actuel = data.kilometrage

  vehicule.cout_total += intervention.cout_total

  if data.statut == StatutIntervention.EN_COURS:
    vehicule.statut = StatutVehicule.MAINTENANCE
  elif data.statut == StatutIntervention.TERMINEE and vehicule.statut == StatutVehicule.MAINTENANCE:
    vehicule.statut = StatutVehicule.DISPONIBLE

  db.commit()
  db.refresh(intervention)

  return InterventionRead(
    id=intervention.id,
    numero=intervention.numero,
    vehicule_id=intervention.vehicule_id,
    vehicule_immatriculation=vehicule.immatriculation,
    vehicule_marque=vehicule.marque,
    vehicule_modele=vehicule.modele,
    mecanicien_responsable_id=intervention.mecanicien_responsable_id,
    mecanicien_nom_complet=(
      f"{intervention.mecanicien_responsable.nom} {intervention.mecanicien_responsable.prenom}"
      if intervention.mecanicien_responsable
      else "Non assigné"
    ),
    type=intervention.type,
    categorie=intervention.categorie,
    date=intervention.date,
    kilometrage=intervention.kilometrage,
    probleme_constate=intervention.probleme_constate,
    diagnostic=intervention.diagnostic,
    travail_effectue=intervention.travail_effectue,
    est_externe=intervention.est_externe,
    prestataire_nom=intervention.prestataire_nom,
    prestataire_telephone=intervention.prestataire_telephone,
    cout_main_doeuvre=intervention.cout_main_doeuvre,
    cout_pieces=intervention.cout_pieces,
    cout_total=intervention.cout_total,
    prochaine_date_maintenance=intervention.prochaine_date_maintenance,
    prochain_kilo_maintenance=intervention.prochain_kilo_maintenance,
    statut=intervention.statut,
    created_at=intervention.created_at,
    updated_at=intervention.updated_at,
  )


@router.put("/{intervention_id}", response_model=InterventionRead, summary="Update Intervention", dependencies=[Depends(require_feature("edit_intervention"))])
def update_intervention(intervention_id: UUID, data: InterventionUpdate, db: Session = Depends(get_db)):
  it = db.query(Intervention).filter(Intervention.id == intervention_id).first()
  if not it:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intervention introuvable.")

  update_dict = data.model_dump(exclude_unset=True)
  for field, value in update_dict.items():
    if value is not None:
      setattr(it, field, value)

  if data.statut == StatutIntervention.TERMINEE and it.vehicule.statut == StatutVehicule.MAINTENANCE:
    it.vehicule.statut = StatutVehicule.DISPONIBLE
  elif data.statut == StatutIntervention.EN_COURS:
    it.vehicule.statut = StatutVehicule.MAINTENANCE

  db.commit()
  db.refresh(it)

  return InterventionRead(
    id=it.id,
    numero=it.numero,
    vehicule_id=it.vehicule_id,
    vehicule_immatriculation=it.vehicule.immatriculation if it.vehicule else None,
    vehicule_marque=it.vehicule.marque if it.vehicule else None,
    vehicule_modele=it.vehicule.modele if it.vehicule else None,
    mecanicien_responsable_id=it.mecanicien_responsable_id,
    mecanicien_nom_complet=(
      f"{it.mecanicien_responsable.nom} {it.mecanicien_responsable.prenom}"
      if it.mecanicien_responsable
      else "Non assigné"
    ),
    type=it.type,
    categorie=it.categorie,
    date=it.date,
    kilometrage=it.kilometrage,
    probleme_constate=it.probleme_constate,
    diagnostic=it.diagnostic,
    travail_effectue=it.travail_effectue,
    est_externe=it.est_externe,
    prestataire_nom=it.prestataire_nom,
    prestataire_telephone=it.prestataire_telephone,
    cout_main_doeuvre=it.cout_main_doeuvre,
    cout_pieces=it.cout_pieces,
    cout_total=it.cout_total,
    prochaine_date_maintenance=it.prochaine_date_maintenance,
    prochain_kilo_maintenance=it.prochain_kilo_maintenance,
    statut=it.statut,
    created_at=it.created_at,
    updated_at=it.updated_at,
  )


@router.delete("/{intervention_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Archive Intervention", dependencies=[Depends(require_feature("edit_intervention"))])
def delete_intervention(intervention_id: UUID, db: Session = Depends(get_db)):
  it = db.query(Intervention).filter(Intervention.id == intervention_id).first()
  if not it:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intervention introuvable.")

  it.archived_at = datetime.now(timezone.utc)
  it.statut = StatutIntervention.ANNULEE
  db.commit()
  return None
