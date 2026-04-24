import React, { useEffect, useState } from 'react';
import { useHealingSession } from '../healing-suite/hooks/useHealingSession';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SimpleLiveChat } from '../components/messaging/SimpleLiveChat';
import { toast } from 'react-hot-toast';
import { 
  LucideLayoutDashboard, LucideTv, LucideCalendarDays, LucideBrainCircuit, 
  LucideBarChart3, LucideUserPlus, LucideHelpCircle, LucideSettings, 
  LucideVideoOff, LucideVideo, LucideMic, LucideMicOff, LucideCircleDot,
  LucideScreenShare, LucidePenTool, LucidePresentation, LucidePhoneOff, 
  LucideInfo, LucideCopy, LucideFilter, LucideShieldCheck, LucideMoreVertical, LucideSend
} from 'lucide-react';
import { SessionInviteModal } from '../components/messaging/SessionInviteModal';

export function LiveStreamStudio({ user, userData }: { user: any; userData: any }) {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // If there's no roomId, we redirect them to a unique access code immediately to establish 'Instant Call'
  useEffect(() => {
    if (!roomId) {
      const generatedId = `URK-${Math.floor(1000 + Math.random() * 9000)}-XZ`;
      navigate(`/conference/${generatedId}`, { replace: true });
    }
  }, [roomId, navigate]);

  const activeRoomId = roomId || 'anonymous_live';
  
  // Everyone is a 'host' for instant calls right now, or we can use audience if not expert. 
  // For the 'generate code and invite' feature to work interchangeably, everyone gets broadcast capability.
  const sessionRole = 'host';
  
  // Use the Agora hook for a 'broadcast' session (up to 100 users)
  const {
     connectionState,
     remoteUsers,
     localVideoTrack,
     localAudioTrack,
     isMuted,
     isCameraOff,
     isScreenSharing,
     isRecording,
     networkQuality,
     error,
     join,
     leave,
     toggleMute,
     toggleCamera,
     toggleScreenShare,
     startRecording,
     stopRecording,
  } = useHealingSession(
     activeRoomId,
     'broadcast',
     // We need to pass a number for Agora UID, so we generate a random one or hash the UID. 
     // For simplicity here, Math.abs hash of the string, or just a large random.
     Math.floor(Math.random() * 1000000), 
     sessionRole
  );

  const [sessionActive, setSessionActive] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const accessCode = activeRoomId;
  const [duration, setDuration] = useState(0);

  // Auto-connect or wait for Manual Publish
  const handlePublish = async () => {
    if (!sessionActive) {
      toast('Connecting to Antigravity Studio...');
      await join();
      setSessionActive(true);
    } else {
      await leave();
      setSessionActive(false);
      setDuration(0);
      toast.success('Session ended successfully');
      // Redirect to dashboard after a short delay
      setTimeout(() => navigate('/specialist-dashboard'), 1500);
    }
  };

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error(`Studio Error: ${error}`);
    }
  }, [error]);

  // Duration Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (sessionActive && connectionState === 'CONNECTED') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, connectionState]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Mount local video track manually
  useEffect(() => {
    if (localVideoTrack && !isCameraOff) {
      const container = document.getElementById('local-video-container');
      if (container) {
          container.innerHTML = '';
          localVideoTrack.play(container);
      }
    }
  }, [localVideoTrack, isCameraOff]);

  const copyAccessCode = () => {
    navigator.clipboard.writeText(accessCode);
    toast.success('Access code copied!');
  };

  const handleInvite = () => {
    setShowInviteModal(true);
  };

  return (
    <div className="bg-[#101319] text-[#e1e2ea] overflow-hidden selection:bg-[#a8c8ff] selection:text-[#003062] min-h-screen relative font-manrope">
      
      {/* Antigravity Background Elements (using standard tailwind arbitrary values since custom config wasn't saved globally in our setup) */}
      <div className="absolute w-96 h-96 bg-msgr-primary-container/20 top-[-10%] left-[-10%] blur-[120px] rounded-full z-0 pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] bg-[#5f5db2]/10 bottom-[-20%] right-[-10%] blur-[120px] rounded-full z-0 pointer-events-none"></div>
      
      <div className="flex h-screen relative z-10">
        
        {/* SideNavBar Component */}
        <aside className="w-64 bg-slate-950/60 backdrop-blur-3xl flex flex-col h-full py-8 gap-4 shadow-2xl shadow-blue-900/10 border-r border-white/5 shrink-0">
          <div className="px-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-msgr-primary-container flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-xl">U</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-none">Urkio Studio</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Expert Mode</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 space-y-1">
            <Link to="/specialist-dashboard" className="text-slate-500 hover:text-slate-300 py-3 px-6 flex items-center gap-3 hover:bg-white/5 rounded-full transition-colors translate-x-1">
              <LucideLayoutDashboard className="size-5" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Dashboard</span>
            </Link>
            <Link to="/conference" className="bg-blue-600/20 text-blue-400 border-r-4 border-blue-500 rounded-r-full py-3 px-6 flex items-center gap-3 translate-x-1">
              <LucideTv className="size-5" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Sessions</span>
            </Link>
            <Link to="/agenda" className="text-slate-500 hover:text-slate-300 py-3 px-6 flex items-center gap-3 hover:bg-white/5 rounded-full transition-colors translate-x-1">
              <LucideCalendarDays className="size-5" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Schedule</span>
            </Link>
            <Link to="/expert-list" className="text-slate-500 hover:text-slate-300 py-3 px-6 flex items-center gap-3 hover:bg-white/5 rounded-full transition-colors translate-x-1">
              <LucideBrainCircuit className="size-5" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Experts</span>
            </Link>
            <Link to="/admin/beta-insights" className="text-slate-500 hover:text-slate-300 py-3 px-6 flex items-center gap-3 hover:bg-white/5 rounded-full transition-colors translate-x-1">
              <LucideBarChart3 className="size-5" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Analytics</span>
            </Link>
          </nav>
          
          <div className="px-6 mb-6">
            <button onClick={handleInvite} className="w-full py-3 rounded-full bg-msgr-primary-container text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-blue-600 active:scale-95 transition-all">
              <LucideUserPlus className="size-4" />
              Invite Guest
            </button>
          </div>
          
          <div className="mt-auto flex flex-col gap-1">
            <Link to="/landing" className="text-slate-500 hover:text-slate-300 py-3 px-6 flex items-center gap-3 hover:bg-white/5 rounded-full transition-colors">
              <LucideHelpCircle className="size-5" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Support</span>
            </Link>
            <Link to={`/user/${user?.uid}?tab=settings`} className="text-slate-500 hover:text-slate-300 py-3 px-6 flex items-center gap-3 hover:bg-white/5 rounded-full transition-colors">
              <LucideSettings className="size-5" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Settings</span>
            </Link>
          </div>
        </aside>
        
        {/* Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* TopNavBar Component */}
          <header className="bg-slate-900/40 backdrop-blur-2xl text-blue-600 border-b border-white/5 shadow-lg shadow-black/20 flex justify-between items-center w-full px-6 py-3 shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-black bg-linear-to-r from-blue-600 to-msgr-primary-container bg-clip-text text-transparent opacity-80">Urkio</h1>
              <div className="h-4 w-px bg-white/10"></div>
              <p className="tracking-tight leading-relaxed text-sm text-[#c1c6d4] italic">Your Journey Within</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex gap-2">
                <button onClick={toggleCamera} className="p-2 rounded-full hover:bg-white/5 text-[#c1c6d4] transition-all duration-300">
                  {isCameraOff ? <LucideVideoOff className="size-5 text-red-400" /> : <LucideVideo className="size-5" />}
                </button>
                <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/5 text-[#c1c6d4] transition-all duration-300">
                  {isMuted ? <LucideMicOff className="size-5 text-red-400" /> : <LucideMic className="size-5" />}
                </button>
                <button onClick={() => isRecording ? stopRecording() : startRecording()} className={`p-2 rounded-full hover:bg-white/5 transition-all duration-300 ${isRecording ? 'text-red-500 animate-pulse' : 'text-[#c1c6d4]'}`}>
                  <LucideCircleDot className={`size-5 ${isRecording ? 'fill-current' : ''}`} />
                </button>
                <button onClick={() => toast.success('Settings menu opened')} className="p-2 rounded-full hover:bg-white/5 text-[#c1c6d4] transition-all duration-300">
                  <LucideSettings className="size-5" />
                </button>
              </div>
              
              <button 
                onClick={handlePublish}
                className={`px-6 py-1.5 rounded-full font-bold text-sm shadow-lg active:scale-90 transition-transform ${sessionActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {sessionActive ? 'End Session' : 'Publish'}
              </button>
              
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-slate-800 flex items-center justify-center">
                {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Expert Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xs font-bold text-slate-400">{userData?.fullName?.[0] || 'U'}</span>
                )}
              </div>
            </div>
          </header>
          
          {/* Main Content Area: Bento Layout */}
          <section className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
            
            {/* Left Column: Primary Broadcast */}
            <div className="col-span-8 flex flex-col gap-6 overflow-hidden">
              
              {/* Main Broadcast Window */}
              <div className="relative flex-1 bg-[#191c21] rounded-2xl overflow-hidden group border border-white/5 shadow-2xl">
                {isCameraOff || !sessionActive ? (
                   <div className="w-full h-full flex items-center justify-center opacity-40 bg-linear-to-b from-[#191c21] to-black">
                      <LucideVideoOff className="size-24 text-slate-700" />
                   </div>
                ) : (
                   <div id="local-video-container" className="w-full h-full object-cover opacity-90 transition-opacity"></div>
                )}
                
                {/* Video Overlays */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      {sessionActive && (
                        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          Live
                        </div>
                      )}
                      
                      <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                        <LucideTv className="size-3" />
                        {remoteUsers.length} Watching
                      </div>
                      
                      {networkQuality !== 'unknown' && (
                          <div className={`bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${networkQuality === 'excellent' ? 'text-green-400' : networkQuality === 'good' ? 'text-yellow-400' : 'text-red-400'}`}>
                             {networkQuality} Ping
                          </div>
                      )}
                    </div>
                    
                    {sessionActive && (
                      <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        {formatDuration(duration)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center pointer-events-auto">
                    <div className="bg-slate-900/60 backdrop-blur-2xl p-2 rounded-full border border-white/5 flex gap-1 shadow-2xl transition-transform hover:scale-105">
                      <button onClick={toggleScreenShare} className={`p-3 rounded-full transition-colors ${isScreenSharing ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-white'}`}>
                        <LucideScreenShare className="size-5" />
                      </button>
                      <button onClick={() => toast.success('Whiteboard tools activated')} className="p-3 rounded-full hover:bg-white/10 text-white transition-colors">
                        <LucidePenTool className="size-5" />
                      </button>
                      <button onClick={() => toast.success('Presentation mode engaged')} className="p-3 rounded-full hover:bg-white/10 text-white transition-colors">
                        <LucidePresentation className="size-5" />
                      </button>
                      <div className="w-px bg-white/10 mx-1 my-2"></div>
                      <button onClick={handlePublish} className="p-3 rounded-full bg-[#93000a] text-[#ffb4ab] hover:bg-red-800 transition-colors">
                        <LucidePhoneOff className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Session Management Controls */}
              <div className="h-24 bg-[#191c21] backdrop-blur-md rounded-2xl flex items-center justify-between px-8 border border-white/5 shadow-xl shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Current Session</span>
                  <h3 className="font-bold text-white tracking-tight">Expert Broadcast Mode</h3>
                  <p className="text-xs text-slate-500 mt-1">Status: {connectionState}</p>
                </div>
                
                <div className="flex gap-4">
                  <button 
                     onClick={isRecording ? stopRecording : startRecording}
                     disabled={!sessionActive}
                     className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 border ${isRecording ? 'border-red-500 text-red-500 hover:bg-red-500/10' : 'border-[#414752] text-[#c1c6d4] hover:bg-white/5'} disabled:opacity-50`}
                  >
                     {isRecording ? 'Stop Recording' : 'Save to Vault'}
                  </button>
                </div>
              </div>
              
            </div>
            
            {/* Right Column: Interaction & Invite */}
            <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
              
              {/* Invite Panel */}
              <div className="bg-[#1d2026] rounded-2xl p-6 border border-white/5 flex flex-col gap-4 shadow-xl shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Invite Panel</span>
                  <LucideInfo className="text-slate-500 size-4" />
                </div>
                
                <div className="bg-[#32353b] rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-xs text-[#c1c6d4] font-medium">Generate Private Access Code</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#191c21] px-4 py-3 rounded-lg font-mono text-[#a8c8ff] font-bold tracking-widest border border-white/5 select-all">
                        {accessCode}
                    </div>
                    <button onClick={copyAccessCode} className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                      <LucideCopy className="text-white size-5" />
                    </button>
                  </div>
                </div>
                
                <button onClick={handleInvite} className="w-full py-3 rounded-full bg-white/5 text-[#e1e2ea] font-bold text-sm hover:bg-white/10 transition-colors border border-white/5">
                    Send to Users
                </button>
              </div>
              
              {/* Participant Interaction */}
              <div className="flex-1 bg-[#1d2026] rounded-2xl flex flex-col overflow-hidden border border-white/5 shadow-xl">
                <div className="p-6 border-b border-white/5 shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Participants ({remoteUsers.length})</span>
                    <button onClick={() => toast.success('Participant filters opened')} className="hover:bg-white/10 p-1 rounded-md transition-colors">
                      <LucideFilter className="text-slate-500 size-4" />
                    </button>
                  </div>
                  
                  {/* Community Agreement Status */}
                  <div className="flex items-center gap-3 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                    <LucideShieldCheck className="text-green-400 size-6" />
                    <div>
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest leading-none mb-1">Community Safe</p>
                      <p className="text-[10px] text-green-400/80 font-medium leading-none">All agreements signed</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  
                  {remoteUsers.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-50">
                          <LucideTv className="size-8 text-slate-500 mb-2" />
                          <p className="text-xs text-slate-400">Waiting for participants to join...</p>
                      </div>
                  ) : (
                      remoteUsers.map((u, i) => (
                        <div key={u.uid} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors cursor-pointer group">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300">
                                {u.uid.toString().substring(0,2)}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1d2026]"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-[#e1e2ea]">User {u.uid.toString().substring(0,4)}</p>
                            <p className="text-[10px] text-[#c1c6d4] uppercase tracking-wider font-medium">Participant</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toast.success('User options opened'); }} className="hover:bg-white/10 p-1 rounded-md transition-colors">
                            <LucideMoreVertical className="text-[#c1c6d4] size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </div>
                      ))
                  )}
                  
                </div>
                
                {/* Mini Chat/Interaction Box using fully active DB mapping */}
                <div className="h-64 border-t border-white/5 shrink-0 bg-[#0c0d12]">
                  <SimpleLiveChat sessionId={activeRoomId} user={user} userData={userData} />
                </div>
              </div>
              
            </div>
            
          </section>
        </main>
      </div>

      <SessionInviteModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={activeRoomId}
        joinUrl={`${window.location.origin}/room/${activeRoomId}`}
      />
    </div>
  );
}
