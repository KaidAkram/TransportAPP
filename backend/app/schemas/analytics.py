from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class TopClientRevenue(BaseModel):
  client_id: str
  client_nom: str
  nombre_missions: int
  nombre_contrats: int
  chiffre_affaires_dzd: float


class VehicleProfitability(BaseModel):
  vehicule_id: str
  immatriculation: str
  revenus_generes_dzd: float
  couts_tco_dzd: float
  marge_nette_dzd: float
  taux_rentabilite: float


class MonthlyRevenueItem(BaseModel):
  mois: str # ex: 2026-01, 2026-02
  chiffre_affaires: float
  depenses_maintenance: float
  depenses_exploitation: float
  marge_nette: float


class StrategicBIKpiResponse(BaseModel):
  flotte_totale: int
  taux_disponibilite_flotte: float
  taux_occupation_moyen: float
  chiffre_affaires_annuel_dzd: float
  total_creances_clients_dzd: float
  total_encaisse_dzd: float
  cout_tco_global_dzd: float
  marge_nette_globale_dzd: float
  depenses_par_categorie_dzd: Dict[str, float]
  total_missions_effectuees: int
  top_clients: List[TopClientRevenue]
  rentabilite_vehicules: List[VehicleProfitability]
  evolution_mensuelle: List[MonthlyRevenueItem]
