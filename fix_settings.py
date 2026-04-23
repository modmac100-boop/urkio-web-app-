import re

with open('src/pages/Settings.tsx', 'r') as f:
    text = f.read()

# Fix 1
text = text.replace(
'''                              className="size-full rounded-4xl border-4 border-surface object-cover shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-4xl opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm"
              >              >''',
'''                              className="size-full rounded-4xl border-4 border-white dark:border-slate-800 object-cover shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                            <label
                              htmlFor="avatar-upload"
                              className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-4xl opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm"
                            >'''
)

# Fix 2
text = text.replace(
'''                        <div className="bg-linear-to-br from-violet-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden"> border-2 border-dashed border-white/20 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/30 flex items-center justify-center group">''',
'''                        <div className="relative h-48 w-full rounded-5xl overflow-hidden border-2 border-dashed border-white/20 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/30 flex items-center justify-center group">'''
)

# Fix 3
text = text.replace(
'''                      <div className="bento-card border border-border-light p-8 bg-surface">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">Profile Photo</h3>nal Specialty / Role</label>
                        <input ''',
'''                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Professional Specialty / Role</label>
                        <input '''
)

# Fix 4
text = text.replace(
'''                  {isExpert && (
            <div className="bento-card border border-primary/20 p-8 bg-primary/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />''',
'''                  {isExpert && (
                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl p-8 border border-white/20 dark:border-slate-800 shadow-xl mt-8">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />'''
)

# Fix 5
text = text.replace(
'''              {/* Help & Support Section */}
              {activeTab === 'help' && (
                <div className={clsx(
                  "group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border rounded-4xl p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4",800 shadow-xl space-y-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Help & Community Support
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-primary/5 rounded-4xl border border-primary/10 group cursor-pointer hover:bg-primary/10 transition-all">
                      <div className={clsx(
                      "shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105",10 transition-transform">
                        <HelpCircle className="w-6 h-6" />''',
'''              {/* Help & Support Section */}
              {activeTab === 'help' && (
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl p-8 border border-white/20 dark:border-slate-800 shadow-xl space-y-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Help & Community Support
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-primary/5 rounded-4xl border border-primary/10 group cursor-pointer hover:bg-primary/10 transition-all">
                      <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                        <HelpCircle className="w-6 h-6" />'''
)

# Fix 6
text = text.replace(
'''                <div className="bg-primary/5 dark:bg-primary/20 backdrop-blur-xl lg:bg-transparent p-6 lg:p-0 rounded-4xl lg:rounded-none border border-primary/20 lg:border-none flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="bento-card border border-border-light p-6 bg-surface">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Cover Photo</h3>
            <div className="relative group rounded-2xl overflow-hidden border border-border-light aspect-video bg-linear-to-br from-primary/20 to-accent/20">ces before leaving.</p>
                  </div>''',
'''                <div className="bg-primary/5 dark:bg-primary/20 backdrop-blur-xl lg:bg-transparent p-6 lg:p-0 rounded-4xl lg:rounded-none border border-primary/20 lg:border-none flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h4 className="font-black text-lg text-slate-900 dark:text-white">Unsaved Changes</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Remember to save your preferences before leaving.</p>
                  </div>'''
)


# Fix 7
text = text.replace(
'''                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${                   <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>''',
'''                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-white/20">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>'''
)

# Fix 8
text = text.replace(
'''                  <button 
                    onClick={() => navigate(`/user/${user.uid}`)}
                    className={clsx(
              "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",ver:bg-opacity-90 transition-all"
                  >''',
'''                  <button 
                    onClick={() => navigate(`/user/${user.uid}`)}
                    className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-white hover:bg-white hover:text-green-500 transition-all"
                  >'''
)

with open('src/pages/Settings.tsx', 'w') as f:
    f.write(text)

