"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export interface DonutData {
  name: string;
  value: number;
  color: string;
  details?: DonutData[];
}

interface DonutChartBentoProps {
  title: string;
  subtitle: string;
  data: DonutData[];
  totalLabel?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[var(--color-haiti)]/90 backdrop-blur-xl px-4 py-3 rounded-xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 pointer-events-none">
        <p className="text-[11px] font-bold uppercase text-white tracking-widest mb-1">{data.name}</p>
        <p className="text-xl font-extrabold" style={{ color: data.color }}>{data.value}</p>
        {data.details && (
          <p className="text-[9px] text-white/50 mt-1 italic">Cliquez pour détailler</p>
        )}
      </div>
    );
  }
  return null;
};

export function DonutChartBento({ title, subtitle, data, totalLabel = "Total" }: DonutChartBentoProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [drillDownNode, setDrillDownNode] = useState<DonutData | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);


  const currentData = drillDownNode ? drillDownNode.details! : data;
  const currentTotal = currentData.reduce((sum, item) => sum + item.value, 0);
  const currentTitle = drillDownNode ? drillDownNode.name : title;
  const currentSubtitle = drillDownNode ? "Détails de répartition" : subtitle;

  const handlePieClick = (entry: any, index: number) => {
    if (!drillDownNode && entry.details && entry.details.length > 0) {
      setDrillDownNode(entry);
      setActiveIndex(null); // Reset hover
    }
  };

  const handleBack = () => {
    setDrillDownNode(null);
    setActiveIndex(null);
  };

  return (
    <div className="glass-panel p-6 h-full flex flex-col relative group overflow-hidden opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--color-electric-violet)]/5 blur-[60px] rounded-full pointer-events-none transition-all duration-700" />

      <div className="relative z-10 flex items-center justify-between mb-4 h-10">
        <AnimatePresence mode="wait">
          {!drillDownNode ? (
            <motion.div
              key="global-title"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            >
              <h3 className="text-base font-heading font-bold text-white tracking-wide drop-shadow-sm">{currentTitle}</h3>
              <p className="text-xs text-white/50 mt-0.5">{currentSubtitle}</p>
            </motion.div>
          ) : (
            <motion.div
              key="drill-title"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm font-heading font-bold text-white tracking-wide drop-shadow-sm">{currentTitle}</h3>
                <p className="text-[10px] text-[var(--color-turbo)] mt-0.5 font-accent uppercase tracking-widest">{currentSubtitle}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative flex-1 min-h-[160px] w-full z-10">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={drillDownNode ? 'drill' : 'root'}
            initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Pie
                  isAnimationActive={false}
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={handlePieClick}
                  style={{ cursor: drillDownNode ? 'default' : 'pointer' }}
                >
                  {currentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{
                        transform: activeIndex === index ? 'scale(1.03)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        cursor: (!drillDownNode && entry.details) ? 'pointer' : 'default'
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>

        {/* Center Total Text */}
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={drillDownNode ? 'total-drill' : 'total-root'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
            >
              <span className="block text-2xl font-heading font-extrabold text-white leading-none drop-shadow-lg">
                {currentTotal}{drillDownNode && drillDownNode.name.includes('%') ? '%' : ''}
              </span>
              <span className="block text-[9px] font-accent text-white/50 uppercase tracking-widest mt-1">{totalLabel}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="mt-4 relative z-10 border-t border-white/10 pt-4 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={drillDownNode ? 'legend-drill' : 'legend-root'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-2"
          >
            {currentData.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 ${(!drillDownNode && item.details) ? 'cursor-pointer hover:bg-white/5 p-1 rounded transition-colors -m-1' : ''}`}
                onClick={() => handlePieClick(item, i)}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] text-white/60 font-accent uppercase tracking-wider truncate">{item.name}</span>
                <span className="ms-auto text-xs font-bold text-white shrink-0">{item.value}</span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
