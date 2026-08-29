import glob
import re

files = glob.glob('frontend/src/app/**/*.tsx', recursive=True)

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    content = content.replace(
        'const [yearFilter, monthFilter, setYearFilter]',
        'const [yearFilter, setYearFilter]'
    )

    if original != content:
        print(f"Fixing {fpath}")
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
