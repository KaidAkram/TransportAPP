const fs = require('fs');

let content = fs.readFileSync('src/app/vehicules/page.tsx', 'utf8');

// Replace Button and Card imports
content = content.replace(/import \{.*?\} from "@\/components\/ui\/table";[ \t]*\/\/[^\n]*/, 
`import { GlassPagination } from "@/components/ui/GlassPagination";
import { Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";`);

content = content.replace(/<div className="space-y-6 max-w-7xl mx-auto">/g, 
`<div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans contain-layout opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>`);

content = content.replace(/<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">[\s\S]*?<\/div>\s*<\/div>/, 
`{/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] font-bold mb-1 ml-0.5 flex items-center gap-2">
            <Bus className="w-3 h-3" />
            Flotte
          </p>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-white drop-shadow-md flex items-center gap-2">
            Gestion du Parc Automobile
          </h1>
          <p className="text-xs text-white/50 mt-1 max-w-xl">
            Supervision de la flotte, suivi kilométrique, conformité documentaire et maintenance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchVehicles}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium glass-panel border-white/10 hover:bg-white/10 text-white transition-all shadow-[0_0_15px_rgba(0,0,0,0.2)]"
          >
            <RefreshCw className={\`h-4 w-4 \${loading ? "animate-spin" : ""}\`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[#8A2BE2] hover:shadow-[0_0_20px_rgba(138,43,226,0.4)] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau Véhicule</span>
          </button>
        </div>
      </div>`);

// Replace KPIs
content = content.replace(/<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">[\s\S]*?<\/div>\s*<\/div>/,
`{/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.2s' }}>
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold">Total Véhicules</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/70">
              <Bus className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-white drop-shadow-sm">{totalCount}</div>
            <p className="text-[10px] text-white/40 mt-1 font-accent tracking-wider uppercase">Flotte active sous gestion</p>
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden group hover:border-[var(--color-turbo)]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(240,225,0,0.1)]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-turbo)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-turbo)]/20 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold">Disponibles</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-turbo)]/10 text-[var(--color-turbo)]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-[var(--color-turbo)] drop-shadow-sm">{disponibles}</div>
            <p className="text-[10px] text-white/40 mt-1 font-accent tracking-wider uppercase">Prêts pour affectation</p>
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden group hover:border-[var(--color-electric-violet)]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(138,43,226,0.1)]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-electric-violet)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-electric-violet)]/20 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold">En Mission</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-[var(--color-electric-violet)] drop-shadow-sm">{enMission}</div>
            <p className="text-[10px] text-white/40 mt-1 font-accent tracking-wider uppercase">Sur route actuellement</p>
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold">Maintenance / Arrêt</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-rose-400 drop-shadow-sm">{maintenance}</div>
            <p className="text-[10px] text-white/40 mt-1 font-accent tracking-wider uppercase">Atelier ou immobilisés</p>
          </div>
        </div>
      </div>`);

// Search filter
content = content.replace(/<Card className="bg-surface border-border shadow-xs">[\s\S]*?<\/Card>/,
`{/* Filter & Search Bar */}
      <div className="glass-panel p-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par immatriculation, marque ou modèle..."
              className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-turbo)] focus:outline-none focus:ring-1 focus:ring-[var(--color-turbo)]/50 transition-all"
            />
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-[var(--color-turbo)] focus:outline-none focus:ring-1 focus:ring-[var(--color-turbo)]/50 transition-all appearance-none"
            >
              <option value="" className="bg-[var(--color-haiti)]">Tous les types</option>
              <option value="Bus" className="bg-[var(--color-haiti)]">Bus</option>
              <option value="Minibus" className="bg-[var(--color-haiti)]">Minibus</option>
              <option value="Voiture" className="bg-[var(--color-haiti)]">Voiture</option>
              <option value="Van" className="bg-[var(--color-haiti)]">Van / Fourgon</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-[var(--color-turbo)] focus:outline-none focus:ring-1 focus:ring-[var(--color-turbo)]/50 transition-all appearance-none"
            >
              <option value="" className="bg-[var(--color-haiti)]">Tous les statuts</option>
              <option value="DISPONIBLE" className="bg-[var(--color-haiti)]">Disponible</option>
              <option value="EN_MISSION" className="bg-[var(--color-haiti)]">En mission</option>
              <option value="MAINTENANCE" className="bg-[var(--color-haiti)]">Maintenance</option>
              <option value="IMMOBILISE" className="bg-[var(--color-haiti)]">Immobilisé</option>
              <option value="HORS_SERVICE" className="bg-[var(--color-haiti)]">Hors service</option>
            </select>
          </div>
        </div>
      </div>`);

// Table
content = content.replace(/<Card className="bg-surface border-border shadow-xs overflow-hidden">[\s\S]*?<\/Card>/,
`{/* Fleet Data Table */}
      <div className="opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.4s' }}>
        {loading ? (
          <div className="glass-panel overflow-hidden p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState 
            title="Aucun véhicule trouvé" 
            message="Ajustez vos filtres ou ajoutez un nouveau véhicule à la flotte." 
            icon={Bus} 
          />
        ) : (
          <div className="glass-panel overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <thead className="bg-black/20 border-b border-white/10 text-white/40 font-accent uppercase tracking-widest">
                  <tr>
                    <th className="py-3 px-4 w-[16%]">Immatriculation</th>
                    <th className="py-3 px-4 w-[20%]">Véhicule (Marque & Modèle)</th>
                    <th className="py-3 px-4 w-[12%]">Type</th>
                    <th className="py-3 px-4 w-[12%] text-center">Places</th>
                    <th className="py-3 px-4 w-[14%] text-right">Kilométrage</th>
                    <th className="py-3 px-4 w-[14%] text-center">Statut</th>
                    <th className="py-3 px-4 w-[12%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-4 text-xs font-mono font-bold text-white truncate">
                        {v.immat}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-white truncate">
                        {v.marque} {v.modele}
                      </td>
                      <td className="py-3 px-4 text-xs text-white/60 truncate">
                        {v.type}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-white/80 truncate">
                        {v.places} pl.
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono text-white truncate">
                        {v.kilometrage.toLocaleString()} <span className="text-[9px] font-sans text-white/40">km</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={v.statut} type="vehicule" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={\`/vehicules/\${v.id}\`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/50 hover:text-[var(--color-electric-violet)] hover:bg-[var(--color-electric-violet)]/10 transition-colors text-[10px] font-bold font-accent uppercase tracking-wider"
                            title="Voir la fiche"
                          >
                            <Eye className="h-3.5 w-3.5" /> Fiche
                          </Link>
                          {v.statut !== "HORS_SERVICE" && (
                            <button
                              onClick={() => handleArchive(v.id, v.immat)}
                              className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Mettre hors service"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>`);

fs.writeFileSync('src/app/vehicules/page.tsx', content);
