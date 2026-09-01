import re

with open('frontend/src/app/globals.css', 'r') as f:
    css = f.read()

# Fix font-mono mapping
css = re.sub(r'--font-mono: var\(--font-geist-mono\);', r'--font-mono: var(--font-mono);', css)

# Fix dark mode colors
dark_replacement = """.dark {
  --background: #02042B;
  --foreground: #F8FAFC;
  --card: #0B192C;
  --card-foreground: #FFFFFF;
  --popover: #0B192C;
  --popover-foreground: #FFFFFF;
  --primary: #00FF88;
  --primary-foreground: #02042B;
  --secondary: #1E293B;
  --secondary-foreground: #F8FAFC;
  --muted: #0F172A;
  --muted-foreground: #94A3B8;
  --accent: #00FF88;
  --accent-foreground: #02042B;
  --destructive: #EF4444;
  --destructive-foreground: #FFFFFF;
  --border: rgba(59, 130, 246, 0.2);
  --input: rgba(59, 130, 246, 0.15);
  --ring: rgba(59, 130, 246, 0.5);
"""
css = re.sub(r'\.dark \{.*?(?=\n\})', dark_replacement, css, flags=re.DOTALL)

with open('frontend/src/app/globals.css', 'w') as f:
    f.write(css)

print("Updated globals.css")
