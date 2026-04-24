import React, { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, Play, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SetupScreenProps {
  onJoin: () => void;
  userName: string;
  isJoining?: boolean;
}

export function SetupScreen({ onJoin, userName, isJoining = false }: SetupScreenProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function setupDevices() {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(ms);
        if (videoRef.current) {
          videoRef.current.srcObject = ms;
        }
      } catch (err) {
        console.error('Failed to get media devices:', err);
        // We use window.alert if toast isn't available, but App has Toaster
        import('react-hot-toast').then(({ toast }) => {
          toast.error('Camera/Mic access denied. Please check browser permissions and ensure you are on a secure (HTTPS) connection.');
        });
      }
    }
    setupDevices();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleCamera = () => {
    stream?.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    stream?.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
    setIsMicOn(!isMicOn);
  };

  const handleBack = () => {
    stream?.getTracks().forEach(t => t.stop());
    navigate(-1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[92vh] p-6 relative font-body bg-[#faf9f6] dark:bg-zinc-950 overflow-hidden">
      {/* Editorial Backdrop */}
      <div className="absolute top-0 inset-e-0 w-1/2 h-full bg-ur-primary/5 pointer-events-none -skew-x-12 transform translate-x-1/4" />
      
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-10 inset-s-10 flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-ur-primary rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-sm group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-2 transition-transform" />
        Dashboard
      </button>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Branding & Info */}
        <div className="space-y-10 order-2 lg:order-1">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-ur-primary/10 rounded-full">
              <ShieldCheck className="size-4 text-ur-primary" />
              <span className="text-[10px] font-black text-ur-primary uppercase tracking-widest">Secure Entry Point</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-zinc-900 dark:text-white leading-[1.1] tracking-tight truncate">
               Setup your <br /> <span className="text-ur-primary">Clinical Space.</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-md">
              Review your connection standards before joining the architectural mesh. High-fidelity audio and video are enabled by default.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none space-y-6">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                <Sparkles className="size-5 text-ur-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Joining as</p>
                <p className="text-lg font-headline font-black text-zinc-900 dark:text-white truncate">{userName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 transition-all hover:bg-zinc-100 dark:hover:bg-white/10">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="peer appearance-none size-5 rounded-lg border-2 border-zinc-200 dark:border-white/10 checked:bg-ur-primary checked:border-ur-primary transition-all cursor-pointer"
                  />
                  <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                    <svg className="size-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">Professional Conduct Agreement</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                    I agree to the <span className="text-ur-primary underline">Good Behavior Policy</span> and acknowledge that this session is monitored for clinical standards and data is highly secured.
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={() => {
                stream?.getTracks().forEach(t => t.stop());
                onJoin();
              }}
              disabled={isJoining || !acceptedTerms}
              className="w-full py-5 milled-gradient disabled:opacity-50 text-white rounded-2xl font-headline font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-ur-primary/20 active:scale-95 flex items-center justify-center gap-4 overflow-hidden group"
            >
              {isJoining ? (
                <>
                  <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting Mesh...
                </>
              ) : (
                <>
                  Join Secure Session
                  <Play className="size-4 fill-current group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Preview Area */}
        <div className="order-1 lg:order-2">
            <div className="relative aspect-square lg:aspect-[4/5] bg-zinc-900 rounded-[3.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-zinc-900 group">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror grayscale hover:grayscale-0 transition-all duration-700"
                style={{ display: isCameraOn ? 'block' : 'none' }}
              />
              {!isCameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-950/90 backdrop-blur-md">
                  <div className="size-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center border border-zinc-800">
                    <VideoOff className="size-10 text-zinc-700" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Optics Disabled</p>
                </div>
              )}

              {/* Float Controls */}
              <div className="absolute bottom-10 inset-s-1/2 -translate-x-1/2 flex gap-6 p-3 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 group-hover:scale-105 transition-transform duration-500">
                <button
                  onClick={toggleMic}
                  className={`size-14 rounded-2xl flex items-center justify-center transition-all ${
                    isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  }`}
                  title={isMicOn ? 'Mute' : 'Unmute'}
                >
                  {isMicOn ? <Mic className="size-6" /> : <MicOff className="size-6" />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`size-14 rounded-2xl flex items-center justify-center transition-all ${
                    isCameraOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  }`}
                  title={isCameraOn ? 'Stop Camera' : 'Start Camera'}
                >
                  {isCameraOn ? <Video className="size-6" /> : <VideoOff className="size-6" />}
                </button>
              </div>

              {/* Identity Tag */}
              <div className="absolute top-10 inset-s-10 px-4 py-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl">
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Live Preview</span>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
