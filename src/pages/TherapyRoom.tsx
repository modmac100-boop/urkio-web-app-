import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
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
  Mic,
  MicOff,
  Copy,
  Share2,
  Sparkles,
  Zap,
  Activity,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useHealingSession } from '../healing-suite/hooks/useHealingSession';
import { VideoTile } from '../healing-suite/components/VideoTile';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { SessionInviteModal } from '../components/messaging/SessionInviteModal';

export function TherapyRoom({ user, userData }: { user: any; userData: any }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { actualTheme: theme, toggleTheme } = useTheme();
  const { roomId: urlRoomId } = useParams();
  
  const [roomId, setRoomId] = useState<string>(urlRoomId || '');
  const [sessionNotes, setSessionNotes] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'AI', text: 'Clinical Neural Bridge Established. Awaiting input.', time: '00:00' }
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('capture');

  // Hardcode generated code if not in a session
  useEffect(() => {
    if (!roomId) {
      setRoomId(`URK-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [roomId]);

  const {
    connectionState,
    remoteUsers,
    localVideoTrack,
    localAudioTrack,
    isMuted,
    isCameraOff,
    isRecording,
    isZenMode,
    join,
    leave,
    toggleMute,
    toggleCamera,
    toggleZenMode,
    startRecording,
    stopRecording
  } = useHealingSession(roomId, 'private', 0, 'host');

  const isAdminOrExpert = user && (
    ['admin', 'management', 'founder'].includes(userData?.role) || 
    ['specialist', 'expert', 'verifiedexpert', 'psychologist', 'practitioner'].includes(userData?.role || '') || 
    ['urkio@urkio.com', 'sameralhalaki@gmail.com'].includes(userData?.email?.toLowerCase()) || 
    ['urkio@urkio.com', 'sameralhalaki@gmail.com'].includes(user?.email?.toLowerCase())
  );

  useEffect(() => {
    if (!urlRoomId && !isAdminOrExpert) {
      toast.error('Unauthorized access to Private Clinical Studio.');
      navigate('/');
    }
  }, [isAdminOrExpert, navigate, urlRoomId]);

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

        .animate-pulse-slow {
           animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      {/* Floating Header */}
      <header className="fixed top-6 left-6 right-6 z-50 flex justify-between items-center px-10 py-5 rounded-[2rem] glass-panel border-[#C8A96E]/10 premium-shadow">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
             <div className="size-10 rounded-xl clinical-gradient flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                <ShieldCheck className="w-6 h-6 text-[#050A0F]" />
             </div>
             <span className="font-serif-clinical text-2xl font-bold tracking-tighter">
               URKIO <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">Clinical Studio</span>
             </span>
          </div>
          
          <div className="hidden md:flex items-center gap-4 px-5 py-2 rounded-2xl bg-white/5 border border-white/5 group">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Active Case Bridge:</span>
            <span className="text-xs font-mono font-black text-[#30B0D0] tracking-widest">{roomId}</span>
            <button onClick={() => { navigator.clipboard.writeText(roomId); toast.success('Link Secured'); }} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#C8A96E]">
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#30B0D0]/20 bg-[#30B0D0]/5">
             <div className={clsx("size-2 rounded-full", connectionState === 'CONNECTED' ? "bg-[#30B0D0] animate-pulse" : "bg-red-500")} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#30B0D0]">
                {connectionState === 'CONNECTED' ? 'E2E SECURED' : 'BRIDGE OFFLINE'}
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
               <span className="absolute left-24 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Home Page</span>
            </button>
            <button onClick={() => navigate(`/user/${user?.uid}`)} className="p-4 rounded-2xl text-slate-400 hover:text-[#C8A96E] hover:bg-white/5 transition-all group relative">
               <User className="w-6 h-6" />
               <span className="absolute left-24 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Expert Profile</span>
            </button>
            <button onClick={() => leave().then(() => navigate('/'))} className="p-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-white/5 transition-all group relative">
               <LogOut className="w-6 h-6" />
               <span className="absolute left-24 px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Exit Studio</span>
            </button>
         </div>
         
         <div className="flex flex-col gap-6">
            <div className="size-1 bg-[#C8A96E]/20 rounded-full mx-auto" />
            <button className="p-4 rounded-2xl text-slate-600 hover:text-white transition-colors">
               <Settings className="w-6 h-6" />
            </button>
         </div>
      </nav>

      {/* Main Studio Workspace */}
      <main className="ml-32 pt-32 p-10 h-screen overflow-hidden flex gap-10">
         
         {/* Center: Video Intelligence Hub */}
         <div className="flex-1 flex flex-col gap-8">
            <div className="flex-1 rounded-[3.5rem] glass-panel border-[#C8A96E]/5 relative overflow-hidden group premium-shadow">
               <AnimatePresence mode="wait">
                  {connectionState === 'CONNECTED' ? (
                     <motion.div 
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }}
                       className="w-full h-full relative"
                     >
                        <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                           <div className="relative rounded-[2.5rem] overflow-hidden bg-[#0A0F14] border border-white/5 shadow-2xl">
                              <VideoTile videoTrack={localVideoTrack || undefined} isLocal name="Expert Perspective" isOff={isCameraOff} className="w-full h-full" />
                              <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                                 <span className="size-2 rounded-full bg-[#30B0D0] animate-pulse" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">You (Practitioner)</span>
                              </div>
                           </div>
                           {remoteUsers.length > 0 ? (
                              remoteUsers.map(u => (
                                 <div key={u.uid} className="relative rounded-[2.5rem] overflow-hidden bg-[#0A0F14] border border-white/5 shadow-2xl">
                                    <VideoTile videoTrack={u.videoTrack} name="Client" className="w-full h-full" />
                                    <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                                       <span className="size-2 rounded-full bg-[#C8A96E] animate-pulse" />
                                       <span className="text-[9px] font-black uppercase tracking-widest">Secure Client Stream</span>
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <div className="relative rounded-[2.5rem] overflow-hidden bg-[#0A0F14]/40 border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-10">
                                 <div className="size-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-6">
                                    <Plus className="w-8 h-8 text-[#C8A96E]" />
                                 </div>
                                 <h4 className="font-serif-clinical text-xl font-bold mb-2">Awaiting Participant</h4>
                                 <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mb-8">Share the XR-Bridge code to initialize</p>
                                 <button onClick={() => setShowInviteModal(true)} className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                                    Invite Participant
                                 </button>
                              </div>
                           )}
                        </div>

                        {/* Intelligence Overlay (Bottom Bar) */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30 px-10 py-5 rounded-[2.5rem] bg-black/40 backdrop-blur-2xl border border-white/10 shadow-3xl opacity-0 group-hover:opacity-100 transition-all duration-500">
                           <button onClick={toggleMute} className={clsx("size-14 rounded-2xl flex items-center justify-center transition-all", isMuted ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white hover:bg-white/10")}>
                              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                           </button>
                           <button onClick={toggleCamera} className={clsx("size-14 rounded-2xl flex items-center justify-center transition-all", isCameraOff ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white hover:bg-white/10")}>
                              {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                           </button>
                           
                           <div className="h-10 w-[1px] bg-white/10 mx-2" />

                           <button onClick={leave} className="px-10 py-4 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all">
                              End Bridge
                           </button>

                           <div className="h-10 w-[1px] bg-white/10 mx-2" />

                           <button onClick={() => navigate('/')} className="size-14 rounded-2xl bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                              <Maximize2 className="w-6 h-6" />
                           </button>
                        </div>
                     </motion.div>
                  ) : (
                     <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="w-full h-full flex flex-col items-center justify-center text-center p-20"
                     >
                        <div className="relative mb-12">
                           <div className="size-32 rounded-[2.5rem] clinical-gradient flex items-center justify-center shadow-3xl animate-float relative z-10">
                              <Zap className="w-12 h-12 text-[#050A0F]" />
                           </div>
                           <div className="absolute inset-0 rounded-[2.5rem] clinical-gradient blur-3xl opacity-20 animate-pulse-slow" />
                        </div>
                        <h2 className="font-serif-clinical text-5xl font-bold mb-6 tracking-tighter">Clinical Environment Ready</h2>
                        <p className="text-sm font-manrope opacity-40 max-w-lg mx-auto mb-12 leading-loose uppercase tracking-[0.3em] font-black">
                           Secure biometric bridge ready for initialization. Established perimeter: XR-9 Security.
                        </p>
                        <button onClick={join} className="px-16 py-6 rounded-3xl bg-[#30B0D0] text-[#050A0F] font-black text-[11px] uppercase tracking-[0.3em] shadow-3xl shadow-[#30B0D0]/20 hover:scale-105 active:scale-95 transition-all">
                           Initialize Secure Bridge
                        </button>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* Bottom Bento: Stats & Insights */}
            <div className="h-64 grid grid-cols-3 gap-8">
               <div className="rounded-[2.5rem] glass-panel p-8 flex flex-col justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Heart Rate Sync</span>
                     <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                  </div>
                  <div>
                     <p className="text-4xl font-serif-clinical font-bold">72 <span className="text-sm opacity-40">BPM</span></p>
                     <p className="text-[9px] font-black uppercase tracking-widest text-[#30B0D0] mt-2">Optimal Variance</p>
                  </div>
               </div>
               <div className="rounded-[2.5rem] glass-panel p-8 flex flex-col justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Session Timer</span>
                     <Circle className="w-4 h-4 text-[#30B0D0] fill-current" />
                  </div>
                  <div>
                     <p className="text-4xl font-serif-clinical font-bold">42:15</p>
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-2">Time Remaining</p>
                  </div>
               </div>
               <div className="rounded-[2.5rem] glass-panel p-8 flex flex-col justify-between hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                     <Sparkles className="w-5 h-5 text-[#C8A96E]" />
                  </div>
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">AI Insight</span>
                     <p className="text-sm font-medium leading-relaxed mt-2 italic">"Client shows positive neuro-receptive response to current topic."</p>
                  </div>
                  <button className="text-[9px] font-black uppercase tracking-widest text-[#C8A96E] flex items-center gap-2 group-hover:gap-4 transition-all">
                     View Deep Analysis <ChevronRight className="w-3 h-3" />
                  </button>
               </div>
            </div>
         </div>

         {/* Right: Operational Data Panel */}
         <div className="w-[450px] flex flex-col gap-8">
            
            {/* Case Documentation */}
            <div className="flex-1 rounded-[3.5rem] glass-panel border-[#C8A96E]/5 flex flex-col premium-shadow">
               <div className="p-10 border-b border-white/5 flex justify-between items-center">
                  <div>
                     <h3 className="font-serif-clinical text-2xl font-bold tracking-tight">Clinical Observations</h3>
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">Direct Encrypted Entry</p>
                  </div>
                  <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                     <FileText className="w-6 h-6 text-[#C8A96E]" />
                  </div>
               </div>
               
               <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                  <div className="mb-8 flex items-center gap-3">
                     <div className="size-8 rounded-lg bg-[#30B0D0]/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-[#30B0D0]" />
                     </div>
                     <p className="text-[11px] font-black uppercase tracking-widest opacity-60 italic">Live Transcription Active...</p>
                  </div>
                  
                  <textarea 
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="w-full h-full bg-transparent border-none focus:ring-0 text-base font-medium leading-[2] resize-none custom-scrollbar placeholder:opacity-20"
                    placeholder="Capture subjective observations and clinical insights here. Data is synced to the vault every 30 seconds."
                  />
               </div>

               <div className="p-10 border-t border-white/5 bg-white/5 grid grid-cols-2 gap-4">
                  <button className="py-4 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Save to Vault</button>
                  <button className="py-4 rounded-2xl clinical-gradient text-[#050A0F] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#C8A96E]/20 hover:scale-105 transition-all">Finalize Case</button>
               </div>
            </div>

            {/* AI Assistant Chat Panel */}
            <div className="h-[350px] rounded-[3.5rem] glass-panel border-[#C8A96E]/5 flex flex-col premium-shadow">
               <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Monitor className="w-4 h-4 text-[#30B0D0]" />
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Neural Assistant</span>
                  </div>
                  <div className="flex gap-1">
                     <div className="size-1 bg-[#30B0D0] rounded-full" />
                     <div className="size-1 bg-[#30B0D0]/40 rounded-full" />
                  </div>
               </div>
               
               <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
                  {chatMessages.map((m, i) => (
                     <div key={i} className={clsx("flex flex-col gap-1", m.sender === 'ME' ? "items-end" : "items-start")}>
                        <div className={clsx(
                           "px-5 py-3 rounded-2xl text-xs font-medium leading-relaxed",
                           m.sender === 'ME' ? "bg-[#30B0D0] text-[#050A0F] rounded-tr-none" : "bg-white/5 text-white/80 rounded-tl-none border border-white/5"
                        )}>
                           {m.text}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-20 px-2">{m.time}</span>
                     </div>
                  ))}
               </div>

               <div className="p-8 pt-0">
                  <div className="relative group">
                     <input 
                       className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-4 px-6 text-sm font-medium outline-none focus:border-[#30B0D0] transition-all group-hover:bg-white/10" 
                       placeholder="Consult Intelligence Engine..." 
                       value={chatInput}
                       onChange={e => setChatInput(e.target.value)}
                       onKeyPress={e => e.key === 'Enter' && handleSendMessage(e)}
                     />
                     <button onClick={() => handleSendMessage()} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#30B0D0] hover:scale-125 transition-transform">
                        <Send className="w-5 h-5" />
                     </button>
                  </div>
               </div>
            </div>

         </div>
      </main>

      <SessionInviteModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={roomId}
        joinUrl={`${window.location.origin}/therapy-room/${roomId}`}
        sessionType="therapy"
        sessionTitle="Urkio Private Clinical Session"
      />
    </div>
  );
}

export function useUrkioChat(userId: string) {
  return { userId };
}
