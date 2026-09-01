import re

with open('frontend/src/app/ui/Dashboard.tsx', 'r') as f:
    content = f.read()

replacements = {
    r'bg-\[#F8FAFC\] dark:bg-\[#02042B\]': 'bg-background',
    r'bg-white dark:bg-\[#0B192C\]': 'bg-card',
    r'bg-slate-100 dark:bg-\[#0F172A\]': 'bg-muted',
    r'bg-slate-100/50 dark:bg-\[#0F172A\]/50': 'bg-muted/50',
    r'text-slate-900 dark:text-neutral-200': 'text-foreground',
    r'text-slate-900 dark:text-white hover:text-emerald-600 dark:text-\[#00FF88\]': 'text-foreground hover:text-primary',
    r'text-slate-900 dark:text-white': 'text-foreground',
    r'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white': 'text-muted-foreground hover:text-foreground',
    r'text-slate-500 dark:text-slate-400': 'text-muted-foreground',
    r'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white': 'text-muted-foreground hover:text-foreground',
    r'text-slate-600 dark:text-slate-300': 'text-muted-foreground',
    r'text-slate-400 dark:text-slate-500': 'text-muted-foreground',
    r'text-emerald-600 dark:text-\[#00FF88\]': 'text-primary',
    r'bg-emerald-100 dark:bg-\[#00FF88\]/10': 'bg-primary/10',
    r'border-emerald-200 dark:border-\[#00FF88\]/20': 'border-primary/20',
    r'border-slate-200 dark:border-blue-500/20/50': 'border-border/50',
    r'border-slate-200 dark:border-blue-500/20': 'border-border',
    r'border-slate-300 dark:border-blue-500/30': 'border-border',
    r'hover:border-slate-300 dark:border-blue-500/30': 'hover:border-border',
    r'hover:bg-slate-100/50 dark:bg-\[#0F172A\]/50': 'hover:bg-muted/50 dark:hover:bg-muted/50',
    r'hover:bg-slate-200 dark:hover:bg-neutral-800': 'hover:bg-muted',
    r'hover:bg-slate-100/50 dark:bg-\[#0F172A\]/50': 'hover:bg-muted/50 dark:hover:bg-muted/50',
    r'dark:hover:text-slate-300': 'dark:hover:text-foreground',
    r'hover:text-slate-700 dark:hover:text-slate-300': 'hover:text-foreground',
    r'border-slate-200 dark:border-blue-500/20/50 hover:bg-slate-50 dark:bg-\[#0F172A\]/30': 'border-border/50 hover:bg-muted/50',
    r'bg-slate-50 dark:bg-\[#0F172A\]/30': 'bg-muted/30',
    r'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30': 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    r'bg-emerald-500 text-white': 'bg-primary text-primary-foreground',
    r'text-emerald-500 dark:text-\[#00FF88\]': 'text-primary',
    r'selection:bg-emerald-500/30 dark:selection:bg-\[#00FF88\]/30': 'selection:bg-primary/30',
    r'border-slate-700 bg-slate-950': 'border-border bg-muted',
}

for old, new in replacements.items():
    content = re.sub(old, new, content)

# Fix Secrets & Test Mode label
content = content.replace("rzp_live_super_secret_key_12345", "rzp_test_placeholder_key")
content = content.replace("Production (Live)", "Testing (Test Mode)")
content = content.replace("demo_admin_key", "placeholder_admin_key")

with open('frontend/src/app/ui/Dashboard.tsx', 'w') as f:
    f.write(content)

print("Dashboard.tsx refactored.")
