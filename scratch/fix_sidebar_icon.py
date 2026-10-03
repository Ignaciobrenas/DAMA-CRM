import re

with open('C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/client/src/components/layout/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("className={isActive ? 'text-white' : 'text-slate-700 dark:text-slate-400'}", "className={`transition-colors duration-300 ${isActive ? 'text-white' : item.color || 'text-slate-700 dark:text-slate-400'}`}")

with open('C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/client/src/components/layout/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
