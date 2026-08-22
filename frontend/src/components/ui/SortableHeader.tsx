import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string | undefined;
  currentOrder: "asc" | "desc" | undefined;
  onSort: (field: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  className = "",
}: SortableHeaderProps) {
  const isSorted = currentSort === field;

  return (
    <th
      className={`py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap cursor-pointer hover:bg-white/5 transition-colors group select-none ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <span className="text-white/30 group-hover:text-white/70 transition-colors flex items-center justify-center w-3 h-3">
          {!isSorted ? (
            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : currentOrder === "asc" ? (
            <ArrowUp className="h-3 w-3 text-emerald-400" />
          ) : (
            <ArrowDown className="h-3 w-3 text-[var(--color-electric-violet)]" />
          )}
        </span>
      </div>
    </th>
  );
}
