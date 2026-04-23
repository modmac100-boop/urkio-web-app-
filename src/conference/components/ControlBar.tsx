import React, { useState } from 'react';
import {
  useCall,
  useCallStateHooks,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  ScreenShareButton,
} from '@stream-io/video-react-sdk';
import { PhoneOff, Disc, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ControlBarProps {
  onLeave: () => void;
  userData: any;
}

export function ControlBar({ onLeave, userData }: ControlBarProps) {
  const call = useCall();
  const { useIsCallRecordingInProgress } = useCallStateHooks();
  const isRecording = useIsCallRecordingInProgress();
  const [isRecordingLoading, setIsRecordingLoading] = useState(false);

  if (!call) return null;

  const toggleRecording = async () => {
    try {
      setIsRecordingLoading(true);
      if (isRecording) {
        await call.stopRecording();
      } else {
        await call.startRecording();
      }
    } catch (err) {
      console.error('Failed to toggle recording:', err);
    } finally {
      setIsRecordingLoading(false);
    }
  };

  return (
    <div className="fixed bottom-10 inset-s-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-5 bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl z-100 transition-all duration-500 hover:bg-zinc-900">
      {/* Precision Controls */}
      <div className="flex items-center gap-4 pe-6 border-ie border-white/10">
        <div className="hover:scale-110 transition-transform">
          <ToggleAudioPublishingButton />
        </div>
        <div className="hover:scale-110 transition-transform">
          <ToggleVideoPublishingButton />
        </div>
      </div>

      {/* Collaboration Tools */}
      <div className="flex items-center gap-6 px-2">
        <div className="hover:scale-110 transition-transform">
          <ScreenShareButton />
        </div>
        
        <button
          onClick={toggleRecording}
          disabled={isRecordingLoading}
          className={clsx(
            "flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all border group",
            isRecording 
              ? "bg-red-500/20 border-red-500/50 text-red-500" 
              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
          )}
          title={isRecording ? "Stop Recording" : "Start Recording"}
        >
          {isRecordingLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Disc className={clsx("size-4 transition-transform group-hover:scale-125", isRecording && "fill-current animate-pulse")} />
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {isRecording ? 'Capturing' : 'Record'}
          </span>
        </button>
      </div>

      <div className="w-px h-8 bg-white/10 mx-2" />

      {/* Terminate Action */}
      <button
        onClick={async () => {
          await call.leave();
          onLeave();
        }}
        className="size-14 bg-red-600 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-xl shadow-red-500/20 group ms-2"
        title="Terminate Session"
      >
        <PhoneOff className="size-6 group-hover:rotate-15 transition-transform" />
      </button>
    </div>
  );
}
