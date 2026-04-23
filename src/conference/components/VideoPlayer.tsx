import React from 'react';
import {
  useCallStateHooks,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import { Video, Sparkles } from 'lucide-react';

export function VideoPlayer() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  return (
    <div className="flex-1 w-full h-full p-6 overflow-hidden font-body">
      <div className={`grid gap-8 w-full h-full ${
        participants.length === 1 ? 'grid-cols-1' :
        participants.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
        participants.length <= 4 ? 'grid-cols-2' :
        'grid-cols-2 md:grid-cols-3'
      }`}>
        {participants.map((p) => (
          <div key={p.sessionId} className="relative rounded-[3rem] overflow-hidden bg-zinc-900 shadow-2xl border border-white/5 group transition-all duration-500 hover:scale-[1.01] hover:border-ur-primary/30">
            <ParticipantView 
              participant={p} 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            />
            
            {/* Participant Identity Overlay */}
            <div className="absolute bottom-6 inset-s-6 px-4 py-2 bg-black/40 backdrop-blur-2xl rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
              <span className={p.isLocalParticipant ? 'text-ur-primary' : 'text-white'}>
                {p.name || p.userId}
                {p.isLocalParticipant && ' [Self]'}
              </span>
            </div>

            {/* Precision Muted Indicator */}
            {!p.publishedTracks.includes('audio' as any) && (
              <div className="absolute top-6 inset-e-6 p-2.5 bg-red-500/80 backdrop-blur-md rounded-full text-white shadow-xl shadow-red-500/20">
                <span className="material-symbols-outlined text-[18px] font-black">mic_off</span>
              </div>
            )}

            {/* Connection Standard Badge */}
            <div className="absolute top-6 inset-s-6 px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-2">
                 <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Stable Mesh</span>
               </div>
            </div>
          </div>
        ))}

        {participants.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-10">
            <div className="relative">
              <div className="size-32 bg-ur-primary/5 rounded-[3rem] flex items-center justify-center border border-ur-primary/10 animate-pulse">
                <Video className="size-12 text-ur-primary opacity-40" />
              </div>
              <Sparkles className="size-6 text-ur-primary absolute -top-2 -inset-e-2 animate-bounce" />
            </div>
            <div className="text-center space-y-3">
              <p className="text-white font-headline font-black text-xl uppercase tracking-widest">Waiting for Participants</p>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] font-mono">The architectural mesh is open and secure</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
