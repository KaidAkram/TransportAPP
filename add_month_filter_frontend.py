import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Find `const [yearFilter, setYearFilter] = useState("");` or similar, and add monthFilter
    pattern_state = r'(const \[yearFilter, setYearFilter\] = useState<string>\(""\);)'
    if not re.search(pattern_state, content):
        pattern_state = r'(const \[yearFilter, setYearFilter\] = useState\(""\);)'
    
    if re.search(pattern_state, content) and 'monthFilter' not in content:
        print(f"Modifying {filepath}")
        content = re.sub(
            pattern_state,
            r'\1\n  const [monthFilter, setMonthFilter] = useState<string>("");',
            content
        )

        # 2. Add to API params
        # if (yearFilter) params.annee = yearFilter;
        content = re.sub(
            r'(if\s*\(yearFilter\)\s*params\.annee\s*=\s*yearFilter;)',
            r'\1\n      if (monthFilter) params.mois = monthFilter;',
            content
        )

        # 3. Add to dependencies of useEffects that include yearFilter
        # e.g., }, [search, statusFilter, typeFilter, yearFilter, page, sortBy, sortOrder]);
        content = re.sub(
            r'(\b(?:yearFilter)\b)',
            r'\1, monthFilter',
            content
        )
        # But wait, replacing yearFilter with yearFilter, monthFilter might do it in the params.annee = yearFilter too.
        # Let's fix that. Wait, the re.sub on \b(?:yearFilter)\b is dangerous.
        # Let's do this safely:
        pass

def process_file_safely(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'yearFilter' not in content or 'monthFilter' in content:
        return

    print(f"Processing {filepath}")
    
    # 1. State
    content = content.replace(
        'const [yearFilter, setYearFilter] = useState<string>("");',
        'const [yearFilter, setYearFilter] = useState<string>("");\n  const [monthFilter, setMonthFilter] = useState<string>("");'
    )
    content = content.replace(
        'const [yearFilter, setYearFilter] = useState("");',
        'const [yearFilter, setYearFilter] = useState("");\n  const [monthFilter, setMonthFilter] = useState("");'
    )

    # 2. Params
    content = content.replace(
        'if (yearFilter) params.annee = yearFilter;',
        'if (yearFilter) params.annee = yearFilter;\n      if (monthFilter) params.mois = monthFilter;'
    )

    # 3. useEffect dependencies
    # Look for [..., yearFilter, ...]
    content = re.sub(
        r'(\[\s*[^\]]*?yearFilter[^\]]*?\])',
        lambda m: m.group(1).replace('yearFilter', 'yearFilter, monthFilter'),
        content
    )

    # 4. JSX
    # We need to insert a month GlassSelect right after the year GlassSelect
    # The year GlassSelect looks something like:
    # <GlassSelect value={yearFilter} ... />
    # We will find the div containing yearFilter and duplicate it for monthFilter
    jsx_pattern = r'(<div className="w-full sm:w-\[150px\]">\s*<GlassSelect\s*value=\{yearFilter\}[\s\S]*?</div>)'
    
    month_select_jsx = """
        <div className="w-full sm:w-[150px]">
          <GlassSelect
            value={monthFilter}
            onChange={setMonthFilter}
            placeholder="Mois"
            options={[
              { value: "", label: "Tous les mois" },
              { value: "1", label: "Janvier" },
              { value: "2", label: "Février" },
              { value: "3", label: "Mars" },
              { value: "4", label: "Avril" },
              { value: "5", label: "Mai" },
              { value: "6", label: "Juin" },
              { value: "7", label: "Juillet" },
              { value: "8", label: "Août" },
              { value: "9", label: "Septembre" },
              { value: "10", label: "Octobre" },
              { value: "11", label: "Novembre" },
              { value: "12", label: "Décembre" },
            ]}
          />
        </div>"""
    
    def jsx_repl(m):
        return m.group(1) + month_select_jsx

    content = re.sub(jsx_pattern, jsx_repl, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    files = [
        'frontend/src/app/cautions/page.tsx',
        'frontend/src/app/contrats/page.tsx',
        'frontend/src/app/employes/page.tsx',
        'frontend/src/app/finances/page.tsx',
        'frontend/src/app/maintenance/page.tsx',
        'frontend/src/app/partenaires/page.tsx',
        'frontend/src/app/stock/page.tsx',
        'frontend/src/app/stock/receptions/page.tsx',
        'frontend/src/app/vehicules/page.tsx',
    ]
    for f in files:
        if os.path.exists(f):
            process_file_safely(f)
