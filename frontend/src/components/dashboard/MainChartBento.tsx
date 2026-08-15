"use client";

import React, { useState } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, ArrowLeft } from "lucide-react";

interface MainChartData {
  month: string;
  revenus: number;
  depenses: number;
  details?: { name: string; revenus: number; depenses: number }[];
}

const mockData: MainChartData[] = [
  { 
    month: "Jan", revenus: 4500000, depenses: 3200000,
    details: [
      { name: "Sem 1", revenus: 1000000, depenses: 800000 },
      { name: "Sem 2", revenus: 1200000, depenses: 750000 },
      { name: "Sem 3", revenus: 1100000, depenses: 900000 },
      { name: "Sem 4", revenus: 1200000, depenses: 750000 },
    ]
  },
  { 
    month: "Fév", revenus: 5200000, depenses: 3100000,
    details: [
      { name: "Sem 1", revenus: 1300000, depenses: 700000 },
      { name: "Sem 2", revenus: 1400000, depenses: 800000 },
      { name: "Sem 3", revenus: 1200000, depenses: 750000 },
      { name: "Sem 4", revenus: 1300000, depenses: 850000 },
    ]
  },
  { 
    month: "Mar", revenus: 4800000, depenses: 3400000,
    details: [
      { name: "Sem 1", revenus: 1100000, depenses: 900000 },
      { name: "Sem 2", revenus: 1200000, depenses: 800000 },
      { name: "Sem 3", revenus: 1300000, depenses: 850000 },
      { name: "Sem 4", revenus: 1200000, depenses: 850000 },
    ]
  },
  { 
    month: "Avr", revenus: 6100000, depenses: 3800000,
    details: [
      { name: "Sem 1", revenus: 1500000, depenses: 900000 },
      { name: "Sem 2", revenus: 1600000, depenses: 1000000 },
      { name: "Sem 3", revenus: 1400000, depenses: 950000 },
      { name: "Sem 4", revenus: 1600000, depenses: 950000 },
    ]
  },
  { 
    month: "Mai", revenus: 5900000, depenses: 3500000,
    details: [
      { name: "Sem 1", revenus: 1400000, depenses: 850000 },
      { name: "Sem 2", revenus: 1500000, depenses: 900000 },
      { name: "Sem 3", revenus: 1400000, depenses: 850000 },
      { name: "Sem 4", revenus: 1600000, depenses: 900000 },
    ]
  },
  { 
    month: "Juin", revenus: 7200000, depenses: 4100000,
    details: [
      { name: "Sem 1", revenus: 1800000, depenses: 1000000 },
      { name: "Sem 2", revenus: 1700000, depenses: 1050000 },
      { name: "Sem 3", revenus: 1900000, depenses: 1100000 },
      { name: "Sem 4", revenus: 1800000, depenses: 950000 },
    ]
  },
];

export function MainChartBento() {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [drillDownMonth, setDrillDownMonth] = useState<MainChartData | null>(null);

  const currentData = drillDownMonth ? drillDownMonth.details! : mockData;
  const xAxisKey = drillDownMonth ? "name" : "month";

  const handlePointClick = (state: any) => {
    if (drillDownMonth) return;
    
    let monthStr = null;
    
    // Priorité 1 : activeLabel (déclenché quand on clique n'importe où dans la colonne d'un mois)
    if (state && state.activeLabel) {
      monthStr = state.activeLabel;
    }
    // Priorité 2 : activePayload (clic sur le wrapper)
    else if (state && state.activePayload && state.activePayload.length > 0) {
      monthStr = state.activePayload[0].payload.month;
    } 
    // Priorité 3 : clic direct sur une barre ou un point
    else if (state && state.payload && state.payload.month) {
      monthStr = state.payload.month;
    }
    // Priorité 4 : structure basique
    else if (state && state.month) {
      monthStr = state.month;
    }

    if (monthStr) {
      const monthData = mockData.find(m => m.month === monthStr);
      if (monthData && monthData.details) {
        setDrillDownMonth(monthData);
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-haiti)]/90 backdrop-blur-xl px-4 py-3 rounded-xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 pointer-events-none">
          <p className="text-[11px] font-bold uppercase text-white tracking-widest mb-2 border-b border-white/20 pb-1">
            {drillDownMonth ? `${label} - ${drillDownMonth.month} 2026` : `${label} 2026`}
          </p>
          <div className="space-y-2 mt-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
                <span className="text-[11px] text-white/90 font-sans uppercase font-medium">{entry.name}</span>
                <span className="ml-auto text-sm font-extrabold text-white">{(entry.value / 1000000).toFixed(1)}M DZD</span>
              </div>
            ))}
          </div>
          {!drillDownMonth && (
            <p className="text-[9px] text-[var(--color-turbo)] mt-2 italic border-t border-white/10 pt-1">Cliquez pour voir le détail par semaine</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 h-full flex flex-col relative group overflow-hidden opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
      {/* Background Subtle Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--color-electric-violet)]/5 blur-[80px] rounded-full pointer-events-none transition-all duration-1000" />
      
      <div className="relative z-10 flex items-start justify-between mb-8">
        <AnimatePresence mode="wait">
          {!drillDownMonth ? (
            <motion.div 
              key="global-title"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            >
              <h3 className="text-lg font-heading font-bold text-white tracking-wide drop-shadow-sm flex items-center gap-2">
                Activité Financière
                <span className="px-2 py-0.5 rounded text-[9px] font-accent bg-white/10 text-white/70 border border-white/20 tracking-widest">S1 2026</span>
              </h3>
              <p className="text-xs text-white/50 mt-1 font-sans">Croissance des revenus vs Dépenses opérationnelles</p>
            </motion.div>
          ) : (
            <motion.div 
              key="drill-title"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3"
            >
              <button 
                onClick={() => setDrillDownMonth(null)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-lg font-heading font-bold text-white tracking-wide drop-shadow-sm flex items-center gap-2">
                  Détail Mensuel : {drillDownMonth.month} 2026
                  <span className="px-2 py-0.5 rounded text-[9px] font-accent bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border border-[var(--color-turbo)]/20 tracking-widest">ZOOM</span>
                </h3>
                <p className="text-xs text-white/50 mt-1 font-sans">Répartition hebdomadaire des flux financiers</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Toggle Button */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
          <button
            onClick={() => setChartType("line")}
            className={`p-1.5 rounded-lg transition-all ${chartType === "line" ? "bg-[var(--color-electric-violet)] text-white shadow-[0_0_15px_rgba(131,77,251,0.5)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`p-1.5 rounded-lg transition-all ${chartType === "bar" ? "bg-[var(--color-turbo)] text-[var(--color-haiti)] shadow-[0_0_15px_rgba(240,225,0,0.5)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 w-full min-h-[300px] z-10">
        <AnimatePresence mode="popLayout">
          <motion.div 
            key={`${chartType}-${drillDownMonth ? 'drill' : 'root'}`}
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -5 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <ResponsiveContainer width="100%" height="100%" className={drillDownMonth ? "" : "cursor-pointer"}>
              {chartType === "line" ? (
                <LineChart data={currentData as any} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={handlePointClick} style={{ cursor: drillDownMonth ? 'default' : 'pointer' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey={xAxisKey} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000000}M`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Line 
                    isAnimationActive={false}
                    type="monotone" 
                    name="Revenus"
                    dataKey="revenus" 
                    stroke="var(--color-turbo)" 
                    strokeWidth={3} 
                    dot={{ fill: 'var(--color-haiti)', stroke: 'var(--color-turbo)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 5, fill: 'var(--color-turbo)', stroke: 'var(--color-haiti)', strokeWidth: 2 }} 
                  />
                  <Line 
                    isAnimationActive={false}
                    type="monotone" 
                    name="Dépenses"
                    dataKey="depenses" 
                    stroke="var(--color-electric-violet)" 
                    strokeWidth={3} 
                    dot={{ fill: 'var(--color-haiti)', stroke: 'var(--color-electric-violet)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 5, fill: 'var(--color-electric-violet)', stroke: 'var(--color-haiti)', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={currentData as any} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6} onClick={handlePointClick} style={{ cursor: drillDownMonth ? 'default' : 'pointer' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey={xAxisKey} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000000}M`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar isAnimationActive={false} dataKey="revenus" name="Revenus" fill="var(--color-turbo)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {currentData.map((_, index) => (
                      <Cell key={`cell-rev-${index}`} fill="url(#colorRev)" />
                    ))}
                  </Bar>
                  <Bar isAnimationActive={false} dataKey="depenses" name="Dépenses" fill="var(--color-electric-violet)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {currentData.map((_, index) => (
                      <Cell key={`cell-dep-${index}`} fill="url(#colorDep)" />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-turbo)" stopOpacity={1}/>
                      <stop offset="95%" stopColor="var(--color-turbo)" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-electric-violet)" stopOpacity={1}/>
                      <stop offset="95%" stopColor="var(--color-electric-violet)" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
