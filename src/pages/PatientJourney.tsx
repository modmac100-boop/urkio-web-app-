import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { 
  Play, 
  Calendar, 
  Video, 
  Heart, 
  Compass, 
  Zap, 
  Shield, 
  ChevronRight,
  MessageCircle,
  Sparkles,
  Award,
  Mic,
  StopCircle,
  Volume2,
  CheckCircle2,
  FileText,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function PatientJourney({ user, userData }: { user: any, userData: any }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [animations, setAnimations] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Fetch Appointments (Journey Roadmap)
    const qSessions = query(
      collection(db, 'appointments'),
      where('userId', '==', user.uid),
      orderBy('date', 'asc')
    );

    // 2. Fetch Prescribed 2D Animations
    const qStories = query(
      collection(db, 'storyboards'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubSessions = onSnapshot(qSessions, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubStories = onSnapshot(qStories, (snap) => {
      setAnimations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubSessions();
      unsubStories();
    };
  }, [user?.uid]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const filePath = `homii_notes/${user.uid}/${Date.now()}.webm`;
        const storageRef = ref(storage, filePath);
        
        const uploadPromise = (async () => {
          const snapshot = await uploadBytes(storageRef, audioBlob);
          const downloadURL = await getDownloadURL(snapshot.ref);
          await addDoc(collection(db, 'homii_notes'), {
            userId: user.uid,
            audioURL: downloadURL,
            createdAt: serverTimestamp(),
            expertReviewStatus: 'pending'
          });
          return 'Safe talk vaulted for your specialist.';
        })();

        toast.promise(uploadPromise, {
          loading: 'Vaulting your thoughts...',
          success: (msg) => msg,
          error: 'Failed to vault audio.'
        });
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone access denied.');
    }
  };

  const handleStopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  const nextSession = sessions.find(s => new Date(s.date) > new Date());
  const isJoinable = nextSession && (
    nextSession.sessionStatus === 'active' || 
    (new Date(nextSession.date).getTime() - Date.now()) < 5 * 60 * 1000
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-msgr-on-surface font-body pb-32 overflow-x-hidden">
      {/* Premium Header */}
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex justify-between items-center px-6 md:px-12 sticky top-0 z-100">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2 bg-msgr-primary rounded-xl text-white shadow-lg"><Heart size={20} fill="white" /></div>
          <span className="text-2xl font-black tracking-tighter text-msgr-primary">URKIO</span>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-2xl border border-zinc-100">
              <Sparkles size={14} className="text-[#00aaff]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-msgr-primary">Healing Mode Active</span>
           </div>
           <img src={userData?.photoURL || "https://ui-avatars.com/api/?name=H"} className="size-10 rounded-2xl ring-4 ring-white shadow-sm" alt="" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        {/* Welcome Section */}
        <header className="mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic leading-none text-zinc-900">
              {userData?.displayName?.split(' ')[0] || 'Hero'}'s <br />
              <span className="text-msgr-primary">Path</span>
            </h1>
            <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] mt-6 text-sm">Milestone 04: Cognitive Restoration</p>
          </motion.div>
        </header>

        {/* Dynamic Join Section */}
        <section className="mb-16">
          <div className="bg-msgr-primary rounded-6xl p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 inset-e-0 p-12 opacity-10 animate-pulse"><Compass size={300} /></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full mb-8">
                   <Clock size={14} className="text-[#00aaff]" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Next Healing Session</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black italic mb-6 tracking-tighter leading-tight">
                  {nextSession ? `Session with ${nextSession.expertName}` : "Your path is clear for now."}
                </h2>
                <div className="flex items-center gap-6">
                  {nextSession && (
                    <div className="p-4 bg-white/5 rounded-2xl">
                       <p className="text-[10px] font-black uppercase text-[#00aaff] mb-1">Scheduled for</p>
                       <p className="text-lg font-bold">{format(new Date(nextSession.date), 'EEEE, MMM do')} @ {format(new Date(nextSession.date), 'HH:mm')}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center lg:text-end">
                <button 
                  onClick={() => nextSession && navigate(`/call/${nextSession.id}`)}
                  disabled={!isJoinable}
                  className={clsx(
                    "w-full lg:w-auto px-16 py-6 rounded-5xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95",
                    isJoinable ? "bg-white text-msgr-primary hover:bg-[#00aaff] hover:text-white" : "bg-black/20 text-white/30 cursor-not-allowed border border-white/10"
                  )}
                >
                  {isJoinable ? <><Video size={20} /> Join Session Now</> : <><Shield size={20} /> Preparing Perimeter...</>}
                </button>
                {nextSession && !isJoinable && (
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#00aaff] mt-6 animate-pulse">BRIDGE OPENS 5 MINS BEFORE START</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* THE HEALING PATH: Motion Pipeline */}
          <div className="lg:col-span-4">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-10 px-4">Milestone Roadmap</h3>
             <div className="relative ps-12 border-is-2 border-zinc-100 space-y-16">
                {sessions.map((session, i) => (
                  <motion.div 
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="relative"
                  >
                    <div className={clsx(
                      "absolute -inset-s-[61px] size-6 rounded-full border-4 border-[#faf9f6] z-10",
                      session.status === 'completed' ? "bg-[#006d3c]" : "bg-msgr-primary animate-pulse"
                    )} />
                    <div className="bg-white p-6 rounded-3xl border border-zinc-50 shadow-sm">
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{session.status === 'completed' ? 'Restored' : 'Upcoming'}</p>
                       <h5 className="font-black italic text-lg">{session.category || 'Session'}</h5>
                       <p className="text-zinc-500 text-xs mt-2">{format(new Date(session.date), 'MMM do')}</p>
                    </div>
                  </motion.div>
                ))}
                
                {/* Visual Endcap */}
                <div className="pt-8">
                   <div className="bg-zinc-900 p-8 rounded-5xl text-center text-white">
                      <Zap size={32} className="mx-auto text-[#00aaff] mb-4" />
                      <p className="text-xs font-black uppercase tracking-[0.2em]">The Breakthrough</p>
                      <p className="text-white/40 text-[10px] mt-2 font-medium">Ultimate transformation milestone</p>
                   </div>
                </div>
             </div>
          </div>

          {/* THE VAULT & HOMII */}
          <div className="lg:col-span-8 space-y-16">
             {/* HOMII VOICE JOURNAL */}
             <div className="bg-white p-10 rounded-6xl border border-zinc-100 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 inset-e-0 p-8 opacity-5"><MaterialIcon name="voice_over_off" className="text-9xl" /></div>
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-2xl font-black italic text-zinc-900 tracking-tight">Homii Voice Journal</h3>
                      <p className="text-zinc-400 text-sm font-medium mt-1">Capture your "Self-Talk" for clinical review.</p>
                   </div>
                   <div className="px-3 py-1 bg-zinc-900 rounded-full text-white text-[9px] font-black uppercase tracking-widest">Encrypted</div>
                </div>

                <div className="flex items-center gap-8">
                   <button 
                     onMouseDown={handleStartRecording}
                     onMouseUp={handleStopRecording}
                     onTouchStart={handleStartRecording}
                     onTouchEnd={handleStopRecording}
                     className={clsx(
                       "size-24 rounded-full flex items-center justify-center transition-all relative z-10",
                       isRecording ? "bg-red-500 scale-110 shadow-red-200 shadow-2xl" : "bg-msgr-primary hover:bg-zinc-900 shadow-xl"
                     )}
                   >
                     {isRecording ? <StopCircle size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
                   </button>
                   <div>
                      <p className="text-lg font-black italic">{isRecording ? "Recording your truth..." : "Press and hold to talk"}</p>
                      <p className="text-zinc-400 text-xs mt-1">Notes are vaulted directly to your expert's hub.</p>
                   </div>
                </div>
             </div>

             {/* SHIFTING STORIES MEDIA HUB */}
             <div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-10 px-4">Your "Shifting" Animation Vault</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   {animations.length > 0 ? animations.map((story) => (
                      <motion.div 
                        key={story.id}
                        whileHover={{ y: -5 }}
                        className="bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl group border border-white/5"
                      >
                         <div className="aspect-video relative">
                            <img src={story.thumbnail || "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800"} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all" alt="" />
                            <div className="absolute inset-0 flex items-center justify-center">
                               <div className="size-16 bg-white rounded-full flex items-center justify-center text-msgr-primary group-hover:scale-110 transition-all shadow-2xl"><Play size={24} fill="currentColor" /></div>
                            </div>
                         </div>
                         <div className="p-8">
                            <h4 className="text-white text-2xl font-black italic mb-2">{story.title || "Restoration Story"}</h4>
                            <div className="flex items-center gap-4">
                               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#00aaff]"><Volume2 size={12} /> Audio Guided</div>
                               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500"><Clock size={12} /> 4:12 Min</div>
                            </div>
                         </div>
                      </motion.div>
                   )) : (
                      <div className="col-span-2 p-20 border-4 border-dashed border-zinc-100 rounded-[4rem] text-center">
                         <Sparkles size={48} className="mx-auto text-zinc-100 mb-6" />
                         <p className="text-zinc-300 font-black uppercase text-xs tracking-[0.2em]">Animations are being tailored for your path.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Mobile-Optimization: Floating Emergency Nav */}
      <div className="fixed bottom-8 inset-s-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-full h-20 shadow-2xl border border-zinc-100 flex items-center justify-around px-8 z-200">
         {[
           { icon: <Heart size={24} />, path: '/journey', active: true },
           { icon: <FileText size={24} />, path: '/records', active: false },
           { icon: <Clock size={24} />, path: '/tasks', active: false },
           { icon: <MessageCircle size={24} />, path: '/messenger', active: false }
         ].map((item, i) => (
           <button 
             key={i}
             onClick={() => navigate(item.path)}
             className={clsx("p-4 rounded-2xl transition-all", item.active ? "bg-msgr-primary text-white shadow-lg" : "text-zinc-300 hover:text-msgr-primary")}
           >
              {item.icon}
           </button>
         ))}
      </div>
    </div>
  );
}

const MaterialIcon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function UserIcon({ size }: { size: number }) {
  return <MaterialIcon name="person" className={`!text-[${size}px]`} />;
}
