import React from 'react';
import { Ghost } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ElementType;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "Aucune donnée",
  message = "Rien à afficher pour le moment.",
  icon: Icon = Ghost,
  className,
  action
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] w-full", className)}>
      <div className="bg-white/5 rounded-full p-4 mb-4 border border-white/10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]">
        <Icon className="h-8 w-8 text-white/40" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-heading font-bold text-white mb-1">{title}</h3>
      <p className="text-[13px] text-white/50 max-w-sm mb-4 font-sans">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
