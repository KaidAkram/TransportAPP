import glob
import re

files = glob.glob('frontend/src/app/**/*.tsx', recursive=True)

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Find where <Table> is used. Usually it's inside a glass-panel.
    # The structure usually is:
    # <div className="glass-panel overflow-hidden p-0 ...">
    #   <div className="min-w-0">
    #     <Table>
    # We want to change the wrapper `<div className="min-w-0">` to `<div className="min-w-0 overflow-x-auto custom-scrollbar w-full">`
    
    content = re.sub(
        r'<div className="min-w-0">\s*<Table>',
        r'<div className="min-w-0 overflow-x-auto custom-scrollbar w-full">\n            <Table>',
        content
    )

    if original != content:
        print(f"Fixed table overflow in {fpath}")
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
