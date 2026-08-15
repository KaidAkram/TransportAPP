export interface TopClientRevenue {
 client_id: string;
 client_nom: string;
 nombre_missions: number;
 nombre_contrats: number;
 chiffre_affaires_dzd: number;
}

export interface VehicleProfitability {
 vehicule_id: string;
 immatriculation: string;
 revenus_generes_dzd: number;
 couts_tco_dzd: number;
 marge_nette_dzd: number;
 taux_rentabilite: number;
}

export interface MonthlyRevenueItem {
 mois: string;
 chiffre_affaires: number;
 depenses_maintenance: number;
 depenses_exploitation: number;
 marge_nette: number;
}

export interface StrategicBIKpi {
 flotte_totale: number;
 taux_disponibilite_flotte: number;
 taux_occupation_moyen: number;
 chiffre_affaires_annuel_dzd: number;
 total_creances_clients_dzd: number;
 total_encaisse_dzd: number;
 cout_tco_global_dzd: number;
 marge_nette_globale_dzd: number;
 depenses_par_categorie_dzd: Record<string, number>;
 total_missions_effectuees: number;
 top_clients: TopClientRevenue[];
 rentabilite_vehicules: VehicleProfitability[];
 evolution_mensuelle: MonthlyRevenueItem[];
}
