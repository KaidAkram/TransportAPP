import glob
import re

files = glob.glob('frontend/src/app/**/*.tsx', recursive=True)

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Add overflow-x-auto to <div className="min-w-0"> right above <table or <Table
    content = re.sub(
        r'<div className="min-w-0">\s*<(table|Table)',
        r'<div className="min-w-0 overflow-x-auto custom-scrollbar w-full">\n                <\1',
        content
    )
    
    # Replace w-full min-w-0
    content = re.sub(
        r'<div className="w-full min-w-0">\s*<(table|Table)',
        r'<div className="w-full min-w-0 overflow-x-auto custom-scrollbar">\n                <\1',
        content
    )
    
    # Add w-full to existing overflow-x-auto divs that wrap tables
    content = re.sub(
        r'<div className="overflow-x-auto">\s*<(table|Table)',
        r'<div className="overflow-x-auto w-full custom-scrollbar">\n                <\1',
        content
    )

    if original != content:
        print(f"Fixed table overflow in {fpath}")
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
