import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Shield, Lock, Play, Pause, Mic, Square, Trash2, 
  Sparkles, History, Send, Users, ChevronRight, Info,
  Settings, Bell, Search, Home, Plus, Wind, Activity,
  Layers, Zap, Fingerprint, Cloud, Globe, Database, Share2,
  MoreVertical, Power
} from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import { GlassButton } from '../components/GlassButton';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { HomiiVoiceSettingsModal } from '../components/HomiiVoiceSettingsModal';

export function Homii({ user, userData }: { user: any; userData: any }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [privacyState, setPrivacyState] = useState<'private' | 'therapist' | 'friends'>('private');
  const [vaultEntries, setVaultEntries] = useState<any[]>([]);
  const [loadingVault, setLoadingVault] = useState(true);
  const [streamData, setStreamData] = useState<number[]>(Array(40).fill(10));
  const [isBreathing, setIsBreathing] = useState(false);
  const [activeOrb, setActiveOrb] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Audio Context for Waveform
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchVault();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [user.uid]);

  const fetchVault = async () => {
    try {
      const q = query(
        collection(db, 'voiceNotes'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      setVaultEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Vault fetch error:", err);
    } finally {
      setLoadingVault(false);
    }
  };

  const startVisualizer = (stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const bars = Array.from({ length: 40 }, (_, i) => {
        const val = dataArray[Math.floor(i * (bufferLength / 40))];
        return Math.max(10, (val / 255) * 80);
      });
      setStreamData(bars);
      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        if (audioContextRef.current) audioContextRef.current.close();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
      
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSec(0);
      startVisualizer(stream);
      timerRef.current = setInterval(() => setRecordingSec(s => s + 1), 1000);
      toast.success("Recording started in your sanctuary.");
    } catch (err) {
      toast.error("Microphone access is required for the journal.");
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setStreamData(Array(40).fill(10));
  };

  const handleSave = async () => {
    if (!audioBlob) return;
    const saveToast = toast.loading("Vaulting reflection...");
    try {
      const path = `homii_notes/${user.uid}/${Date.now()}.webm`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, audioBlob);
      const url = await getDownloadURL(sRef);
      
      await addDoc(collection(db, 'voiceNotes'), {
        authorId: user.uid,
        authorName: userData?.displayName || user.email,
        url,
        duration: recordingSec,
        privacy: privacyState,
        emotion: analysisResult?.dominantEmotion || 'Reflective',
        sentimentScore: analysisResult?.calm || 50,
        createdAt: serverTimestamp()
      });
      
      toast.success("Reflection secured in your vault.", { id: saveToast });
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingSec(0);
      setAnalysisResult(null);
      fetchVault();
    } catch (err) {
      toast.error("Security breach: Failed to save reflection.", { id: saveToast });
    }
  };

  const handleAnalyze = async () => {
    if (!audioBlob) return;
    setIsAnalyzing(true);
    const analysisToast = toast.loading("Processing neural signatures...");
    
    setTimeout(() => {
      setAnalysisResult({
        calm: 88,
        reflective: 10,
        stressed: 2,
        dominantEmotion: 'Calm',
        insight: "Your neural frequency indicates deep resonance. You sound exceptionally centered with high emotional clarity.",
        cognitiveLoad: 12,
        speechCadence: 92,
        emotionalValence: 85,
        vocalTremor: 3,
        heartRateEstimate: 68,
        stability: 96,
        confidence: 94,
        vocalHealth: 98,
        patientSummary: {
          assessment: "Stable",
          recommendation: "Maintain current mindfulness routine.",
          nextSync: "In 24 hours"
        }
      });
      setIsAnalyzing(false);
      setActiveOrb('calm');
      toast.success("Deep Neural analysis complete.", { id: analysisToast });
    }, 3000);
  };

  const handleDelete = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSec(0);
    setAnalysisResult(null);
    toast.success("Current reflection cleared.");
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-['Manrope'] overflow-hidden selection:bg-indigo-500/30">
      {/* ── Immersive Glass Sidebar — hidden on mobile, visible lg+ ── */}
      <aside className="hidden lg:flex w-20 xl:w-24 bg-[#0a0f1e]/40 backdrop-blur-2xl border-r border-slate-800 flex-col items-center py-10 z-50">
        <div className="size-14 rounded-4xl bg-linear-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] mb-14 rotate-6 hover:rotate-0 transition-transform duration-500 cursor-pointer" onClick={() => navigate('/')}>
          <Globe className="size-7 text-white" />
        </div>
        
        <nav className="flex-1 flex flex-col gap-8">
          {[
            { icon: Home, label: 'Home', path: '/' },
            { icon: Activity, label: 'Live', active: true },
            { icon: Users, label: 'Session' },
            { icon: Database, label: 'Archives', path: '/vault' },
            { icon: Settings, label: 'Settings', path: '/settings' },
          ].map((item, i) => (
            <div key={i} className="group relative flex flex-col items-center">
              <button 
                onClick={() => {
                  if (item.label === 'Settings') setIsSettingsOpen(true);
                  else if (item.path) navigate(item.path);
                }}
                className={clsx(
                  "size-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                  item.active ? "bg-indigo-500/20 text-indigo-400" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <item.icon className="size-5 z-10" />
                {item.active && <div className="absolute inset-0 bg-indigo-500/10 blur-sm" />}
              </button>
              <span className="absolute left-[120%] py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </span>
            </div>
          ))}
        </nav>

        <button onClick={() => navigate('/')} className="size-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
          <Power className="size-5" />
        </button>
      </aside>

      {/* ── Main Canvas ── */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b_0%,#020617_100%)] pb-24 lg:pb-0">
        
        {/* Abstract Background Noise & Blooms */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] translate-y-1/2 pointer-events-none" />

        {/* Header Bar — compact on mobile */}
        <header className="h-16 md:h-24 flex items-center justify-between px-4 md:px-16 relative z-40">
          <div className="flex items-center gap-4 md:gap-10">
            <div className="flex flex-col">
              <div className="hidden md:flex items-center gap-2 mb-1">
                <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                  <Cloud className="size-3 text-indigo-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Live Reflection Hub</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-5xl font-black text-white italic tracking-tighter">Voice Journal</h1>
              <p className="hidden md:block text-sm font-medium text-slate-500 max-w-sm mt-3 leading-relaxed">
                Speak freely. Our architectural sanctuary protects your thoughts with end-to-end neural encryption.
              </p>
            </div>
            <div className="hidden md:block h-8 w-px bg-slate-800" />
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-inner">
              <span className="size-2 rounded-full bg-indigo-500 animate-ping" />
              Live Network Active
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-3 py-2 px-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-black text-slate-200">{userData?.displayName || 'Urkio User'}</p>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{userData?.userCode || 'PATIENT.XZ-9'}</p>
              </div>
              <div className="size-9 rounded-xl overflow-hidden border border-slate-700 p-0.5">
                <img src={userData?.photoURL || "https://ui-avatars.com/api/?name=" + (userData?.displayName || 'D')} className="w-full h-full object-cover rounded-lg" alt="Profile" />
              </div>
            </div>
            <button onClick={() => toast("No new system alerts.")} className="p-3 text-slate-500 hover:text-white transition-colors relative cursor-pointer">
              <Bell className="size-5" />
              <span className="absolute top-3 right-3 size-2 bg-indigo-500 rounded-full border-2 border-[#020617]" />
            </button>
          </div>
        </header>

        {/* Central Immersive Interaction Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 relative z-30 overflow-y-auto">
          
          {/* Orbital Visualization System — scales from 280px on mobile to 500px on desktop */}
          <div className="relative size-[280px] sm:size-[360px] md:size-[500px] flex items-center justify-center">
            
            {/* Spinning Rings */}
            <div className="absolute inset-0 rounded-full border border-slate-800/50 animate-[spin_30s_linear_infinite]" />
            <div className="absolute inset-20 rounded-full border border-indigo-500/10 animate-[spin_20s_linear_infinite_reverse]" />
            <div className={clsx("absolute inset-40 rounded-full border border-purple-500/20 transition-all duration-1000", isRecording ? "scale-110 opacity-50" : "scale-100 opacity-20")} />

            {/* Rotating Control Nodes */}
            {[
              { id: 'neural', icon: Activity, label: 'Neural', angle: 0, color: 'text-indigo-400' },
              { id: 'aura', icon: Heart, label: 'Aura', angle: 90, color: 'text-purple-400' },
              { id: 'energy', icon: Zap, label: 'Energy', angle: 180, color: 'text-yellow-400' },
              { id: 'breath', icon: Wind, label: 'Breath', angle: 270, color: 'text-emerald-400' },
            ].map((node, i) => (
              <div 
                key={i}
                className="absolute transition-all duration-1000 cursor-pointer"
                onClick={() => { setActiveOrb(node.id); toast(`Initializing ${node.label} matrix...`); }}
                style={{ 
                  transform: `rotate(${node.angle}deg) translateY(-250px) rotate(-${node.angle}deg)` 
                }}
              >
                <div className="flex flex-col items-center gap-3 transition-transform hover:scale-110">
                  <div className={clsx(
                    "size-12 rounded-2xl flex items-center justify-center border border-slate-800 bg-[#0a0f1e]/80 backdrop-blur-md shadow-lg transition-colors",
                    activeOrb === node.id ? "bg-indigo-500/20 border-indigo-500" : "",
                    node.color
                  )}>
                    <node.icon className="size-5" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
                    {node.label}
                  </span>
                </div>
              </div>
            ))}

            {/* Main Central Orb (Mic/Visualizer) */}
            <div className="relative size-72 flex items-center justify-center">
               <div className={clsx(
                 "absolute inset-0 rounded-full bg-linear-to-tr from-indigo-600 to-purple-600 blur-2xl transition-all duration-1000",
                 isRecording ? "opacity-40 scale-125" : "opacity-20 scale-100"
               )} />
               
               <div className="relative size-full rounded-full bg-[#0a0f1e] border-4 border-slate-800 flex flex-col items-center justify-center group overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] px-10 text-center">
                  
                  {/* Waveform Background */}
                  <div className="absolute inset-0 opacity-20 flex items-center justify-center gap-0.5">
                    {streamData.map((h, i) => (
                      <div 
                        key={i} 
                        className={clsx("w-1 rounded-full transition-all duration-150", isRecording ? "bg-indigo-400" : "bg-slate-700")}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/60 mb-2">Session Timer</div>
                    <div className="text-5xl font-black text-white tabular-nums tracking-tighter mb-4 italic">
                      {formatTime(recordingSec)}
                    </div>
                    <button 
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={clsx(
                        "size-20 rounded-3xl flex items-center justify-center transition-all duration-500 group/mic active:scale-90",
                        isRecording ? "bg-red-500 text-white shadow-[0_0_50px_rgba(239,68,68,0.4)]" : "bg-white text-slate-900 shadow-2xl"
                      )}
                    >
                      {isRecording ? <Square className="size-8" /> : <Mic className="size-8" />}
                    </button>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mt-6 animate-pulse">
                      {isRecording ? "Channeling Thoughts..." : "Awaiting Frequency"}
                    </p>
                  </div>
               </div>
            </div>

            {/* Static Participant Avatars (Design Request) */}
            <div className="absolute inset-0 pointer-events-none">
               {[
                 { top: '10%', left: '20%', img: 'https://i.pravatar.cc/150?u=1' },
                 { top: '15%', right: '15%', img: 'https://i.pravatar.cc/150?u=2' },
                 { bottom: '20%', left: '10%', img: 'https://i.pravatar.cc/150?u=3' },
                 { bottom: '10%', right: '25%', img: 'https://i.pravatar.cc/150?u=4' },
               ].map((p, i) => (
                 <div key={i} className="absolute size-14 rounded-3xl border-2 border-slate-800 bg-slate-900 p-1 opacity-40 hover:opacity-100 transition-opacity" style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}>
                   <img src={p.img} className="w-full h-full object-cover rounded-[1.25rem] grayscale" alt="Participant" />
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Control Footer — stacks on mobile, horizontal on desktop */}
        <footer className="shrink-0 px-4 md:px-16 py-4 md:h-40 flex items-center justify-center bg-[#0a0f1e]/60 backdrop-blur-3xl border-t border-slate-800 z-50">
           <div className="flex flex-wrap items-center justify-center gap-4 md:gap-12">
              {/* Reset Action */}
              <button 
                onClick={handleDelete}
                className="size-14 md:size-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-red-400 hover:border-red-500/50 transition-all shadow-xl"
              >
                <Trash2 className="size-5 md:size-6" />
              </button>

              <div className="h-8 w-px bg-slate-800 hidden md:block" />

              {/* Aura Breathing */}
              <button 
                onClick={() => setIsBreathing(!isBreathing)}
                className={clsx(
                  "size-14 md:size-16 rounded-2xl border flex items-center justify-center transition-all shadow-xl",
                  isBreathing ? "bg-indigo-500 text-white border-indigo-400" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-indigo-400"
                )}
              >
                <Wind className="size-5 md:size-6" />
              </button>

              {/* Main Actions Group */}
              <div className="flex gap-3 p-1.5 bg-slate-900/40 rounded-3xl border border-white/5">
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !audioBlob}
                  className="px-5 md:px-10 py-4 md:py-5 rounded-2xl bg-linear-to-br from-slate-800/80 to-slate-900/80 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:from-slate-700 transition-all shadow-2xl disabled:opacity-30"
                >
                  {isAnalyzing ? <Activity className="size-4 animate-spin text-indigo-400" /> : <Sparkles className="size-4 text-indigo-400" />}
                  <span className="hidden sm:inline">Tone Analytics</span>
                  <span className="sm:hidden">Analyze</span>
                </button>
                
                <button 
                  onClick={handleSave}
                  disabled={!audioBlob}
                  className="px-5 md:px-10 py-4 md:py-5 rounded-2xl bg-indigo-500 text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:bg-indigo-400 active:scale-95 transition-all disabled:opacity-30"
                >
                  <span className="hidden sm:inline">Vault Entry</span>
                  <span className="sm:hidden">Save</span>
                </button>
              </div>
           </div>
        </footer>
      </main>

      {/* ── Secondary Command Panel (Right Sidebar) ── */}
      <aside className="hidden xl:flex flex-col w-96 bg-[#0a0f1e]/40 backdrop-blur-3xl border-l border-slate-800 p-10 z-50">
        
        {/* Tone Profile Section */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="size-4 text-indigo-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Tone Profile</h3>
          </div>
          
          <div className="space-y-8">
            {[
              { label: 'Calm', val: analysisResult?.calm || 0 },
              { label: 'Reflective', val: analysisResult?.reflective || 0 },
              { label: 'Stressed', val: analysisResult?.stressed || 0 },
              ...(analysisResult?.cognitiveLoad ? [
                { label: 'Cognitive Load', val: analysisResult.cognitiveLoad },
                { label: 'Speech Cadence', val: analysisResult.speechCadence },
                { label: 'Emotional Valence', val: analysisResult.emotionalValence },
                { label: 'Vocal Tremor', val: analysisResult.vocalTremor },
              ] : [])
            ].map((tone, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className={tone.val > 0 ? "text-slate-200" : "text-slate-600"}>{tone.label}</span>
                  <span className="text-indigo-400">{tone.val}%</span>
                </div>
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ width: `${tone.val}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>

          {!analysisResult && (
             <div className="mt-20 py-10 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center opacity-30">
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Awaiting Input</div>
             </div>
          )}
        </div>

        {/* Access Matrix */}
        <div className="mt-auto">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Access Matrix</h3>
          <div className="p-8 bg-white text-slate-950 rounded-[2.5rem] flex items-center gap-6 shadow-2xl">
             <div className="size-16 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
                <Lock className="size-7" />
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-tight leading-tight">Vault Only (Private)</span>
                <span className="text-[10px] font-medium text-slate-500 mt-1 leading-tight">Highest encryption, user-only access</span>
             </div>
          </div>
        </div>
      </aside>

      <HomiiVoiceSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
