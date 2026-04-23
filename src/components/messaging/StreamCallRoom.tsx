import React, { useState, useEffect } from 'react';
import { StreamVideo, StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import { useConference } from '../../conference/hooks/useConference';
import { SetupScreen } from '../../conference/components/SetupScreen';
import { VideoPlayer } from '../../conference/components/VideoPlayer';
import { ControlBar } from '../../conference/components/ControlBar';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useSearchParams } from 'react-router-dom';
import { X, Shield, Users, Link as LinkIcon, Check, MessageSquare, PhoneOff, Lock, Key, ArrowRight, RefreshCw } from 'lucide-react';
import { SessionInviteModal } from '../../components/messaging/SessionInviteModal';
import { SimpleLiveChat } from '../../components/messaging/SimpleLiveChat';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface StreamCallRoomProps {
  callId: string;
  user: any;
  userData: any;
  type: 'audio' | 'video';
  onLeaveRoom: () => void;
}

export function StreamCallRoom({ callId, user, userData, type, onLeaveRoom }: StreamCallRoomProps) {
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.get('code');
  
  const [hasJoined, setHasJoined] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [inputCode, setInputCode] = useState(urlCode || '');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

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

  useEffect(() => {
    const verifySession = async () => {
      try {
        const q = query(
          collection(db, 'sessions'),
          where('roomId', '==', callId),
          where('active', '==', true)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          // No active secure session, treat as regular call
          setIsVerified(true);
          setIsVerifying(false);
          return;
        }

        const sessionData = snapshot.docs[0].data();
        
        // If host or valid code provided via URL, auto-verify
        if (sessionData.hostId === user.uid || (urlCode && sessionData.accessCode === urlCode)) {
          setIsVerified(true);
        }
      } catch (err) {
        console.error("Error verifying session:", err);
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [callId, user.uid, urlCode]);

  const handleManualVerify = async () => {
    setIsVerifying(true);
    setVerificationError(null);
    try {
      const q = query(
        collection(db, 'sessions'),
        where('roomId', '==', callId),
        where('active', '==', true)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setIsVerified(true);
        return;
      }

      const sessionData = snapshot.docs[0].data();
      if (sessionData.accessCode === inputCode) {
        setIsVerified(true);
        toast.success("Identity Verified");
      } else {
        setVerificationError("Invalid access code. Please check and try again.");
        toast.error("Invalid Code");
      }
    } catch (err) {
      setVerificationError("Failed to verify access. Connection error.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleJoin = async () => {
    if (callId) {
      setIsJoining(true);
      try {
        await joinCall(type === 'audio' ? 'default' : 'default', callId); // Stream call types are flexible
        setHasJoined(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsJoining(false);
      }
    }
  };

  const handleLeave = async () => {
    await leaveCall();
    
    // Sync with Ringing System
    const q = query(
      collection(db, 'calls'),
      where('roomId', '==', callId),
      where('status', 'in', ['calling', 'accepted'])
    );
    const snap = await getDocs(q);
    const updates = snap.docs.map(d => updateDoc(d.ref, { status: 'ended' }));
    await Promise.all(updates);

    setHasJoined(false);
    onLeaveRoom();
  };

  const handleEndCall = async () => {
    if (!call) return;
    try {
      const isSpecialist = userData?.role === 'specialist' || 
                           ['admin', 'management', 'founder', 'expert', 'verifiedexpert', 'psychologist', 'practitioner'].includes(userData?.role || '') ||
                           userData?.email === 'urkio@urkio.com';
      
      // 1. End in Stream
      if (isSpecialist) {
        await call.endCall();
      } else {
        await call.leave();
      }

      // 2. Sync with Ringing System (CallContext)
      const q = query(
        collection(db, 'calls'),
        where('roomId', '==', callId),
        where('status', 'in', ['calling', 'accepted'])
      );
      const snap = await getDocs(q);
      const updates = snap.docs.map(d => updateDoc(d.ref, { 
        status: 'ended', 
        endedAt: serverTimestamp(),
        endedBy: user.uid 
      }));
      await Promise.all(updates);

    } catch (err) {
      console.error('Failed to end/leave call:', err);
    } finally {
      setHasJoined(false);
      onLeaveRoom();
    }
  };

  // Invitation and Chat logic handled by modals and sidebar state

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="size-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
          <X className="size-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Connection Error</h2>
        <p className="text-slate-400 max-w-sm mb-10">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-slate-200 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 md:p-16 overflow-hidden w-full max-w-md">
          <div className="absolute top-0 inset-e-0 w-32 h-32 bg-primary/5 rounded-full -mie-16 -mt-16 blur-3xl opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-10">
            <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20 relative group">
              <Lock className="size-8 text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -inset-e-1 size-3 bg-teal-500 rounded-full border-2 border-white dark:border-surface-dark animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">Secure Unlock</h2>
            <p className="text-slate-500 font-medium px-4 text-sm">Enter the 6-digit access code sent by your healer to enter this session.</p>
          </div>

          <div className="space-y-6 mt-10">
            <div className="relative">
              <div className="absolute inset-y-0 inset-s-5 flex items-center pointer-events-none">
                <Key className="size-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className={clsx(
                  "w-full ps-14 pe-6 py-5 bg-slate-50 dark:bg-background-dark border text-2xl font-mono tracking-[0.5em] font-black text-center rounded-2xl outline-none transition-all",
                  verificationError ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-500" : "border-slate-100 dark:border-white/5 focus:ring-4 focus:ring-primary/10 focus:border-primary/40 dark:text-white"
                )}
              />
            </div>

            {verificationError && (
              <p className="text-center text-xs font-bold text-red-500 animate-bounce">{verificationError}</p>
            )}

            <button 
              onClick={handleManualVerify}
              disabled={isVerifying || inputCode.length < 6}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/30 hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-3"
            >
              {isVerifying ? (
                <div className="size-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Verify Access
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>

          <button 
            onClick={onLeaveRoom}
            className="w-full mt-6 py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold transition-colors"
          >
            Cancel and Return
          </button>
        </div>
        
        <p className="mt-12 text-[10px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Shield className="size-3" />
          HIPAA COMPLIANT END-TO-END ENCRYPTION ACTIVE
        </p>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950">
        <SetupScreen 
          onJoin={handleJoin} 
          userName={userData?.displayName || user.displayName || 'Urkio User'} 
          isJoining={isJoining}
        />
        <button 
          onClick={onLeaveRoom}
          className="absolute top-6 inset-e-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all z-50"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  if (isConnecting || !client || !call) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="size-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white font-bold tracking-widest uppercase text-xs animate-pulse">Establishing Secure Connection...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme>
            {/* Room Header Info */}
            <div className="absolute top-0 inset-s-0 w-full p-6 flex items-center justify-between z-100 bg-linear-to-b from-black/60 to-transparent pointer-events-none">
              <div className="flex items-center gap-4 pointer-events-auto">
                <div className="size-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                  <Shield className="size-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Urkio-Session</h3>
                  <p className="text-[10px] text-teal-500/80 font-mono flex items-center gap-1.5 uppercase tracking-widest">
                    <span className="size-1.5 bg-teal-500 rounded-full animate-pulse" /> {type === 'video' ? 'Video' : 'Audio'} Overlay · {callId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pointer-events-auto">
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 group"
                  title="Invite Others to Session"
                >
                  <LinkIcon className="size-4" />
                  <span className="text-xs font-bold">Invite</span>
                </button>

                <button 
                  onClick={() => setShowChat(!showChat)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95",
                    showChat ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                  )}
                  title="Toggle Chat"
                >
                  <MessageSquare className="size-4" />
                  <span className="text-xs font-bold">Chat</span>
                </button>

                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5">
                  <Users className="size-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-300">Live</span>
                </div>

                <button 
                  onClick={handleEndCall}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
                  title={userData?.role === 'specialist' ? "End Session for All" : "Leave Session"}
                >
                  <PhoneOff className="size-4 group-hover:rotate-12 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    {userData?.role === 'specialist' ? "End Session" : "Leave"}
                  </span>
                </button>
              </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex min-h-0 relative">
              {/* Video Mesh */}
              <div className={clsx("flex-1 transition-all duration-300", showChat ? "me-80" : "me-0")}>
                <div className="h-full bg-slate-900 overflow-hidden relative">
                  <VideoPlayer />
                </div>
              </div>

              {/* Chat Sidebar Placeholder */}
              <aside className={clsx(
                "w-80 border-is border-white/10 bg-slate-900/40 backdrop-blur-3xl transition-transform duration-300 absolute inset-e-0 top-0 bottom-0 z-40",
                showChat ? "translate-x-0" : "translate-x-full"
              )}>
                <div className="h-full flex flex-col p-6">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="font-black text-sm tracking-widest uppercase">Live Chat</h3>
                      <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
                        <X className="size-5" />
                      </button>
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <SimpleLiveChat sessionId={callId} user={user} userData={userData} />
                   </div>
                </div>
              </aside>
            </div>

            {/* Control Bar */}
            <ControlBar onLeave={handleLeave} userData={userData} />

            <SessionInviteModal 
              isOpen={showInviteModal} 
              onClose={() => setShowInviteModal(false)} 
              roomId={callId}
              joinUrl={window.location.origin + (window.location.pathname.includes('/room/') ? window.location.pathname : `/room/${callId}`)}
            />
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
}
