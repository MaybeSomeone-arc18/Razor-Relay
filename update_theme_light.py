import re

with open('frontend/src/app/globals.css', 'r') as f:
    css = f.read()

light_replacement = """:root {
  --background: #F8FAFC;
  --foreground: #0F172A;
  --card: #FFFFFF;
  --card-foreground: #0F172A;
  --popover: #FFFFFF;
  --popover-foreground: #0F172A;
  --primary: #059669;
  --primary-foreground: #FFFFFF;
  --secondary: #F1F5F9;
  --secondary-foreground: #0F172A;
  --muted: #F1F5F9;
  --muted-foreground: #64748B;
  --accent: #059669;
  --accent-foreground: #FFFFFF;
  --destructive: #EF4444;
  --destructive-foreground: #FFFFFF;
  --border: #E2E8F0;
  --input: #E2E8F0;
  --ring: #3B82F6;
"""
css = re.sub(r':root \{.*?(?=\n\})', light_replacement, css, flags=re.DOTALL)

with open('frontend/src/app/globals.css', 'w') as f:
    f.write(css)

print("Updated globals.css light mode")
