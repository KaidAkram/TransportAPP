import re
import glob
import os

files = [
    'c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/employes/page.tsx',
    'c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/vehicules/page.tsx',
    'c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/partenaires/page.tsx',
    'c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/contrats/page.tsx',
    'c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/cautions/page.tsx',
    'c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/maintenance/page.tsx',
    'c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/stock/page.tsx',
    'c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/finances/page.tsx'
]

for file_path in files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add GlassPagination import if not there
    if 'GlassPagination' not in content:
        # Find last import
        import_match = list(re.finditer(r'^import .*?;$', content, re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            content = content[:last_import.end()] + '\nimport { GlassPagination } from "@/components/ui/GlassPagination";' + content[last_import.end():]

    # 2. Add state
    if 'const [page, setPage]' not in content:
        # Find const [search, setSearch]
        content = re.sub(
            r'(const \[search, setSearch\] = useState.*?;\n)',
            r'\1  const [page, setPage] = useState(1);\n  const [totalPages, setTotalPages] = useState(1);\n  const [totalItems, setTotalItems] = useState(0);\n',
            content
        )

    # 3. Add params.page
    if 'params.page = page.toString();' not in content:
        content = re.sub(
            r'(if \(search\) params\.search = search;\n)',
            r'\1      params.page = page.toString();\n',
            content
        )

    # 4. Extract total_pages and total
    # Find setEmployees, setVehicles, setContrats, setPartenaires, etc...
    content = re.sub(
        r'(set[A-Z][a-zA-Z]+\(res\.data\.items\);\n)',
        r'\1      setTotalPages(res.data.total_pages || 1);\n      setTotalItems(res.data.total || 0);\n',
        content
    )

    # 5. Add 'page' to useCallback deps
    # We find the `}, [search, ...]);` at the end of useCallback
    content = re.sub(
        r'\}, \[search, (.*?)\]\);',
        r'}, [search, \1, page]);',
        content
    )
    # Some don't have filters, just search
    if ', page' not in content:
        content = re.sub(
            r'\}, \[search\]\);',
            r'}, [search, page]);',
            content
        )

    # 6. Reset page when filters change (we'll just reset in a useEffect watching all those filters)
    # To do this safely, we will let the user change the page manually, but reset to 1 if search changes
    if 'setPage(1)' not in content:
        deps_match = re.search(r'\}, \[search([^]]*)\]\);', content)
        if deps_match:
            deps = 'search' + deps_match.group(1).replace(', page', '')
            reset_effect = f'\n  useEffect(() => {{\n    setPage(1);\n  }}, [{deps}]);\n'
            
            # Insert before the fetch useEffect
            content = re.sub(
                r'(useEffect\(\(\) => \{\n\s*fetch[A-Z][a-zA-Z]+\(\);\n\s*\}, \[fetch[A-Z][a-zA-Z]+\]\);)',
                reset_effect + r'\n  \1',
                content
            )

    # 7. Add GlassPagination at the end of the table
    if '<GlassPagination' not in content:
        content = re.sub(
            r'(</table>\s*</div>\s*</div>)',
            r'</table>\n        </div>\n        <GlassPagination\n          currentPage={page}\n          totalPages={totalPages}\n          totalItems={totalItems}\n          onPageChange={setPage}\n        />\n      </div>',
            content
        )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f"Patched {file_path}")

