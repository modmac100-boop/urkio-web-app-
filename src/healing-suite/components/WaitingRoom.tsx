import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, ArrowRight, Shield, Check } from 'lucide-react';
import AgoraRTC, { ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

interface WaitingRoomProps {
  sessionId: string;
  practitionerName?: string;
  sessionMode: 'private' | 'group' | 'broadcast';
  role: 'host' | 'audience';
  userName: string;
  userAvatar?: string;
  onEnterSession: () => void;
  isEntering?: boolean;
}

export function WaitingRoom({
  sessionId, practitionerName, userName, userAvatar, onEnterSession, isEntering,
}: WaitingRoomProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [localVideo, setLocalVideo] = useState<ICameraVideoTrack | null>(null);
  const [localAudio, setLocalAudio] = useState<IMicrophoneAudioTrack | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Initialize local preview tracks
  useEffect(() => {
    let vidTrack: ICameraVideoTrack, audTrack: IMicrophoneAudioTrack;
    (async () => {
      try {
        [audTrack, vidTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, ANS: true, AGC: true },
          { encoderConfig: '720p_1' } // Higher quality for preview
        ) as [IMicrophoneAudioTrack, ICameraVideoTrack];
        setLocalVideo(vidTrack);
        setLocalAudio(audTrack);
        if (videoRef.current) vidTrack.play(videoRef.current);
      } catch (err) {
        console.warn('[WaitingRoom] Camera/Mic access denied:', err);
      }
    })();
    return () => {
      vidTrack?.stop(); vidTrack?.close();
      audTrack?.stop(); audTrack?.close();
    };
  }, []);

  const toggleMute = async () => {
    if (!localAudio) return;
    await (localAudio as IMicrophoneAudioTrack).setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleCamera = async () => {
    if (!localVideo) return;
    await (localVideo as ICameraVideoTrack).setMuted(!isCameraOff);
    setIsCameraOff(!isCameraOff);
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface relative overflow-hidden flex flex-col font-sans selection:bg-primary/20">
      <style>{`
        .antigravity-orb {
            position: absolute;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            background: radial-gradient(circle, var(--hmoii-primary) 0.15, transparent 0.7);
            filter: blur(60px);
            z-index: 0;
        }
      `}</style>

      {/* Ambient Orbs */}
      <div className="antigravity-orb top-[-10%] left-[-5%]"></div>
      <div className="antigravity-orb bottom-[-10%] right-[-5%] opacity-60"></div>

      {/* Main Entry Canvas */}
      <main className="grow flex items-center justify-center p-6 md:p-12 relative z-10">
        
        {/* Asymmetrical Background Element */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 hidden md:block">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[819px] border-[0.5px] border-white/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[614px] border-[0.5px] border-white/5 rounded-full"></div>
        </div>

        <div className="w-full max-w-6xl z-10 grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Camera Preview (Zen View) */}
          <div className="space-y-8">
            <div className="relative aspect-video bg-hmoii-surface-container/40 backdrop-blur-2xl rounded-4xl overflow-hidden border border-white/5 shadow-2xl group">
              <div ref={videoRef} className="w-full h-full object-cover" />
              {isCameraOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest/90 backdrop-blur-3xl">
                  {userAvatar
                    ? <img src={userAvatar} alt={userName} className="size-24 rounded-full object-cover border-4 border-white/10 shadow-xl" />
                    : <div className="size-24 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-4xl font-bold text-primary">{userName?.[0]?.toUpperCase()}</div>
                  }
                  <p className="mt-4 text-on-surface-variant text-sm font-bold uppercase tracking-widest">Camera Off</p>
                </div>
              )}
              
              {/* Overlay Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-950/40 backdrop-blur-xl p-2 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button onClick={toggleMute} className={`p-3 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-white'}`}>
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button onClick={toggleCamera} className={`p-3 rounded-full transition-all ${isCameraOff ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-white'}`}>
                  {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              </div>

              {/* Expert Name Tag Style */}
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-slate-950/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-hmoii-primary">You</span>
                <span className="text-sm font-bold">{userName}</span>
              </div>
            </div>

            <div className="flex items-center gap-6 justify-center text-on-surface-variant/50">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <Shield className="size-4" /> Secure Session
              </div>
              <div className="h-1 w-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> HD Active
              </div>
            </div>
          </div>

          {/* Right Side: Join Interface (Antigravity Design) */}
          <div className="bg-hmoii-surface-container/40 backdrop-blur-2xl rounded-4xl p-10 md:p-14 shadow-2xl relative overflow-hidden">
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter text-on-surface mb-6 leading-none">
                Enter Your <br/><span className="text-hmoii-primary">Healing Space</span>
              </h1>
              <p className="text-on-surface-variant font-medium text-lg max-w-sm leading-relaxed opacity-80">
                {practitionerName ? `Facilitated by ${practitionerName}` : 'Secure, end-to-end encrypted therapeutic direct line.'}
              </p>
            </div>

            <div className="space-y-10">
              {/* Session Code Area */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-hmoii-primary">Session Code</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/5 border-b-2 border-white/10 py-4 px-1 text-3xl tracking-[0.4em] font-headline font-black text-on-surface focus-within:border-hmoii-primary transition-all duration-300">
                    {sessionId.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Behavior Agreement */}
              <div onClick={() => setAgreedToTerms(!agreedToTerms)} className="flex items-start gap-4 group cursor-pointer select-none">
                <div className={`mt-1 size-6 rounded border transition-all flex items-center justify-center ${agreedToTerms ? 'bg-hmoii-primary border-hmoii-primary' : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}>
                  {agreedToTerms && <Check className="size-4 text-hmoii-on-primary stroke-4" />}
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                  I agree to the <span className="text-on-surface font-bold underline decoration-hmoii-primary/30 underline-offset-4">Terms & Conditions</span> and represent a spirit of good behavior during this shared session.
                </p>
              </div>

              {/* Join Button */}
              <button 
                onClick={onEnterSession}
                disabled={!agreedToTerms || isEntering}
                className="w-full py-6 rounded-full bg-linear-to-r from-hmoii-primary-container to-hmoii-primary text-hmoii-on-primary font-headline font-black text-lg tracking-tight hover:shadow-[0px_0px_32px_rgba(10,102,194,0.4)] active:scale-[0.98] disabled:opacity-30 disabled:grayscale transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                {isEntering ? (
                  <span className="flex items-center gap-3">
                    <RefreshCw className="size-6 animate-spin" /> Connecting...
                  </span>
                ) : (
                  <>
                    <span>Join Session</span>
                    <ArrowRight className="size-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Architectural Accent Line */}
            <div className="absolute top-0 right-0 h-32 w-[2px] bg-linear-to-b from-hmoii-primary to-transparent opacity-40"></div>
          </div>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="p-8 mt-auto flex justify-between items-center opacity-40 text-[10px] font-black uppercase tracking-[0.2em] z-10">
        <div>URKIO CONNECT • DIGITAL MIDNIGHT 2.0</div>
        <div className="flex gap-8">
          <span>AES-256</span>
          <span>HIPAA COMPLIANT</span>
        </div>
      </footer>
    </div>
  );
}

const RefreshCw = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);
