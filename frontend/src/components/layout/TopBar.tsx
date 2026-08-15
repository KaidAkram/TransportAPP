"use client";

import { useState, useRef, useEffect } from "react";
import { Search, User, Bus, FileText, ArrowRight, Wallet, Activity, Wrench, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { NotificationBell } from "@/components/layout/NotificationBell";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const ALL_SEARCH_OPTIONS = [
  // Actions
  { id: 'act-1', type: "action", text: "Ajouter un véhicule", icon: Bus, color: "text-[var(--color-turbo)]", href: "/vehicules" },
  { id: 'act-2', type: "action", text: "Ajouter un paiement entrant", icon: Wallet, color: "text-emerald-400", href: "/finances" },
  { id: 'act-3', type: "action", text: "Créer un nouveau contrat", icon: FileText, color: "text-[var(--color-electric-violet)]", href: "/contrats" },
  { id: 'act-4', type: "action", text: "Nouvelle intervention maintenance", icon: Wrench, color: "text-red-400", href: "/maintenance" },
  
  // Pages
  { id: 'page-1', type: "page", text: "Tableau de bord (Accueil)", icon: Activity, color: "text-white/60", href: "/" },
  { id: 'page-2', type: "page", text: "Gestion des Véhicules", icon: Bus, color: "text-white/60", href: "/vehicules" },
  { id: 'page-3', type: "page", text: "Finances & Facturation", icon: Wallet, color: "text-white/60", href: "/finances" },
  { id: 'page-4', type: "page", text: "Contrats & Cautions", icon: FileText, color: "text-white/60", href: "/contrats" },
  
  // Data (Mocked global data)
  { id: 'veh-1', type: "vehicle", text: "Bus Mercedes MAT-16 (Alger)", icon: Bus, color: "text-white/40", href: "/vehicules" },
  { id: 'veh-2', type: "vehicle", text: "Minibus Toyota T-10 (Oran)", icon: Bus, color: "text-white/40", href: "/vehicules" },
  { id: 'ctr-1', type: "contract", text: "Convention Sonatrach - En cours", icon: FileText, color: "text-white/40", href: "/contrats" },
  { id: 'ctr-2', type: "contract", text: "Marché Ministère des Transports", icon: FileText, color: "text-white/40", href: "/contrats" },
  { id: 'fin-1', type: "finance", text: "Factures 2026 - Trimestre 1", icon: Wallet, color: "text-white/40", href: "/finances" },
];

export function TopBar() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on query
  const filteredOptions = query
    ? ALL_SEARCH_OPTIONS.filter(opt => opt.text.toLowerCase().includes(query.toLowerCase()))
    : ALL_SEARCH_OPTIONS.slice(0, 5); // Suggestions rapides par défaut

  // Add the literal search query as the first option if typing
  const displayOptions = query
    ? [
        { id: 'search-query', type: 'search', text: `Rechercher '${query}'`, icon: Search, color: 'text-[var(--color-turbo)]', href: `/search?q=${encodeURIComponent(query)}` },
        ...filteredOptions
      ].slice(0, 6)
    : filteredOptions;

  // Inline autocomplete "ghost" text
  const bestMatch = query ? ALL_SEARCH_OPTIONS.find(opt => opt.text.toLowerCase().startsWith(query.toLowerCase())) : null;
  const ghostText = bestMatch ? bestMatch.text : "";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchOpen) {
        // Raccourci clavier global (Ctrl+K ou Cmd+K) pour ouvrir la recherche
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          setIsSearchOpen(true);
          searchInputRef.current?.focus();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % displayOptions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + displayOptions.length) % displayOptions.length);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsSearchOpen(false);
        setQuery("");
        searchInputRef.current?.blur();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (displayOptions[selectedIndex]) {
          router.push(displayOptions[selectedIndex].href);
          setIsSearchOpen(false);
          setQuery("");
          searchInputRef.current?.blur();
        }
      } else if (e.key === "Tab" && ghostText) {
        e.preventDefault();
        setQuery(ghostText);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, displayOptions, selectedIndex, ghostText, router]);

  // Reset index when query changes or search opens
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isSearchOpen]);

  return (
    <>
      {/* Background Blur Overlay when Search is Active */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[var(--color-haiti)]/60 backdrop-blur-md"
            onClick={() => {
              setIsSearchOpen(false);
              setQuery("");
            }}
          />
        )}
      </AnimatePresence>

      <div className={`sticky top-4 z-50 px-6 font-sans ${isSearchOpen ? 'relative z-50' : ''}`}>
        <header className="flex h-16 w-full items-center justify-between px-6 glass-panel relative z-50">
          {/* Global Search */}
          <div className="relative w-72 md:w-96 group">
            <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors z-20 ${isSearchOpen ? 'text-[var(--color-turbo)]' : 'text-white/40 group-focus-within:text-[var(--color-turbo)]'}`} />
            
            {/* Search Input Wrapper for Ghost Text */}
            <div className="relative w-full z-10">
              {/* Ghost text background */}
              {isSearchOpen && ghostText && ghostText.toLowerCase().startsWith(query.toLowerCase()) && (
                <div className="absolute inset-y-0 left-9 flex items-center pointer-events-none">
                  <span className="text-transparent">{query}</span>
                  <span className="text-white/20">{ghostText.slice(query.length)}</span>
                </div>
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                id="global-search-input"
                placeholder="Recherche globale (Ctrl+K)"
                onFocus={() => setIsSearchOpen(true)}
                className={`w-full rounded-xl bg-white/5 py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/40 border transition-all relative z-10 focus:outline-none ${
                  isSearchOpen ? 'border-[var(--color-turbo)]/50 shadow-[0_0_15px_rgba(240,225,0,0.1)] bg-[var(--color-haiti)]' : 'border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-white/20'
                }`}
              />
            </div>

            {/* Dropdown Results */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-haiti)]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50"
                >
                  <div className="p-2">
                    <p className="px-3 py-2 text-[9px] font-accent uppercase tracking-widest text-white/40">
                      {query ? "Résultats de recherche" : "Suggestions Rapides"}
                    </p>
                    
                    {displayOptions.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-white/50">
                        Aucun résultat pour "{query}"
                      </div>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {displayOptions.map((choice, idx) => {
                          const Icon = choice.icon;
                          const isSelected = idx === selectedIndex;
                          return (
                            <li key={choice.id}>
                              <Link
                                href={choice.href}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  setQuery("");
                                }}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                  isSelected ? "bg-white/10 shadow-sm" : "hover:bg-white/5"
                                }`}
                              >
                                <div className={`p-1.5 rounded-md ${isSelected ? 'bg-white/5' : 'bg-transparent'}`}>
                                  <Icon className={`w-3.5 h-3.5 ${choice.color}`} />
                                </div>
                                <span className={`text-xs ${isSelected ? "text-white font-medium" : "text-white/70"}`}>
                                  {/* Highlight matched text if applicable */}
                                  {query && choice.type !== 'search' ? (
                                    <>
                                      {choice.text.toLowerCase().includes(query.toLowerCase()) ? (
                                        <>
                                          {choice.text.substring(0, choice.text.toLowerCase().indexOf(query.toLowerCase()))}
                                          <span className="text-[var(--color-turbo)] font-bold bg-[var(--color-turbo)]/10 px-0.5 rounded">
                                            {choice.text.substring(
                                              choice.text.toLowerCase().indexOf(query.toLowerCase()),
                                              choice.text.toLowerCase().indexOf(query.toLowerCase()) + query.length
                                            )}
                                          </span>
                                          {choice.text.substring(choice.text.toLowerCase().indexOf(query.toLowerCase()) + query.length)}
                                        </>
                                      ) : choice.text}
                                    </>
                                  ) : choice.text}
                                </span>
                                {isSelected && <ArrowRight className="w-3 h-3 text-white/50 ml-auto" />}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  
                  {/* Keyboard Shortcuts Footer */}
                  <div className="bg-black/20 px-4 py-2 border-t border-white/5 flex items-center justify-between text-[9px] text-white/40">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/10 font-sans shadow-sm">↑↓</kbd> Naviguer
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/10 font-sans shadow-sm">Enter</kbd> Aller
                      </span>
                    </div>
                    <div className="flex gap-4">
                      {ghostText && query && (
                        <span className="flex items-center gap-1.5">
                          <kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/10 font-sans shadow-sm">Tab</kbd> Autocompléter
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/10 font-sans shadow-sm">Esc</kbd> Quitter
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 relative z-50">
            {/* Interactive Alerts Notification Bell */}
            <NotificationBell />

            {/* User Profile / Status */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-electric-violet)]/20 text-white font-semibold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                {user ? user.email.slice(0, 2).toUpperCase() : <User className="h-4 w-4" />}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold text-white tracking-wide">
                  {user ? user.email : "Direction Générale"}
                </p>
                <p className="text-[10px] text-[var(--color-turbo)] capitalize tracking-widest font-accent">
                  {user ? user.role : "Super Administrateur"}
                </p>
              </div>
              {user && (
                <button 
                  onClick={() => {
                    useAuthStore.getState().logout();
                    router.push("/login");
                  }}
                  title="Déconnexion"
                  className="ml-2 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </header>
      </div>
    </>
  );
}
