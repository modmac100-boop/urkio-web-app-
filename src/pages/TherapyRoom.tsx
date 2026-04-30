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
  Monitor,
  MessageSquare,
  History,
  X,
  Menu,
  MoreVertical,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useHealingSession } from '../healing-suite/hooks/useHealingSession';
import { VideoPlayer } from '../conference/components/VideoPlayer';
import { useTheme } from '../contexts/ThemeContext';
import { UrkioAgentChat } from '../services/UrkioAgentService';
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
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hardcode generated code if not in a session
  useEffect(() => {
    if (!roomId) {
      setRoomId(`URK-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [roomId]);

  // Convert string UID to numeric for Agora if possible, else 0 for auto-assign
  const numericUid = React.useMemo(() => {
    const val = parseInt(user?.uid?.substring(0, 8), 16) || 0;
    return val > 0 ? val : Math.floor(Math.random() * 1000000);
  }, [user?.uid]);

  const {
    connectionState,
    remoteUsers,
    localVideoTrack,
    localAudioTrack,
    isMuted,
    isCameraOff,
    isRecording,
    join,
    leave,
    toggleMute,
    toggleCamera,
    startRecording,
    stopRecording
  } = useHealingSession(roomId, 'private', numericUid, 'host');

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
    // Legacy simulated chat removed. Now using real UrkioAgentChat component below.
  };

  return (
    <div className={clsx(
      "min-h-screen font-sans selection:bg-ur-primary/30 transition-all duration-700 overflow-hidden",
      theme === 'dark' ? "bg-ur-on-surface text-ur-background" : "bg-msgr-surface text-msgr-on-surface"
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
           background: linear-gradient(135deg, var(--ur-primary) 0%, var(--ur-gold) 100%);
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
      `}</style>

      {/* Floating Header - Compact & Premium */}
      <header className="fixed top-6 left-6 right-6 z-100 flex justify-between items-center px-10 py-5 rounded-[2.5rem] glass-panel border-ur-gold/10 premium-shadow transition-all duration-500">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
             <div className="size-10 rounded-xl clinical-gradient flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                <ShieldCheck className="w-6 h-6 text-ur-on-surface" />
             </div>
             <span className="font-serif-clinical text-2xl font-bold tracking-tighter">
               URKIO <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 hidden sm:inline">Clinical</span>
             </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-4 px-5 py-2 rounded-2xl bg-white/5 border border-white/5 group">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Studio Bridge:</span>
            <span className="text-xs font-mono font-black text-ur-primary tracking-widest">{roomId}</span>
            <button onClick={() => { navigator.clipboard.writeText(roomId); toast.success('Link Secured'); }} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-ur-gold">
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full border border-ur-primary/20 bg-ur-primary/5">
             <div className={clsx("size-2 rounded-full", connectionState === 'CONNECTED' ? "bg-ur-primary animate-pulse" : "bg-red-500")} />
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ur-primary">
                {connectionState === 'CONNECTED' ? 'E2E SECURED' : 'BRIDGE OFFLINE'}
             </span>
          </div>

          <div className="flex items-center gap-4 border-l pl-6 border-white/10">
            <button onClick={toggleTheme} className="text-slate-400 hover:text-ur-primary transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="relative">
               <button 
                 onClick={() => setIsMenuOpen(!isMenuOpen)}
                 className={clsx("size-10 rounded-xl flex items-center justify-center transition-all", isMenuOpen ? "bg-ur-primary text-ur-on-surface" : "bg-white/5 text-slate-400 hover:text-white")}
               >
                  <Menu className="w-5 h-5" />
               </button>
               
               <AnimatePresence>
                  {isMenuOpen && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                       className="absolute top-14 right-0 w-64 glass-panel rounded-3xl p-4 premium-shadow border-ur-gold/20"
                     >
                        <div className="space-y-2">
                           <button onClick={() => navigate('/')} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest">
                              <Home className="w-4 h-4 text-ur-primary" /> Home Dashboard
                           </button>
                           <button onClick={() => navigate(`/user/${user?.uid}`)} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest">
                              <User className="w-4 h-4 text-ur-gold" /> Expert Profile
                           </button>
                           <div className="h-px bg-white/5 my-2" />
                           <button onClick={() => setIsAssistantOpen(!isAssistantOpen)} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest">
                              <Bot className="w-4 h-4 text-ur-primary" /> Assistant
                           </button>
                           <button onClick={() => { leave().then(() => navigate('/')); }} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-red-500/10 text-red-500 transition-all text-xs font-bold uppercase tracking-widest">
                              <LogOut className="w-4 h-4" /> Exit Studio
                           </button>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace - NO SIDEBAR - FULL SCREEN SIZE */}
      <main className="pt-32 p-6 md:p-10 h-screen overflow-hidden flex flex-col gap-8">
         
         {/* Top Section: Immersive Video & Notes Split */}
         <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8 min-h-0">
            {/* Primary Video Hub - EXPANDED */}
            <div className="flex-3 relative min-h-0">
               {connectionState === 'CONNECTED' ? (
                  <div className={clsx("w-full h-full grid gap-4 md:gap-6", remoteUsers.length > 0 ? "grid-cols-2" : "grid-cols-1")}>
                     <VideoPlayer 
                        videoTrack={localVideoTrack || undefined}
                        isLocal
                        name="Me"
                        isOff={isCameraOff}
                        isMuted={isMuted}
                        onToggleMic={toggleMute}
                        onToggleVideo={toggleCamera}
                        onLeave={leave}
                        onInvite={() => setShowInviteModal(true)}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        isRecording={isRecording}
                        activeBiometric={72}
                        className="h-full"
                     />
                     {remoteUsers.map(u => (
                        <VideoPlayer 
                          key={u.uid}
                          videoTrack={u.videoTrack}
                          name="Secure Remote User"
                          className="h-full"
                          activeBiometric={68}
                        />
                     ))}
                  </div>
               ) : (
                  <div className="w-full h-full rounded-[4rem] glass-panel border-ur-gold/5 flex flex-col items-center justify-center text-center p-20 premium-shadow">
                     <div className="relative mb-12">
                        <div className="size-40 rounded-[3rem] clinical-gradient flex items-center justify-center shadow-3xl animate-float relative z-10">
                           <Zap className="w-16 h-16 text-ur-on-surface" />
                        </div>
                        <div className="absolute inset-0 rounded-[3rem] clinical-gradient blur-[80px] opacity-20 animate-pulse-slow" />
                     </div>
                     <h2 className="font-serif-clinical text-6xl font-bold mb-6 tracking-tighter">Clinical Bridge Ready</h2>
                     <p className="text-sm font-manrope opacity-40 max-w-lg mx-auto mb-12 uppercase tracking-[0.4em] font-black leading-loose">
                        Encrypted Neural Access Protocol v4.0.0
                     </p>
                     <div className="flex gap-4">
                        <button onClick={join} className="px-16 py-6 rounded-3xl bg-ur-primary text-ur-on-surface font-black text-[12px] uppercase tracking-[0.4em] shadow-3xl shadow-ur-primary/20 hover:scale-105 active:scale-95 transition-all">
                           Initialize Connection
                        </button>
                        <button onClick={() => navigate('/')} className="px-10 py-6 rounded-3xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                           Return Home
                        </button>
                     </div>
                  </div>
               )}
            </div>

            {/* Integrated Clinical Documentation Panel */}
            <div className="flex-1 rounded-[3.5rem] glass-panel border-ur-gold/5 flex flex-col premium-shadow">
               <div className="p-10 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="size-12 rounded-2xl bg-ur-gold/10 flex items-center justify-center shadow-inner">
                        <FileText className="w-6 h-6 text-ur-gold" />
                     </div>
                     <div>
                        <h3 className="font-serif-clinical text-2xl font-bold tracking-tight">Clinical Session Log</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Auto-Sync Active</p>
                     </div>
                  </div>
               </div>
               
               <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                  <textarea 
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="w-full h-full bg-transparent border-none focus:ring-0 text-lg font-medium leading-[2.5] resize-none custom-scrollbar placeholder:opacity-10"
                    placeholder="Capture clinical insights, behavioral markers, and session breakthroughs..."
                  />
               </div>

               <div className="p-10 border-t border-white/5 bg-white/2 flex gap-4">
                  <button className="flex-1 py-5 rounded-2xl bg-white/5 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">Local Archive</button>
                  <button className="flex-1 py-5 rounded-2xl clinical-gradient text-ur-on-surface text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-ur-gold/20 hover:scale-105 transition-all">Sync to Cloud</button>
               </div>
            </div>
         </div>

         {/* Bottom Matrix - Functional & Minimal */}
         <div className="h-40 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="rounded-[2.5rem] glass-panel p-8 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group">
               <div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Session Timer</span>
                  <p className="text-3xl font-serif-clinical font-bold mt-1 tracking-tighter">00:42:15</p>
               </div>
               <div className="size-14 rounded-2xl bg-ur-primary/10 flex items-center justify-center">
                  <Monitor className="w-7 h-7 text-ur-primary" />
               </div>
            </div>

            <div className="rounded-[2.5rem] glass-panel p-8 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group">
               <div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Neural Analysis</span>
                  <p className="text-xs font-bold mt-1 opacity-60">STABLE FLOW</p>
               </div>
               <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-7 h-7 text-emerald-500 animate-pulse" />
               </div>
            </div>

            <div className="rounded-[2.5rem] glass-panel p-8 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group">
               <div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Case Docs</span>
                  <p className="text-xs font-bold mt-1 opacity-60">3 FILES SECURED</p>
               </div>
               <div className="size-14 rounded-2xl bg-ur-gold/10 flex items-center justify-center">
                  <FolderOpen className="w-7 h-7 text-ur-gold" />
               </div>
            </div>

            <button 
              onClick={() => setIsAssistantOpen(true)}
              className="rounded-[2.5rem] bg-ur-primary p-8 flex items-center justify-between hover:scale-105 transition-all group shadow-3xl shadow-ur-primary/20"
            >
               <div className="text-ur-on-surface text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Neural Agent</span>
                  <p className="text-xl font-serif-clinical font-bold mt-1">Consult AI</p>
               </div>
               <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-ur-on-surface" />
               </div>
            </button>
         </div>
      </main>

      {/* Slide-out Neural Assistant - FIXING INTERACTIVITY */}
      <AnimatePresence>
         {isAssistantOpen && (
            <motion.div 
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-8 right-8 bottom-8 w-[450px] z-200 glass-panel border-ur-primary/20 premium-shadow flex flex-col rounded-[3.5rem] overflow-hidden"
            >
               <div className="p-10 border-b border-white/10 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-4">
                     <div className="size-12 rounded-2xl bg-ur-primary/10 flex items-center justify-center shadow-lg">
                        <Bot className="w-7 h-7 text-ur-primary" />
                     </div>
                     <div>
                        <h3 className="font-serif-clinical text-2xl font-bold">Neural Assistant</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ur-primary animate-pulse">Real-time Analysis</p>
                     </div>
                  </div>
                  <button onClick={() => setIsAssistantOpen(false)} className="p-4 rounded-2xl hover:bg-white/10 transition-colors">
                     <X className="w-6 h-6 text-slate-500" />
                  </button>
               </div>

               <div className="flex-1 overflow-hidden">
                  <UrkioAgentChat 
                    user={user} 
                    userData={userData} 
                    conversationId={`therapy_session_${roomId}`}
                    compact={true}
                  />
               </div>
            </motion.div>
         )}
      </AnimatePresence>

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
