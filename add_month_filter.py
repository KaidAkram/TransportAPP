import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the parameter definition
    # e.g., annee: Optional[int] = Query(None, description="Filter by year (date_emission)"),
    # We want to insert `mois: Optional[int] = Query(None, description="Filtrer par mois"),` right after it
    pattern_param = r'(annee:\s*Optional\[int\]\s*=\s*Query\(None,\s*description="[^"]+"\),?)'
    
    # We also need to find the if statement:
    # e.g., if annee:\n      query = query.filter(extract('year', Model.field) == annee)
    # The field could be different per file.
    pattern_if = r"(if annee:\s*\n\s*query = query\.filter\(extract\('year', ([a-zA-Z_]+\.[a-zA-Z_]+)\) == annee\))"

    # Only modify if both patterns are found
    if re.search(pattern_param, content) and re.search(pattern_if, content):
        print(f"Modifying {filepath}")
        
        def repl_param(match):
            annee_line = match.group(1)
            # if annee_line doesn't end with comma, add one
            if not annee_line.endswith(','):
                annee_line += ','
            indent = "  "
            mois_line = f'\n{indent}mois: Optional[int] = Query(None, description="Filtrer par mois"),'
            return annee_line + mois_line

        new_content = re.sub(pattern_param, repl_param, content)

        def repl_if(match):
            annee_block = match.group(1)
            field = match.group(2)
            indent = annee_block.split('if annee:')[0]
            if not indent.strip() == '': 
                pass # just need spacing
            # we'll extract the exact spacing from the newline
            lines = annee_block.split('\n')
            first_indent = lines[0][:len(lines[0])-len(lines[0].lstrip())]
            second_indent = lines[1][:len(lines[1])-len(lines[1].lstrip())]
            mois_block = f"\n{first_indent}if mois:\n{second_indent}query = query.filter(extract('month', {field}) == mois)"
            return annee_block + mois_block

        new_content = re.sub(pattern_if, repl_if, new_content)
        
        # Exception for Facture: Facture.annee_realisation is an integer, so the pattern won't match exactly.
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

if __name__ == "__main__":
    files = glob.glob('backend/app/api/v1/*.py')
    for f in files:
        process_file(f)

    # Let's handle facture manually if needed since it uses `Facture.annee_realisation == annee`
    facture_path = 'backend/app/api/v1/factures.py'
    with open(facture_path, 'r', encoding='utf-8') as f:
        f_content = f.read()
    
    if 'Facture.annee_realisation == annee' in f_content and 'if mois:' not in f_content:
        # wait, does facture have a month field? 
        # Facture model has date_facture which is a DateTime. annee_realisation is an int.
        # So we should filter by date_facture.
        print("Handling factures.py separately")
        f_content = re.sub(
            r'(annee:\s*Optional\[int\].*)',
            r'\1\n  mois: Optional[int] = Query(None, description="Filtrer par mois (date_facture)"),',
            f_content
        )
        f_content = re.sub(
            r"(if annee:\s*\n\s*query = query\.filter\(Facture\.annee_realisation == annee\))",
            r"\1\n  if mois:\n    query = query.filter(extract('month', Facture.date_facture) == mois)",
            f_content
        )
        with open(facture_path, 'w', encoding='utf-8') as f:
            f.write(f_content)

