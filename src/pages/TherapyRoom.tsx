import React, { useState, useEffect } from 'react';
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
  Share2
} from 'lucide-react';
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
    { sender: 'AI', text: 'Transcription Assistant ready.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Hardcode generated code if not in a session
  useEffect(() => {
    if (!roomId) {
      setRoomId(`XRQ-${Math.floor(1000 + Math.random() * 9000)}`);
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
      toast.error('Unauthorized access to Private Therapy Room.');
      navigate('/');
    }
  }, [isAdminOrExpert, navigate, urlRoomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      sender: 'ME',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
  };

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
      "min-h-screen font-sans selection:bg-primary/30 transition-colors duration-500 overflow-hidden",
      theme === 'dark' ? "bg-[#050A0F] text-[#EDE8E4]" : "bg-[#F8F9FA] text-[#1A222B]"
    )}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(200, 169, 110, 0.2); border-radius: 10px; }
        .font-serif-clinical { font-family: 'Noto Serif SC', serif; }
      `}</style>

      {/* Header */}
      <header className={clsx(
        "fixed top-0 left-0 right-0 z-50 h-16 border-b flex justify-between items-center px-8 transition-all",
        theme === 'dark' ? "bg-[#050A0F]/80 backdrop-blur-xl border-[#C8A96E]/20" : "bg-white/80 backdrop-blur-xl border-slate-200"
      )}>
        <div className="flex items-center gap-12">
          <span className="font-serif-clinical text-xl font-bold tracking-tight bg-gradient-to-r from-[#30B0D0] to-[#C8A96E] bg-clip-text text-transparent cursor-pointer" onClick={() => navigate('/')}>
            URKIO <span className="text-[10px] uppercase tracking-widest ml-2 opacity-60">Clinical Room</span>
          </span>
          <div className="flex items-center gap-4 px-4 py-1.5 rounded-full bg-black/5 border border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Code:</span>
            <span className="text-xs font-mono font-bold text-[#30B0D0]">{roomId}</span>
            <button onClick={() => { navigator.clipboard.writeText(roomId); toast.success('Copied!'); }} className="hover:text-[#30B0D0] transition-colors">
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={clsx(
            "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all",
            connectionState === 'CONNECTED' ? "bg-[#30B0D0]/10 border-[#30B0D0]/30 text-[#30B0D0]" : "bg-slate-500/10 border-slate-500/20 text-slate-500"
          )}>
            <div className={clsx("w-2 h-2 rounded-full", connectionState === 'CONNECTED' ? "bg-[#30B0D0] animate-pulse" : "bg-slate-500")} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{connectionState === 'CONNECTED' ? 'Secure Line Active' : 'Offline'}</span>
          </div>

          <button 
            onClick={() => connectionState === 'CONNECTED' ? leave() : join()}
            className={clsx(
              "px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg",
              connectionState === 'CONNECTED' ? "bg-red-500 text-white shadow-red-500/20" : "bg-[#30B0D0] text-[#050A0F] shadow-[#30B0D0]/20"
            )}
          >
            {connectionState === 'CONNECTED' ? 'End Session' : 'Initialize Bridge'}
          </button>

          <div className="flex items-center gap-4 border-l pl-6 border-slate-200 dark:border-[#C8A96E]/20 text-slate-400">
            <button onClick={toggleTheme} className="hover:text-[#30B0D0] transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Settings className="w-5 h-5 hover:text-[#30B0D0] cursor-pointer transition-colors" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#30B0D0] to-[#C8A96E] p-[1px] cursor-pointer">
              <div className="w-full h-full rounded-full bg-[#10161D] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar - 3 LINES NAVIGATION REQUESTED */}
      <nav className={clsx(
        "flex flex-col h-screen fixed left-0 top-0 pt-24 pb-8 border-r z-40 transition-all",
        theme === 'dark' ? "bg-[#10161D] border-[#C8A96E]/15 w-64" : "bg-white border-slate-200 w-64 shadow-xl"
      )}>
        <div className="px-6 mb-10">
          <div className="p-4 rounded-[1.5rem] bg-gradient-to-br from-[#30B0D0]/10 to-[#C8A96E]/10 border border-[#C8A96E]/10 flex items-center gap-3">
             <div className="size-10 rounded-xl bg-[#30B0D0] flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-[#050A0F]" />
             </div>
             <div>
                <p className="text-xs font-bold">Clinical Hub</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#C8A96E]">Verified Room</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col flex-1">
          {navItems.map((item, idx) => (
            <button 
              key={idx}
              className={clsx(
                "py-3.5 px-8 flex items-center gap-4 transition-all relative group",
                item.active ? "text-[#30B0D0] bg-[#30B0D0]/5 border-l-4 border-[#C8A96E]" : "text-slate-400 hover:text-[#30B0D0] hover:bg-black/5"
              )}
            >
              {item.icon}
              <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}

          {/* THE 3 LINES NAVIGATION */}
          <div className="mt-auto pt-8 border-t border-[#C8A96E]/10 flex flex-col gap-1 mb-6">
            <p className="px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Core Navigation</p>
            <button 
              onClick={() => navigate('/')}
              className="py-3 px-8 flex items-center gap-4 text-slate-400 hover:text-[#30B0D0] transition-all"
            >
              <Home className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">Home Dashboard</span>
            </button>
            <button 
              onClick={() => navigate(`/user/${user?.uid}`)}
              className="py-3 px-8 flex items-center gap-4 text-slate-400 hover:text-[#C8A96E] transition-all"
            >
              <User className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">Profile Page</span>
            </button>
            <button 
              onClick={() => leave().then(() => navigate('/'))}
              className="py-3 px-8 flex items-center gap-4 text-slate-400 hover:text-red-500 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">Exit Room</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-64 pt-24 p-8 min-h-screen relative z-10 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8 pb-12">
          
          {/* Video Feed */}
          <div className="col-span-12 lg:col-span-8">
            <div className={clsx(
              "aspect-video rounded-[3rem] relative overflow-hidden group border shadow-3xl transition-all",
              theme === 'dark' ? "bg-[#10161D]/60 backdrop-blur-xl border-white/5" : "bg-white border-slate-200"
            )}>
              {connectionState === 'CONNECTED' ? (
                <div className="w-full h-full relative">
                   {/* Agora Video Grid Logic */}
                   {remoteUsers.length > 0 ? (
                      <div className="w-full h-full grid grid-cols-2 gap-2 p-2">
                         <div className="relative rounded-[2rem] overflow-hidden bg-black shadow-2xl">
                            <VideoTile videoTrack={localVideoTrack || undefined} isLocal name="You (Host)" isOff={isCameraOff} className="w-full h-full" />
                         </div>
                         {remoteUsers.map(u => (
                            <div key={u.uid} className="relative rounded-[2rem] overflow-hidden bg-black shadow-2xl">
                               <VideoTile videoTrack={u.videoTrack} name="Patient" className="w-full h-full" />
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="w-full h-full relative">
                         <VideoTile videoTrack={localVideoTrack || undefined} isLocal name="You (Host)" isOff={isCameraOff} className="w-full h-full" />
                         <div className="absolute top-8 right-8 z-20">
                            <button onClick={() => setShowInviteModal(true)} className="bg-black/40 backdrop-blur-md text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-black/60 transition-all flex items-center gap-2">
                               <Plus className="w-4 h-4" /> Invite Participant
                            </button>
                         </div>
                      </div>
                   )}

                   {/* On-Video Controls */}
                   <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={toggleMute} className={clsx("size-14 rounded-full flex items-center justify-center transition-all border", isMuted ? "bg-red-500/20 border-red-500 text-red-500" : "bg-black/40 backdrop-blur-md border-white/20 text-white")}>
                         {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>
                      <button onClick={leave} className="size-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/40 hover:scale-110 active:scale-95 transition-all">
                         <LogOut className="w-8 h-8 rotate-180" />
                      </button>
                      <button onClick={toggleCamera} className={clsx("size-14 rounded-full flex items-center justify-center transition-all border", isCameraOff ? "bg-red-500/20 border-red-500 text-red-500" : "bg-black/40 backdrop-blur-md border-white/20 text-white")}>
                         {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                      </button>
                   </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-12">
                   <div className="size-24 rounded-[2rem] bg-[#30B0D0]/10 flex items-center justify-center mb-8 border border-[#30B0D0]/20">
                      <VideoOff className="w-10 h-10 text-slate-500" />
                   </div>
                   <h2 className="font-serif-clinical text-3xl font-bold mb-4">Room Initialized</h2>
                   <p className="text-sm opacity-60 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
                      The clinical perimeter is ready. Establish the encrypted bridge to begin the session.
                   </p>
                   <button onClick={join} className="bg-[#30B0D0] text-[#050A0F] px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-[#30B0D0]/30 hover:scale-105 active:scale-95 transition-all">
                      Initialize Bridge
                   </button>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Workspace Side Panel */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* Notes Panel */}
            <div className={clsx(
              "h-[500px] rounded-[3rem] flex flex-col border shadow-3xl transition-all",
              theme === 'dark' ? "bg-[#10161D]/60 backdrop-blur-xl border-white/5" : "bg-white border-slate-200"
            )}>
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-serif-clinical text-xl font-bold">Clinical Notes</h3>
                <span className="text-[9px] font-black text-[#C8A96E] bg-[#C8A96E]/10 px-4 py-1.5 rounded-full uppercase tracking-widest">Secure Cloud</span>
              </div>
              <div className="p-8 flex-1">
                <textarea 
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full h-full bg-transparent border-none focus:ring-0 text-sm font-medium leading-relaxed resize-none custom-scrollbar"
                  placeholder="Subjective observation notes..."
                />
              </div>
              <div className="p-6 border-t border-white/5 flex gap-3">
                 <button className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest bg-white/5 rounded-2xl hover:bg-white/10 transition-all">Archive</button>
                 <button className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest bg-[#30B0D0] text-[#050A0F] rounded-2xl shadow-xl shadow-[#30B0D0]/20 hover:scale-105 transition-all">Push to Records</button>
              </div>
            </div>
          </div>

          {/* Bento Grid Features */}
          <div className="col-span-12 md:col-span-4">
             <div className={clsx(
               "h-72 rounded-[3rem] p-8 border shadow-3xl",
               theme === 'dark' ? "bg-[#10161D]/60 backdrop-blur-xl border-white/5" : "bg-white border-slate-200"
             )}>
                <div className="flex items-center justify-between mb-8">
                   <h4 className="font-serif-clinical text-lg font-bold">Session Capture</h4>
                   <div className={clsx("size-3 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)]", isRecording ? "bg-red-500 animate-pulse" : "bg-slate-400")} />
                </div>
                <div className="flex flex-col gap-6">
                   <div className="bg-black/20 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Status</span>
                         <span className="text-xl font-mono font-bold tracking-tight">{isRecording ? 'RECORDING' : 'READY'}</span>
                      </div>
                      <button onClick={isRecording ? stopRecording : startRecording} className={clsx("size-14 rounded-full flex items-center justify-center transition-all shadow-2xl", isRecording ? "bg-red-500 text-white" : "bg-[#30B0D0] text-[#050A0F]")}>
                         {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                      </button>
                   </div>
                </div>
             </div>
          </div>

          <div className="col-span-12 md:col-span-4">
             <div className={clsx(
               "h-72 rounded-[3rem] flex flex-col border shadow-3xl",
               theme === 'dark' ? "bg-[#10161D]/60 backdrop-blur-xl border-white/5" : "bg-white border-slate-200"
             )}>
                <div className="px-8 py-5 border-b border-white/5 bg-black/5">
                   <span className="text-[9px] font-black uppercase tracking-widest opacity-40">AI Transcription</span>
                </div>
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                   {chatMessages.map((m, i) => (
                      <div key={i} className="flex gap-3">
                         <div className="size-6 rounded-lg bg-[#30B0D0]/10 flex items-center justify-center text-[9px] font-black text-[#30B0D0]">{m.sender}</div>
                         <p className="text-[11px] font-medium opacity-70 leading-relaxed">{m.text}</p>
                      </div>
                   ))}
                </div>
                <div className="p-6 pt-0">
                   <div className="relative">
                      <input 
                        className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-5 text-[11px] font-medium outline-none focus:border-[#30B0D0] transition-all" 
                        placeholder="Talk to clinical AI..." 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage(e)}
                      />
                      <button onClick={handleSendMessage} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#30B0D0]">
                         <Send className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
          </div>

          <div className="col-span-12 md:col-span-4">
             <div className={clsx(
               "h-72 rounded-[3rem] p-8 border shadow-3xl flex flex-col",
               theme === 'dark' ? "bg-[#10161D]/60 backdrop-blur-xl border-white/5" : "bg-white border-slate-200"
             )}>
                <h4 className="font-serif-clinical text-lg font-bold mb-6">Patient Library</h4>
                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                   {[
                      { n: 'intake_assessment.pdf', d: 'Oct 12' },
                      { n: 'neuro_results.jpg', d: 'Nov 04' }
                   ].map((f, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-black/10 rounded-2xl border border-transparent hover:border-white/5 transition-all cursor-pointer group">
                         <FileCode className="w-5 h-5 text-[#C8A96E]" />
                         <div className="flex-1">
                            <p className="text-[10px] font-bold">{f.n}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-0.5">{f.d}</p>
                         </div>
                         <Maximize2 className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-all" />
                      </div>
                   ))}
                </div>
                <button className="mt-4 w-full py-3 border-2 border-dashed border-[#C8A96E]/20 rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#C8A96E] hover:bg-[#C8A96E]/5 transition-all">
                   + Import Clinical Data
                </button>
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
        sessionTitle="Clinical Therapy Session"
      />
    </div>
  );
}
