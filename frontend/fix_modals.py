import glob
import os

pages = glob.glob('src/app/**/page.tsx', recursive=True)

for page in pages:
    if "admin" in page or "login" in page or "analytics" in page:
        continue
    
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "Portal" in content:
        continue
        
    # Import portal
    import_idx = content.rfind('import ')
    end_import_idx = content.find('\n', import_idx) + 1
    content = content[:end_import_idx] + 'import { Portal } from "@/components/shared/Portal";\n' + content[end_import_idx:]
    
    # Wrap modals
    if "{/* Modals */}" in content:
        content = content.replace("{/* Modals */}", "{/* Modals */}\n      <Portal>")
    elif "{/* Add" in content:
        idx = content.find("{/* Add")
        content = content[:idx] + "      {/* Modals */}\n      <Portal>\n" + content[idx:]
    else:
        continue
        
    # Add closing Portal tag before the last </div>
    last_div_idx = content.rfind("    </div>\n  );\n}")
    if last_div_idx == -1:
        last_div_idx = content.rfind("    </div>\n  )\n}")
    if last_div_idx == -1:
        last_div_idx = content.rfind("    </div>\n")
        
    if last_div_idx != -1:
        content = content[:last_div_idx] + "      </Portal>\n" + content[last_div_idx:]
        
    with open(page, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Fixed {page}")
