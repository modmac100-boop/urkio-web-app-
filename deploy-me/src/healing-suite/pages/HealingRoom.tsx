import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Sparkles, RefreshCw, MessageCircle, Users, Settings, MoreVertical, Send, Check, Video, Mic, ExternalLink, QrCode, FileText } from 'lucide-react';
import { useHealingSession, SessionMode } from '../hooks/useHealingSession';
import { db } from '../../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { WaitingRoom } from '../components/WaitingRoom';
import { VideoTile, ParticipantGrid } from '../components/VideoTile';
import { SessionControls } from '../components/SessionControls';
import { SessionTimer } from '../../components/session/SessionTimer';
import { ClinicalReport } from '../../components/session/ClinicalReport';
import { useSessionMetadata } from '../../hooks/useSessionMetadata';
import clsx from 'clsx';

interface HealingRoomProps {
  user: any;
  userData: any;
}

export function HealingRoom({ user, userData }: HealingRoomProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mode = (searchParams.get('mode') as SessionMode) || 'private';
  const role = (searchParams.get('role') as 'host' | 'audience') || 'host';
  const practitionerName = searchParams.get('practitioner') || undefined;

  const [hasEntered, setHasEntered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'participants' | 'settings' | 'report'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const isExpert = role === 'host';
  const {
    metadata,
    startTimer,
    stopTimer,
    updateReport,
    archiveReport
  } = useSessionMetadata(sessionId || '', isExpert ? user.uid : undefined);

  const uid = parseInt(user?.uid?.slice(-8), 16) % 100000 || Math.floor(Math.random() * 99999);
  const displayName = userData?.displayName || user?.displayName || 'Urkio User';
  const avatar = userData?.photoURL || user?.photoURL;

  const {
    isMuted, isCameraOff, isScreenSharing, isZenMode, handRaisedUids, networkQuality, error,
    isRecording, startRecording, stopRecording,
    join, leave, toggleMute, toggleCamera, toggleZenMode, toggleHandRaise, toggleScreenShare,
    connectionState, remoteUsers, localVideoTrack, updateState
  } = useHealingSession(sessionId!, mode, uid, role);

  // ── Real-time Chat Logic ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!sessionId) return;

    const messagesRef = collection(db, 'calls', sessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !sessionId || sending) return;

    setSending(true);
    try {
      const messagesRef = collection(db, 'calls', sessionId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: displayName,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleEnterSession = async () => {
    if (!sessionId) return;
    setIsEntering(true);
    try {
      await join();
      setHasEntered(true);
    } catch (err: any) {
      console.error("[HealingRoom] Join failed:", err);
    } finally {
      setIsEntering(false);
    }
  };

  const handleLeave = async () => {
    await leave();
    navigate('/specialist-hub');
  };

  // ── Connection Error State ──────────────────────────────────────────────────
  if (connectionState === 'FAILED') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center font-body">
        <div className="size-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-8 border border-rose-500/20">
          <RefreshCw className="size-10 text-rose-500" />
        </div>
        <h2 className="text-3xl font-headline font-black text-white mb-4 uppercase tracking-tight">Encryption Handshake Failed</h2>
        <p className="text-zinc-500 max-w-sm mb-10 font-medium leading-relaxed">
          {error || "We couldn't establish a secure clinical P2P connection to this sanctuary space."}
        </p>
        <div className="flex gap-4">
          <button onClick={() => navigate('/specialist-dashboard')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all">
            Exit Sanctuary
          </button>
          <button onClick={() => { updateState({ connectionState: 'DISCONNECTED' }); handleEnterSession(); }} className="px-8 py-4 bg-ur-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ── Pre-session: Waiting Room ──────────────────────────────────────────────
  if (!hasEntered || connectionState === 'DISCONNECTED') {
    return (
      <WaitingRoom
        sessionId={sessionId!}
        practitionerName={practitionerName}
        sessionMode={mode}
        role={role}
        userName={displayName}
        userAvatar={avatar}
        onEnterSession={handleEnterSession}
        isEntering={isEntering}
      />
    );
  }

  const isReconnecting = connectionState === 'RECONNECTING' || connectionState === 'CONNECTING';
  const totalParticipants = remoteUsers.length + 1;

  return (
    <div className={clsx(
      'min-h-screen bg-[#101319] text-[#e1e2ea] flex flex-col relative overflow-hidden font-sans',
      isZenMode && 'cursor-none'
    )}>
      <style>{`
        .glass-panel {
            backdrop-filter: blur(24px);
            background: rgba(50, 53, 59, 0.4);
        }
        .antigravity-orb {
            filter: blur(100px);
            z-index: -1;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #414752;
            border-radius: 10px;
        }
        .vertical-text {
            writing-mode: vertical-rl;
        }
      `}</style>
      
      {/* Antigravity Background Orbs */}
      <div className="fixed top-[-10%] right-[-5%] w-96 h-96 antigravity-orb bg-msgr-primary-container/20 rounded-full"></div>
      <div className="fixed bottom-[10%] left-[-5%] w-80 h-80 antigravity-orb bg-[#5f5db2]/10 rounded-full"></div>

      {/* Top Navigation Bar */}
      <nav className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-50 bg-slate-950/40 backdrop-blur-3xl shadow-[0px_32px_64px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVNBL_DtCzdMoGo_FtwgcQGy0JdFbOoYiPI-lArs5zRdWwxSGx6Gix4nFdsZWWThbuGkhpPhyWaQRrTkPJV5aavvsSUK80FaMQEBWsSUzkDAwZX9wB8ubP9il5iTtl6NVxNI1MrHxcQFVGf8DOZvplQ7zP8ozIJKQCzCmEnMR5M-mitU_cZ80QJBSm5AabPNwotPY-IJsK-YkRxvJ0Vnyr64I-uT8RZKXA9qOT2EDqsauSVqu8MdwUt9lFl3kdXSlDnTmHk6bi97Q" alt="Logo" className="h-8 w-8" />
            <span className="text-2xl font-bold bg-linear-to-br from-blue-600 to-indigo-900 bg-clip-text text-transparent font-headline">Urkio</span>
          </div>
          <div className="hidden md:flex gap-8 ml-12">
            <span className="text-blue-400 font-bold border-b-2 border-blue-600 pb-1 cursor-default">Live Session</span>
            <button onClick={handleLeave} className="text-slate-400 font-bold hover:text-slate-200 transition-colors uppercase text-[10px] tracking-widest">Dashboard</button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="items-center gap-6 hidden sm:flex">
             <span className="text-[10px] font-black uppercase tracking-widest text-[#a8c8ff]">Safe Session Active</span>
             <span className="text-xs font-bold text-slate-500">{sessionId}</span>
          </div>
          <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10 shadow-lg">
            <img src={avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCb_Xn-MhxIPTW09nbA1ZnNFEFlOd2x3oSxJ34P7vCsAaUxQOs0N2PL6VdYES_5ZvxRwNbrf5Zx8VguZ28Bk1TkGNAdxN7tcIf_PbI6tSoSnnUIBcuS0MZ3PnBGJ9hQdT-WkyZt13lje8jjAcOFmswdqacoJa0V14IqZIE53w8_RI61s9S_HO0OHPKrVC73mfuxnC1YAxMvO0aSUh8ZnbmUQH0XBWE8Sfeu-H-RzFh6zoKOpw4dVhuJIYyqPpoloGXZQfMAqUO8NWY"} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Side Navigation (Left/Right depending on direction) */}
        <aside className="fixed inset-s-0 top-0 h-full flex flex-col z-40 bg-slate-950/60 backdrop-blur-3xl w-20 md:w-64 rounded-e-3xl pt-24 pb-8 border-e border-white/5 shadow-2xl">
          <div className="px-6 mb-12 hidden md:block">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="uppercase tracking-[0.2em] text-[10px] font-black text-slate-500">Active Connection</span>
            </div>
            <h2 className="text-lg font-black text-[#e1e2ea]">Healing Space</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Code: {sessionId?.slice(-6).toUpperCase()}</p>
          </div>

          <div className="flex flex-col gap-2 flex-1 px-2">
            {[
              { id: 'meeting', icon: <Video size={20} />, label: 'Meeting' },
              { id: 'chat', icon: <MessageCircle size={20} />, label: 'Real-time Chat' },
              { id: 'participants', icon: <Users size={20} />, label: 'Participants' },
              { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => { if(item.id !== 'meeting') setActiveSideTab(item.id as any); }}
                className={clsx(
                  "flex items-center gap-4 transition-all duration-300 p-4 rounded-full group",
                  activeSideTab === item.id || item.id === 'meeting' ? "bg-linear-to-br from-blue-600/20 to-transparent text-blue-400" : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="hidden md:inline uppercase tracking-[0.2em] text-[10px] font-black">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="ms-20 md:ms-64 flex-1 flex flex-col xl:flex-row p-6 gap-6 overflow-hidden">
          {/* Video Stage (Left/Center) */}
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="relative flex-1 bg-[#1d2026] rounded-4xl overflow-hidden group shadow-2xl border border-white/5">
              {/* Primary Video Feed */}
              {role === 'host' ? (
                <VideoTile
                  videoTrack={localVideoTrack || undefined}
                  isLocal
                  isOff={isCameraOff}
                  isMuted={isMuted}
                  name={displayName}
                  avatar={avatar}
                  isHost
                  className="w-full h-full object-cover"
                />
              ) : remoteUsers[0] ? (
                <VideoTile
                  videoTrack={remoteUsers[0].videoTrack}
                  isOff={!remoteUsers[0].videoTrack}
                  isMuted={!remoteUsers[0].audioTrack}
                  name="Practitioner"
                  isHost
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                   <div className="size-20 bg-primary/20 rounded-4xl flex items-center justify-center animate-pulse">
                      <Shield className="size-10 text-primary" />
                   </div>
                   <p className="text-on-surface-variant font-bold uppercase tracking-widest">Waiting for session to begin...</p>
                </div>
              )}

              {/* Floating Controls Overlay */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                 <SessionControls
                    isMuted={isMuted}
                    isCameraOff={isCameraOff}
                    isScreenSharing={isScreenSharing}
                    isZenMode={isZenMode}
                    isHandRaised={handRaisedUids.has(uid)}
                    mode={mode}
                    role={role}
                    networkQuality={networkQuality}
                    isRecording={isRecording}
                    onToggleMute={toggleMute}
                    onToggleCamera={toggleCamera}
                    onToggleScreenShare={toggleScreenShare}
                    onToggleZen={toggleZenMode}
                    onToggleHandRaise={toggleHandRaise}
                    onToggleRecord={isRecording ? stopRecording : startRecording}
                    onLeave={handleLeave}
                  />
              </div>

              {/* Expert Name Tag */}
              <div className="absolute top-8 left-8 flex items-center gap-3 glass-panel py-3 px-6 rounded-full border border-white/10 shadow-2xl">
                <div className="size-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Expert</span>
                <span className="text-sm font-bold">{role === 'host' ? displayName : 'Dr. Elena Sterling'}</span>
              </div>
            </div>

            {/* Bottom Participant Grid */}
            <div className="h-32 xl:h-40">
               <ParticipantGrid count={totalParticipants} mode={mode}>
                  <div className="bg-[#191c21] rounded-2xl overflow-hidden border border-white/5 shadow-lg group relative aspect-video h-full">
                     <VideoTile videoTrack={localVideoTrack || undefined} isLocal isOff={isCameraOff} isMuted={isMuted} name="You" avatar={avatar} className="size-full grayscale group-hover:grayscale-0 transition-all duration-700" />
                  </div>
                  {remoteUsers.map(ru => (
                    <div key={ru.uid} className="bg-[#191c21] rounded-2xl overflow-hidden border border-white/5 shadow-lg group relative aspect-video h-full">
                       <VideoTile videoTrack={ru.videoTrack} isOff={!ru.videoTrack} isMuted={!ru.audioTrack} name={`Member ${String(ru.uid).slice(-3)}`} className="size-full grayscale group-hover:grayscale-0 transition-all duration-700" />
                    </div>
                  ))}
                  <div className="bg-[#272a30] rounded-2xl flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-primary/50 transition-colors cursor-pointer group aspect-video h-full">
                    <MoreVertical className="text-slate-500 group-hover:text-primary transition-colors" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-2">More</span>
                  </div>
               </ParticipantGrid>
            </div>
          </div>

          {/* Right Sidebar: Analytical Console & Clinical Logs */}
          <aside className="w-full xl:w-96 flex flex-col gap-6 overflow-hidden">
            {/* Session Timer Component Card */}
            <SessionTimer 
              metadata={metadata} 
              isExpert={isExpert} 
              onStart={startTimer} 
              onStop={stopTimer} 
            />

            {/* Clinical Agreement Panel */}
            <div className="bg-msgr-primary-container/10 p-6 rounded-[2.5rem] border border-msgr-primary-container/20 relative overflow-hidden shrink-0 shadow-lg">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Shield size={48} />
               </div>
               <h3 className="text-sm font-black text-[#a8c8ff] mb-2 flex items-center gap-2 uppercase tracking-widest">
                  <Shield size={16} /> Clinical Environment
               </h3>
               <p className="text-[11px] text-zinc-500 leading-relaxed mb-6 opacity-70 font-bold">
                  Maintaining a safe, confidential, and respectful spirit in this Virtual Healing Space.
               </p>
               <div className="flex items-center gap-3 bg-msgr-primary-container/20 px-5 py-3 rounded-full w-fit border border-msgr-primary-container/30">
                  <Check size={14} className="text-teal-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Behavior Agreement Active</span>
               </div>
            </div>

            {/* Interactive Chat Console (Session Logs) */}
            <div className="flex-1 bg-[#1d2026] rounded-[2.5rem] overflow-hidden flex flex-col border border-white/5 shadow-2xl shadow-black/60">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#a8c8ff]">Session Logs</span>
                <span className="text-[10px] flex items-center gap-2 font-black uppercase tracking-widest">
                   <div className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                   <span className="text-emerald-500">Real-time</span>
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                 {messages.map((msg) => {
                   const isMe = msg.senderId === user.uid;
                   return (
                     <div key={msg.id} className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between px-1">
                           <span className={clsx(
                             "text-[10px] font-black uppercase tracking-widest",
                             isMe ? "text-blue-400" : "text-emerald-400"
                           )}>
                             {isMe ? 'You' : msg.senderName}
                           </span>
                           <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                             {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                           </span>
                        </div>
                        <div className={clsx(
                          "p-5 rounded-3xl rounded-tl-none text-sm leading-relaxed shadow-xl transition-all border",
                          isMe ? "bg-[#32353b] border-white/5" : "bg-msgr-primary-container/10 border-msgr-primary-container/20"
                        )}>
                          {msg.text}
                        </div>
                     </div>
                   );
                 })}
                 <div ref={chatEndRef} />
               </div>

               {/* Premium Chat Input */}
               <form onSubmit={handleSendMessage} className="p-6 bg-[#272a30]/50 border-t border-white/5 backdrop-blur-md">
                 <div className="relative">
                   <input 
                     type="text" 
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     placeholder="Message the space..."
                     className="w-full bg-[#1d2026] border border-white/5 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all rounded-full pl-6 pr-14 py-4 text-sm placeholder:text-slate-600 font-bold" 
                   />
                   <button 
                     type="submit"
                     disabled={!newMessage.trim() || sending}
                     className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100"
                   >
                     {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send size={16} />}
                   </button>
                 </div>
               </form>
            </div>
          </aside>
        </main>
      </div>

      {/* Decorative Accents */}
      <aside className="hidden lg:flex fixed inset-s-8 bottom-12 flex-col gap-6 text-slate-700 pointer-events-none">
        <div className="h-24 w-px bg-linear-to-t from-slate-700/40 to-transparent mx-auto"></div>
        <div className="vertical-text uppercase tracking-[0.4em] text-[10px] font-bold select-none whitespace-nowrap">
            URKIO CONNECT • VIRTUAL MIDNIGHT
        </div>
      </aside>
    </div>
  );
}
