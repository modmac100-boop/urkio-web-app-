import os
import glob

replacements = {
    'bg-gradient-to-r': 'bg-linear-to-r',
    'bg-gradient-to-br': 'bg-linear-to-br',
    'bg-gradient-to-tr': 'bg-linear-to-tr',
    'bg-gradient-to-t': 'bg-linear-to-t',
    'flex-shrink-0': 'shrink-0',
    'rounded-[2rem]': 'rounded-4xl',
    'rounded-[1.5rem]': 'rounded-3xl',
    'tracking-[0.1em]': 'tracking-widest',
    'z-[100]': 'z-100',
    'z-[200]': 'z-200',
    'z-[300]': 'z-300',
    'z-[9999]': 'z-9999',
    'z-[10000]': 'z-10000',
    '!py-2': 'py-2!',
    'w-[40rem]': 'w-160',
    'h-[40rem]': 'h-160',
    'w-[30rem]': 'w-120',
    'h-[30rem]': 'h-120',
    'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]': 'bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))]',
}

def process_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    original_content = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if file_path.endswith('Agenda.tsx'):
        agenda_replacements = {
            'to-[#0a66c2]': 'to-msgr-primary-container',
            'hover:bg-[#0a66c2]': 'hover:bg-msgr-primary-container',
            'bg-[#f4f3f0]': 'bg-msgr-surface-container-low',
            'bg-[#f4f3f0]/50': 'bg-msgr-surface-container-low/50',
            'bg-[#f4f3f0]/30': 'bg-msgr-surface-container-low/30',
            'bg-[#f4f3f0]/20': 'bg-msgr-surface-container-low/20',
            'hover:bg-[#f4f3f0]/50': 'hover:bg-msgr-surface-container-low/50',
            'text-[#006d3c]': 'text-ur-secondary',
            'bg-[#006d3c]': 'bg-ur-secondary',
            'border-t-[#006d3c]': 'border-t-ur-secondary',
            'bg-[#006d3c]/10': 'bg-ur-secondary/10',
            'group-hover:bg-[#006d3c]': 'group-hover:bg-ur-secondary',
            'shadow-[#006d3c]/10': 'shadow-ur-secondary/10',
            'leading-[2]': 'leading-loose',
            'text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-[8px]': 'text-[10px] text-zinc-400 font-bold uppercase tracking-widest',
        }
        for old, new in agenda_replacements.items():
            content = content.replace(old, new)
        content = content.replace('text-[8px]', 'text-[10px]')

    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Updated {file_path}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            process_file(os.path.join(root, file))

for root, dirs, files in os.walk('temp_designs'):
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))

print("Total global replacements finished!")
