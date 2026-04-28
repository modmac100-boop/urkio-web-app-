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
  File as FileIcon,
  Sparkles,
  Zap,
  Activity,
  ChevronRight,
  Monitor,
  Copy,
  Info,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

export const ClinicalStudio: React.FC = () => {
  const navigate = useNavigate();
  const { actualTheme: theme, toggleTheme } = useTheme();
  const [isSecureLineActive, setIsSecureLineActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [notes, setNotes] = useState("Patient presents with recurring cognitive friction during focused tasks. Initial screening suggests...");
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'AI', text: 'Neural Diagnostic Engine Standby.', time: '00:00' }
  ]);

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

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      sender: 'ME',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
  };

  return (
    <div className={clsx(
      "min-h-screen font-sans selection:bg-[#30B0D0]/30 transition-all duration-700 overflow-hidden",
      theme === 'dark' ? "bg-[#050A0F] text-[#EDE8E4]" : "bg-[#F8F9FA] text-[#1A222B]"
    )}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,ital,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&family=Noto+Serif+SC:wght@200..900&display=swap');
        
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(200, 169, 110, 0.2); border-radius: 10px; }
        .font-serif-clinical { font-family: 'Newsreader', serif; }
        .font-manrope { font-family: 'Manrope', sans-serif; }
        
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .premium-shadow {
           box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .clinical-gradient {
           background: linear-gradient(135deg, #30B0D0 0%, #C8A96E 100%);
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
      `}</style>

      {/* Floating Header */}
      <header className="fixed top-6 left-6 right-6 z-50 flex justify-between items-center px-10 py-5 rounded-[2rem] glass-panel border-[#C8A96E]/10 premium-shadow">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
             <div className="size-10 rounded-xl clinical-gradient flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                <Zap className="w-6 h-6 text-[#050A0F]" />
             </div>
             <span className="font-serif-clinical text-2xl font-bold tracking-tighter">
               URKIO <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">Clinical Studio</span>
             </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-4 px-5 py-2 rounded-2xl bg-white/5 border border-white/5">
            <SearchIcon className="w-4 h-4 text-slate-500" />
            <input className="bg-transparent border-none focus:ring-0 text-xs w-64 font-medium" placeholder="Search Encrypted Vault..." />
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#30B0D0]/20 bg-[#30B0D0]/5">
             <div className={clsx("size-2 rounded-full", isSecureLineActive ? "bg-[#30B0D0] animate-pulse" : "bg-red-500")} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#30B0D0]">
                {isSecureLineActive ? 'Neural Bridge Active' : 'Bridge Offline'}
             </span>
          </div>

          <div className="flex items-center gap-6 border-l pl-8 border-white/10">
            <button onClick={toggleTheme} className="text-slate-400 hover:text-[#30B0D0] transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-2xl p-[1px] bg-gradient-to-tr from-[#30B0D0] to-[#C8A96E]">
               <div className="w-full h-full rounded-2xl bg-[#050A0F] flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* MINIMAL 3-LINE SIDEBAR REQUESTED */}
      <nav className="fixed left-6 top-32 bottom-6 w-20 z-50 flex flex-col items-center py-10 rounded-[2.5rem] glass-panel border-[#C8A96E]/10 premium-shadow">
         <div className="flex flex-col gap-8 flex-1">
            <button onClick={() => navigate('/')} className="p-4 rounded-2xl text-slate-400 hover:text-[#30B0D0] hover:bg-white/5 transition-all group relative">
               <Home className="w-6 h-6" />
               <span className="absolute left-24 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Home</span>
            </button>
            <button onClick={() => navigate('/settings')} className="p-4 rounded-2xl text-slate-400 hover:text-[#C8A96E] hover:bg-white/5 transition-all group relative">
               <User className="w-6 h-6" />
               <span className="absolute left-24 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Profile</span>
            </button>
            <button onClick={() => auth.signOut()} className="p-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-white/5 transition-all group relative">
               <LogOut className="w-6 h-6" />
               <span className="absolute left-24 px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Exit</span>
            </button>
         </div>
         
         <div className="flex flex-col gap-6">
            <div className="size-1 bg-[#C8A96E]/20 rounded-full mx-auto" />
            <button className="p-4 rounded-2xl text-slate-600 hover:text-white transition-colors">
               <Settings className="w-6 h-6" />
            </button>
         </div>
      </nav>

      {/* Studio Grid Workspace */}
      <main className="ml-32 pt-32 p-10 h-screen overflow-hidden grid grid-cols-12 gap-8">
         
         {/* Left: Project & Case Overview */}
         <div className="col-span-12 lg:col-span-3 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2 pb-10">
            <div className="rounded-[2.5rem] glass-panel p-8 premium-shadow">
               <h3 className="font-serif-clinical text-xl font-bold mb-6">Patient Dossier</h3>
               <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Current Active Case</p>
                     <p className="font-bold">Alpha-7 Client Session</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Access Level</p>
                        <p className="font-bold text-[#C8A96E]">Lvl 4 Specialist</p>
                     </div>
                     <ShieldCheck className="w-6 h-6 text-[#C8A96E]" />
                  </div>
               </div>
            </div>

            <div className="rounded-[2.5rem] glass-panel p-8 flex-1 premium-shadow">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-serif-clinical text-xl font-bold">Case Documents</h3>
                  <button className="text-[#30B0D0] hover:scale-110 transition-transform"><Plus className="w-5 h-5" /></button>
               </div>
               <div className="space-y-4">
                  {[
                     { n: 'intake_report.pdf', d: 'Secure PDF', c: '#30B0D0' },
                     { n: 'neuro_scan.vox', d: 'Volumetric Data', c: '#C8A96E' },
                     { n: 'session_notes_01.txt', d: 'Encrypted Text', c: '#30B0D0' }
                  ].map((doc, i) => (
                     <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-black/10 border border-transparent hover:border-white/5 transition-all cursor-pointer group">
                        <div className={clsx("size-10 rounded-xl flex items-center justify-center shadow-lg", `bg-[${doc.c}]/10 text-[${doc.c}]`)}>
                           <FileCode className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                           <p className="text-xs font-bold">{doc.n}</p>
                           <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-0.5">{doc.d}</p>
                        </div>
                        <Maximize2 className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-all" />
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Center: Live Studio Bridge */}
         <div className="col-span-12 lg:col-span-6 flex flex-col gap-8">
            <div className="flex-1 rounded-[3.5rem] glass-panel border-[#C8A96E]/5 relative overflow-hidden group premium-shadow">
               <AnimatePresence mode="wait">
                  {isSecureLineActive ? (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative">
                        <div className="absolute inset-0 bg-[#0A0F14] flex flex-col items-center justify-center">
                           <div className="size-48 rounded-full border-4 border-dashed border-[#30B0D0]/20 animate-spin-slow flex items-center justify-center">
                              <div className="size-32 rounded-[2rem] clinical-gradient flex items-center justify-center animate-pulse">
                                 <Monitor className="w-12 h-12 text-[#050A0F]" />
                              </div>
                           </div>
                           <p className="mt-8 text-sm font-black uppercase tracking-[0.4em] text-[#30B0D0]">Secure Line Visualized</p>
                        </div>
                        
                        <div className="absolute top-10 right-10 flex gap-4">
                           <button className="px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">Toggle XR-View</button>
                        </div>

                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30 px-10 py-5 rounded-[2.5rem] bg-black/40 backdrop-blur-2xl border border-white/10 shadow-3xl">
                           <button onClick={() => setIsRecording(!isRecording)} className={clsx("size-14 rounded-2xl flex items-center justify-center transition-all", isRecording ? "bg-red-500/20 text-red-500 border-red-500" : "bg-white/5 text-white")}>
                              {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                           </button>
                           <button onClick={() => setIsSecureLineActive(false)} className="px-10 py-4 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-600/40">
                              Sever Bridge
                           </button>
                           <button className="size-14 rounded-2xl bg-white/5 text-white flex items-center justify-center">
                              <Maximize2 className="w-6 h-6" />
                           </button>
                        </div>
                     </motion.div>
                  ) : (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full flex flex-col items-center justify-center text-center p-20">
                        <div className="relative mb-12">
                           <div className="size-32 rounded-[2.5rem] clinical-gradient flex items-center justify-center shadow-3xl animate-float relative z-10">
                              <Zap className="w-12 h-12 text-[#050A0F]" />
                           </div>
                           <div className="absolute inset-0 rounded-[2.5rem] clinical-gradient blur-3xl opacity-20" />
                        </div>
                        <h2 className="font-serif-clinical text-5xl font-bold mb-6 tracking-tighter">Clinical Perimeter Ready</h2>
                        <p className="text-sm font-manrope opacity-40 max-w-lg mx-auto mb-12 uppercase tracking-[0.3em] font-black">
                           XR-Studio v4.0 is waiting for biometric sync initialization.
                        </p>
                        <button onClick={() => setIsSecureLineActive(true)} className="px-16 py-6 rounded-3xl bg-[#30B0D0] text-[#050A0F] font-black text-[11px] uppercase tracking-[0.3em] shadow-3xl shadow-[#30B0D0]/20 hover:scale-105 active:scale-95 transition-all">
                           Initialize Secure Bridge
                        </button>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* Bottom Widgets */}
            <div className="h-48 grid grid-cols-2 gap-8">
               <div className="rounded-[2.5rem] glass-panel p-8 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                  <div>
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Session Duration</span>
                     <p className="text-4xl font-serif-clinical font-bold mt-2">{formatTime(sessionTime)}</p>
                  </div>
                  <div className="size-14 rounded-2xl bg-[#30B0D0]/10 flex items-center justify-center">
                     <Activity className="w-8 h-8 text-[#30B0D0] animate-pulse" />
                  </div>
               </div>
               <div className="rounded-[2.5rem] glass-panel p-8 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                  <div>
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Biometric Score</span>
                     <p className="text-4xl font-serif-clinical font-bold mt-2">98.4</p>
                  </div>
                  <div className="size-14 rounded-2xl bg-[#C8A96E]/10 flex items-center justify-center">
                     <Sparkles className="w-8 h-8 text-[#C8A96E]" />
                  </div>
               </div>
            </div>
         </div>

         {/* Right: Operational Controls */}
         <div className="col-span-12 lg:col-span-3 flex flex-col gap-8 pb-10">
            <div className="flex-1 rounded-[3.5rem] glass-panel border-[#C8A96E]/5 flex flex-col premium-shadow">
               <div className="p-10 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-serif-clinical text-2xl font-bold tracking-tight">Observations</h3>
                  <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                     <FileText className="w-5 h-5 text-[#C8A96E]" />
                  </div>
               </div>
               <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-full bg-transparent border-none focus:ring-0 text-base font-medium leading-[2] resize-none placeholder:opacity-20"
                    placeholder="Enter clinical notes..."
                  />
               </div>
            </div>

            <div className="h-[300px] rounded-[3.5rem] glass-panel border-[#C8A96E]/5 flex flex-col premium-shadow">
               <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Neural Assistant</span>
                  <div className="size-2 bg-[#30B0D0] rounded-full animate-pulse" />
               </div>
               <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-4">
                  {chatMessages.map((m, i) => (
                     <div key={i} className={clsx("flex flex-col gap-1", m.sender === 'ME' ? "items-end" : "items-start")}>
                        <div className={clsx(
                           "px-4 py-2 rounded-xl text-[11px] font-medium",
                           m.sender === 'ME' ? "bg-[#30B0D0] text-[#050A0F] rounded-tr-none" : "bg-white/5 text-white/80 rounded-tl-none"
                        )}>
                           {m.text}
                        </div>
                     </div>
                  ))}
               </div>
               <div className="p-8 pt-0">
                  <div className="relative">
                     <input 
                       className="w-full bg-white/5 border border-white/10 rounded-[1.2rem] py-3 px-5 text-[11px] font-medium outline-none focus:border-[#30B0D0]" 
                       placeholder="Consult AI..." 
                       value={chatInput}
                       onChange={e => setChatInput(e.target.value)}
                       onKeyPress={e => e.key === 'Enter' && handleSendMessage(e)}
                     />
                  </div>
               </div>
            </div>
         </div>

      </main>
    </div>
  );
};
