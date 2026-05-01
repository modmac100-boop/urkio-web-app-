import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Maximize2, Minimize2, Settings, ShieldCheck,
  MoreVertical, User, MessageSquare, Plus,
  Sparkles, Activity, Zap, Circle, Square,
  UserPlus, Maximize, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

interface VideoPlayerProps {
  videoTrack?: any;
  audioTrack?: any;
  isLocal?: boolean;
  name?: string;
  isOff?: boolean;
  isMuted?: boolean;
  isPremium?: boolean;
  className?: string;
  onToggleMic?: () => void;
  onToggleVideo?: () => void;
  onLeave?: () => void;
  onInvite?: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
  statusText?: string;
  activeBiometric?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoTrack,
  audioTrack,
  isLocal,
  name = 'Participant',
  isOff,
  isMuted,
  isPremium = true,
  className,
  onToggleMic,
  onToggleVideo,
  onLeave,
  onInvite,
  onStartRecording,
  onStopRecording,
  isRecording = false,
  statusText = 'Secure Stream',
  activeBiometric
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoTrack && containerRef.current && !isOff) {
      videoTrack.play(containerRef.current);
    }
    return () => {
      if (videoTrack) videoTrack.stop();
    };
  }, [videoTrack, isOff]);

  const toggleFullscreen = () => {
    if (!playerRef.current) return;

    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <motion.div 
      ref={playerRef}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        "relative rounded-4xl overflow-hidden group shadow-3xl border border-white/5 bg-ur-on-surface transition-all duration-500",
        isFullscreen ? "fixed inset-0 z-9999 rounded-none" : "h-full",
        className
      )}
    >
      {/* Immersive Backdrop for Video-Off */}
      <AnimatePresence>
        {isOff && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-surface-container-lowest to-surface-container-low z-10"
          >
             <div className="relative mb-8">
                <div className="size-24 rounded-4xl bg-white/5 border border-white/10 flex items-center justify-center animate-float">
                   <User className="w-10 h-10 text-ur-primary opacity-40" />
                </div>
                <div className="absolute inset-0 rounded-4xl bg-ur-primary/10 blur-3xl animate-pulse" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ur-primary/60">Stream Obfuscated</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Canvas */}
      <div ref={containerRef} className="w-full h-full object-cover" />

      {/* Glass Overlay UI */}
      <div className="absolute inset-0 z-20 pointer-events-none p-10 flex flex-col justify-between">
         
         {/* Top Meta Info */}
         <div className="flex justify-between items-start pointer-events-auto">
            <div className="flex flex-col gap-3">
               <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
                  <div className={clsx("size-2.5 rounded-full", isOff ? "bg-red-500" : "bg-ur-primary animate-pulse")} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{name}</span>
               </div>
               
               {isRecording && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 w-fit"
                  >
                     <Circle className="w-3 h-3 text-red-500 fill-current animate-pulse" />
                     <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Recording Active</span>
                  </motion.div>
               )}

               {activeBiometric && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-ur-primary/10 backdrop-blur-md border border-ur-primary/20 w-fit">
                     <Activity className="w-4 h-4 text-ur-primary" />
                     <span className="text-[10px] font-black text-ur-primary">{activeBiometric} BPM</span>
                  </div>
               )}
            </div>

            <div className="flex items-center gap-3">
               <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <ShieldCheck className="w-4 h-4 text-ur-tertiary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-ur-tertiary">Encrypted Channel</span>
               </div>
               <button 
                 onClick={toggleFullscreen}
                 className="p-3.5 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 shadow-2xl"
               >
                  {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
               </button>
            </div>
         </div>

         {/* Bottom Action Bar */}
         <div className="flex justify-center items-center gap-6 pointer-events-auto opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-6 group-hover:translate-y-0">
            <div className="flex items-center gap-4 px-8 py-4 rounded-4xl bg-black/50 backdrop-blur-3xl border border-white/10 shadow-3xl">
               <button 
                 onClick={onToggleMic}
                 title={isMuted ? "Unmute" : "Mute"}
                 className={clsx(
                   "size-14 rounded-2xl flex items-center justify-center transition-all hover:scale-110",
                   isMuted ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-white/5 text-white hover:bg-white/10 border border-white/5"
                 )}
               >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
               </button>
               <button 
                 onClick={onToggleVideo}
                 title={isOff ? "Turn Camera On" : "Turn Camera Off"}
                 className={clsx(
                   "size-14 rounded-2xl flex items-center justify-center transition-all hover:scale-110",
                   isOff ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-white/5 text-white hover:bg-white/10 border border-white/5"
                 )}
               >
                  {isOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
               </button>
               
               <div className="w-px h-10 bg-white/10 mx-2" />

               {onStartRecording && (
                  <button 
                    onClick={isRecording ? onStopRecording : onStartRecording}
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                    className={clsx(
                      "size-14 rounded-2xl flex items-center justify-center transition-all hover:scale-110",
                      isRecording ? "bg-red-500 text-white shadow-xl shadow-red-500/20" : "bg-white/5 text-white hover:bg-white/10 border border-white/5"
                    )}
                  >
                     {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5 fill-red-500 text-red-500" />}
                  </button>
               )}

               {onInvite && (
                  <button 
                    onClick={onInvite}
                    title="Invite Participants"
                    className="size-14 rounded-2xl bg-ur-primary/10 text-ur-primary flex items-center justify-center hover:bg-ur-primary hover:text-ur-on-surface hover:scale-110 active:scale-95 transition-all shadow-xl shadow-ur-primary/10 border border-ur-primary/20"
                  >
                     <UserPlus className="w-6 h-6" />
                  </button>
               )}

               <div className="w-px h-10 bg-white/10 mx-2" />

               <button 
                 onClick={onLeave}
                 title="Leave Session"
                 className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all shadow-2xl shadow-red-600/40 hover:scale-105 active:scale-95"
               >
                  <PhoneOff className="w-6 h-6" />
               </button>
            </div>

            {/* Extra Tools */}
            <div className="flex flex-col gap-3">
               <button 
                 onClick={onInvite}
                 title="Share Session Link"
                 className="p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all shadow-2xl"
               >
                  <Share2 className="w-5 h-5 text-white" />
               </button>
               <button 
                 onClick={() => toast.success('Clinical Suite Settings v4.0.0')}
                 title="Studio Settings"
                 className="p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all shadow-2xl"
               >
                  <Settings className="w-5 h-5 text-white" />
               </button>
            </div>
         </div>
      </div>

      {/* Aesthetic Overlays */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-ur-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-ur-tertiary/5 blur-[120px] pointer-events-none" />
    </motion.div>
  );
};
