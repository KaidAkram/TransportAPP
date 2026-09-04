import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ShieldAlert, Lock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export function PermissionDeniedModal() {
  const [mounted, setMounted] = useState(false);
  const { deniedActionName, setDeniedAction } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !deniedActionName) return null;

  const handleClose = () => {
    setDeniedAction(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={handleClose} 
      />
      <div className="relative w-full max-w-md bg-[var(--color-haiti)] border border-white/10 rounded-2xl shadow-2xl p-6 m-4 animate-[stagger-up_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 end-4 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Lock className="h-8 w-8 text-red-400" />
          </div>
          
          <h2 className="text-xl font-heading font-black text-white mb-2">
            Action non autorisée
          </h2>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full mb-6 mt-2">
            <p className="text-sm text-white/70">
              L'administrateur a désactivé votre accès à la fonctionnalité :
            </p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 border border-white/5 text-red-400 font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              {deniedActionName}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/10 transition-all"
          >
            Compris, fermer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
