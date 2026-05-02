import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, X, RotateCcw, Send, Loader2, Save, Settings, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaStream } from '../../hooks/useMediaStream';
import { AudioVisualizer } from '../common/AudioVisualizer';
import clsx from 'clsx';

interface VideoRecorderProps {
  onClose: () => void;
  onSend: (blob: Blob) => Promise<void>;
  onSaveToVault?: (blob: Blob) => Promise<void>;
}

export function VideoRecorder({ onClose, onSend, onSaveToVault }: VideoRecorderProps) {
  const {
    stream,
    error,
    cameras,
    microphones,
    selectedCamera,
    selectedMic,
    isInitializing,
    setSelectedCamera,
    setSelectedMic,
    startStream,
    stopStream
  } = useMediaStream();

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-start camera
  useEffect(() => {
    startStream();
  }, [startStream]);

  // Connect stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    
    // Improved MIME type selection for Safari/iOS compatibility
    const mimeTypes = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4', // Fallback for Safari
      'video/quicktime'
    ];
    
    const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
    console.log('Using mimeType:', mimeType);
    
    try {
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
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
    } catch (err) {
      console.error('MediaRecorder start error:', err);
    }
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
    startStream(); // Restart camera stream
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border border-white/5"
      >
        {/* Top Bar */}
        <div className="absolute top-6 inset-x-6 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 pointer-events-auto">
            <div className={clsx("size-2 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-teal-500")} />
            <span className="text-[10px] font-black uppercase text-white tracking-widest">
              {isRecording ? "Live Recording" : error ? "Device Error" : "Ready"}
            </span>
            {isRecording && (
              <span className="text-red-500 text-[10px] font-black tracking-widest ml-1">
                {formatTime(elapsedSec)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {!recordedBlob && (
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="size-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
              >
                <Settings className={clsx("size-5", showSettings && "rotate-90")} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="size-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="aspect-video bg-slate-950 relative flex items-center justify-center overflow-hidden">
          {!recordedBlob ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={clsx(
                  "w-full h-full object-cover transition-opacity duration-700", 
                  (!isCameraOn || error || isInitializing) ? "opacity-0" : "opacity-100"
                )}
              />
              
              <AnimatePresence>
                {isRecording && isMicOn && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-8 pointer-events-none"
                  >
                    <AudioVisualizer stream={stream} color="#30B0D0" gap={1} barWidth={2} />
                  </motion.div>
                )}
              </AnimatePresence>

              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                  <Loader2 className="size-10 animate-spin mb-4 text-teal-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Initializing Hardware...</p>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                  <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
                    <AlertCircle className="size-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Access Error</h3>
                  <p className="text-sm text-white/60 mb-6 max-w-xs">{error}</p>
                  <button 
                    onClick={() => startStream()}
                    className="px-6 py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all"
                  >
                    Retry Access
                  </button>
                </div>
              )}

              {!isCameraOn && !error && !isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
                  <div className="size-20 rounded-full bg-white/5 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Camera Transmitting Paused</p>
                </div>
              )}
            </>
          ) : (
            <video 
              ref={previewRef} 
              autoPlay 
              loop 
              controls 
              className="w-full h-full object-cover"
            />
          )}

          {/* Settings Overlay */}
          <AnimatePresence>
            {showSettings && !recordedBlob && (
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="absolute inset-y-0 right-0 w-72 bg-black/60 backdrop-blur-2xl border-l border-white/10 p-8 z-30 flex flex-col gap-6"
              >
                <h4 className="text-[10px] font-black uppercase text-teal-500 tracking-[0.2em] mb-2">Hardware Config</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-2 block">Camera</label>
                    <select 
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                    >
                      {cameras.map(c => <option key={c.deviceId} value={c.deviceId} className="bg-slate-900">{c.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-2 block">Microphone</label>
                    <select 
                      value={selectedMic}
                      onChange={(e) => setSelectedMic(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                    >
                      {microphones.map(m => <option key={m.deviceId} value={m.deviceId} className="bg-slate-900">{m.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={() => {
                      setShowSettings(false);
                      startStream();
                    }}
                    className="w-full py-3 rounded-xl bg-teal-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-500/20"
                  >
                    Apply Changes
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="p-8 bg-linear-to-t from-black via-black/80 to-transparent">
          <div className="flex items-center justify-between gap-6 max-w-sm mx-auto">
            {!recordedBlob ? (
              <>
                <button 
                  onClick={toggleMic}
                  className={clsx(
                    "size-14 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                    isMicOn ? "bg-white/5 text-white/60 hover:text-white" : "bg-red-500 text-white shadow-red-500/20"
                  )}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!!error || isInitializing}
                  className={clsx(
                    "size-20 rounded-full flex items-center justify-center transition-all disabled:opacity-30",
                    isRecording 
                      ? "bg-red-500 shadow-2xl shadow-red-500/40" 
                      : "bg-white text-black hover:scale-110 active:scale-95"
                  )}
                >
                  <div className={clsx(
                    "transition-all duration-300",
                    isRecording 
                      ? "bg-white w-7 h-7 rounded-lg" 
                      : "bg-current w-8 h-8 rounded-full"
                  )} />
                </button>

                <button 
                  onClick={toggleCamera}
                  className={clsx(
                    "size-14 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                    isCameraOn ? "bg-white/5 text-white/60 hover:text-white" : "bg-red-500 text-white shadow-red-500/20"
                  )}
                >
                  {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 text-white/70 font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all border border-white/5 tracking-widest"
                >
                  <RotateCcw className="w-4 h-4" />
                  RETAKE
                </button>
                
                {onSaveToVault && (
                  <button 
                    onClick={handleSaveToVault}
                    disabled={isSending}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 text-white font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10 disabled:opacity-50 tracking-widest"
                  >
                    <Save className="w-4 h-4 text-teal-400" />
                    VAULT
                  </button>
                )}

                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex-1 w-full py-4 rounded-2xl bg-teal-500 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-2xl shadow-teal-500/30 hover:bg-teal-400 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> TRANSMIT TO EXPERT</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
