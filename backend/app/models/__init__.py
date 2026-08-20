from app.models.base import Base, BaseModelMixin
from app.models.enums import (
  StatutVehicule,
  StatutEmploye,
  TypeEmploye,
  RolePartenaire,
  TypePartenaire,
  StatutContrat,
  TypeCaution,
  StatutCaution,
  CategorieIntervention,
  StatutIntervention,
  TypeMouvement,
  StatutDevis,
  StatutFacture,
  ModePaiement,
  StatutPaiement,
  CategorieDepenseVehicule,
  ModeReglementReception,
)
from app.models.document import Document
from app.models.employe import Employe, Chauffeur, Mecanicien, Permis
from app.models.partenaire import Partenaire, Client, Fournisseur, Contact, CRMNote
from app.models.contrat import Contrat, Avenant, Caution
from app.models.stock import Piece, MouvementStock, Reception, ReceptionLigne
from app.models.vehicule import Vehicule, Constat
from app.models.intervention import Intervention
from app.models.finance import Devis, DevisLigne, Facture, FactureLigne, Paiement, DepenseVehicule
from app.models.feature_toggle import FeatureToggle
from app.models.settings import SystemSettings

__all__ = [
  "Base",
  "BaseModelMixin",
  # Enums
  "StatutVehicule",
  "StatutEmploye",
  "TypeEmploye",
  "RolePartenaire",
  "TypePartenaire",
  "StatutContrat",
  "TypeCaution",
  "StatutCaution",
  "CategorieIntervention",
  "StatutIntervention",
  "TypeMouvement",
  "StatutDevis",
  "StatutFacture",
  "ModePaiement",
  "StatutPaiement",
  "CategorieDepenseVehicule",
  "ModeReglementReception",
  # Models
  "Document",
  "Employe",
  "Chauffeur",
  "Mecanicien",
  "Permis",
  "Partenaire",
  "Client",
  "Fournisseur",
  "Contact",
  "CRMNote",
  "Contrat",
  "Avenant",
  "Caution",
  "Piece",
  "MouvementStock",
  "Reception",
  "ReceptionLigne",
  "Vehicule",
  "Constat",
  "Intervention",
  "Devis",
  "DevisLigne",
  "Facture",
  "FactureLigne",
  "Paiement",
  "DepenseVehicule",
  "FeatureToggle",
  "SystemSettings",
]
