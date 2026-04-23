import re

with open('src/pages/Agenda.tsx', 'r') as f:
    content = f.read()

replacement = """                                {t.postpone}
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleTransferSession(appt.id); }}
                                className="px-6 py-3 bg-amber-50 text-amber-600 border border-amber-500/20 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all hover:scale-105 active:scale-95 shadow-sm"
                             >
                                Transfer CM
                             </button>"""

content = re.sub(r'(\s*\{t\.postpone\}\s*</button>)', r'\1\n                             <button \n                                onClick={(e) => { e.stopPropagation(); handleTransferSession(appt.id); }}\n                                className=\"px-6 py-3 bg-amber-50 text-amber-600 border border-amber-500/20 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all hover:scale-105 active:scale-95 shadow-sm\"\n                             >\n                                Transfer CM\n                             </button>', content)

with open('src/pages/Agenda.tsx', 'w') as f:
    f.write(content)
