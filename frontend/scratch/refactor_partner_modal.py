import re
import sys

file_path = "c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/components/modules/partenaires/AddPartnerModal.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports and constants
content = content.replace(
    'import React, { useState } from "react";',
    'import React, { useState, useEffect } from "react";\nimport { createPortal } from "react-dom";'
)

constants = """
const glassInput = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-violet)]/50 focus:border-[var(--color-electric-violet)]/50 transition-all shadow-inner font-medium";
const glassInputMono = `${glassInput} font-mono`;
const glassLabel = "block text-[11px] font-accent uppercase tracking-widest text-white/50 mb-2 font-bold";

export function AddPartnerModal"""

content = content.replace('export function AddPartnerModal', constants)

# 2. Mounted state
mounted_state = """  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);"""

content = content.replace(
"""  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);""",
  mounted_state
)

# 3. Modal Container and Header
old_render = """  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-xl bg-[#1B102B]/95 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Nouveau Partenaire CRM</h2>
              <p className="text-xs text-white/50">Enregistrement Client Corporate ou Fournisseur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>"""

new_render = """  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] relative"
        style={{ background: 'radial-gradient(circle at top right, rgba(131,77,251,0.05), transparent 60%), rgba(255,255,255,0.02)' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">Nouveau Partenaire CRM</h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] mt-0.5">Enregistrement Client Corporate ou Fournisseur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>"""

content = content.replace(old_render, new_render)

# Remove the old if (!isOpen) return null; check
content = content.replace("  if (!isOpen) return null;\n", "")

# Add closing parenthesis for createPortal at the end
content = re.sub(r'    </div>\n  \);\n}', '    </div>\n  ),\n  document.body\n  );\n}', content)

# 4. Replace Input styles
content = content.replace('className="block text-xs font-bold text-[var(--color-electric-violet)] mb-1"', 'className={glassLabel}')
content = content.replace('className="block text-xs font-semibold text-white mb-1"', 'className={glassLabel}')
content = content.replace('className="block text-[11px] font-semibold text-white mb-1"', 'className={glassLabel}')

content = content.replace('className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white focus:border-[var(--color-electric-violet)] focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)]/50"', 'className={glassInput}')
content = content.replace('className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:border-[var(--color-electric-violet)] focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)]/50"', 'className={glassInput}')
content = content.replace('className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-mono text-white focus:border-[var(--color-electric-violet)] focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)]/50"', 'className={glassInputMono}')
content = content.replace('className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-white focus:border-[var(--color-electric-violet)] focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)]/50"', 'className={glassInputMono}')

# Update Form content classes
content = content.replace('className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"', 'className="p-6 space-y-6 overflow-y-auto"')

# Fix Form buttons
old_buttons = """        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white hover:bg-white/10"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[var(--color-electric-violet)] hover:bg-[#6A3DE8] text-white"
          >
            {isSubmitting ? "Enregistrement..." : "Ajouter le partenaire"}
          </Button>
        </div>"""

new_buttons = """        {/* Actions */}
        <div className="relative flex items-center justify-end gap-4 px-6 py-5 border-t border-white/10 bg-black/20 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/70 hover:text-white hover:bg-white/10 font-bold"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[var(--color-electric-violet)] hover:bg-[#6A3DE8] text-white shadow-[0_0_20px_rgba(131,77,251,0.3)] hover:shadow-[0_0_30px_rgba(131,77,251,0.5)] transition-all font-bold px-6"
          >
            {isSubmitting ? "Enregistrement..." : "Ajouter le partenaire"}
          </Button>
        </div>"""
content = content.replace(old_buttons, new_buttons)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
