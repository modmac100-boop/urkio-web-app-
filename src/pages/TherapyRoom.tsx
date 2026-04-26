import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Menu, X, Video, FileText, Settings, LayoutDashboard, Clock, BookOpen,
  Play, Square, Send, Archive, HelpCircle, Bell, History, ArrowRight,
  Shield, Mic, MicOff, VideoOff, AlignLeft, Bold, Italic, List, Save, Download, Copy
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useHealingSession } from '../healing-suite/hooks/useHealingSession';
import { VideoTile } from '../healing-suite/components/VideoTile';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { SessionInviteModal } from '../components/messaging/SessionInviteModal';

export function TherapyRoom({ user, userData }: { user: any; userData: any }) {
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams();
  const [roomId, setRoomId] = useState<string>(urlRoomId || '');
  const [sessionNotes, setSessionNotes] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'AI', text: 'Transcription Assistant ready.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Hardcode generated code if not in a session
  useEffect(() => {
    if (!roomId) {
      setRoomId(`XRQ-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, []);

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
  } = useHealingSession(roomId, 'private', 0, 'host'); // 0 uid will let agora assign one

  // Protect route
  const isAdminOrExpert = user && (
    ['admin', 'management', 'founder'].includes(userData?.role) || 
    ['specialist', 'expert', 'verifiedexpert', 'psychologist', 'practitioner'].includes(userData?.role || '') || 
    ['urkio@urkio.com', 'sameralhalaki@gmail.com'].includes(userData?.email?.toLowerCase()) || 
    ['urkio@urkio.com', 'sameralhalaki@gmail.com'].includes(user?.email?.toLowerCase())
  );

  useEffect(() => {
    // If there's no roomId in the URL, this is the expert's private office - require expert role.
    // If there IS a roomId, it's a specific session (likely booked) - allow the client/guest to join.
    if (!urlRoomId && !isAdminOrExpert) {
      toast.error('Unauthorized access to Private Therapy Room.');
      navigate('/');
    }
  }, [isAdminOrExpert, navigate, urlRoomId]);

  const handleSendInvite = () => {
    setShowInviteModal(true);
  };

  const handleDownloadNotes = () => {
    if (!sessionNotes.trim()) {
      toast.error('No notes to download.');
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([sessionNotes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `clinical_notes_${roomId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
    toast.success('Notes downloaded safely.');
  };

  const handleSaveNotes = async () => {
    if (!sessionNotes.trim()) {
      toast.error('Cannot save empty notes.');
      return;
    }
    try {
      await addDoc(collection(db, 'clinicalNotes'), {
        roomId,
        expertId: user?.uid || 'guest',
        notes: sessionNotes,
        createdAt: serverTimestamp(),
      });
      toast.success('Notes saved securely to cloud.', { icon: '☁️' });
    } catch (e) {
      toast.error('Failed to save notes.');
    }
  };

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

  // Auto-join for guests if they land on a room link
  useEffect(() => {
    if (urlRoomId && !isAdminOrExpert && connectionState === 'DISCONNECTED') {
      console.log("[TherapyRoom] Guest detected, auto-joining session:", urlRoomId);
      join();
    }
  }, [urlRoomId, isAdminOrExpert, connectionState, join]);

  // Access control: If no roomId and not expert, we already navigate away in useEffect.
  // We allow guests if they have a specific roomId.
  // if (!user) return null; // Removed to allow guest access

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className={clsx(
        "flex h-[calc(100vh-140px)] md:h-[calc(100vh-64px)] w-full bg-[#101319] text-[#e1e2ea] font-['Manrope'] overflow-hidden selection:bg-msgr-primary-container/30 relative rounded-2xl md:rounded-none transition-all duration-500",
        isZenMode && "zen-mode-container scale-25 fixed top-6 right-6 w-screen h-screen border-2 border-white/20 shadow-2xl z-1000 pointer-events-auto"
      )}
    >

      {/* Background Orbs */}
      <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full bg-msgr-primary-container blur-[120px] opacity-15 pointer-events-none z-0" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full bg-[#5f5db2] blur-[120px] opacity-15 pointer-events-none z-0" />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={clsx(
        "absolute md:relative top-0 inset-s-0 h-full border-e border-white/5 bg-[#0b0c10] md:bg-slate-950/60 backdrop-blur-3xl shadow-2xl flex flex-col transition-all duration-300 z-50",
        isSidebarOpen 
          ? "translate-x-0 w-64" 
          : (isRTL ? "translate-x-full md:translate-x-0 md:w-20" : "-translate-x-full md:translate-x-0 md:w-20")
      )}>
        <div className="py-8 px-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-10 px-2 flex items-center justify-between">
            {isSidebarOpen && (
              <div>
                <div className="text-lg font-bold tracking-tighter text-white">{t('therapyRoom.clinicalStudio')}</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-blue-500/80">{t('therapyRoom.expertSuite')}</div>
              </div>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:block text-slate-400 hover:text-white transition-colors">
              <Menu className="size-5" />
            </button>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition-colors">
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {[
                          { id: 'dash', label: t('therapyRoom.dashboard'), icon: LayoutDashboard, path: '/specialist-dashboard' },
              { id: 'sessions', label: t('therapyRoom.sessions'), icon: Video, active: true },
              { id: 'records', label: t('therapyRoom.records'), icon: FileText, path: '/records' },
              { id: 'library', label: t('therapyRoom.library'), icon: BookOpen, path: '/healing-courses' },
              { id: 'settings', label: t('therapyRoom.settings'), icon: Settings, path: '/settings' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.path) navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 w-full group",
                  item.active ? "bg-white/5 text-blue-400 font-bold" : "text-slate-400 hover:text-white hover:bg-white/5",
                  !isSidebarOpen && "justify-center px-0"
                )}
              >
                <item.icon className={clsx("size-5", item.active && "fill-blue-400/20")} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-6">
            <button
              onClick={() => {
                if (connectionState === 'DISCONNECTED') join();
                else leave();
              }}
              className={clsx(
                "w-full rounded-full py-3 font-bold transition-all shadow-lg flex items-center justify-center gap-2",
                connectionState !== 'DISCONNECTED' ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-msgr-primary-container text-white shadow-msgr-primary-container/20 hover:bg-[#005eb5]"
              )}
            >
              <Video className="size-4" />
              {isSidebarOpen && (
                <span>
                  {connectionState !== 'DISCONNECTED' 
                    ? t('therapyRoom.endSession') 
                    : (isAdminOrExpert ? t('therapyRoom.newSession') : t('messaging.joinSession'))}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 px-2">
              <img alt="Provider" className="size-10 rounded-full object-cover border border-white/10" src={userData?.photoURL || "https://ui-avatars.com/api/?name=Dr"} />
              {isSidebarOpen && (
                <div className="overflow-hidden p-1">
                  <p className="text-xs font-bold text-white truncate">{userData?.displayName || 'Dr. Expert'}</p>
                  <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest">{userData?.primaryRole || 'Senior Lead Expert'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative h-full overflow-hidden">
        {/* Top App Bar */}
        <header className="w-full flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-4 bg-slate-950/40 backdrop-blur-2xl border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4 md:gap-8 mb-4 md:mb-0 w-full md:w-auto">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg">
              <Menu className="size-5" />
            </button>
                        <h1 className="text-[10px] sm:text-xl font-extrabold bg-linear-to-r from-blue-400 to-transparent bg-clip-text text-transparent uppercase tracking-widest flex-1 md:flex-none">{t('therapyRoom.title')}</h1>
            <div className="hidden lg:flex items-center gap-6">
              <span className="text-blue-400 border-b-2 border-blue-400 pb-1 text-[10px] font-bold tracking-widest uppercase">{t('therapyRoom.activeSession')}</span>
              <span className="text-slate-400 text-[10px] font-bold tracking-widest uppercase hover:text-blue-300 transition-colors cursor-pointer">{t('therapyRoom.archive')}</span>
              <span className="text-slate-400 text-[10px] font-bold tracking-widest uppercase hover:text-blue-300 transition-colors cursor-pointer" onClick={() => navigate('/expert-list')}>{t('therapyRoom.patientList')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 md:gap-6">
            <div className="flex flex-1 md:flex-none items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 justify-between md:justify-start gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden sm:inline">{t('therapyRoom.joinCode')}</span>
              <span className="text-xs font-mono font-bold text-blue-400 truncate">{roomId}</span>
              <button onClick={() => { navigator.clipboard.writeText(roomId); toast.success('Code copied!'); }} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors">
                <Copy className="size-3" />
              </button>
                            <button onClick={handleSendInvite} className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full hover:bg-blue-500/30 transition-colors uppercase font-bold shrink-0">{t('therapyRoom.invite')}</button>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <Bell className="size-5 text-slate-400 hover:text-blue-300 transition-colors cursor-pointer" />
                <span className="absolute -top-1 -right-1 size-2 bg-[#ffb4ab] rounded-full"></span>
              </div>
              <History className="size-5 text-slate-400 hover:text-blue-300 transition-colors cursor-pointer hidden sm:block" />
              <HelpCircle className="size-5 text-slate-400 hover:text-blue-300 transition-colors cursor-pointer hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Dual Pane Content */}
        <div className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">

          {/* Left Pane: Live Session Control */}
          <section className="flex-none lg:flex-[1.4] flex flex-col gap-6 min-w-0 h-auto lg:h-full">
            {/* Video Feed Container */}
            <div className="relative flex-1 bg-[#191c21] rounded-2xl overflow-hidden border border-white/5 shadow-inner min-h-[300px] lg:min-h-0">

              {connectionState === 'CONNECTED' ? (
                <>
                  {/* Background Track - Prioritize Remote Participant */}
                  {remoteUsers.length > 0 ? (
                    <VideoTile
                      videoTrack={remoteUsers[0].videoTrack}
                      name={t('therapyRoom.patient')}
                      className="w-full h-full absolute inset-0 rounded-none border-none"
                    />
                  ) : (
                    <VideoTile
                      videoTrack={localVideoTrack || undefined}
                      isLocal
                      name={t('therapyRoom.youHost')}
                      isOff={isCameraOff}
                      className="w-full h-full absolute inset-0 rounded-none border-none"
                    />
                  )}

                  {/* Picture-in-Picture Track */}
                  {remoteUsers.length > 0 && (
                    <div className="absolute top-6 right-6 w-48 h-32 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 group hover:w-64 hover:h-40 transition-all duration-300">
                      <VideoTile
                        videoTrack={localVideoTrack || undefined}
                        isLocal
                        name={t('therapyRoom.you')}
                        isOff={isCameraOff}
                        className="w-full h-full rounded-none border-none"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black/40">
                  <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <VideoOff className="size-8 text-slate-500" />
                  </div>
                                    <h2 className="text-xl font-bold text-white mb-2">{t('therapyRoom.secureLineOffline')}</h2>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8">{t('therapyRoom.initializeBridgeDesc')}</p>
                  <button onClick={join} className="px-8 py-3 bg-msgr-primary-container text-white font-bold rounded-full text-xs uppercase tracking-widest shadow-lg shadow-msgr-primary-container/20 hover:bg-[#005eb5] transition-all">
                    {t('therapyRoom.initializeBridge')}
                  </button>
                </div>
              )}

              {/* Overlay Controls (Only when connected) */}
              {connectionState === 'CONNECTED' && (
                <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none z-30">
                  <div className="flex justify-between items-start">
                    <div className="bg-slate-950/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 border border-white/10 pointer-events-auto">
                      <div className="size-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold tracking-widest uppercase">LIVE: {roomId}</span>
                    </div>
                    <div className="bg-slate-950/60 backdrop-blur-md px-4 py-2 rounded-full text-blue-400 font-mono font-bold text-lg pointer-events-auto border border-white/10 shadow-lg">
                      {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 pointer-events-auto pb-4">
                    <button onClick={toggleMute} className="size-12 rounded-full bg-[#32353b]/60 backdrop-blur-xl flex items-center justify-center hover:bg-white/10 transition-colors text-white border border-white/10 shadow-xl">
                      {isMuted ? <MicOff className="size-5 text-red-400" /> : <Mic className="size-5" />}
                    </button>
                    <button onClick={leave} className="w-16 h-12 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center hover:bg-red-600 transition-colors text-white shadow-xl shadow-red-500/20">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>call_end</span>
                    </button>
                    <button onClick={toggleCamera} className="size-12 rounded-full bg-[#32353b]/60 backdrop-blur-xl flex items-center justify-center hover:bg-white/10 transition-colors text-white border border-white/10 shadow-xl">
                      {isCameraOff ? <VideoOff className="size-5 text-red-400" /> : <Video className="size-5" />}
                    </button>
                    <button 
                      onClick={toggleZenMode} 
                      className={clsx(
                        "size-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all text-white border border-white/10 shadow-xl",
                        isZenMode ? "bg-blue-500 shadow-blue-500/20" : "bg-[#32353b]/60 hover:bg-white/10"
                      )}
                      title={isZenMode ? "Normal View" : "Minimize (25%)"}
                    >
                      <span className="material-symbols-outlined text-xl">{isZenMode ? 'fullscreen' : 'zoom_in'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls & Chat Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 h-auto md:h-64">
              {/* Recording Controls */}
              <div className="col-span-1 bg-[#32353b]/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5 flex flex-col justify-between shadow-lg">
                <div>
                                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">{t('therapyRoom.sessionCapture')}</h3>
                  <div className="space-y-3">
                    <button
                      onClick={startRecording}
                      disabled={isRecording || connectionState !== 'CONNECTED'}
                      className={clsx(
                        "w-full flex items-center justify-between px-4 py-3 rounded-full transition-all group border",
                        isRecording
                          ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                          : "bg-white/5 border-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={clsx("size-2 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-slate-400")} />
                                                <span className="text-sm font-semibold">{isRecording ? t('therapyRoom.recording') : t('therapyRoom.startRecording')}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">REC</span>
                    </button>

                    <button
                      onClick={stopRecording}
                      disabled={!isRecording}
                      className={clsx(
                        "w-full flex items-center justify-between px-4 py-3 rounded-full transition-all border",
                        !isRecording ? "opacity-50 cursor-not-allowed bg-white/5 border-transparent" : "bg-white/10 hover:bg-white/20 border-white/10 shadow-lg"
                      )}
                    >
                                            <div className="flex items-center gap-3 text-slate-300">
                        <Square className="size-4 fill-current" />
                        <span className="text-sm font-semibold">{t('therapyRoom.stopStream')}</span>
                      </div>
                    </button>
                  </div>
                </div>
                                <div className="text-[9px] text-msgr-primary-container/80 text-center font-bold tracking-widest mt-4 flex items-center justify-center gap-1">
                  <Shield className="size-3" /> {t('therapyRoom.e2eEncrypted')}
                </div>
              </div>

              {/* Chat Area */}
              <div className="col-span-1 md:col-span-2 bg-[#32353b]/40 backdrop-blur-xl rounded-2xl flex flex-col border border-white/5 overflow-hidden shadow-lg h-64 md:h-auto">
                <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('therapyRoom.sessionNotesChat')}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={clsx("flex gap-3", msg.sender === 'ME' ? "flex-row-reverse" : "flex-row")}>
                      <div className={clsx(
                        "size-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        msg.sender === 'ME' ? "bg-slate-500/20 text-slate-300" : "bg-msgr-primary-container/20 text-[#a8c8ff]"
                      )}>
                        {msg.sender}
                      </div>
                      <div className={clsx("flex-1", msg.sender === 'ME' && "text-right")}>
                        <p className={clsx(
                          "text-xs p-3 inline-block",
                            msg.sender === 'ME'
                            ? "text-white bg-msgr-primary-container rounded-tl-xl rounded-bl-xl rounded-br-xl"
                            : "text-[#c1c6d4] bg-[#32353b]/50 border border-white/5 rounded-tr-xl rounded-br-xl rounded-bl-xl"
                        )}>
                          {msg.text}
                        </p>
                        <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold tracking-widest">{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-black/20">
                  <form onSubmit={handleSendMessage} className="relative">
                    <input
                      type="text"
                      className="w-full bg-[#191c21] border border-white/5 rounded-full pl-5 pr-12 py-3 text-xs focus:ring-1 focus:ring-msgr-primary-container/50 text-white placeholder-slate-500 outline-none"
                      placeholder={t('therapyRoom.sendMessagePlaceholder')}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button type="submit" disabled={!chatInput.trim()} className="absolute right-2 top-1.5 p-1.5 text-[#a8c8ff] hover:bg-[#a8c8ff]/10 rounded-full transition-colors disabled:opacity-50">
                      <Send className="size-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* Right Pane: Clinical Documentation & Workspace (Expert Only) */}
          {isAdminOrExpert && (
            <section className="flex-none lg:flex-1 flex flex-col gap-6 min-w-0 h-[600px] lg:h-full">
              {/* Documentation Editor */}
              <div className="flex-1 bg-[#32353b]/40 backdrop-blur-xl rounded-2xl border border-white/5 flex flex-col shadow-lg overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">{t('therapyRoom.clinicalDocumentation')}</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">{t('therapyRoom.subjectiveObjective')}</p>
                  </div>
                  <div className="hidden sm:flex gap-1 bg-[#191c21] rounded-lg p-1 border border-white/5">
                    <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-slate-400 hover:text-white"><Bold className="size-4" /></button>
                    <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-slate-400 hover:text-white"><Italic className="size-4" /></button>
                    <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-slate-400 hover:text-white"><List className="size-4" /></button>
                    <div className="w-px h-6 bg-white/10 my-auto mx-1"></div>
                    <button onClick={handleSaveNotes} title="Save Notes" className="p-1.5 hover:bg-emerald-500/20 rounded-md transition-colors text-emerald-400 hover:text-emerald-300"><Save className="size-4" /></button>
                    <button onClick={handleDownloadNotes} title="Download Notes" className="p-1.5 hover:bg-blue-500/20 rounded-md transition-colors text-blue-400 hover:text-blue-300"><Download className="size-4" /></button>
                  </div>
                </div>

                <div className="flex-1 p-6 lg:p-8">
                  <textarea
                    className="w-full h-full bg-transparent border-none focus:ring-0 text-sm leading-relaxed text-[#e1e2ea] placeholder-slate-600 resize-none outline-none custom-scrollbar"
                    placeholder="Start typing clinical notes here... &#10;&#10;Use '/' for AI commands or to pull data from patient history."
                    value={sessionNotes}
                    onChange={e => setSessionNotes(e.target.value)}
                  />
                </div>

                <div className="p-4 border-t border-white/5 flex justify-between items-center bg-black/20">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    <span className="size-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
                    {t('therapyRoom.cloudSynced')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {t('therapyRoom.words')}: {sessionNotes.split(/\s+/).filter(w => w.length > 0).length}
                  </div>
                </div>
              </div>

              {/* File Explorer & Actions Bento */}
              <div className="h-auto md:h-64 grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                {/* File Explorer */}
                <div className="bg-[#32353b]/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5 flex flex-col shadow-lg overflow-hidden h-64 md:h-auto">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                    {t('therapyRoom.caseDocuments')}
                    <button className="hover:text-blue-400 transition-colors bg-white/5 p-1.5 rounded-lg"><ArrowRight className="size-3" /></button>
                  </h3>
                  <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-2">
                    {[
                      { n: 'intake_form.pdf', date: 'Oct 12' },
                      { n: 'scan_results.jpg', date: 'Nov 04' },
                      { n: 'referral_notes.docx', date: 'Jan 20' }
                    ].map((file, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-white/5">
                        <div className="size-8 rounded-lg bg-msgr-primary-container/10 flex items-center justify-center">
                          <FileText className="size-4 text-[#a8c8ff]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{file.n}</p>
                          <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">{file.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-3">
                  <button className="flex-1 bg-[#32353b]/40 backdrop-blur-xl hover:bg-msgr-primary-container/20 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all shadow-lg text-blue-400 min-h-[100px]">
                    <Send className="size-5 group-hover:-translate-y-1 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-white">{t('therapyRoom.sendToManager')}</span>
                  </button>
                  <button className="flex-1 bg-[#32353b]/40 backdrop-blur-xl hover:bg-slate-800 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all shadow-lg text-slate-500 hover:text-slate-300 min-h-[100px]">
                    <Archive className="size-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('therapyRoom.moveToArchive')}</span>
                  </button>
                </div>
              </div>
            </section>
          )}
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
