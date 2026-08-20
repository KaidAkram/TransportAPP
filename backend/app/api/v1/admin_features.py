from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.core.database import get_db
from app.core.security import get_current_user, require_admin, CurrentUser
from app.models.feature_toggle import FeatureToggle
from app.schemas.feature_toggle import (
  FeatureToggleRead,
  FeatureToggleUpdate,
  FeatureToggleListResponse,
  FeatureToggleMapResponse,
)

router = APIRouter(prefix="", tags=["Admin & Feature Toggles"])


# Predefined Master Feature Toggles List
DEFAULT_FEATURES = [
  # Véhicules
  {"feature_name": "create_vehicle", "description": "Ajouter un nouveau véhicule au parc", "categorie": "Véhicules"},
  {"feature_name": "edit_vehicle", "description": "Modifier les caractéristiques d'un véhicule", "categorie": "Véhicules"},
  {"feature_name": "archive_vehicle", "description": "Archiver ou réformer un véhicule", "categorie": "Véhicules"},
  {"feature_name": "view_vehicle", "description": "Consulter les dossiers véhicules et constats", "categorie": "Véhicules"},

  # Employés & Chauffeurs
  {"feature_name": "create_chauffeur", "description": "Recruter / Enregistrer un chauffeur", "categorie": "Personnel & RH"},
  {"feature_name": "edit_chauffeur", "description": "Modifier le dossier et permis du chauffeur", "categorie": "Personnel & RH"},
  {"feature_name": "view_chauffeur", "description": "Consulter la liste et fiches des chauffeurs", "categorie": "Personnel & RH"},
  {"feature_name": "create_mecanicien", "description": "Enregistrer un mécanicien d'atelier", "categorie": "Personnel & RH"},
  {"feature_name": "edit_mecanicien", "description": "Modifier les compétences du mécanicien", "categorie": "Personnel & RH"},

  # CRM & Partenaires
  {"feature_name": "create_client", "description": "Créer un client ou partenaire commercial", "categorie": "CRM & Partenaires"},
  {"feature_name": "edit_client", "description": "Modifier les coordonnées et données fiscales", "categorie": "CRM & Partenaires"},
  {"feature_name": "view_client", "description": "Consulter les comptes clients et fournisseurs", "categorie": "CRM & Partenaires"},

  # Contrats & Avenants
  {"feature_name": "create_contrat", "description": "Établir une nouvelle convention d'exploitation", "categorie": "Contrats"},
  {"feature_name": "edit_contrat", "description": "Modifier les clauses ou résilier un contrat", "categorie": "Contrats"},
  {"feature_name": "view_contrat", "description": "Consulter les contrats commerciaux", "categorie": "Contrats"},
  {"feature_name": "create_avenant", "description": "Ajouter un avenant financier / temporel", "categorie": "Contrats"},

  # Cautions Bancaires
  {"feature_name": "create_caution", "description": "Émettre une caution bancaire (soumission/bonne exécution)", "categorie": "Cautions"},
  {"feature_name": "edit_caution", "description": "Mettre à jour le cycle de vie de la caution", "categorie": "Cautions"},
  {"feature_name": "view_caution", "description": "Consulter le registre des garanties bancaires", "categorie": "Cautions"},
  {"feature_name": "generate_caution_pdf", "description": "Générer le certificat officiel de caution PDF", "categorie": "Cautions"},

  # Stock & Pièces
  {"feature_name": "create_stock_entry", "description": "Enregistrer une réception fournisseur (Entrée)", "categorie": "Stock & Pièces"},
  {"feature_name": "create_stock_exit", "description": "Effectuer une sortie de magasin pour réparation", "categorie": "Stock & Pièces"},
  {"feature_name": "do_inventory", "description": "Réaliser un audit physique et ajustement de stock", "categorie": "Stock & Pièces"},

  # Maintenance & Atelier
  {"feature_name": "create_intervention", "description": "Ouvrir un ordre de réparation / entretien", "categorie": "Maintenance"},
  {"feature_name": "edit_intervention", "description": "Clôturer ou modifier une intervention", "categorie": "Maintenance"},
  {"feature_name": "view_intervention", "description": "Consulter l'historique de maintenance", "categorie": "Maintenance"},

  # Planification des Missions
  {"feature_name": "create_mission", "description": "Planifier et affecter un voyage / trajet", "categorie": "Missions"},
  {"feature_name": "edit_mission", "description": "Modifier ou réguler le statut d'un trajet", "categorie": "Missions"},
  {"feature_name": "view_mission", "description": "Accéder au planning et calendrier des départs", "categorie": "Missions"},

  # Finances & Facturation
  {"feature_name": "create_facture", "description": "Émettre une facture client", "categorie": "Finances & Factures"},
  {"feature_name": "edit_facture", "description": "Annuler ou modifier une facture", "categorie": "Finances & Factures"},
  {"feature_name": "view_facture", "description": "Consulter le journal des factures et créances", "categorie": "Finances & Factures"},
  {"feature_name": "record_paiement", "description": "Encaisser une facture (mode de règlement)", "categorie": "Finances & Factures"},

  # Analyses & Décisionnel (BI)
  {"feature_name": "view_analytics", "description": "Consulter les tableaux de bord décisionnels et KPIs TCO", "categorie": "Analyses & BI"},
  {"feature_name": "export_excel", "description": "Exporter les rapports au format Excel (XLSX)", "categorie": "Analyses & BI"},

  # Gestion des Documents & Pièces Jointes
  {"feature_name": "upload_document", "description": "Téléverser des documents et pièces jointes (photos, PDF, permis)", "categorie": "Gestion des Documents"},
  {"feature_name": "view_document", "description": "Consulter et prévisualiser les documents rattachés", "categorie": "Gestion des Documents"},
  {"feature_name": "download_document", "description": "Télécharger les documents et attestations", "categorie": "Gestion des Documents"},
  {"feature_name": "delete_document", "description": "Supprimer des pièces jointes et documents", "categorie": "Gestion des Documents"},
]


def ensure_default_features(db: Session):
  """Ensures all default feature flags exist in the database."""
  existing = {f.feature_name for f in db.query(FeatureToggle.feature_name).all()}
  added = False
  for item in DEFAULT_FEATURES:
    if item["feature_name"] not in existing:
      ft = FeatureToggle(
        feature_name=item["feature_name"],
        description=item["description"],
        categorie=item["categorie"],
        enabled_for_gestionnaire=True,
      )
      db.add(ft)
      added = True
  if added:
    db.commit()


@router.get("/admin/features", response_model=FeatureToggleListResponse, summary="List All Feature Toggles (Admin Only)")
def list_admin_features(
  admin_user: CurrentUser = Depends(require_admin),
  db: Session = Depends(get_db),
):
  ensure_default_features(db)
  items = db.query(FeatureToggle).order_by(asc(FeatureToggle.categorie), asc(FeatureToggle.feature_name)).all()
  return FeatureToggleListResponse(items=items, total=len(items))


@router.put("/admin/features/{feature_name}", response_model=FeatureToggleRead, summary="Toggle Feature Status (Admin Only)")
def update_feature_toggle(
  feature_name: str,
  payload: FeatureToggleUpdate,
  admin_user: CurrentUser = Depends(require_admin),
  db: Session = Depends(get_db),
):
  ensure_default_features(db)
  feature = db.query(FeatureToggle).filter(FeatureToggle.feature_name == feature_name).first()
  if not feature:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail=f"Fonctionnalité '{feature_name}'introuvable.",
    )

  feature.enabled_for_gestionnaire = payload.enabled_for_gestionnaire
  db.commit()
  db.refresh(feature)
  return feature


@router.get("/features/active", response_model=FeatureToggleMapResponse, summary="Get Active Features Map for Current User")
def get_active_features(
  current_user: CurrentUser = Depends(get_current_user),
  db: Session = Depends(get_db),
):
  ensure_default_features(db)
  features_dict: Dict[str, bool] = {}

  all_toggles = db.query(FeatureToggle).all()
  for t in all_toggles:
    if current_user.role == "admin":
      features_dict[t.feature_name] = True
    else:
      features_dict[t.feature_name] = t.enabled_for_gestionnaire

  return FeatureToggleMapResponse(
    features=features_dict,
    role=current_user.role,
  )
