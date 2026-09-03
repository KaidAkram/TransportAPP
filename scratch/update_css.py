with open('frontend/src/app/globals.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/themes.css', 'r', encoding='utf-8') as f:
    themes_css = f.read()

themes_css = themes_css.replace('[data-theme="dusk"] {', ':root,\n[data-theme="dusk"] {')

new_lines = lines[:52] + [themes_css + '\n'] + lines[142:]

with open('frontend/src/app/globals.css', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Updated globals.css')
