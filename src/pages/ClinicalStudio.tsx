import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  User, 
  LogOut, 
  Settings,
  HelpCircle, 
  FolderOpen, 
  FileText, 
  Video, 
  Bot, 
  Archive, 
  Plus,
  ShieldCheck,
  Link as LinkIcon,
  VideoOff,
  Search as SearchIcon,
  Circle,
  Play,
  Square,
  Send,
  FileCode,
  FileMinus,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  Home,
  File as FileIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

export const ClinicalStudio: React.FC = () => {
  const navigate = useNavigate();
  const { actualTheme: theme, toggleTheme } = useTheme();
  const [isSecureLineActive, setIsSecureLineActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [notes, setNotes] = useState("Patient presents with recurring cognitive friction during focused tasks. Initial screening suggests...");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const navItems = [
    { icon: <FolderOpen className="w-5 h-5" />, label: 'Patient Case' },
    { icon: <FileText className="w-5 h-5" />, label: 'Clinical Docs' },
    { icon: <Video className="w-5 h-5" />, label: 'Session Capture', active: true },
    { icon: <Bot className="w-5 h-5" />, label: 'AI Assistant' },
    { icon: <Archive className="w-5 h-5" />, label: 'Archive' },
  ];

  return (
    <div className={clsx(
      "min-h-screen font-sans selection:bg-primary/30 transition-colors duration-500",
      theme === 'dark' ? "bg-[#050A0F] text-[#EDE8E4]" : "bg-[#F8F9FA] text-[#1A222B]"
    )}>
      {/* Background Gradient */}
      <div className={clsx(
        "fixed inset-0 pointer-events-none opacity-50",
        theme === 'dark' 
          ? "bg-[radial-gradient(circle_at_top_right,_#0F1C26,_#050A0F)]" 
          : "bg-[radial-gradient(circle_at_top_right,_#E2E8F0,_#F8F9FA)]"
      )} />

      {/* TopAppBar */}
      <header className={clsx(
        "fixed top-0 left-0 right-0 z-50 h-16 border-b flex justify-between items-center px-8 transition-all",
        theme === 'dark' 
          ? "bg-[#050A0F]/80 backdrop-blur-xl border-[#C8A96E]/20" 
          : "bg-white/80 backdrop-blur-xl border-slate-200"
      )}>
        <div className="flex items-center gap-12">
          <span className="font-serif text-xl font-bold tracking-tight bg-gradient-to-r from-[#30B0D0] to-[#C8A96E] bg-clip-text text-transparent">
            URKIO Clinical Studio
          </span>
          <div className="relative hidden md:block">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className={clsx(
                "border rounded-xl pl-10 pr-4 py-2 text-sm w-80 outline-none transition-all focus:ring-2",
                theme === 'dark' 
                  ? "bg-[#10161D] border-[#EDE8E4]/10 focus:border-[#C8A96E] focus:ring-[#C8A96E]/20" 
                  : "bg-slate-100 border-slate-200 focus:border-[#30B0D0] focus:ring-[#30B0D0]/20"
              )} 
              placeholder="Search Patient Records..." 
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={clsx(
            "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all",
            isSecureLineActive 
              ? "bg-[#30B0D0]/10 border-[#30B0D0]/30 text-[#30B0D0]" 
              : "bg-slate-500/10 border-slate-500/20 text-slate-500"
          )}>
            <div className={clsx(
              "w-2 h-2 rounded-full",
              isSecureLineActive ? "bg-[#30B0D0] animate-pulse" : "bg-slate-500"
            )} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isSecureLineActive ? 'Secure Line Active' : 'Offline'}
            </span>
          </div>

          <button 
            onClick={() => setIsSecureLineActive(!isSecureLineActive)}
            className={clsx(
              "px-5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg",
              isSecureLineActive 
                ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                : "bg-[#30B0D0] text-[#050A0F] hover:shadow-[#30B0D0]/20"
            )}
          >
            {isSecureLineActive ? 'End Session' : 'Initialize Session'}
          </button>

          <div className="flex items-center gap-4 border-l pl-6 border-slate-200 dark:border-[#C8A96E]/20 text-slate-400">
            <button onClick={toggleTheme} className="hover:text-[#30B0D0] transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Settings className="w-5 h-5 hover:text-[#30B0D0] cursor-pointer transition-colors" />
            <HelpCircle className="w-5 h-5 hover:text-[#30B0D0] cursor-pointer transition-colors" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#30B0D0] to-[#C8A96E] p-[1px] cursor-pointer">
              <div className="w-full h-full rounded-full bg-[#10161D] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <nav className={clsx(
        "flex flex-col h-screen fixed left-0 top-0 pt-20 pb-8 border-r z-40 transition-all",
        theme === 'dark' ? "bg-[#10161D] border-[#C8A96E]/15 w-64" : "bg-white border-slate-200 w-64 shadow-xl shadow-slate-200/50"
      )}>
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#30B0D0] to-[#C8A96E] flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-[#050A0F]" />
          </div>
          <div>
            <p className="font-bold text-sm">Expert Suite</p>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#C8A96E]" />
              <span className="text-[9px] uppercase tracking-tighter text-[#C8A96E] font-black">Verified Provider</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1">
          {navItems.map((item, idx) => (
            <button 
              key={idx}
              className={clsx(
                "py-3 px-6 flex items-center gap-3 transition-all relative group",
                item.active 
                  ? "bg-[#30B0D0]/10 text-[#30B0D0] border-l-4 border-[#C8A96E]" 
                  : "text-slate-400 hover:bg-slate-500/5 hover:text-[#30B0D0]"
              )}
            >
              {item.icon}
              <span className="text-sm font-semibold tracking-wide">{item.label}</span>
            </button>
          ))}

          {/* 3 LINES NAVIGATION REQUESTED */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-[#C8A96E]/10 flex flex-col gap-1">
            <p className="px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Navigation</p>
            <button 
              onClick={() => navigate('/')}
              className="py-3 px-6 flex items-center gap-3 text-slate-400 hover:bg-emerald-500/5 hover:text-emerald-500 transition-all"
            >
              <Home className="w-5 h-5" />
              <span className="text-sm font-semibold">Home Dashboard</span>
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="py-3 px-6 flex items-center gap-3 text-slate-400 hover:bg-blue-500/5 hover:text-blue-500 transition-all"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-semibold">Expert Profile</span>
            </button>
            <button 
              onClick={() => auth.signOut()}
              className="py-3 px-6 flex items-center gap-3 text-slate-400 hover:bg-red-500/5 hover:text-red-500 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-semibold">Exit Studio</span>
            </button>
          </div>
        </div>

        <div className="px-6 mb-6">
          <button className="w-full bg-[#30B0D0] text-[#050A0F] py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-[#30B0D0]/20 uppercase tracking-widest">
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="ml-64 pt-24 p-8 min-h-screen relative z-10">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8">
          
          {/* Top Section: Video & Docs */}
          <div className="col-span-12 lg:col-span-8 h-[500px]">
            <div className={clsx(
              "h-full rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden group border shadow-2xl transition-all",
              theme === 'dark' ? "bg-[#10161D]/60 backdrop-blur-xl border-[#C8A96E]/15" : "bg-white border-slate-200"
            )}>
              <div className="absolute inset-0 opacity-10">
                <img 
                  alt="Encrypted Network" 
                  className="w-full h-full object-cover grayscale" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDC0Jg4mYO5BR1m_pYRuch8pT9Wlimx0z8TAPBFdgZHD53xPAPUT9cllLc07bqKfYyIwIYMrDHEH486UbXSHaKvvZHeaHEkjAs5gZg9ONkHVKsjrs5GDiQm0XZnF1S6_E5HBjH79k_HNoakS30x6bVnChmcUj6FskVLzHf4nPbG2N6IlhOigCpoBklGLIojuLirb2u4qa9vwHkM-qZdMVvLPFB3BVK-x7OSy1d852Lvoosz6S1UTRqz_fqM_mAAhHoJ2U6T_n3fG68q"
                />
              </div>
              
              <div className="relative z-10 text-center">
                <div className={clsx(
                  "w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border transition-all",
                  isSecureLineActive ? "bg-[#30B0D0]/20 border-[#30B0D0]/40" : "bg-slate-500/10 border-slate-500/20"
                )}>
                  {isSecureLineActive ? (
                    <Video className="w-10 h-10 text-[#30B0D0] animate-pulse" />
                  ) : (
                    <VideoOff className="w-10 h-10 text-slate-500" />
                  )}
                </div>
                <h2 className="text-3xl font-serif font-bold mb-4">
                  {isSecureLineActive ? 'Connection Established' : 'Secure Line Offline'}
                </h2>
                <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium">
                  {isSecureLineActive 
                    ? 'Encrypted end-to-end bridge is active. Monitoring for clinical biomarkers...'
                    : 'Establish a 256-bit encrypted end-to-end bridge to begin the clinical session.'}
                </p>
                <button 
                  onClick={() => setIsSecureLineActive(!isSecureLineActive)}
                  className={clsx(
                    "px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 mx-auto transition-all active:scale-95 shadow-2xl",
                    isSecureLineActive 
                      ? "bg-red-500 text-white shadow-red-500/20" 
                      : "bg-[#30B0D0] text-[#050A0F] shadow-[#30B0D0]/20"
                  )}
                >
                  <LinkIcon className="w-4 h-4" />
                  {isSecureLineActive ? 'Sever Bridge' : 'Initialize Bridge'}
                </button>
              </div>

              <div className="absolute bottom-6 left-8 flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-[#050A0F]/50 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                  ID: <span className="text-[#30B0D0]">URK-882-QX</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-[#050A0F]/50 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                  LATENCY: <span className="text-[#30B0D0]">{isSecureLineActive ? '14ms' : '-- ms'}</span>
                </div>
              </div>

              <div className="absolute top-6 right-8">
                <button className="p-2 rounded-xl bg-black/20 text-white/50 hover:text-white transition-all">
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Clinical Documentation Panel */}
          <div className="col-span-12 lg:col-span-4 h-[500px]">
            <div className={clsx(
              "h-full rounded-[2.5rem] flex flex-col border shadow-2xl transition-all",
              theme === 'dark' ? "bg-[#10161D]/60 backdrop-blur-xl border-[#C8A96E]/15" : "bg-white border-slate-200"
            )}>
              <div className="p-8 border-b border-slate-200 dark:border-[#C8A96E]/10 flex justify-between items-center">
                <h3 className="text-xl font-serif font-bold italic">Clinical Notes</h3>
                <span className="text-[10px] font-black text-[#C8A96E] bg-[#C8A96E]/10 px-3 py-1 rounded-full uppercase tracking-widest">
                  Auto-Save: Active
                </span>
              </div>
              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Observation Matrix</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-full bg-transparent border-none focus:ring-0 text-sm font-medium leading-relaxed resize-none"
                  placeholder="Type '/' for AI commands (e.g., /summarize)..."
                />
              </div>
              <div className="p-6 border-t border-slate-200 dark:border-[#C8A96E]/10 bg-black/5 flex gap-3">
                <button className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 rounded-xl hover:bg-black/5 transition-all">Format</button>
                <button className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-[#30B0D0]/10 text-[#30B0D0] rounded-xl hover:bg-[#30B0D0]/20 transition-all">Export</button>
              </div>
            </div>
          </div>

          {/* Session Capture */}
          <div className="col-span-12 md:col-span-4 h-80">
            <div className={clsx(
              "h-full rounded-[2.5rem] p-8 flex flex-col border shadow-2xl transition-all",
              theme === 'dark' ? "bg-[#10161D]/60 backdrop-blur-xl border-[#C8A96E]/15" : "bg-white border-slate-200"
            )}>
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-lg font-serif font-bold">Session Capture</h4>
                <div className={clsx(
                  "size-3 rounded-full",
                  isRecording ? "bg-red-500 animate-ping" : "bg-slate-300"
                )} />
              </div>
              <div className="flex-1 flex flex-col justify-center gap-8">
                <div className={clsx(
                  "rounded-[2rem] p-6 border flex items-center justify-between",
                  theme === 'dark' ? "bg-[#050A0F] border-white/5" : "bg-slate-50 border-slate-200"
                )}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Duration</span>
                    <span className="text-3xl font-mono tracking-tight">{formatTime(sessionTime)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsRecording(!isRecording)}
                      className={clsx(
                        "size-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl",
                        isRecording 
                          ? "bg-amber-500 text-white shadow-amber-500/20" 
                          : "bg-[#30B0D0] text-[#050A0F] shadow-[#30B0D0]/20"
                      )}
                    >
                      {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-4 bg-[#30B0D0]/5 rounded-2xl border border-[#30B0D0]/10">
                  <ShieldCheck className="w-4 h-4 text-[#30B0D0]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AES-256 Encryption Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Transcription Assistant */}
          <div className="col-span-12 md:col-span-4 h-80">
            <div className={clsx(
              "h-full rounded-[2.5rem] flex flex-col border shadow-2xl transition-all",
              theme === 'dark' ? "bg-[#10161D]/60 backdrop-blur-xl border-[#C8A96E]/15" : "bg-white border-slate-200"
            )}>
              <div className="px-8 py-5 border-b border-slate-200 dark:border-[#C8A96E]/10 bg-black/5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">AI Transcription</span>
                <div className="flex gap-1.5">
                  <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                  <Circle className="w-2 h-2 fill-emerald-500/20 text-emerald-500/20" />
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="flex gap-4">
                  <div className="size-8 rounded-xl bg-[#30B0D0]/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-[#30B0D0]" />
                  </div>
                  <p className="text-xs text-slate-400 italic leading-relaxed mt-1">
                    Awaiting clinical input to begin real-time analysis and biomarker extraction...
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="relative">
                  <input 
                    className={clsx(
                      "w-full rounded-2xl py-4 pl-6 pr-12 text-xs outline-none transition-all",
                      theme === 'dark' ? "bg-[#050A0F] border border-white/5 focus:border-[#30B0D0]" : "bg-slate-100 border-slate-200 focus:border-[#30B0D0]"
                    )}
                    placeholder="Send message to AI..." 
                    type="text"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[#30B0D0] hover:scale-110 transition-transform">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Case Documents */}
          <div className="col-span-12 md:col-span-4 h-80">
            <div className={clsx(
              "h-full rounded-[2.5rem] p-8 flex flex-col border shadow-2xl transition-all",
              theme === 'dark' ? "bg-[#10161D]/60 backdrop-blur-xl border-[#C8A96E]/15" : "bg-white border-slate-200"
            )}>
              <h4 className="text-lg font-serif font-bold mb-6">Case Documents</h4>
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {[
                  { icon: <FileCode className="text-[#C8A96E]" />, name: 'Patient_Intake_Form.pdf', meta: '2.4 MB • Oct 12, 2023' },
                  { icon: <FileText className="text-[#30B0D0]" />, name: 'Neuro_Baseline_Oct.docs', meta: '1.1 MB • Oct 14, 2023' },
                ].map((doc, i) => (
                  <div key={i} className="group flex items-center justify-between p-4 rounded-2xl bg-black/5 border border-transparent hover:border-[#C8A96E]/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                        {React.cloneElement(doc.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{doc.name}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{doc.meta}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-[#30B0D0] transition-colors"><Maximize2 className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-red-400 transition-colors"><FileMinus className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full py-4 border-2 border-dashed border-[#C8A96E]/30 rounded-2xl text-[10px] font-black text-[#C8A96E] uppercase tracking-widest hover:bg-[#C8A96E]/5 transition-all">
                + Add Clinical Data
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(200, 169, 110, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 169, 110, 0.4);
        }
      `}</style>
    </div>
  );
};
