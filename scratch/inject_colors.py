import re
with open('C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/client/src/components/layout/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("animation?: IconAnimationVariant;\n  }", "animation?: IconAnimationVariant;\n    color?: string;\n  }")

colors = {
    'dashboard': "text-indigo-500 dark:text-indigo-400",
    'calendar': "text-sky-500 dark:text-sky-400",
    'appointments': "text-violet-500 dark:text-violet-400",
    'my-time': "text-amber-500 dark:text-amber-400",
    'logistics': "text-fuchsia-500 dark:text-fuchsia-400",
    'pipeline': "text-emerald-500 dark:text-emerald-400",
    'contacts': "text-blue-500 dark:text-blue-400",
    'companies': "text-cyan-500 dark:text-cyan-400",
    'lead-capture': "text-rose-500 dark:text-rose-400",
    'invoicing': "text-teal-500 dark:text-teal-400",
    'expenses': "text-red-500 dark:text-red-400",
    'inventory': "text-orange-500 dark:text-orange-400",
    'agile': "text-lime-500 dark:text-lime-400",
    'portal-empleado': "text-purple-500 dark:text-purple-400",
    'tickets': "text-pink-500 dark:text-pink-400",
    'omnichannel': "text-green-500 dark:text-green-400",
    'workflows': "text-yellow-500 dark:text-yellow-400",
    'integrations': "text-indigo-500 dark:text-indigo-400",
    'admin-bi': "text-purple-600 dark:text-purple-400",
    'reports': "text-sky-600 dark:text-sky-400",
    'settings': "text-slate-500 dark:text-slate-400",
    'portal': "text-emerald-600 dark:text-emerald-400",
    'faq': "text-blue-400 dark:text-blue-300",
    'privacy': "text-slate-400 dark:text-slate-300",
}

lines = content.split('\n')
for i, line in enumerate(lines):
    if "{ id: '" in line and "label:" in line:
        for key, color in colors.items():
            if f"id: '{key}'" in line:
                if "color:" not in line:
                    if "} ]" in line:
                        lines[i] = line.replace("} ]", f", color: '{color}' }} ]")
                    else:
                        lines[i] = line.replace(" },", f", color: '{color}' }},").replace(" }", f", color: '{color}' }}")

content = '\n'.join(lines)

# Now modify the DynamicIcon className
import re
content = re.sub(
    r'<DynamicIcon\s+icon=\{item\.icon\}\s+variant=\{item\.animation \|\| 'bounce'\}\s+className=\{`(.*?)`\}',
    r"<DynamicIcon\n                            icon={item.icon}\n                            variant={item.animation || 'bounce'}\n                            className={`\1 ${isActive ? 'text-white' : item.color || 'text-slate-500'} group-hover:scale-110 transition-transform`}",
    content,
    flags=re.DOTALL
)

with open('C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/client/src/components/layout/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
