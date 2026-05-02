import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video, User as UserIcon, Mic, MicOff, VideoOff, Maximize2 } from 'lucide-react';
import clsx from 'clsx';

interface CallInterfaceProps {
  status: 'ringing' | 'calling' | 'active';
  type: 'audio' | 'video';
  partner: {
    uid: string;
    displayName: string;
    photoURL?: string;
  };
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
}

export function CallInterface({ status, type, partner, onAccept, onDecline, onEnd }: CallInterfaceProps) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: any;
    if (status === 'active') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-100 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-500">
      <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-6xl p-12 flex flex-col items-center text-center shadow-2xl overflow-hidden relative">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 inset-s-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -inset-s-1/2 w-full h-full bg-teal-500/10 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-1/2 -inset-e-1/2 w-full h-full bg-indigo-500/10 blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="relative mb-12">
          {status === 'ringing' || status === 'calling' ? (
            <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping" />
          ) : null}
          <div className="size-32 rounded-full border-4 border-white/10 p-1 relative z-10">
            {partner.photoURL ? (
              <img 
                src={partner.photoURL} 
                alt={partner.displayName} 
                className="w-full h-full rounded-full object-cover shadow-2xl" 
              />
            ) : (
              <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center">
                <UserIcon className="size-12 text-white/20" />
              </div>
            )}
          </div>
        </div>

        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
          {partner.displayName}
        </h2>
        
        <div className="flex flex-col items-center gap-2 mb-16">
          <p className="text-teal-400 font-bold tracking-[0.2em] uppercase text-[10px]">
            {status === 'ringing' ? 'Incoming Call' : status === 'calling' ? 'Calling...' : 'In Session'}
          </p>
          {status === 'active' && (
            <span className="text-white/60 font-mono text-sm tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
              {formatDuration(duration)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-8">
          {status === 'ringing' ? (
            <>
              <button
                onClick={onDecline}
                className="size-16 rounded-3xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-red-500/20"
              >
                <PhoneOff className="size-6" />
              </button>
              <button
                onClick={onAccept}
                className="size-20 rounded-5xl bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-teal-500/20"
              >
                {type === 'video' ? <Video className="size-8" /> : <Phone className="size-8" />}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <button className="size-14 rounded-2xl bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 transition-all">
                  <MicOff className="size-5" />
                </button>
                <button
                  onClick={onEnd}
                  className="size-20 rounded-5xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-red-500/20"
                >
                  <PhoneOff className="size-8" />
                </button>
                <button className="size-14 rounded-2xl bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 transition-all">
                  <VideoOff className="size-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Action Tooltip */}
        <div className="mt-12 text-[10px] font-black tracking-widest uppercase text-white/20">
          Urkio Secure Communication Protocol v2.4
        </div>
      </div>
    </div>
  );
}
