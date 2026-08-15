export interface VehiculeKpi {
 total: number;
 disponibles: number;
 en_mission: number;
 en_maintenance: number;
}

export interface EmployeKpi {
 total: number;
 chauffeurs: number;
 mecaniciens: number;
}

export interface PartenaireKpi {
 total: number;
 clients: number;
 fournisseurs: number;
}

export interface ContratKpi {
 total_actifs: number;
 total_volume_dzd: number;
}

export interface CautionKpi {
 total_chez_client: number;
 total_encours_dzd: number;
}

export interface StockKpi {
 total_references: number;
 stock_normal: number;
 stock_faible: number;
 stock_rupture: number;
}

export interface MaintenanceKpi {
 interventions_terminees: number;
 interventions_en_cours: number;
 budget_maintenance_dzd: number;
}

export interface DashboardKpi {
 vehicules: VehiculeKpi;
 employes: EmployeKpi;
 partenaires: PartenaireKpi;
 contrats: ContratKpi;
 cautions: CautionKpi;
 stock: StockKpi;
 maintenance: MaintenanceKpi;
}

export interface ActivityItem {
 id: string;
 type: string;
 title: string;
 description: string;
 date: string;
 link: string;
 badge_label: string;
 badge_variant: "success"| "warning"| "primary"| "neutral"| "danger";
}

export interface DashboardResponse {
 kpi: DashboardKpi;
 recent_activity: ActivityItem[];
}

export interface AlertItem {
 id: string;
 type: "DOCUMENT"| "CONTRAT"| "CAUTION"| "STOCK"| "MAINTENANCE";
 severity: "URGENT"| "WARNING"| "INFO";
 title: string;
 message: string;
 entity_type: string;
 entity_id: string;
 link: string;
 days_left?: number | null;
 badge_label: string;
}

export interface AlertsResponse {
 items: AlertItem[];
 total: number;
 urgent_count: number;
 warning_count: number;
 info_count: number;
}
