import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GlassPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function GlassPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: GlassPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02] shrink-0">
      <div className="text-xs text-white/50">
        Affichage de la page <span className="font-bold text-white">{currentPage}</span> sur <span className="font-bold text-white">{totalPages}</span> 
        {" "}({totalItems} éléments au total)
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-[var(--color-electric-violet)] px-2">
          {currentPage}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
