from datetime import datetime, timezone, date as dt_date
import math
import os
from typing import Optional, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import require_feature
from app.models.stock import Piece, MouvementStock, Reception, ReceptionLigne
from app.models.partenaire import Partenaire
from app.models.intervention import Intervention
from app.models.settings import SystemSettings
from app.models.enums import TypeMouvement
from app.schemas.stock import (
  PieceCreate,
  PieceUpdate,
  PieceRead,
  PieceDetail,
  PieceListResponse,
  MouvementStockRead,
  MouvementStockListResponse,
  StockEntryCreate,
  StockExitCreate,
  InventoryAuditCreate,
  ReceptionCreate,
  ReceptionRead,
  ReceptionDetail,
  ReceptionListResponse,
)
from app.api.v1.settings import get_or_create_settings
from app.services.pdf_stock_service import generate_reception_pdf

router = APIRouter(prefix="/stock", tags=["Module 5 — Gestion du Stock & Pièces"])


def compute_stock_status(stock_actuel: int, stock_minimum: int) ->str:
  if stock_actuel <= 0:
    return "RUPTURE"
  elif stock_actuel <= stock_minimum:
    return "FAIBLE"
  return "NORMAL"


@router.get("/pieces", response_model=PieceListResponse, summary="List Spare Parts Inventory")
def list_pieces(
  search: Optional[str] = Query(None, description="Search by reference, designation, marque, or emplacement"),
  categorie: Optional[str] = Query(None, description="Filter by category"),
  statut_stock: Optional[str] = Query(None, description="Filter by stock status: NORMAL, FAIBLE, RUPTURE"),
  include_archived: bool = Query(False, description="Include archived pieces"),
  page: int = Query(1, ge=1, description="Page number"),
  per_page: int = Query(20, ge=1, le=100, description="Items per page"),
  db: Session = Depends(get_db),
):
  query = db.query(Piece)

  if not include_archived:
    query = query.filter(Piece.archived_at.is_(None))

  if search:
    search_pattern = f"%{search}%"
    query = query.filter(
      or_(
        Piece.reference.ilike(search_pattern),
        Piece.designation.ilike(search_pattern),
        Piece.marque.ilike(search_pattern),
        Piece.emplacement.ilike(search_pattern),
        Piece.modele_compatibilite.ilike(search_pattern),
      )
    )

  if categorie:
    query = query.filter(Piece.categorie.ilike(categorie))

  all_matching = query.all()

  items_all = []
  normal_count = 0
  faible_count = 0
  rupture_count = 0

  for p in all_matching:
    st = compute_stock_status(p.stock_actuel, p.stock_minimum)
    if st == "NORMAL":
      normal_count += 1
    elif st == "FAIBLE":
      faible_count += 1
    elif st == "RUPTURE":
      rupture_count += 1

    if not statut_stock or st == statut_stock.upper():
      items_all.append((p, st))

  total = len(items_all)
  total_pages = math.ceil(total / per_page) if total >0 else 1

  start = (page - 1) * per_page
  end = start + per_page
  paginated_items = items_all[start:end]

  result_pieces = []
  for p, st in paginated_items:
    p_read = PieceRead(
      id=p.id,
      reference=p.reference,
      designation=p.designation,
      categorie=p.categorie,
      marque=p.marque,
      modele_compatibilite=p.modele_compatibilite,
      unite=p.unite,
      stock_actuel=p.stock_actuel,
      stock_minimum=p.stock_minimum,
      emplacement=p.emplacement,
      description=p.description,
      statut_stock=st,
      created_at=p.created_at,
      updated_at=p.updated_at,
      archived_at=p.archived_at,
    )
    result_pieces.append(p_read)

  return PieceListResponse(
    items=result_pieces,
    total=total,
    page=page,
    per_page=per_page,
    total_pages=total_pages,
    total_references=len(all_matching),
    total_stock_normal=normal_count,
    total_stock_faible=faible_count,
    total_rupture=rupture_count,
  )


@router.get("/pieces/{piece_id}", response_model=PieceDetail, summary="Get Spare Part Detail & Movement Ledger")
def get_piece(piece_id: UUID, db: Session = Depends(get_db)):
  piece = db.query(Piece).filter(Piece.id == piece_id).first()
  if not piece:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pièce détachée introuvable.")

  st = compute_stock_status(piece.stock_actuel, piece.stock_minimum)

  mouvements = (
    db.query(MouvementStock)
    .filter(MouvementStock.piece_id == piece_id)
    .order_by(desc(MouvementStock.date), desc(MouvementStock.created_at))
    .all()
  )

  mvt_reads = []
  total_entrees = 0
  total_sorties = 0

  for m in mouvements:
    if m.type == TypeMouvement.ENTREE:
      total_entrees += m.quantite
    elif m.type == TypeMouvement.SORTIE:
      total_sorties += m.quantite

    mvt_reads.append(
      MouvementStockRead(
        id=m.id,
        piece_id=m.piece_id,
        piece_reference=piece.reference,
        piece_designation=piece.designation,
        type=m.type,
        quantite=m.quantite,
        date=m.date,
        motif=m.motif,
        ecart_inventaire=m.ecart_inventaire,
        intervention_id=m.intervention_id,
        intervention_numero=m.intervention.numero if m.intervention else None,
        fournisseur_id=m.fournisseur_id,
        fournisseur_nom=m.fournisseur.nom_commercial if m.fournisseur else None,
        reference_document=m.reference_document,
        created_at=m.created_at,
        updated_at=m.updated_at,
      )
    )

  return PieceDetail(
    id=piece.id,
    reference=piece.reference,
    designation=piece.designation,
    categorie=piece.categorie,
    marque=piece.marque,
    modele_compatibilite=piece.modele_compatibilite,
    unite=piece.unite,
    stock_actuel=piece.stock_actuel,
    stock_minimum=piece.stock_minimum,
    emplacement=piece.emplacement,
    description=piece.description,
    statut_stock=st,
    created_at=piece.created_at,
    updated_at=piece.updated_at,
    archived_at=piece.archived_at,
    mouvements=mvt_reads,
    total_entrees=total_entrees,
    total_sorties=total_sorties,
  )


@router.post("/pieces", response_model=PieceRead, status_code=status.HTTP_201_CREATED, summary="Create Spare Part", dependencies=[Depends(require_feature("create_stock_entry"))])
def create_piece(data: PieceCreate, db: Session = Depends(get_db)):
  existing = db.query(Piece).filter(Piece.reference == data.reference.strip()).first()
  if existing:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Une pièce avec la référence '{data.reference}'existe déjà.",
    )

  piece = Piece(
    id=uuid4(),
    reference=data.reference.strip().upper(),
    designation=data.designation.strip(),
    categorie=data.categorie.strip(),
    marque=data.marque.strip() if data.marque else None,
    modele_compatibilite=data.modele_compatibilite.strip() if data.modele_compatibilite else None,
    unite=data.unite.strip() if data.unite else "Pièce",
    stock_actuel=data.stock_actuel,
    stock_minimum=data.stock_minimum,
    emplacement=data.emplacement.strip().upper() if data.emplacement else None,
    description=data.description.strip() if data.description else None,
  )
  db.add(piece)
  db.commit()
  db.refresh(piece)

  st = compute_stock_status(piece.stock_actuel, piece.stock_minimum)
  return PieceRead(
    id=piece.id,
    reference=piece.reference,
    designation=piece.designation,
    categorie=piece.categorie,
    marque=piece.marque,
    modele_compatibilite=piece.modele_compatibilite,
    unite=piece.unite,
    stock_actuel=piece.stock_actuel,
    stock_minimum=piece.stock_minimum,
    emplacement=piece.emplacement,
    description=piece.description,
    statut_stock=st,
    created_at=piece.created_at,
    updated_at=piece.updated_at,
  )


@router.put("/pieces/{piece_id}", response_model=PieceRead, summary="Update Spare Part", dependencies=[Depends(require_feature("create_stock_entry"))])
def update_piece(piece_id: UUID, data: PieceUpdate, db: Session = Depends(get_db)):
  piece = db.query(Piece).filter(Piece.id == piece_id).first()
  if not piece:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pièce détachée introuvable.")

  update_dict = data.model_dump(exclude_unset=True)
  for field, value in update_dict.items():
    if value is not None:
      setattr(piece, field, value)

  db.commit()
  db.refresh(piece)

  st = compute_stock_status(piece.stock_actuel, piece.stock_minimum)
  return PieceRead(
    id=piece.id,
    reference=piece.reference,
    designation=piece.designation,
    categorie=piece.categorie,
    marque=piece.marque,
    modele_compatibilite=piece.modele_compatibilite,
    unite=piece.unite,
    stock_actuel=piece.stock_actuel,
    stock_minimum=piece.stock_minimum,
    emplacement=piece.emplacement,
    description=piece.description,
    statut_stock=st,
    created_at=piece.created_at,
    updated_at=piece.updated_at,
  )


@router.delete("/pieces/{piece_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Archive Spare Part", dependencies=[Depends(require_feature("create_stock_entry"))])
def delete_piece(piece_id: UUID, db: Session = Depends(get_db)):
  piece = db.query(Piece).filter(Piece.id == piece_id).first()
  if not piece:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pièce détachée introuvable.")

  piece.archived_at = datetime.now(timezone.utc)
  db.commit()
  return None


# ============================================
# Stock Transactions (ACID Safe)
# ============================================

@router.post("/entrees", response_model=MouvementStockRead, status_code=status.HTTP_201_CREATED, summary="Register Stock Delivery (Entrée)", dependencies=[Depends(require_feature("create_stock_entry"))])
def create_stock_entry(data: StockEntryCreate, db: Session = Depends(get_db)):
  piece = db.query(Piece).filter(Piece.id == data.piece_id).first()
  if not piece:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pièce détachée introuvable.")

  piece.stock_actuel += data.quantite

  mouvement = MouvementStock(
    id=uuid4(),
    piece_id=piece.id,
    type=TypeMouvement.ENTREE,
    quantite=data.quantite,
    date=data.date,
    motif=data.motif.strip(),
    fournisseur_id=data.fournisseur_id,
    reference_document=data.reference_document.strip() if data.reference_document else None,
  )
  db.add(mouvement)
  db.commit()
  db.refresh(mouvement)

  return MouvementStockRead(
    id=mouvement.id,
    piece_id=mouvement.piece_id,
    piece_reference=piece.reference,
    piece_designation=piece.designation,
    type=mouvement.type,
    quantite=mouvement.quantite,
    date=mouvement.date,
    motif=mouvement.motif,
    fournisseur_id=mouvement.fournisseur_id,
    fournisseur_nom=mouvement.fournisseur.nom_commercial if mouvement.fournisseur else None,
    reference_document=mouvement.reference_document,
    created_at=mouvement.created_at,
    updated_at=mouvement.updated_at,
  )


@router.post("/sorties", response_model=MouvementStockRead, status_code=status.HTTP_201_CREATED, summary="Register Stock Consumption (Sortie)", dependencies=[Depends(require_feature("create_stock_exit"))])
def create_stock_exit(data: StockExitCreate, db: Session = Depends(get_db)):
  piece = db.query(Piece).filter(Piece.id == data.piece_id).first()
  if not piece:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pièce détachée introuvable.")

  if piece.stock_actuel < data.quantite:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Stock insuffisant pour {piece.reference}. Disponible : {piece.stock_actuel} {piece.unite}(s), Demandé : {data.quantite}.",
    )

  piece.stock_actuel -= data.quantite

  mouvement = MouvementStock(
    id=uuid4(),
    piece_id=piece.id,
    type=TypeMouvement.SORTIE,
    quantite=data.quantite,
    date=data.date,
    motif=data.motif.strip(),
    intervention_id=data.intervention_id,
    reference_document=data.reference_document.strip() if data.reference_document else None,
  )
  db.add(mouvement)
  db.commit()
  db.refresh(mouvement)

  return MouvementStockRead(
    id=mouvement.id,
    piece_id=mouvement.piece_id,
    piece_reference=piece.reference,
    piece_designation=piece.designation,
    type=mouvement.type,
    quantite=mouvement.quantite,
    date=mouvement.date,
    motif=mouvement.motif,
    intervention_id=mouvement.intervention_id,
    reference_document=mouvement.reference_document,
    created_at=mouvement.created_at,
    updated_at=mouvement.updated_at,
  )


@router.post("/inventaire", response_model=MouvementStockRead, status_code=status.HTTP_201_CREATED, summary="Register Physical Inventory Count Audit", dependencies=[Depends(require_feature("do_inventory"))])
def create_inventory_audit(data: InventoryAuditCreate, db: Session = Depends(get_db)):
  piece = db.query(Piece).filter(Piece.id == data.piece_id).first()
  if not piece:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pièce détachée introuvable.")

  ecart = data.stock_reel_compte - piece.stock_actuel
  motif_complet = (
    f"{data.motif.strip()} (Écart: {'+'if ecart >0 else ''}{ecart} {piece.unite})"
    if not data.justification_ecart
    else f"{data.motif.strip()} — Justification : {data.justification_ecart.strip()} (Écart: {'+'if ecart >0 else ''}{ecart})"
  )

  piece.stock_actuel = data.stock_reel_compte

  mouvement = MouvementStock(
    id=uuid4(),
    piece_id=piece.id,
    type=TypeMouvement.INVENTAIRE,
    quantite=abs(ecart),
    ecart_inventaire=ecart,
    date=data.date,
    motif=motif_complet,
  )
  db.add(mouvement)
  db.commit()
  db.refresh(mouvement)

  return MouvementStockRead(
    id=mouvement.id,
    piece_id=mouvement.piece_id,
    piece_reference=piece.reference,
    piece_designation=piece.designation,
    type=mouvement.type,
    quantite=mouvement.quantite,
    date=mouvement.date,
    motif=mouvement.motif,
    ecart_inventaire=mouvement.ecart_inventaire,
    created_at=mouvement.created_at,
    updated_at=mouvement.updated_at,
  )


@router.get("/mouvements", response_model=MouvementStockListResponse, summary="List All Stock Movements Ledger")
def list_mouvements(
  type: Optional[TypeMouvement] = Query(None, description="Filter by movement type"),
  piece_id: Optional[UUID] = Query(None, description="Filter by piece"),
  page: int = Query(1, ge=1, description="Page number"),
  per_page: int = Query(20, ge=1, le=100, description="Items per page"),
  db: Session = Depends(get_db),
):
  query = db.query(MouvementStock)

  if type:
    query = query.filter(MouvementStock.type == type)

  if piece_id:
    query = query.filter(MouvementStock.piece_id == piece_id)

  total = query.count()
  total_pages = math.ceil(total / per_page) if total >0 else 1

  mouvements = (
    query.order_by(desc(MouvementStock.date), desc(MouvementStock.created_at))
    .offset((page - 1) * per_page)
    .limit(per_page)
    .all()
  )

  items = []
  for m in mouvements:
    items.append(
      MouvementStockRead(
        id=m.id,
        piece_id=m.piece_id,
        piece_reference=m.piece.reference if m.piece else None,
        piece_designation=m.piece.designation if m.piece else None,
        type=m.type,
        quantite=m.quantite,
        date=m.date,
        motif=m.motif,
        ecart_inventaire=m.ecart_inventaire,
        intervention_id=m.intervention_id,
        intervention_numero=m.intervention.numero if m.intervention else None,
        fournisseur_id=m.fournisseur_id,
        fournisseur_nom=m.fournisseur.nom_commercial if m.fournisseur else None,
        reference_document=m.reference_document,
        created_at=m.created_at,
        updated_at=m.updated_at,
      )
    )

  return MouvementStockListResponse(
    items=items,
    total=total,
    page=page,
    per_page=per_page,
    total_pages=total_pages,
  )


# ═══════════════════════════════════════════════════════════════════
#  RECEPTIONS — Supplier Delivery Records
# ═══════════════════════════════════════════════════════════════════

@router.post("/receptions", response_model=ReceptionRead, status_code=status.HTTP_201_CREATED,
             summary="Create Reception (Bon de Réception)", dependencies=[Depends(require_feature("create_stock_entry"))])
def create_reception(data: ReceptionCreate, db: Session = Depends(get_db)):
  numero = f"REC-{datetime.now().year}-{uuid4().hex[:6].upper()}"

  total = 0.0
  for ligne in data.lignes:
    total += ligne.quantite * ligne.prix_unitaire

  reception = Reception(
    id=uuid4(),
    numero=numero,
    fournisseur_id=data.fournisseur_id,
    date=data.date,
    lieu=data.lieu,
    montant_total=total,
    mode_reglement=data.mode_reglement,
    motif=data.motif,
    reference_document=data.reference_document,
  )
  db.add(reception)
  db.flush()

  for ligne_data in data.lignes:
    piece = db.query(Piece).filter(Piece.id == ligne_data.piece_id).first()
    if not piece:
      db.rollback()
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pièce {ligne_data.piece_id} introuvable.")

    montant_ligne = ligne_data.quantite * ligne_data.prix_unitaire

    ligne = ReceptionLigne(
      id=uuid4(),
      reception_id=reception.id,
      piece_id=ligne_data.piece_id,
      quantite=ligne_data.quantite,
      prix_unitaire=ligne_data.prix_unitaire,
      montant_ligne=montant_ligne,
    )
    db.add(ligne)

    piece.stock_actuel += ligne_data.quantite

    mv = MouvementStock(
      id=uuid4(),
      piece_id=ligne_data.piece_id,
      type=TypeMouvement.ENTREE,
      quantite=ligne_data.quantite,
      date=data.date,
      motif=data.motif or f"Réception {numero}",
      fournisseur_id=data.fournisseur_id,
      reference_document=data.reference_document or numero,
      reception_id=reception.id,
    )
    db.add(mv)

  db.commit()
  db.refresh(reception)

  try:
    settings = get_or_create_settings(db)
    lignes_full = (
      db.query(ReceptionLigne)
      .options(joinedload(ReceptionLigne.piece))
      .filter(ReceptionLigne.reception_id == reception.id)
      .all()
    )
    pdf_url = generate_reception_pdf(reception, lignes_full, settings)
    reception.url_pdf = pdf_url
    db.commit()
    db.refresh(reception)
  except Exception as e:
    print(f"[PDF] Failed to generate reception PDF: {e}")

  fournisseur_nom = reception.fournisseur.nom_commercial if reception.fournisseur else None
  lignes_read = []
  for l in reception.lignes:
    lignes_read.append({
      "id": l.id,
      "piece_id": l.piece_id,
      "piece_reference": l.piece.reference if l.piece else None,
      "piece_designation": l.piece.designation if l.piece else None,
      "quantite": l.quantite,
      "prix_unitaire": l.prix_unitaire,
      "montant_ligne": l.montant_ligne,
    })

  return ReceptionRead(
    id=reception.id,
    numero=reception.numero,
    fournisseur_id=reception.fournisseur_id,
    fournisseur_nom=fournisseur_nom,
    date=reception.date,
    lieu=reception.lieu,
    montant_total=reception.montant_total,
    mode_reglement=reception.mode_reglement,
    motif=reception.motif,
    reference_document=reception.reference_document,
    url_pdf=reception.url_pdf,
    created_at=reception.created_at,
    updated_at=reception.updated_at,
  )


@router.get("/receptions", response_model=ReceptionListResponse, summary="List Receptions",
            dependencies=[Depends(require_feature("view_stock"))])
def list_receptions(
  search: Optional[str] = Query(None),
  fournisseur_id: Optional[UUID] = Query(None),
  date_from: Optional[dt_date] = Query(None),
  date_to: Optional[dt_date] = Query(None),
  page: int = Query(1, ge=1),
  per_page: int = Query(10, ge=1, le=100),
  db: Session = Depends(get_db),
):
  query = db.query(Reception)

  if search:
    pattern = f"%{search}%"
    query = query.join(Partenaire, Reception.fournisseur_id == Partenaire.id, isouter=True).filter(
      or_(Reception.numero.ilike(pattern), Reception.reference_document.ilike(pattern), Partenaire.nom_commercial.ilike(pattern))
    )
  if fournisseur_id:
    query = query.filter(Reception.fournisseur_id == fournisseur_id)
  if date_from:
    query = query.filter(Reception.date >= date_from)
  if date_to:
    query = query.filter(Reception.date <= date_to)

  total = query.count()
  total_pages = math.ceil(total / per_page) if total > 0 else 1

  receptions = query.order_by(desc(Reception.date), desc(Reception.created_at)).offset((page - 1) * per_page).limit(per_page).all()

  items = []
  for r in receptions:
    items.append(ReceptionRead(
      id=r.id,
      numero=r.numero,
      fournisseur_id=r.fournisseur_id,
      fournisseur_nom=r.fournisseur.nom_commercial if r.fournisseur else None,
      date=r.date,
      lieu=r.lieu,
      montant_total=r.montant_total,
      mode_reglement=r.mode_reglement,
      motif=r.motif,
      reference_document=r.reference_document,
      url_pdf=r.url_pdf,
      created_at=r.created_at,
      updated_at=r.updated_at,
    ))

  return ReceptionListResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/receptions/{reception_id}", response_model=ReceptionDetail, summary="Get Reception Detail",
            dependencies=[Depends(require_feature("view_stock"))])
def get_reception(reception_id: UUID, db: Session = Depends(get_db)):
  r = db.query(Reception).filter(Reception.id == reception_id).first()
  if not r:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réception introuvable.")

  lignes_read = []
  for l in r.lignes:
    lignes_read.append({
      "id": l.id,
      "piece_id": l.piece_id,
      "piece_reference": l.piece.reference if l.piece else None,
      "piece_designation": l.piece.designation if l.piece else None,
      "quantite": l.quantite,
      "prix_unitaire": l.prix_unitaire,
      "montant_ligne": l.montant_ligne,
    })

  return ReceptionDetail(
    id=r.id,
    numero=r.numero,
    fournisseur_id=r.fournisseur_id,
    fournisseur_nom=r.fournisseur.nom_commercial if r.fournisseur else None,
    date=r.date,
    lieu=r.lieu,
    montant_total=r.montant_total,
    mode_reglement=r.mode_reglement,
    motif=r.motif,
    reference_document=r.reference_document,
    url_pdf=r.url_pdf,
    created_at=r.created_at,
    updated_at=r.updated_at,
    lignes=lignes_read,
  )


@router.get("/receptions/{reception_id}/pdf", summary="Download Reception PDF")
def download_reception_pdf(reception_id: UUID, db: Session = Depends(get_db)):
  reception = db.query(Reception).filter(Reception.id == reception_id).first()
  if not reception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réception introuvable.")

  sanitized = reception.numero.replace("/", "_").replace("\\", "_")
  filename = f"reception_{sanitized}.pdf"
  filepath = os.path.join(
    os.path.abspath(
      os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend", "public", "assets", "documents", "receptions")
    ),
    filename,
  )

  if os.path.exists(filepath):
    return FileResponse(filepath, media_type="application/pdf", filename=filename, content_disposition_type="inline")

  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Le fichier PDF n'a pas été généré.")


@router.delete("/receptions/{reception_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete Reception", dependencies=[Depends(require_feature("create_stock_entry"))])
def delete_reception(reception_id: UUID, db: Session = Depends(get_db)):
  reception = db.query(Reception).filter(Reception.id == reception_id).first()
  if not reception:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réception introuvable.")

  for l in reception.lignes:
    piece = db.query(Piece).filter(Piece.id == l.piece_id).first()
    if piece:
      piece.stock_actuel = max(0, piece.stock_actuel - l.quantite)

  for m in reception.mouvements:
    db.delete(m)

  db.delete(reception)
  db.commit()
  return None

@router.post("/receptions/{reception_id}/generate-pdf-achat", response_model=ReceptionRead, summary="Generate Bon d'Achat PDF", dependencies=[Depends(require_feature("view_stock"))])
def generate_bon_achat(reception_id: UUID, db: Session = Depends(get_db)):
  r = db.query(Reception).options(joinedload(Reception.fournisseur), joinedload(Reception.lignes).joinedload(ReceptionLigne.piece)).filter(Reception.id == reception_id).first()
  if not r:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réception introuvable.")

  from app.services.pdf_service import generate_bon_achat_pdf
  settings = get_or_create_settings(db)
  
  fournisseur_nom = r.fournisseur.nom_commercial if r.fournisseur else "INCONNU"
  fournisseur_tel = r.fournisseur.telephone if (r.fournisseur and r.fournisseur.telephone) else "-"
  
  lignes_data = []
  for l in r.lignes:
      lignes_data.append({
          "reference": l.piece.reference if l.piece else "-",
          "designation": l.piece.designation if l.piece else "-",
          "quantite": l.quantite,
          "prix_unitaire": l.prix_unitaire,
          "montant_ligne": l.montant_ligne
      })
      
  pdf_url = generate_bon_achat_pdf(
      reception_numero=r.numero,
      date_reception=r.date,
      fournisseur_nom=fournisseur_nom,
      fournisseur_tel=fournisseur_tel,
      lignes=lignes_data,
      montant_total=r.montant_total,
      mode_reglement=getattr(r.mode_reglement, 'name', str(r.mode_reglement)) if r.mode_reglement else "A_Terme",
      company_name=settings.company_name or "GarageDZ",
      company_address=settings.company_address or "25 ARZEW, ORAN",
      company_phone=settings.company_phone or "",
      company_rc=settings.company_rc or "RC N° 00000000000",
      company_nif=settings.company_nif or "00000000000000",
      company_nis=settings.company_nis or "00000000000000",
      company_ai=settings.company_ai or "00000000000",
  )
  
  r.url_pdf = pdf_url
  db.commit()
  db.refresh(r)
  
  lignes_read = []
  for l in r.lignes:
    lignes_read.append({
      "id": l.id,
      "piece_id": l.piece_id,
      "piece_reference": l.piece.reference if l.piece else None,
      "piece_designation": l.piece.designation if l.piece else None,
      "quantite": l.quantite,
      "prix_unitaire": l.prix_unitaire,
      "montant_ligne": l.montant_ligne,
    })

  return ReceptionRead(
    id=r.id,
    numero=r.numero,
    fournisseur_id=r.fournisseur_id,
    fournisseur_nom=r.fournisseur.nom_commercial if r.fournisseur else None,
    date=r.date,
    lieu=r.lieu,
    montant_total=r.montant_total,
    mode_reglement=r.mode_reglement,
    motif=r.motif,
    reference_document=r.reference_document,
    url_pdf=r.url_pdf,
    created_at=r.created_at,
    updated_at=r.updated_at,
  )
