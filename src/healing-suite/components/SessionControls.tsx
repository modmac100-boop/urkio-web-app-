import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Hand, Maximize2, Share, Wifi, WifiOff } from 'lucide-react';
import { SessionMode } from '../hooks/useHealingSession';
import clsx from 'clsx';

interface SessionControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isZenMode: boolean;
  isHandRaised?: boolean;
  mode: SessionMode;
  role: 'host' | 'audience';
  networkQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  isRecording?: boolean;
  onToggleRecord?: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleZen: () => void;
  onToggleHandRaise?: () => void;
  onLeave: () => void;
}

export function SessionControls({
  isMuted, isCameraOff, isScreenSharing, isZenMode, isHandRaised,
  mode, role, networkQuality, isRecording,
  onToggleMute, onToggleCamera, onToggleScreenShare, onToggleZen, onToggleHandRaise, onLeave, onToggleRecord,
}: SessionControlsProps) {
  
  const ControlBtn = ({
    onClick, active = false, danger = false, children, label
  }: {
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    children: React.ReactNode;
    label: string;
  }) => (
    <button
      onClick={onClick}
      title={label}
      className={clsx(
        'group relative flex items-center justify-center size-12 rounded-full transition-all duration-300 active:scale-90',
        danger
          ? 'bg-hmoii-error-container text-hmoii-error hover:bg-red-600 shadow-lg'
          : active
          ? 'bg-hmoii-primary text-hmoii-on-primary shadow-[0_0_20px_rgba(168,200,255,0.4)]'
          : 'bg-hmoii-surface-container-highest text-white hover:bg-white/10 border border-white/5'
      )}
    >
      {children}
      {/* Tooltip */}
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </span>
    </button>
  );

  return (
    <div className="flex items-center gap-4 bg-slate-950/40 backdrop-blur-2xl p-3 rounded-full border border-white/5 shadow-2xl">
      <ControlBtn onClick={onToggleMute} active={!isMuted} label={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </ControlBtn>

      <ControlBtn onClick={onToggleCamera} active={!isCameraOff} label={isCameraOff ? 'Show Camera' : 'Hide Camera'}>
        {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
      </ControlBtn>

      <ControlBtn onClick={onLeave} danger label="End Session">
        <PhoneOff size={20} />
      </ControlBtn>

      {/* Record button — only for hosts/practitioners */}
      {role === 'host' && onToggleRecord && (
        <ControlBtn 
          onClick={onToggleRecord} 
          active={isRecording} 
          label={isRecording ? 'Stop Recording' : 'Record Session'}
        >
          <div className="relative">
            <div className={clsx(
              "size-5 rounded-full border-2 border-current flex items-center justify-center",
              isRecording && "bg-red-500 animate-pulse border-red-500"
            )}>
              {!isRecording && <div className="size-2 bg-red-500 rounded-full" />}
            </div>
          </div>
        </ControlBtn>
      )}

      <div className="w-px h-8 bg-white/10 mx-1" />

      {/* Screen share — only for hosts/publishers */}
      {(role === 'host' || mode !== 'broadcast') && (
        <ControlBtn onClick={onToggleScreenShare} active={isScreenSharing} label="Share Screen">
          <Share size={20} />
        </ControlBtn>
      )}

      {/* Hand raise — only for non-host */}
      {role === 'audience' && onToggleHandRaise && (
        <ControlBtn onClick={onToggleHandRaise} active={isHandRaised} label="Raise Hand">
          <Hand size={20} className={isHandRaised ? 'fill-current' : ''} />
        </ControlBtn>
      )}

      {/* Zen Mode / Minimize */}
      <ControlBtn onClick={onToggleZen} active={isZenMode} label={isZenMode ? 'Normal View' : 'Minimize (25%)'}>
        <span className="material-symbols-outlined text-xl">{isZenMode ? 'fullscreen' : 'zoom_in'}</span>
      </ControlBtn>

      <div className={clsx(
        "flex items-center px-4 transition-all",
        networkQuality === 'poor' ? "text-red-400" : "text-emerald-400"
      )}>
        {networkQuality === 'poor' ? <WifiOff size={16} /> : <Wifi size={16} />}
      </div>
    </div>
  );
}
