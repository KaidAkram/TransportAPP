"use client";

import { useState, useRef, useEffect } from "react";
import { useSettingsStore, CompanySettings } from "@/stores/settingsStore";
import { Building2, Save, Upload, MapPin, Building, Hash, Phone, Key, ShieldCheck } from "lucide-react";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { TypographySwitcher } from "@/components/shared/TypographySwitcher";

export default function AdminSettingsPage() {
  const { company, updateCompany } = useSettingsStore();
  const [formData, setFormData] = useState<CompanySettings>(company);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if store updates externally
  useEffect(() => {
    setFormData(company);
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.name.endsWith(".svg")) {
      alert("Veuillez sélectionner une image valide (JPG, PNG, SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, logoBase64: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API save delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    updateCompany(formData);
    await useSettingsStore.getState().saveGlobalSettings();
    
    setIsSaving(false);
    setToastMessage("Paramètres de l'entreprise mis à jour avec succès !");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--color-electric-violet)] text-white px-4 py-3 rounded-2xl shadow-xl shadow-[#7C3AED]/20 border border-white/20 flex items-center gap-2.5 text-sm font-medium animate-scale-in">
          <ShieldCheck className="h-5 w-5 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-accent text-[var(--color-turbo)] uppercase tracking-widest mb-1 block font-bold">
            SaaS Administration
          </span>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight drop-shadow-md">
            Paramètres de l'Entreprise
          </h1>
          <p className="text-sm text-white/60 mt-2 max-w-xl">
            Configurez l'identité visuelle et les informations légales de votre instance. Ces données apparaîtront sur vos factures, devis et tableaux de bord.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Visual Identity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 border-t-2 border-t-[var(--color-electric-violet)] rounded-2xl animate-[stagger-up_0.1s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            <h3 className="text-sm font-heading font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--color-electric-violet)]" />
              Identité Visuelle
            </h3>

            <div className="flex flex-col items-center gap-4">
              <div 
                className="w-32 h-32 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner group relative cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.logoBase64 ? (
                  <img src={formData.logoBase64} alt="Logo Entreprise" className="w-full h-full object-cover" />
                ) : (
                  <img src="/animated-logo.gif" alt="Software Logo" className="w-full h-full object-cover mix-blend-screen" />
                )}
                
                <div className="absolute inset-0 bg-[var(--color-haiti)]/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <Upload className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">Changer</span>
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoUpload} 
                accept="image/png, image/jpeg, image/svg+xml, .svg" 
                className="hidden" 
              />
              
              <div className="text-center">
                <p className="text-xs text-white/50">Logo de l'entreprise</p>
                <p className="text-[9px] uppercase tracking-widest text-white/30 mt-1">Format carré (JPG, PNG, SVG)</p>
              </div>
              
              {formData.logoBase64 && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, logoBase64: null }))}
                  className="text-[10px] text-red-400 hover:text-red-300 underline-offset-4 hover:underline"
                >
                  Supprimer le logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Legal Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl animate-[stagger-up_0.2s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            <h3 className="text-sm font-heading font-bold text-white mb-6 flex items-center gap-2">
              <Key className="w-4 h-4 text-[var(--color-turbo)]" />
              Informations Légales & Coordonnées
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/50 pl-1">Nom de l'entreprise</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white font-medium focus:border-[var(--color-electric-violet)]/50 focus:bg-black/60 transition-all focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)]/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/50 pl-1">Adresse Complète</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white font-medium focus:border-[var(--color-electric-violet)]/50 focus:bg-black/60 transition-all focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/50 pl-1">Registre Commerce (RC)</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    name="rc"
                    value={formData.rc}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono text-white/80 focus:border-[var(--color-electric-violet)]/50 focus:bg-black/60 transition-all focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/50 pl-1">NIF</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    name="nif"
                    value={formData.nif}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono text-white/80 focus:border-[var(--color-electric-violet)]/50 focus:bg-black/60 transition-all focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/50 pl-1">NIS</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    name="nis"
                    value={formData.nis}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono text-white/80 focus:border-[var(--color-electric-violet)]/50 focus:bg-black/60 transition-all focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/50 pl-1">Article d'Imposition (AI)</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    name="ai"
                    value={formData.ai}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono text-white/80 focus:border-[var(--color-electric-violet)]/50 focus:bg-black/60 transition-all focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/50 pl-1">Numéro de Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono text-white/80 focus:border-[var(--color-electric-violet)]/50 focus:bg-black/60 transition-all focus:outline-none"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[var(--color-haiti)] font-bold text-sm hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-[var(--color-haiti)] border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder les Paramètres
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      {/* Theme Switcher — Admin only, below the form */}
      <ThemeSwitcher />

      {/* Typography Switcher — Admin only */}
      <TypographySwitcher />

    </div>
  );
}
