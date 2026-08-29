from datetime import datetime, timezone, date as dt_date
import math
from typing import Optional, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc, extract
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_feature
from app.models.partenaire import Partenaire, Client, Fournisseur, Contact, CRMNote
from app.models.document import Document
from app.models.enums import RolePartenaire, TypePartenaire
from app.schemas.partenaire import (
  PartenaireCreate,
  PartenaireUpdate,
  PartenaireRead,
  PartenaireDetail,
  PartenaireListResponse,
  ContactCreate,
  ContactUpdate,
  ContactRead,
  CRMNoteCreate,
  CRMNoteRead,
)
from app.schemas.document import DocumentCreate, DocumentRead, DocumentSummary
from app.services.document_service import compute_validity_status

router = APIRouter(prefix="/partenaires", tags=["Module 3 — Gestion des Partenaires & CRM"])


@router.get("", response_model=PartenaireListResponse, summary="List CRM Partners (Clients & Fournisseurs)", dependencies=[Depends(require_feature("view_client"))])
def list_partenaires(
  search: Optional[str] = Query(None, description="Search by nom_commercial, nif, email, or telephone"),
  role_partenaire: Optional[RolePartenaire] = Query(None, description="Filter by role (CLIENT or FOURNISSEUR)"),
  statut_crm: Optional[str] = Query(None, description="Filter by CRM status (Actif, Prospect, Inactif, Bloqué)"),
  type_client: Optional[TypePartenaire] = Query(None, description="Filter by client type"),
  annee: Optional[int] = Query(None, description="Filter by year (created_at)"),
  mois: Optional[int] = Query(None, description="Filtrer par mois"),
  include_archived: bool = Query(False, description="Include soft-deleted partners"),
  page: int = Query(1, ge=1, description="Page number"),
  per_page: int = Query(10, ge=1, le=100, description="Items per page"),
  sort_by: Optional[str] = Query(None, description="Field to sort by"),
  sort_order: Optional[str] = Query("asc", description="Sort order: asc or desc"),
  db: Session = Depends(get_db),
):
  query = db.query(Partenaire)

  if not include_archived:
    query = query.filter(Partenaire.archived_at.is_(None))

  if search:
    search_pattern = f"%{search}%"
    query = query.filter(
      or_(
        Partenaire.nom_commercial.ilike(search_pattern),
        Partenaire.nif.ilike(search_pattern),
        Partenaire.email.ilike(search_pattern),
        Partenaire.telephone_principal.ilike(search_pattern),
        Partenaire.registre_commerce.ilike(search_pattern),
      )
    )

  if role_partenaire:
    query = query.filter(Partenaire.role_partenaire == role_partenaire)

  if statut_crm:
    query = query.filter(Partenaire.statut_crm.ilike(statut_crm))

  if type_client:
    query = query.filter(Partenaire.type_client == type_client)

  if annee:
    query = query.filter(extract('year', Partenaire.created_at) == annee)
if mois:
    query = query.filter(extract('month', Partenaire.created_at) == mois)

  total = query.count()
  total_pages = math.ceil(total / per_page) if total >0 else 1

  if sort_by and hasattr(Partenaire, sort_by):
    col = getattr(Partenaire, sort_by)
    query = query.order_by(desc(col) if sort_order == "desc" else col.asc())
  else:
    query = query.order_by(desc(Partenaire.created_at))

  partners = (
    query.offset((page - 1) * per_page)
    .limit(per_page)
    .all()
  )

  items = []
  for p in partners:
    primary = next((c for c in p.contacts if c.est_principal), None)
    if not primary and p.contacts:
      primary = p.contacts[0]

    p_read = PartenaireRead(
      id=p.id,
      nom_commercial=p.nom_commercial,
      logo=p.logo,
      nif=p.nif,
      nis=p.nis,
      registre_commerce=p.registre_commerce,
      article_imposition=p.article_imposition,
      adresse=p.adresse,
      wilaya=p.wilaya,
      commune=p.commune,
      code_postal=p.code_postal,
      telephone_principal=p.telephone_principal,
      email=p.email,
      site_web=p.site_web,
      statut_crm=p.statut_crm or "Actif",
      role_partenaire=p.role_partenaire,
      type_client=p.type_client,
      specialite=p.specialite,
      created_at=p.created_at,
      updated_at=p.updated_at,
      archived_at=p.archived_at,
      contact_principal=ContactRead.model_validate(primary) if primary else None,
    )
    items.append(p_read)

  return PartenaireListResponse(
    items=items,
    total=total,
    page=page,
    per_page=per_page,
    total_pages=total_pages,
  )


@router.get("/{partenaire_id}", response_model=PartenaireDetail, summary="Get Detailed Partner Dossier", dependencies=[Depends(require_feature("view_client"))])
def get_partenaire(partenaire_id: UUID, db: Session = Depends(get_db)):
  partner = db.query(Partenaire).filter(Partenaire.id == partenaire_id).first()
  if not partner:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partenaire introuvable.")

  docs = (
    db.query(Document)
    .filter(Document.entity_type == "partenaire", Document.entity_id == partenaire_id, Document.archived_at.is_(None))
    .all()
  )
  for doc in docs:
    doc.statut_validite = compute_validity_status(doc.date_expiration)

  notes = (
    db.query(CRMNote)
    .filter(CRMNote.partenaire_id == partenaire_id)
    .order_by(desc(CRMNote.date), desc(CRMNote.created_at))
    .all()
  )

  primary = next((c for c in partner.contacts if c.est_principal), None)
  if not primary and partner.contacts:
    primary = partner.contacts[0]

  return PartenaireDetail(
    id=partner.id,
    nom_commercial=partner.nom_commercial,
    logo=partner.logo,
    nif=partner.nif,
    nis=partner.nis,
    registre_commerce=partner.registre_commerce,
    article_imposition=partner.article_imposition,
    adresse=partner.adresse,
    wilaya=partner.wilaya,
    commune=partner.commune,
    code_postal=partner.code_postal,
    telephone_principal=partner.telephone_principal,
    email=partner.email,
    site_web=partner.site_web,
    statut_crm=partner.statut_crm or "Actif",
    role_partenaire=partner.role_partenaire,
    type_client=partner.type_client,
    specialite=partner.specialite,
    created_at=partner.created_at,
    updated_at=partner.updated_at,
    archived_at=partner.archived_at,
    contact_principal=ContactRead.model_validate(primary) if primary else None,
    contacts=[ContactRead.model_validate(c) for c in partner.contacts],
    documents=[DocumentSummary.model_validate(d) for d in docs],
    crm_notes=[CRMNoteRead.model_validate(n) for n in notes],
    total_contacts=len(partner.contacts),
    total_documents=len(docs),
    total_notes=len(notes),
  )


@router.post("", response_model=PartenaireRead, status_code=status.HTTP_201_CREATED, summary="Create Partner", dependencies=[Depends(require_feature("create_client"))])
def create_partenaire(data: PartenaireCreate, db: Session = Depends(get_db)):
  if data.role_partenaire == RolePartenaire.CLIENT:
    partner = Client(
      id=uuid4(),
      nom_commercial=data.nom_commercial.strip(),
      logo=data.logo,
      nif=data.nif.strip() if data.nif else None,
      nis=data.nis.strip() if data.nis else None,
      registre_commerce=data.registre_commerce.strip() if data.registre_commerce else None,
      article_imposition=data.article_imposition.strip() if data.article_imposition else None,
      adresse=data.adresse.strip() if data.adresse else None,
      wilaya=data.wilaya.strip() if data.wilaya else None,
      commune=data.commune.strip() if data.commune else None,
      code_postal=data.code_postal.strip() if data.code_postal else None,
      telephone_principal=data.telephone_principal.strip() if data.telephone_principal else None,
      email=data.email.strip() if data.email else None,
      site_web=data.site_web.strip() if data.site_web else None,
      statut_crm=data.statut_crm.strip() if data.statut_crm else "Actif",
      role_partenaire=RolePartenaire.CLIENT,
      type_client=data.type_client or TypePartenaire.ENTREPRISE,
    )
  else:
    partner = Fournisseur(
      id=uuid4(),
      nom_commercial=data.nom_commercial.strip(),
      logo=data.logo,
      nif=data.nif.strip() if data.nif else None,
      nis=data.nis.strip() if data.nis else None,
      registre_commerce=data.registre_commerce.strip() if data.registre_commerce else None,
      article_imposition=data.article_imposition.strip() if data.article_imposition else None,
      adresse=data.adresse.strip() if data.adresse else None,
      wilaya=data.wilaya.strip() if data.wilaya else None,
      commune=data.commune.strip() if data.commune else None,
      code_postal=data.code_postal.strip() if data.code_postal else None,
      telephone_principal=data.telephone_principal.strip() if data.telephone_principal else None,
      email=data.email.strip() if data.email else None,
      site_web=data.site_web.strip() if data.site_web else None,
      statut_crm=data.statut_crm.strip() if data.statut_crm else "Actif",
      role_partenaire=RolePartenaire.FOURNISSEUR,
      specialite=data.specialite.strip() if data.specialite else "Fournisseur Général",
    )

  db.add(partner)
  db.flush()

  for c_data in data.contacts:
    contact = Contact(
      id=uuid4(),
      partenaire_id=partner.id,
      nom=c_data.nom.strip(),
      prenom=c_data.prenom.strip(),
      fonction=c_data.fonction.strip() if c_data.fonction else None,
      telephone=c_data.telephone.strip() if c_data.telephone else None,
      email=c_data.email.strip() if c_data.email else None,
      whatsapp=c_data.whatsapp.strip() if c_data.whatsapp else None,
      est_principal=c_data.est_principal,
      notes=c_data.notes,
    )
    db.add(contact)

  db.commit()
  db.refresh(partner)
  return partner


@router.put("/{partenaire_id}", response_model=PartenaireRead, summary="Update Partner", dependencies=[Depends(require_feature("edit_client"))])
def update_partenaire(partenaire_id: UUID, data: PartenaireUpdate, db: Session = Depends(get_db)):
  partner = db.query(Partenaire).filter(Partenaire.id == partenaire_id).first()
  if not partner:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partenaire introuvable.")

  update_dict = data.model_dump(exclude_unset=True)
  for field, value in update_dict.items():
    if value is not None:
      setattr(partner, field, value)

  db.commit()
  db.refresh(partner)
  return partner


@router.patch("/{partenaire_id}/archive", response_model=PartenaireRead, summary="Archive Partner", dependencies=[Depends(require_feature("edit_client"))])
def archive_partenaire(partenaire_id: UUID, db: Session = Depends(get_db)):
  partner = db.query(Partenaire).filter(Partenaire.id == partenaire_id).first()
  if not partner:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partenaire introuvable.")

  partner.archived_at = datetime.now(timezone.utc)
  partner.statut_crm = "Inactif"
  db.commit()
  db.refresh(partner)
  return partner


# ============================================
# Multi-Contact Sub-resources
# ============================================

@router.get("/{partenaire_id}/contacts", response_model=List[ContactRead], summary="List Partner Contacts")
def list_contacts(partenaire_id: UUID, db: Session = Depends(get_db)):
  return (
    db.query(Contact)
    .filter(Contact.partenaire_id == partenaire_id)
    .order_by(desc(Contact.est_principal), Contact.nom)
    .all()
  )


@router.post("/{partenaire_id}/contacts", response_model=ContactRead, status_code=status.HTTP_201_CREATED, summary="Add Contact to Partner")
def add_contact(partenaire_id: UUID, data: ContactCreate, db: Session = Depends(get_db)):
  partner = db.query(Partenaire).filter(Partenaire.id == partenaire_id).first()
  if not partner:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partenaire introuvable.")

  if data.est_principal:
    db.query(Contact).filter(Contact.partenaire_id == partenaire_id).update({"est_principal": False})

  contact = Contact(
    id=uuid4(),
    partenaire_id=partenaire_id,
    nom=data.nom.strip(),
    prenom=data.prenom.strip(),
    fonction=data.fonction.strip() if data.fonction else None,
    telephone=data.telephone.strip() if data.telephone else None,
    email=data.email.strip() if data.email else None,
    whatsapp=data.whatsapp.strip() if data.whatsapp else None,
    est_principal=data.est_principal,
    notes=data.notes,
  )
  db.add(contact)
  db.commit()
  db.refresh(contact)
  return contact


@router.delete("/{partenaire_id}/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Contact")
def delete_contact(partenaire_id: UUID, contact_id: UUID, db: Session = Depends(get_db)):
  contact = db.query(Contact).filter(Contact.id == contact_id, Contact.partenaire_id == partenaire_id).first()
  if not contact:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact introuvable.")

  db.delete(contact)
  db.commit()
  return None


# ============================================
# CRM Interaction History Notes
# ============================================

@router.get("/{partenaire_id}/notes", response_model=List[CRMNoteRead], summary="List CRM History Notes")
def list_crm_notes(partenaire_id: UUID, db: Session = Depends(get_db)):
  return (
    db.query(CRMNote)
    .filter(CRMNote.partenaire_id == partenaire_id)
    .order_by(desc(CRMNote.date), desc(CRMNote.created_at))
    .all()
  )


@router.post("/{partenaire_id}/notes", response_model=CRMNoteRead, status_code=status.HTTP_201_CREATED, summary="Log CRM Interaction")
def create_crm_note(partenaire_id: UUID, data: CRMNoteCreate, db: Session = Depends(get_db)):
  partner = db.query(Partenaire).filter(Partenaire.id == partenaire_id).first()
  if not partner:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partenaire introuvable.")

  note = CRMNote(
    id=uuid4(),
    partenaire_id=partenaire_id,
    type=data.type,
    auteur=data.auteur.strip() if data.auteur else "Administrateur",
    date=data.date,
    contenu=data.contenu.strip(),
  )
  db.add(note)
  db.commit()
  db.refresh(note)
  return note


# ============================================
# Corporate Documents Sub-routes
# ============================================

@router.get("/{partenaire_id}/documents", response_model=List[DocumentRead], summary="List Partner Corporate Documents")
def list_partenaire_documents(partenaire_id: UUID, db: Session = Depends(get_db)):
  docs = (
    db.query(Document)
    .filter(Document.entity_type == "partenaire", Document.entity_id == partenaire_id, Document.archived_at.is_(None))
    .order_by(desc(Document.created_at))
    .all()
  )
  for doc in docs:
    doc.statut_validite = compute_validity_status(doc.date_expiration)
  return docs


@router.post("/{partenaire_id}/documents", response_model=DocumentRead, status_code=status.HTTP_201_CREATED, summary="Attach Document to Partner")
def create_partenaire_document(partenaire_id: UUID, data: DocumentCreate, db: Session = Depends(get_db)):
  partner = db.query(Partenaire).filter(Partenaire.id == partenaire_id).first()
  if not partner:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partenaire introuvable.")

  validity = compute_validity_status(data.date_expiration)
  doc = Document(
    id=uuid4(),
    nom=data.nom.strip(),
    type=data.type.strip(),
    url_fichier=data.url_fichier.strip(),
    date_emission=data.date_emission,
    date_expiration=data.date_expiration,
    statut_validite=validity,
    entity_type="partenaire",
    entity_id=partenaire_id,
  )
  db.add(doc)
  db.commit()
  db.refresh(doc)
  return doc
