import enum


class StatutVehicule(str, enum.Enum):
  DISPONIBLE = "DISPONIBLE"
  EN_MISSION = "EN_MISSION"
  MAINTENANCE = "MAINTENANCE"
  IMMOBILISE = "IMMOBILISE"
  HORS_SERVICE = "HORS_SERVICE"


class StatutEmploye(str, enum.Enum):
  ACTIF = "ACTIF"
  ABSENT = "ABSENT"
  SUSPENDU = "SUSPENDU"
  QUITTE = "QUITTE"


class TypeEmploye(str, enum.Enum):
  CHAUFFEUR = "CHAUFFEUR"
  MECANICIEN = "MECANICIEN"
  ADMINISTRATIF = "ADMINISTRATIF"


class TypePartenaire(str, enum.Enum):
  AGENCE_VOYAGE = "AGENCE_VOYAGE"
  ENTREPRISE = "ENTREPRISE"
  HOTEL = "HOTEL"
  ORGANISME = "ORGANISME"
  ASSOCIATION = "ASSOCIATION"
  PARTICULIER = "PARTICULIER"
  AUTRE = "AUTRE"


class RolePartenaire(str, enum.Enum):
  CLIENT = "CLIENT"
  FOURNISSEUR = "FOURNISSEUR"
  PARTENAIRE_MIXTE = "PARTENAIRE_MIXTE"


class StatutContrat(str, enum.Enum):
  ACTIF = "ACTIF"
  EXPIRE = "EXPIRE"


class TypeCaution(str, enum.Enum):
  SOUMISSION = "SOUMISSION"
  BONNE_EXECUTION = "BONNE_EXECUTION"
  DEMANDE = "DEMANDE"


class StatutCaution(str, enum.Enum):
  CREATION = "CREATION"
  CHEZ_CLIENT = "CHEZ_CLIENT"
  RETOURNEE = "RETOURNEE"
  MAIN_LEVEE = "MAIN_LEVEE"


class CategorieIntervention(str, enum.Enum):
  PREVENTIVE = "PREVENTIVE"
  CORRECTIVE = "CORRECTIVE"


class StatutIntervention(str, enum.Enum):
  PLANIFIEE = "PLANIFIEE"
  EN_COURS = "EN_COURS"
  TERMINEE = "TERMINEE"
  ANNULEE = "ANNULEE"


class TypeMouvement(str, enum.Enum):
  ENTREE = "ENTREE"
  SORTIE = "SORTIE"
  INVENTAIRE = "INVENTAIRE"


# Phase 2 Enums: Financials, Missions & Expenses
class StatutDevis(str, enum.Enum):
  BROUILLON = "BROUILLON"
  ENVOYE = "ENVOYE"
  ACCEPTE = "ACCEPTE"
  REFUSE = "REFUSE"
  EXPIRE = "EXPIRE"


class StatutFacture(str, enum.Enum):
  EN_ATTENTE = "EN_ATTENTE"
  PARTIEL = "PARTIEL"
  PAYE = "PAYE"
  RETARD = "RETARD"
  ANNULEE = "ANNULEE"


class ModePaiement(str, enum.Enum):
  ESPECE = "ESPECE"
  VIREMENT = "VIREMENT"
  CHEQUE = "CHEQUE"
  CARTE = "CARTE"


class StatutPaiement(str, enum.Enum):
  EN_ATTENTE = "EN_ATTENTE"
  VALIDE = "VALIDE"
  REJETE = "REJETE"


class CategorieDepenseVehicule(str, enum.Enum):
  CARBURANT = "CARBURANT"
  PEAGE = "PEAGE"
  PNEU = "PNEU"
  ASSURANCE = "ASSURANCE"
  ENTRETIEN = "ENTRETIEN"
  REPARATION = "REPARATION"
  PERSONNEL = "PERSONNEL"
  AMORTISSEMENT = "AMORTISSEMENT"
  AUTRE = "AUTRE"
