import glob
import re

files = glob.glob('frontend/src/app/**/*.tsx', recursive=True)

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Fix the main filter bar flex container
    # It usually looks like: className="relative z-20 flex flex-col sm:flex-row gap-3 ...
    content = re.sub(
        r'flex flex-col sm:flex-row',
        r'flex flex-wrap',
        content
    )
    
    content = re.sub(
        r'flex flex-col md:flex-row',
        r'flex flex-wrap',
        content
    )

    # 2. Fix the search input wrapper to allow it to be full width on mobile but flex-1 on tablet+
    # Currently it's: <div className="relative flex-1 group">
    # We change to: <div className="relative w-full md:w-auto md:flex-1 min-w-[250px] group">
    # Wait, some pages might use a different wrapper. We only want to replace it if it's the search input wrapper.
    # It always contains `<Search className=`
    content = re.sub(
        r'<div className="relative flex-1 group">(\s*<div className="absolute[^>]+>\s*<Search|<Search)',
        r'<div className="relative w-full lg:w-auto lg:flex-1 min-w-[250px] group">\1',
        content
    )
    
    # 3. For the GlassSelect wrappers: w-full sm:w-[150px]
    # To make them look nice on mobile (2 per row instead of 1 huge dropdown), we can use:
    # w-[calc(50%-6px)] sm:w-[150px] sm:flex-none
    # The gap is 3 (12px), so 50% - 6px fits two per row.
    content = re.sub(
        r'className="w-full sm:w-\[([^\]]+)\]"',
        r'className="w-[calc(50%-6px)] sm:w-auto sm:min-w-[\1]"',
        content
    )
    
    if 'partenaires/page.tsx' in fpath:
        content = content.replace(
            '<div className="relative flex-1 group">',
            '<div className="relative w-full lg:w-auto lg:flex-1 min-w-[250px] group">'
        )

    if original != content:
        print(f"Fixed layout in {fpath}")
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
