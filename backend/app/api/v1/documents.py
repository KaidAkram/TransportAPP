import os
import re
import uuid
from datetime import datetime, date as dt_date, timezone
from pathlib import Path
from typing import Optional, List
from uuid import UUID

from fastapi import (
  APIRouter,
  Depends,
  HTTPException,
  UploadFile,
  File,
  Form,
  status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_user, get_current_user, require_feature, CurrentUser
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentListResponse

router = APIRouter(tags=["Gestion des Documents & Fichiers"])

# Base upload directory
UPLOAD_DIR = Path("uploads").resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_MIME_TYPES = {
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def sanitize_filename(filename: str) ->str:
  # Keep only safe alphanumeric, dots, underscores, dashes
  clean = re.sub(r"[^\w\.-]", "_", os.path.basename(filename))
  return clean or "document.bin"


def format_size(size_bytes: int) ->str:
  if not size_bytes:
    return "0 B"
  if size_bytes < 1024:
    return f"{size_bytes} B"
  if size_bytes < 1024 * 1024:
    return f"{size_bytes / 1024:.1f} Ko"
  return f"{size_bytes / (1024 * 1024):.1f} Mo"


def to_document_response(doc: Document) ->DocumentResponse:
  doc_dict = {
    "id": doc.id,
    "nom": doc.nom,
    "document_type": doc.document_type or doc.type or "Autre",
    "type": doc.type,
    "description": doc.description,
    "date_emission": doc.date_emission,
    "date_expiration": doc.date_expiration,
    "statut_validite": doc.statut_validite or "Valide",
    "entity_type": doc.entity_type,
    "entity_id": doc.entity_id,
    "filename": doc.filename,
    "url_fichier": doc.url_fichier or f"/api/v1/documents/{doc.id}/view",
    "download_url": f"/api/v1/documents/{doc.id}/download",
    "view_url": f"/api/v1/documents/{doc.id}/view",
    "mime_type": doc.mime_type or "application/octet-stream",
    "size": doc.size or 0,
    "size_formatted": format_size(doc.size or 0),
    "uploaded_by": doc.uploaded_by or "admin",
    "uploaded_at": doc.uploaded_at or doc.created_at,
    "created_at": doc.created_at,
  }
  return DocumentResponse(**doc_dict)


@router.post(
  "/upload",
  response_model=DocumentResponse,
  status_code=status.HTTP_201_CREATED,
  summary="Upload and attach a document/media file to any system entity",
  dependencies=[Depends(require_feature("upload_document"))],
)
async def upload_document(
  file: UploadFile = File(...),
  entity_type: str = Form(...),
  entity_id: str = Form(...),
  document_type: str = Form("Autre"),
  nom: Optional[str] = Form(None),
  description: Optional[str] = Form(None),
  date_emission: Optional[str] = Form(None),
  date_expiration: Optional[str] = Form(None),
  db: Session = Depends(get_db),
  current_user: CurrentUser = Depends(get_optional_user),
):
  try:
    parsed_entity_id = UUID(entity_id)
  except ValueError:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Identifiant d'entité (entity_id) invalide (UUID attendu).",
    )

  # 1. Validate MIME type
  content_type = file.content_type or "application/octet-stream"
  if content_type not in ALLOWED_MIME_TYPES and not content_type.startswith("image/"):
    # Check by extension fallback
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".txt", ".docx", ".xlsx"]:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Type de fichier non autorisé : {content_type}. Formats acceptés : PDF, JPG, PNG, WEBP, TXT, DOCX, XLSX.",
      )

  # 2. Read and validate size
  content = await file.read()
  file_size = len(content)
  if file_size >MAX_FILE_SIZE:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Fichier trop volumineux ({format_size(file_size)}). La taille maximale autorisée est de 10 Mo.",
    )

  # 3. Create target directory
  safe_entity_type = sanitize_filename(entity_type.lower())
  target_dir = UPLOAD_DIR / safe_entity_type / str(parsed_entity_id)
  target_dir.mkdir(parents=True, exist_ok=True)

  # 4. Generate unique filename
  raw_filename = file.filename or "document.bin"
  safe_name = sanitize_filename(raw_filename)
  unique_filename = f"{uuid.uuid4().hex[:8]}_{int(datetime.now().timestamp())}_{safe_name}"
  file_path = target_dir / unique_filename

  # 5. Save file to disk
  with open(file_path, "wb") as f:
    f.write(content)

  # Parse dates if provided
  parsed_date_emission = None
  if date_emission:
    try:
      parsed_date_emission = dt_date.fromisoformat(date_emission)
    except ValueError:
      pass

  parsed_date_expiration = None
  if date_expiration:
    try:
      parsed_date_expiration = dt_date.fromisoformat(date_expiration)
    except ValueError:
      pass

  statut_val = "Valide"
  if parsed_date_expiration:
    today = dt_date.today()
    if parsed_date_expiration < today:
      statut_val = "Expiré"
    elif (parsed_date_expiration - today).days <= 30:
      statut_val = "Expire bientôt"

  # 6. Create Document database record
  doc_name = nom.strip() if nom and nom.strip() else safe_name
  doc_id = uuid.uuid4()
  doc = Document(
    id=doc_id,
    nom=doc_name,
    type=document_type,
    document_type=document_type,
    filename=safe_name,
    file_path=str(file_path),
    url_fichier=f"/api/v1/documents/{doc_id}/view",
    mime_type=content_type,
    size=file_size,
    uploaded_by=current_user.username,
    uploaded_at=datetime.now(timezone.utc),
    description=description,
    date_emission=parsed_date_emission,
    date_expiration=parsed_date_expiration,
    statut_validite=statut_val,
    entity_type=safe_entity_type,
    entity_id=parsed_entity_id,
  )

  db.add(doc)
  db.commit()
  db.refresh(doc)

  return to_document_response(doc)


@router.get(
  "/entities/{entity_type}/{entity_id}/documents",
  response_model=DocumentListResponse,
  summary="List all documents attached to a specific entity",
  dependencies=[Depends(require_feature("view_document"))],
)
def list_entity_documents(
  entity_type: str,
  entity_id: UUID,
  db: Session = Depends(get_db),
):
  safe_entity_type = sanitize_filename(entity_type.lower())
  docs = (
    db.query(Document)
    .filter(Document.entity_type == safe_entity_type, Document.entity_id == entity_id)
    .order_by(Document.uploaded_at.desc())
    .all()
  )

  return DocumentListResponse(
    items=[to_document_response(d) for d in docs],
    total=len(docs),
    entity_type=safe_entity_type,
    entity_id=entity_id,
  )


@router.get(
  "/documents/{document_id}/download",
  summary="Download a document as an attachment",
  dependencies=[Depends(require_feature("download_document"))],
)
def download_document(
  document_id: UUID,
  db: Session = Depends(get_db),
):
  doc = db.query(Document).filter(Document.id == document_id).first()
  if not doc:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Document introuvable.",
    )

  if doc.file_path and os.path.exists(doc.file_path):
    return FileResponse(
      path=doc.file_path,
      filename=doc.filename or f"{doc.nom}.pdf",
      media_type=doc.mime_type or "application/octet-stream",
      content_disposition_type="attachment",
    )

  raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Le fichier physique correspondant est introuvable sur le serveur.",
  )


@router.get(
  "/documents/{document_id}/view",
  summary="View a document inline (for image/PDF preview)",
  dependencies=[Depends(require_feature("view_document"))],
)
def view_document(
  document_id: UUID,
  db: Session = Depends(get_db),
):
  doc = db.query(Document).filter(Document.id == document_id).first()
  if not doc:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Document introuvable.",
    )

  if doc.file_path and os.path.exists(doc.file_path):
    return FileResponse(
      path=doc.file_path,
      filename=doc.filename or f"{doc.nom}.pdf",
      media_type=doc.mime_type or "application/octet-stream",
      content_disposition_type="inline",
    )

  raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Le fichier physique correspondant est introuvable sur le serveur.",
  )


@router.delete(
  "/documents/{document_id}",
  status_code=status.HTTP_200_OK,
  summary="Delete a document and its stored physical file",
  dependencies=[Depends(require_feature("delete_document"))],
)
def delete_document(
  document_id: UUID,
  db: Session = Depends(get_db),
):
  doc = db.query(Document).filter(Document.id == document_id).first()
  if not doc:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Document introuvable.",
    )

  # Delete physical file if exists
  if doc.file_path and os.path.exists(doc.file_path):
    try:
      os.remove(doc.file_path)
    except Exception as e:
      print(f"[WARN] Error removing file {doc.file_path}: {e}")

  db.delete(doc)
  db.commit()

  return {"message": "Document supprimé avec succès.", "document_id": str(document_id)}
