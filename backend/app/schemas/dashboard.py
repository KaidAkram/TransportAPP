from typing import Optional, List
from pydantic import BaseModel, Field


class VehiculeKpi(BaseModel):
  total: int = 0
  disponibles: int = 0
  en_mission: int = 0
  en_maintenance: int = 0


class EmployeKpi(BaseModel):
  total: int = 0
  chauffeurs: int = 0
  mecaniciens: int = 0


class PartenaireKpi(BaseModel):
  total: int = 0
  clients: int = 0
  fournisseurs: int = 0


class ContratKpi(BaseModel):
  total_actifs: int = 0
  total_volume_dzd: float = 0.0


class CautionKpi(BaseModel):
  total_chez_client: int = 0
  total_encours_dzd: float = 0.0


class StockKpi(BaseModel):
  total_references: int = 0
  stock_normal: int = 0
  stock_faible: int = 0
  stock_rupture: int = 0


class MaintenanceKpi(BaseModel):
  interventions_terminees: int = 0
  interventions_en_cours: int = 0
  budget_maintenance_dzd: float = 0.0


class DashboardKpi(BaseModel):
  vehicules: VehiculeKpi
  employes: EmployeKpi
  partenaires: PartenaireKpi
  contrats: ContratKpi
  cautions: CautionKpi
  stock: StockKpi
  maintenance: MaintenanceKpi


class ActivityItem(BaseModel):
  id: str
  type: str # VEHICULE, INTERVENTION, STOCK, CONTRAT, CAUTION, CRM, DOCUMENT, MISSION
  title: str
  description: str
  date: str
  link: str
  badge_label: str
  badge_variant: str # success, warning, primary, neutral, danger


class DashboardResponse(BaseModel):
  kpi: DashboardKpi
  recent_activity: List[ActivityItem] = []


class AlertItem(BaseModel):
  id: str
  type: str # DOCUMENT, CONTRAT, CAUTION, STOCK, MAINTENANCE
  severity: str # URGENT, WARNING, INFO
  title: str
  message: str
  entity_type: str
  entity_id: str
  link: str
  days_left: Optional[int] = None
  badge_label: str


class AlertsResponse(BaseModel):
  items: List[AlertItem]
  total: int
  urgent_count: int
  warning_count: int
  info_count: int


# ==========================================
# Executive Dashboard Graphical Charts
# ==========================================

class MonthlyRevenuePoint(BaseModel):
  mois: str
  label: str
  chiffre_affaires: float
  charges: float
  marge_nette: float
  previsions: float


class CostCategoryBreakdown(BaseModel):
  categorie: str
  montant: float
  pourcentage: float
  couleur: str


class FleetStatusBreakdown(BaseModel):
  statut: str
  label: str
  count: int
  pourcentage: float
  couleur: str


class InterventionTypeBreakdown(BaseModel):
  mois: str
  label: str
  preventive: int
  corrective: int
  total: int


class TopClientItem(BaseModel):
  client_id: str
  nom: str
  chiffre_affaires: float
  volume_missions: int
  part_marche: float


class CriticalStockItem(BaseModel):
  id: str
  reference: str
  designation: str
  stock_actuel: int
  stock_minimum: int
  unite: str
  categorie: str
  pourcentage: float


class DashboardChartsResponse(BaseModel):
  revenue_trend: List[MonthlyRevenuePoint]
  cost_breakdown: List[CostCategoryBreakdown]
  fleet_status: List[FleetStatusBreakdown]
  intervention_types: List[InterventionTypeBreakdown]
  top_clients: List[TopClientItem]
  critical_stock: List[CriticalStockItem]
  taux_occupation_moyen: float
  taux_disponibilite_flotte: float
  total_ca_annuel: float
  total_charges_annuel: float
  total_marge_annuel: float
