"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from "recharts";
import { 
  TrendingUp, Activity, Users, ShieldAlert, Coins, ArrowDownCircle, DollarSign, AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { StrategicBIKpi } from "@/types/analytics";

// Quantum 2025 Palette
const COLOR_PRIMARY = "#834dfb"; // Electric Violet
const COLOR_SECONDARY = "#f0e100"; // Turbo
const COLOR_MUTED = "rgba(255,255,255,0.4)";

// Curated 5-color palette for PieChart
const PIE_COLORS = [
  "#834dfb", // Electric Violet
  "#0ea5e9", // Vivid Cyan
  "#f0e100", // Turbo Yellow
  "#f43f5e", // Neon Rose
  "#10b981"  // Emerald Green
];

export default function AnalyticsPage() {
  const [data, setData] = useState<StrategicBIKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get<StrategicBIKpi>("/analytics/kpis");
        setData(res.data);
      } catch (err: any) {
        setError("Erreur lors du chargement des analyses.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-haiti)] border-t-[var(--color-electric-violet)]"></div>
          <p className="font-accent text-[11px] font-bold tracking-widest text-[var(--color-electric-violet)] uppercase">
            Génération des rapports financiers...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center max-w-md">
          <ShieldAlert className="mx-auto h-8 w-8 text-red-500 mb-4" />
          <p className="text-red-200">{error || "Aucune donnée disponible"}</p>
        </div>
      </div>
    );
  }

  const formatDZD = (value: number) => new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(value);
  
  // Prepare data for Pie Chart
  const pieData = data.depenses_par_categorie_dzd 
    ? Object.entries(data.depenses_par_categorie_dzd).map(([key, val]) => ({ name: key, value: val }))
    : [];
  const totalExpenses = pieData.reduce((acc, curr) => acc + curr.value, 0);

  // Custom Rich Tooltip
  const CustomTooltip = ({ active, payload, label, chartType }: any) => {
    if (active && payload && payload.length) {
      const entryData = payload[0].payload;
      
      return (
        <div className="rounded-xl border border-white/5 bg-[var(--color-haiti)]/95 backdrop-blur-xl p-4 shadow-2xl outline-none">
          {label && <p className="mb-3 border-b border-white/10 pb-2 text-xs font-bold text-white/50 uppercase tracking-widest">{label}</p>}
          
          {/* Specific rendering for Top Clients */}
          {chartType === 'clients' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLOR_PRIMARY }} />
                <p className="text-sm font-medium text-white">Chiffre d'Affaires:</p>
                <p className="text-sm font-bold font-mono text-[var(--color-electric-violet)] ms-auto">
                  {formatDZD(entryData.chiffre_affaires_dzd)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-1 border-t border-white/5 pt-3">
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Missions</p>
                  <p className="font-mono text-sm text-white font-bold">{entryData.nombre_missions}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Contrats</p>
                  <p className="font-mono text-sm text-white font-bold">{entryData.nombre_contrats}</p>
                </div>
              </div>
            </div>
          )}

          {/* Specific rendering for Expenses (PieChart) */}
          {chartType === 'expenses' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill || COLOR_SECONDARY }} />
                <p className="text-sm font-bold text-white uppercase tracking-wider">{entryData.name}</p>
              </div>
              <div className="flex flex-col gap-1 mt-1 border-t border-white/5 pt-3">
                <p className="text-[10px] text-white/40 uppercase">Montant Alloué</p>
                <p className="font-mono text-lg text-white font-bold">{formatDZD(entryData.value)}</p>
                <div className="inline-block px-2 py-1 bg-white/5 rounded text-xs font-bold text-white/70 w-fit mt-1">
                  {((entryData.value / totalExpenses) * 100).toFixed(1)}% du TCO
                </div>
              </div>
            </div>
          )}

          {/* Default rendering for AreaChart */}
          {!chartType && payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 py-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm font-medium text-white/80">{entry.name}:</p>
              <p className="text-sm font-bold font-mono text-white ms-auto">
                {typeof entry.value === 'number' ? formatDZD(entry.value) : entry.value}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const stagger: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans contain-layout">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-electric-violet)] animate-pulse" />
            <span className="text-[10px] font-accent font-bold uppercase tracking-[0.2em] text-[var(--color-electric-violet)]">
              Direction Financière
            </span>
          </div>
          <h1 className="text-3xl font-heading font-black text-white flex items-center gap-3">
            <Activity className="h-8 w-8 text-[var(--color-electric-violet)]" />
            Trésorerie & Rentabilité
          </h1>
          <p className="mt-2 text-sm text-white/50">Vue financière globale épurée.</p>
        </div>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Chiffre d'Affaires */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl glass-panel p-6 shadow-2xl border border-white/5 group">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-electric-violet)]/10 blur-3xl transition-all duration-500 group-hover:bg-[var(--color-electric-violet)]/20" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="rounded-xl bg-[var(--color-electric-violet)]/10 p-3 text-[var(--color-electric-violet)] shadow-[0_0_15px_rgba(131,77,251,0.1)]">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="relative z-10 mt-6">
            <p className="text-[10px] font-accent font-bold uppercase tracking-[0.2em] text-white/40">CA Annuel (Facturé)</p>
            <p className="mt-1 font-mono text-2xl lg:text-3xl font-bold text-white drop-shadow-sm">{formatDZD(data.chiffre_affaires_annuel_dzd)}</p>
          </div>
        </motion.div>

        {/* KPI 2: Marge Nette */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl glass-panel p-6 shadow-2xl border border-white/5 group">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-turbo)]/10 blur-3xl transition-all duration-500 group-hover:bg-[var(--color-turbo)]/20" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="rounded-xl bg-[var(--color-turbo)]/10 p-3 text-[var(--color-turbo)] shadow-[0_0_15px_rgba(240,225,0,0.1)]">
              <Activity className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-accent font-bold text-[var(--color-turbo)] opacity-80">CA - Dépenses</p>
          </div>
          <div className="relative z-10 mt-6">
            <p className="text-[10px] font-accent font-bold uppercase tracking-[0.2em] text-white/40">Marge Nette Globale</p>
            <p className="mt-1 font-mono text-2xl lg:text-3xl font-bold text-white drop-shadow-sm">{formatDZD(data.marge_nette_globale_dzd)}</p>
          </div>
        </motion.div>

        {/* KPI 3: Encaissements */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl glass-panel p-6 shadow-2xl border border-white/5 group">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-3xl transition-all duration-500 group-hover:bg-white/10" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="rounded-xl bg-white/5 p-3 text-white/70 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Coins className="h-6 w-6" />
            </div>
          </div>
          <div className="relative z-10 mt-6">
            <p className="text-[10px] font-accent font-bold uppercase tracking-[0.2em] text-white/40">Total Encaissé (Cash-in)</p>
            <p className="mt-1 font-mono text-2xl lg:text-3xl font-bold text-white drop-shadow-sm">{formatDZD(data.total_encaisse_dzd)}</p>
          </div>
        </motion.div>

        {/* KPI 4: Créances */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl glass-panel p-6 shadow-2xl border border-white/5 group">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#f43f5e]/10 blur-3xl transition-all duration-500 group-hover:bg-[#f43f5e]/20" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="rounded-xl bg-[#f43f5e]/10 p-3 text-[#f43f5e] shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400">
              <AlertCircle className="h-3 w-3" /> Impayés
            </div>
          </div>
          <div className="relative z-10 mt-6">
            <p className="text-[10px] font-accent font-bold uppercase tracking-[0.2em] text-white/40">Créances Clients</p>
            <p className="mt-1 font-mono text-2xl lg:text-3xl font-bold text-white drop-shadow-sm">{formatDZD(data.total_creances_clients_dzd)}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Evolution Mensuelle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 glass-panel rounded-2xl border border-white/5 p-6"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Évolution Mensuelle (Cash Flow)</h2>
            <p className="text-xs text-white/40 font-medium">Comparaison Chiffre d'Affaires vs Marge vs Dépenses</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.evolution_mensuelle} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMarge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLOR_SECONDARY} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLOR_SECONDARY} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis 
                  dataKey="mois" 
                  stroke="rgba(255,255,255,0.2)" 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                {/* Remove annoying white cursor line on hover */}
                <RechartsTooltip cursor={{ stroke: 'transparent', fill: 'transparent' }} content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                
                {/* activeDot={{ stroke: 'none' }} removes the annoying white borders on hover dots */}
                <Area type="monotone" name="Chiffre d'Affaires" dataKey="chiffre_affaires" stroke={COLOR_PRIMARY} strokeWidth={3} fillOpacity={1} fill="url(#colorCA)" activeDot={{ r: 6, stroke: 'none', fill: COLOR_PRIMARY }} />
                <Area type="monotone" name="Marge Nette" dataKey="marge_nette" stroke={COLOR_SECONDARY} strokeWidth={3} fillOpacity={1} fill="url(#colorMarge)" activeDot={{ r: 6, stroke: 'none', fill: COLOR_SECONDARY }} />
                <Area type="monotone" name="Dépenses Exploitation" dataKey="depenses_exploitation" stroke={COLOR_MUTED} strokeWidth={2} fillOpacity={0} activeDot={{ r: 4, stroke: 'none', fill: COLOR_MUTED }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Clients */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-panel rounded-2xl border border-white/5 p-6 flex flex-col relative overflow-hidden"
        >
          <div className="mb-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-lg font-bold text-white">Top Clients</h2>
              <p className="text-xs text-white/40 font-medium">Survolez un client pour voir les détails (Missions, Contrats)</p>
            </div>
            <Users className="h-5 w-5 text-white/20" />
          </div>

          <div className="h-[350px] w-full z-10 transition-all duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_clients} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  stroke="rgba(255,255,255,0.2)" 
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  dataKey="client_nom" 
                  type="category" 
                  width={120}
                  stroke="rgba(255,255,255,0.2)" 
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                {/* Remove annoying background cursor for BarChart and pass chartType */}
                <RechartsTooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip chartType="clients" />} />
                <Bar 
                  dataKey="chiffre_affaires_dzd" 
                  name="CA Facturé" 
                  radius={[0, 4, 4, 0]} 
                  barSize={24}
                  activeBar={false} /* Removes white border on hover */
                >
                  {data.top_clients.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLOR_PRIMARY} 
                      fillOpacity={1 - (index * 0.15)} 
                      className="transition-all duration-300 hover:brightness-125" 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Répartition des Dépenses */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel rounded-2xl border border-white/5 p-6 flex flex-col relative overflow-hidden"
        >
          <div className="mb-6 z-10">
            <h2 className="text-lg font-bold text-white">Charges (TCO)</h2>
            <p className="text-xs text-white/40 font-medium">Survolez pour les détails financiers</p>
          </div>
          <div className="h-[350px] w-full z-10 transition-all duration-300">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    activeShape={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        className="transition-all duration-300 hover:brightness-110 outline-none cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip cursor={{ fill: 'transparent', stroke: 'transparent' }} content={<CustomTooltip chartType="expenses" />} />
                  <Legend 
                    iconType="circle"
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '11px', color: '#fff', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-white/40 font-medium text-sm flex items-center justify-center h-full">Aucune dépense</div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
