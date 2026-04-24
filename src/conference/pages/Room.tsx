import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { StreamVideo, StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import { useConference } from '../hooks/useConference';
import { SetupScreen } from '../components/SetupScreen';
import { VideoPlayer } from '../components/VideoPlayer';
import { ControlBar } from '../components/ControlBar';
import { X, Shield, Users, Link as LinkIcon, MessageSquare, Sparkles, FileText, Timer } from 'lucide-react';
import { SessionInviteModal } from '../../components/messaging/SessionInviteModal';
import { SimpleLiveChat } from '../../components/messaging/SimpleLiveChat';
import { SessionTimer } from '../../components/session/SessionTimer';
import { ClinicalReport } from '../../components/session/ClinicalReport';
import { useSessionMetadata } from '../../hooks/useSessionMetadata';
import clsx from 'clsx';

interface RoomProps {
  user: any;
  userData: any;
}

export function Room({ user, userData }: RoomProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hasJoined, setHasJoined] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const isPrivate = searchParams.get('private') === 'true';
  const limit = searchParams.get('limit') || '100';

  const role = userData?.role?.toLowerCase();
  const isExpert = ['specialist', 'expert', 'practitioner', 'admin'].includes(role || '');

  const {
    metadata,
    startTimer,
    stopTimer,
    updateReport,
    archiveReport
  } = useSessionMetadata(roomId || '', isExpert ? user.uid : undefined);

  const {
    client,
    call,
    isConnecting,
    error,
    joinCall,
    leaveCall
  } = useConference(
    user.uid,
    userData?.displayName || user.displayName || 'Urkio User',
    userData?.photoURL || user.photoURL
  );

  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!roomId) return;
    setIsJoining(true);
    try {
      await joinCall('default', roomId);
      setHasJoined(true);
    } catch {
      setHasJoined(false);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = () => {
    leaveCall();
    setHasJoined(false);
    navigate('/conference');
  };

  if (!roomId) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center font-body text-white">
        <div className="size-24 bg-red-500/10 rounded-4xl flex items-center justify-center mb-10 border border-red-500/20 shadow-2xl shadow-red-500/10">
          <X className="size-12 text-red-500" />
        </div>
        <h2 className="text-4xl font-headline font-black mb-4 uppercase tracking-tight">Connection Error</h2>
        <p className="text-zinc-500 max-w-sm mb-12 font-medium leading-relaxed">{error}</p>
        <div className="flex gap-6">
          <button
            onClick={() => navigate('/conference')}
            className="px-10 py-5 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all border border-zinc-800"
          >
            ← Exit Hub
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-10 py-5 bg-white text-zinc-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all shadow-xl active:scale-95"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#faf9f6] dark:bg-zinc-950">
        <SetupScreen 
          onJoin={handleJoin} 
          userName={userData?.displayName || user.displayName || 'Urkio User'} 
          isJoining={isJoining}
        />
      </div>
    );
  }

  if (isConnecting || !client || !call) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-10 font-body">
        <div className="relative">
          <div className="size-20 border-t-2 border-e-2 border-ur-primary rounded-full animate-spin" />
          <Sparkles className="size-6 text-ur-primary absolute top-1/2 inset-s-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-headline font-black tracking-[0.3em] uppercase text-xs">Architectural Mesh</p>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Establishing Secure P2P Pipeline...</p>
        </div>
        <button
          onClick={() => { setHasJoined(false); }}
          className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-xl border border-zinc-800 transition-all font-black text-[10px] uppercase tracking-[0.2em]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-body">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme>
            {/* Executive Header Overlay */}
            <div className="absolute top-0 inset-s-0 w-full p-8 flex items-center justify-between z-100 bg-linear-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
              <div className="flex items-center gap-6 pointer-events-auto">
                <div className="size-12 bg-white/5 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                  <Shield className={clsx("size-6", isPrivate ? "text-ur-primary" : "text-emerald-500")} />
                </div>
                <div>
                  <h3 className="font-headline font-black text-xs uppercase tracking-[0.3em] text-white/90">
                    {isPrivate ? 'Clinical Session' : 'Global Hub'}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className={clsx("size-2 rounded-full animate-pulse shadow-lg", isPrivate ? "bg-ur-primary" : "bg-emerald-500")} />
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
                      ID: {roomId} • Limit: {limit} Users
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pointer-events-auto">
                <div className="flex bg-white/5 backdrop-blur-3xl p-1.5 rounded-3xl border border-white/5 shadow-2xl">
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all group"
                  >
                    <LinkIcon className="size-4 group-hover:rotate-45 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Invite</span>
                  </button>

                  <button 
                    onClick={() => setShowChat(!showChat)}
                    className={clsx(
                      "flex items-center gap-3 px-5 py-3 rounded-2xl transition-all group",
                      showChat ? "bg-ur-primary text-white shadow-lg shadow-ur-primary/20" : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <MessageSquare className={clsx("size-4", showChat ? "fill-current" : "")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Chat</span>
                  </button>

                  {isExpert && (
                    <button 
                      onClick={() => setShowReport(!showReport)}
                      className={clsx(
                        "flex items-center gap-3 px-5 py-3 rounded-2xl transition-all group border-is border-white/10",
                        showReport ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <FileText className={clsx("size-4", showReport ? "fill-current" : "")} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Report</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-3xl px-6 py-3 rounded-2xl border border-white/10 relative">
                   <div className="absolute -top-4 inset-s-0 w-full flex justify-center">
                      <SessionTimer 
                        metadata={metadata} 
                        isExpert={isExpert} 
                        onStart={startTimer} 
                        onStop={stopTimer} 
                      />
                   </div>
                  <Users className="size-4 text-ur-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Live Session</span>
                </div>

                <div className="w-px h-8 bg-white/10 mx-2" />

                <button 
                  onClick={handleLeave}
                  className="size-12 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl transition-all group shadow-2xl shadow-red-500/10"
                >
                  <X className="size-6 mx-auto group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex min-h-0 relative mt-24">
              <div className={clsx("flex-1 transition-all duration-700 ease-in-out px-8 pb-8", (showChat || showReport) ? "me-[400px]" : "me-0")}>
                <div className="h-full rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl relative group">
                  <VideoPlayer />
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
                </div>
              </div>

              {/* Editorial Chat Sidebar */}
              <aside className={clsx(
                "w-[400px] bg-zinc-950 border-is border-white/5 transition-all duration-700 ease-in-out absolute inset-e-0 top-0 bottom-0 z-40 transform shadow-2xl",
                showChat ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
              )}>
                <div className="h-full flex flex-col p-8 bg-linear-to-b from-zinc-900/50 to-transparent">
                   <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <MessageSquare className="size-5 text-ur-primary" />
                        <h3 className="font-headline font-black text-xs uppercase tracking-[0.3em]">Live Intelligence</h3>
                      </div>
                      <button onClick={() => setShowChat(false)} className="text-zinc-600 hover:text-white transition-colors">
                        <X className="size-6" />
                      </button>
                   </div>
                   <div className="flex-1 overflow-hidden relative border-is border-white/5 pt-4">
                      <SimpleLiveChat sessionId={roomId} user={user} userData={userData} />
                   </div>
                </div>
              </aside>

              {/* Clinical Report Sidebar */}
              {isExpert && (
                <aside className={clsx(
                  "w-[400px] bg-zinc-950 border-is border-white/5 transition-all duration-700 ease-in-out absolute inset-e-0 top-0 bottom-0 z-40 transform shadow-2xl",
                  showReport ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
                )}>
                  <ClinicalReport 
                    metadata={metadata} 
                    onUpdate={updateReport} 
                    onArchive={archiveReport} 
                    onClose={() => setShowReport(false)} 
                  />
                </aside>
              )}
            </div>

            {/* Premium Control Bar */}
            <div className="pb-8 px-8">
              <ControlBar onLeave={handleLeave} userData={userData} />
            </div>

            <SessionInviteModal 
              isOpen={showInviteModal} 
              onClose={() => setShowInviteModal(false)} 
              roomId={roomId}
              joinUrl={window.location.origin + (window.location.pathname.includes('/conference/') ? (window.location.pathname.endsWith(roomId) ? window.location.pathname : `/conference/${roomId}`) : `/conference/${roomId}`)}
            />
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
}
