import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, X, RotateCcw, Send, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoRecorderProps {
  onClose: () => void;
  onSend: (blob: Blob) => Promise<void>;
  onSaveToVault?: (blob: Blob) => Promise<void>;
}

export function VideoRecorder({ onClose, onSend, onSaveToVault }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' }, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    
    const mimeTypes = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
    
    const mr = new MediaRecorder(streamRef.current, { mimeType });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      if (previewRef.current) {
        previewRef.current.src = URL.createObjectURL(blob);
      }
    };
    
    mr.start(200);
    mediaRecorderRef.current = mr;
    setIsRecording(true);
    setElapsedSec(0);
    timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleReset = () => {
    setRecordedBlob(null);
    setElapsedSec(0);
  };

  const handleSend = async () => {
    if (!recordedBlob) return;
    setIsSending(true);
    try {
      await onSend(recordedBlob);
      onClose();
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!recordedBlob || !onSaveToVault) return;
    setIsSending(true);
    try {
      await onSaveToVault(recordedBlob);
      onClose();
    } catch (error) {
      console.error('Save to vault error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (sec: number) => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-slate-800 rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Floating Status Indicator */}
        <div className="absolute top-6 inset-s-6 z-10">
          <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
            <div className={clsx("size-2 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-zinc-500")} />
            <span className="text-[10px] font-black uppercase text-white tracking-widest">
              {isRecording ? "Transmitting" : "Ready"}
            </span>
            {isRecording && (
              <span className="text-red-500 text-[10px] font-black tracking-widest">
                {formatTime(elapsedSec)}
              </span>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 inset-e-6 z-10 size-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Video Area */}
        <div className="aspect-video bg-black relative flex items-center justify-center">
          {!recordedBlob ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={clsx("w-full h-full object-cover", !isCameraOn && "opacity-0")}
            />
          ) : (
            <video 
              ref={previewRef} 
              autoPlay 
              loop 
              controls 
              className="w-full h-full object-cover"
            />
          )}

          {!isCameraOn && !recordedBlob && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
              <div className="size-20 rounded-full bg-slate-700/50 flex items-center justify-center animate-pulse">
                <VideoOff className="w-10 h-10" />
              </div>
              <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Camera is off</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-8 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 inset-x-0">
          <div className="flex items-center justify-between gap-6 max-w-sm mx-auto">
            {!recordedBlob ? (
              <>
                <button 
                  onClick={toggleMic}
                  className={clsx(
                    "size-14 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                    isMicOn ? "bg-white/10 text-white" : "bg-red-500 text-white shadow-red-500/20"
                  )}
                >
                  {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>

                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className="size-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-105 active:scale-95 transition-all"
                >
                  <div className={clsx(
                    "bg-white transition-all duration-300",
                    isRecording ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-full"
                  )} />
                </button>

                <button 
                  onClick={toggleCamera}
                  className={clsx(
                    "size-14 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                    isCameraOn ? "bg-white/10 text-white" : "bg-red-500 text-white shadow-red-500/20"
                  )}
                >
                  {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 text-white/70 font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                >
                  <RotateCcw className="w-4 h-4" />
                  RETAKE
                </button>
                
                {onSaveToVault && (
                  <button 
                    onClick={handleSaveToVault}
                    disabled={isSending}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-emerald-400" />
                    SAVE TO VAULT
                  </button>
                )}

                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex-1 w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 shadow-2xl shadow-primary/40 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> SEND TO EXPERT</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
