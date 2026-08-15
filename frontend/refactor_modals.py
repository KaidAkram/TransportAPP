import re
import os

files = [
    r'c:\Users\Akram KAID\Desktop\Entreprise_transport\frontend\src\components\modules\partenaires\AddCRMNoteModal.tsx',
    r'c:\Users\Akram KAID\Desktop\Entreprise_transport\frontend\src\components\modules\partenaires\AddPartnerDocumentModal.tsx',
    r'c:\Users\Akram KAID\Desktop\Entreprise_transport\frontend\src\components\modules\partenaires\AddContactModal.tsx'
]

replacements = [
    # Modal container
    (r'bg-surface border-border shadow-xl', r'bg-[#1B102B]/95 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]'),
    # Header
    (r'border-border bg-table-header', r'border-white/5 bg-white/5'),
    # Icons container
    (r'bg-primary-light text-primary-base', r'bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] shadow-[inset_0_0_10px_rgba(131,77,251,0.2)]'),
    (r'h-9 w-9 rounded-lg', r'h-10 w-10 rounded-xl'),
    # Close button
    (r'text-text-secondary hover:bg-background hover:text-text-primary', r'text-white/50 hover:bg-white/5 hover:text-white'),
    # Text colors
    (r'text-text-primary', r'text-white'),
    (r'text-text-secondary', r'text-white/50'),
    (r'text-danger-text', r'text-red-400'),
    (r'text-danger', r'text-red-400'),
    (r'bg-danger-bg', r'bg-red-500/10'),
    (r'border-danger/20', r'border-red-500/20'),
    # Inputs
    (r'rounded-md border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base', r'rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white focus:border-[var(--color-electric-violet)] focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)]/50'),
    (r'rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-white focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base', r'rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-mono text-white focus:border-[var(--color-electric-violet)] focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)]/50'),
    # Buttons container
    (r'border-border', r'border-white/10'),
]

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Custom replacements
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    
    # Replace Button component usage with native buttons to apply the new classes easily
    content = re.sub(r'<Button\s+type=\"button\"\s+className=.*?\s+onClick=\{onClose\}\s*>\s*Annuler\s*</Button>', r'<button type=\"button\" onClick={onClose} className=\"px-4 py-2 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors\">Annuler</button>', content, flags=re.DOTALL)
    content = re.sub(r'<Button\s+type=\"submit\"\s+className=.*?\s+isLoading=\{isSubmitting\}\s*>\s*(.*?)\s*</Button>', r'<button type=\"submit\" disabled={isSubmitting} className=\"px-5 py-2 text-sm font-bold text-white bg-[var(--color-electric-violet)] rounded-xl hover:bg-[var(--color-electric-violet)]/80 shadow-[0_0_20px_rgba(131,77,251,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed\">\1</button>', content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("done")
