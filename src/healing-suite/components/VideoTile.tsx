import React, { useEffect, useRef } from 'react';
import { ILocalVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';
import { MicOff, Shield } from 'lucide-react';

interface VideoTileProps {
  videoTrack?: ILocalVideoTrack | IRemoteVideoTrack;
  isLocal?: boolean;
  isOff?: boolean;
  name: string;
  avatar?: string;
  isMuted?: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  className?: string;
}

export function VideoTile({
  videoTrack, isLocal, isOff, name, avatar, isMuted, isHandRaised, isHost, className = '',
}: VideoTileProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoTrack && ref.current && !isOff) {
      videoTrack.play(ref.current);
      return () => { videoTrack.stop(); };
    }
  }, [videoTrack, isOff]);

  return (
    <div className={`relative bg-[#191c21] rounded-2xl overflow-hidden border border-white/5 group shadow-lg ${className}`}>
      {/* Video Content */}
      {!isOff && videoTrack ? (
        <div 
          ref={ref} 
          className={`w-full h-full object-cover ${isLocal ? 'video-mirror-transform' : ''}`} 
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#1d2026]">
          {avatar
            ? <img src={avatar} alt={name} className="size-16 rounded-full border-2 border-white/10 object-cover opacity-80" />
            : <div className="size-16 rounded-full bg-slate-800 border-2 border-white/5 flex items-center justify-center text-2xl font-black text-slate-500">
                {name?.[0]?.toUpperCase()}
              </div>
          }
          <p className="mt-3 text-[10px] uppercase font-black tracking-widest text-slate-600">Feed Inactive</p>
        </div>
      )}

      {/* Glass Metadata Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-white text-[10px] font-bold">{name}</span>
              {isLocal && <span className="text-white/40 text-[9px] font-bold">(You)</span>}
              {isHost && <Shield className="size-3 text-[#a8c8ff]" />}
           </div>
           {isMuted && <MicOff className="size-3 text-red-500" />}
        </div>
      </div>

      {/* Minimal Static Tag (Alternative to Hover) */}
      <div className="absolute bottom-2 left-2 text-[10px] bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/5 font-bold tracking-tight pointer-events-none">
        {name}
      </div>

      {/* Hand raised indicator */}
      {isHandRaised && (
        <div className="absolute top-3 right-3 bg-[#a8c8ff] text-[#001b3d] p-1.5 rounded-lg animate-bounce shadow-xl scale-75 origin-top-right">
          <span className="text-sm">✋</span>
        </div>
      )}
    </div>
  );
}

/* ─── Adaptive Participant Grid ────────────────────────────────────────────── */
interface ParticipantGridProps {
  children: React.ReactNode;
  count: number;
  mode: 'private' | 'group' | 'broadcast';
}

export function ParticipantGrid({ children }: ParticipantGridProps) {
  // Overhauled for a horizontal strip layout at the bottom
  return (
    <div className="flex items-center gap-4 h-full overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
       {children}
    </div>
  );
}
