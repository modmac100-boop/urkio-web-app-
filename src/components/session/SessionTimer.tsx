import React, { useState, useEffect } from 'react';
import { Play, Square, Timer as TimerIcon, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { SessionMetadata } from '../../hooks/useSessionMetadata';

interface SessionTimerProps {
  metadata: SessionMetadata;
  isExpert: boolean;
  onStart: (duration: number) => void;
  onStop: () => void;
}

/* --- Redesigned SessionTimer to match Urkio Analytical Console --- */
export function SessionTimer({ metadata, isExpert, onStart, onStop }: SessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(metadata.timerDuration);
  const [customDuration, setCustomDuration] = useState(60);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (metadata.timerStatus === 'running' && metadata.timerStartTime) {
      const elapsed = Math.floor((Date.now() - metadata.timerStartTime) / 1000);
      const remaining = Math.max(0, metadata.timerDuration - elapsed);
      setTimeLeft(remaining);

      interval = setInterval(() => {
        const newElapsed = Math.floor((Date.now() - metadata.timerStartTime!) / 1000);
        const newRemaining = Math.max(0, metadata.timerDuration - newElapsed);
        setTimeLeft(newRemaining);
        
        if (newRemaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    } else {
      setTimeLeft(metadata.timerDuration);
    }

    return () => clearInterval(interval);
  }, [metadata.timerStatus, metadata.timerStartTime, metadata.timerDuration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const percentage = (timeLeft / metadata.timerDuration) * 100;

  return (
    <div className="flex flex-col items-center gap-8 py-10 px-12 bg-msgr-surface-container backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] w-full max-w-sm">
      <div className="relative size-48 flex items-center justify-center">
        {/* Anti-gravity Progress Ring */}
        <svg className="absolute inset-0 size-full -rotate-90 filter drop-shadow-[0_0_12px_rgba(59,130,246,0.3)]">
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-white/5"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeDasharray="552.92"
            strokeDashoffset={552.92 - (552.92 * percentage) / 100}
            strokeLinecap="round"
            className={clsx(
              "transition-all duration-1000",
              timeLeft < 60 ? "text-rose-500 shadow-[0_0_20px_#f43f5e]" : "text-blue-500 shadow-[0_0_20px_#3b82f6]"
            )}
          />
        </svg>

        <div className="text-center z-10">
          <span className="text-5xl font-mono font-black text-white tracking-widest leading-none drop-shadow-lg">
            {formatTime(timeLeft)}
          </span>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic mt-3 opacity-80">Remaining</p>
        </div>
      </div>

      {isExpert && (
        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-full border border-white/5 shadow-inner">
          <div className="flex items-center px-4 bg-white/5 rounded-full border border-white/5 h-12">
            <input 
              type="number" 
              value={customDuration}
              onChange={(e) => setCustomDuration(Number(e.target.value))}
              className="w-8 bg-transparent text-center text-sm font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Min</span>
          </div>

          {metadata.timerStatus === 'running' ? (
            <button
              onClick={onStop}
              className="size-12 bg-rose-500 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl shadow-rose-500/20"
              title="Stop Timer"
            >
              <Square size={18} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={() => onStart(customDuration * 60)}
              className="size-12 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl shadow-blue-600/20"
              title="Start Timer"
            >
              <Play size={18} fill="currentColor" className="ml-1" />
            </button>
          )}
          
          <button
            onClick={() => {
                if (metadata.timerStatus === 'running') onStop();
                onStart(customDuration * 60);
            }}
            className="size-12 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center transition-all hover:bg-zinc-700 hover:text-white"
            title="Reset"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
