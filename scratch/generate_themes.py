import json
import re

def hex_to_rgba(hex_color, alpha):
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 6:
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
    else:
        return f"rgba(255, 255, 255, {alpha})"
    return f"rgba({r}, {g}, {b}, {alpha})"

image1_themes = [
    {"name": "Dusk", "vibe": "Calm • Warm • Sophisticated", "hex": ["#1A1B2E", "#42426F", "#6D5BA6", "#F08A8A", "#FFD6C9"]},
    {"name": "Sage", "vibe": "Fresh • Natural • Balanced", "hex": ["#2E4D3D", "#527F5B", "#A3C9A8", "#DCEAD9", "#F7F7F2"]},
    {"name": "Ocean", "vibe": "Cool • Clean • Refreshing", "hex": ["#0D1B2A", "#1B4965", "#29ADB2", "#A8DADC", "#E6F4F1"]},
    {"name": "Sunset", "vibe": "Vibrant • Energetic • Friendly", "hex": ["#E94F37", "#F9844A", "#F9C74F", "#FDD9B5", "#FFF2E7"]},
    {"name": "Lavender", "vibe": "Soft • Dreamy • Elegant", "hex": ["#5E4B8B", "#7D6CC4", "#B9A7E0", "#E7D6F7", "#F6F2FB"]},
    {"name": "Mustard", "vibe": "Bold • Modern • Playful", "hex": ["#2B2B2B", "#D4A017", "#F0C94C", "#F7E7B5", "#FFFDF5"]},
    {"name": "Teal Gray", "vibe": "Minimal • Calm • Professional", "hex": ["#263238", "#455A64", "#80CBC4", "#CFD8DC", "#ECEFF1"]},
    {"name": "Berry", "vibe": "Rich • Bold • Luxurious", "hex": ["#6B0F3C", "#9D174D", "#E3356A", "#F7A1B3", "#FDF2EC"]},
    {"name": "Arctic", "vibe": "Crisp • Cool • Modern", "hex": ["#102A43", "#1E88E5", "#64B5F6", "#BBDEFB", "#E3F2FD"]},
]

image2_themes = [
    {"name": "Modern Purple", "vibe": "Creative • Modern • Premium", "hex": ["#6D28D9", "#8B5CF6", "#C4B5FD", "#F5F3FF", "#1F2937"]},
    {"name": "Ocean Breeze", "vibe": "Calm • Fresh • Trustworthy", "hex": ["#0EA5E9", "#38BDF8", "#BAE6FD", "#E0F2FE", "#0F172A"]},
    {"name": "Nature Green", "vibe": "Natural • Balanced • Calm", "hex": ["#16A34A", "#4ADE80", "#BBF7D0", "#F0FDF4", "#14532D"]},
    {"name": "Sunset Vibes", "vibe": "Warm • Energetic • Friendly", "hex": ["#F97316", "#FB923C", "#FDBA74", "#FFF7ED", "#7C2D12"]},
    {"name": "Blush Pink", "vibe": "Soft • Feminine • Elegant", "hex": ["#EC4899", "#F472B6", "#FBCFE8", "#FDF2F8", "#831843"]},
    {"name": "Deep Blue", "vibe": "Professional • Strong • Reliable", "hex": ["#1E3A8A", "#2563EB", "#93C5FD", "#EFF6FF", "#0B1220"]},
    {"name": "Bright Yellow", "vibe": "Cheerful • Optimistic • Bold", "hex": ["#EAB308", "#FACC15", "#FDE68A", "#FFFBEB", "#713F12"]},
    {"name": "Teal Harmony", "vibe": "Modern • Clean • Balanced", "hex": ["#14B8A6", "#2DD4BF", "#99F6E4", "#ECFEFF", "#134E4A"]},
    {"name": "Royal Dark", "vibe": "Luxury • Elegant • Sophisticated", "hex": ["#4C1D95", "#6D28D9", "#A78BFA", "#EDE9FE", "#111827"]},
    {"name": "Minimal Neutral", "vibe": "Clean • Simple • Timeless", "hex": ["#374151", "#6B7280", "#D1D5DB", "#F3F4F6", "#111827"]},
]

# For image1, bg is hex[0], primary is hex[3] or hex[2], secondary is hex[2] or hex[1]
# Let's map it so they look good.
# For Image 1: 
# bg = hex[0]
# primary = hex[2]
# secondary = hex[3]

# For Image 2:
# bg = hex[4]
# primary = hex[0]
# secondary = hex[1]

ts_code = []
ts_code.append("export type ThemeId = ")
theme_ids = []
themes_array = []
css_code = []

def process_theme(theme, source):
    id_str = theme['name'].lower().replace(' ', '-')
    theme_ids.append(f"'{id_str}'")
    
    if source == 1:
        bg = theme['hex'][0]
        primary = theme['hex'][2]
        secondary = theme['hex'][3]
        text = theme['hex'][4]
    else:
        bg = theme['hex'][4]
        primary = theme['hex'][0]
        secondary = theme['hex'][1]
        text = theme['hex'][3]
        
    themes_array.append(f"""  {{
    id: '{id_str}',
    name: '{theme['name']}',
    vibe: '{theme['vibe']}',
    colors: {{ primary: '{primary}', secondary: '{secondary}', bg: '{bg}' }},
  }},""")

    css_code.append(f"""[data-theme="{id_str}"] {{
  --theme-accent-primary: {primary};
  --theme-accent-secondary: {secondary};
  --theme-bg-deep: {bg};
  --theme-bg-surface: {hex_to_rgba(primary, 0.04)};
  --theme-bg-card: {hex_to_rgba(primary, 0.05)};
  --theme-text-primary: {text};
  --theme-text-muted: {hex_to_rgba(text, 0.55)};
  --theme-border: {hex_to_rgba(primary, 0.15)};
  --theme-orb-primary: {hex_to_rgba(primary, 0.25)};
  --theme-orb-secondary: {hex_to_rgba(secondary, 0.15)};
  --theme-glass-hover: {hex_to_rgba(primary, 0.08)};
}}""")


for t in image1_themes:
    process_theme(t, 1)
for t in image2_themes:
    process_theme(t, 2)

with open('scratch/themes.ts', 'w') as f:
    f.write(" | ".join(theme_ids) + ";\n\n")
    f.write("export const THEMES: ThemeDefinition[] = [\n")
    f.write("\n".join(themes_array))
    f.write("\n];\n")

with open('scratch/themes.css', 'w') as f:
    f.write("\n\n".join(css_code))

print("Done")
