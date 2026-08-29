import glob
import re

files = glob.glob('backend/app/api/v1/*.py')

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Look for \nif mois: (0 indentation)
    # and replace with \n  if mois:
    original = content
    content = re.sub(
        r'\nif mois:\n\s*(query = query\.filter\(extract\(\'month\'.*?\) == mois\))',
        r'\n  if mois:\n    \1',
        content
    )

    if original != content:
        print(f"Fixed {fpath}")
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
