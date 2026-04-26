import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Star, MapPin, Clock, Video, BookOpen, Calendar, ArrowLeft, Copy, Check, Sparkles, Shield, Globe, Edit3, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Auto-generate a conference room code
const genRoomCode = () => {
  const seg1 = Math.random().toString(36).substring(2, 5).toUpperCase();
  const seg2 = Math.floor(1000 + Math.random() * 9000);
  const seg3 = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `URK-${seg2}-${seg3}`;
};

// ---------- Booking Modal ----------
function BookingModal({ expert, user, onClose }: { expert: any; user: any; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [form, setForm] = useState({ date: '', time: '', sessionType: 'therapy', message: '' });
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time) { toast.error('Please select a date and time.'); return; }
    setLoading(true);
    const code = genRoomCode();
    setRoomCode(code);
    try {
      await addDoc(collection(db, 'events'), {
        type: 'session',
        expertId: expert.uid,
        expertName: expert.displayName,
        clientId: user?.uid || 'guest',
        clientName: user?.displayName || user?.email || 'Visitor',
        date: new Date(`${form.date}T${form.time}`).toISOString(),
        sessionType: form.sessionType,
        message: form.message,
        roomId: code,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setStep('confirm');
    } catch {
      toast.error('Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/therapy-room/${roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
      <div className="bg-[#0f1117] border border-white/10 rounded-[2.5rem] w-full max-w-lg p-10 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"><X className="size-6" /></button>

        {step === 'form' ? (
          <>
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-ur-primary mb-2">Book a Session</p>
              <h2 className="text-3xl font-black text-white tracking-tighter">with {expert.displayName}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Date</label>
                  <input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-ur-primary/50"
                    min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Time</label>
                  <input type="time" required value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-ur-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Session Type</label>
                <select value={form.sessionType} onChange={e => setForm(p => ({ ...p, sessionType: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none">
                  <option value="therapy">One-on-One Therapy</option>
                  <option value="healing-course">Healing Course Session</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Your Message (optional)</label>
                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Briefly describe what you'd like to work on..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none resize-none placeholder:text-white/20" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 milled-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-ur-primary/20 active:scale-95 transition-all disabled:opacity-50">
                {loading ? 'Submitting…' : 'Confirm Session Request'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-8">
            <div className="size-20 bg-green-500/10 border border-green-500/20 rounded-[2rem] flex items-center justify-center mx-auto">
              <Check className="size-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Request Sent!</h2>
              <p className="text-white/50 text-sm">{expert.displayName} will confirm your session shortly.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Your Session Room</p>
              <p className="text-2xl font-mono font-black text-ur-primary">{roomCode}</p>
              <button onClick={copy} className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                {copied ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
                {copied ? 'Copied!' : 'Copy Room Link'}
              </button>
            </div>
            <button onClick={onClose} className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export function ExpertPublicSpace({ user, userData }: { user: any; userData: any }) {
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const isOwner = user?.uid === expertId;

  useEffect(() => {
    if (!expertId) return;
    getDoc(doc(db, 'users', expertId)).then(snap => {
      if (snap.exists()) setExpert({ uid: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [expertId]);

  useEffect(() => {
    if (!expertId) return;
    const q = query(collection(db, 'events'), where('expertId', '==', expertId), where('type', '==', 'course'));
    return onSnapshot(q, snap => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [expertId]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="size-12 border-4 border-ur-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!expert) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white gap-6">
      <p className="text-2xl font-black">Expert not found</p>
      <button onClick={() => navigate(-1)} className="text-ur-primary underline">Go back</button>
    </div>
  );

  const specialty: string[] = expert.specialty || expert.primaryRole ? [expert.primaryRole] : ['Specialist'];
  const rating = expert.rating || 4.8;
  const reviewCount = expert.reviewCount || 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-body selection:bg-ur-primary/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-ur-primary/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[140px]" />
      </div>

      {/* Back nav */}
      <div className="relative z-10 pt-8 px-6 md:px-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold group">
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-16 pt-12 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="size-32 md:size-44 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                <img src={expert.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName || 'E')}&background=1a1a2e&color=fff&size=300`}
                  alt={expert.displayName} className="w-full h-full object-cover" />
              </div>
              {expert.isVerified && (
                <div className="absolute -bottom-3 -right-3 size-12 bg-ur-primary rounded-2xl flex items-center justify-center shadow-xl shadow-ur-primary/30 border-4 border-zinc-950">
                  <Shield className="size-5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-5">
              <div>
                {isOwner && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-ur-primary/10 border border-ur-primary/20 rounded-full text-[10px] font-black text-ur-primary uppercase tracking-widest mb-4">
                    <Edit3 className="size-3" /> Your Practice Page
                  </div>
                )}
                <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tighter text-white">{expert.displayName || 'Expert'}</h1>
                <p className="text-ur-primary font-bold text-sm mt-1">{specialty.join(' · ')}</p>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={clsx('size-4', i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700')} />
                  ))}
                </div>
                <span className="text-zinc-400 text-sm font-bold">{rating.toFixed(1)}</span>
                {reviewCount > 0 && <span className="text-zinc-600 text-xs">({reviewCount} reviews)</span>}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {(expert.languages || ['Arabic', 'English']).map((l: string) => (
                  <span key={l} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <Globe className="size-3" />{l}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <Clock className="size-3" />{expert.sessionDuration || 60} min sessions
                </span>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-2">
                {!isOwner && (
                  <button onClick={() => user ? setShowBooking(true) : navigate('/landing')}
                    className="px-8 py-4 milled-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-ur-primary/20 active:scale-95 transition-all flex items-center gap-2">
                    <Calendar className="size-4" /> Book a Session
                  </button>
                )}
                {isOwner && (
                  <>
                    <button onClick={() => navigate('/therapy-room')}
                      className="px-8 py-4 milled-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center gap-2">
                      <Video className="size-4" /> Open Therapy Room
                    </button>
                    <button onClick={() => navigate('/agenda')}
                      className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2">
                      <Calendar className="size-4" /> My Agenda
                    </button>
                  </>
                )}
                <button 
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    toast.success('Practice Link Copied!', {
                      icon: '🔗',
                      style: { borderRadius: '1rem', background: '#0f1117', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
                    });
                  }}
                  className="px-6 py-4 bg-white/5 border border-white/10 text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
                >
                  <Copy className="size-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      {expert.bio && (
        <section className="relative z-10 px-6 md:px-16 pb-20">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-10 md:p-14">
              <h2 className="text-2xl font-headline font-black text-white tracking-tighter uppercase mb-6 flex items-center gap-3">
                <Sparkles className="size-5 text-ur-primary" /> About
              </h2>
              <p className="text-zinc-400 leading-relaxed text-base whitespace-pre-wrap">{expert.bio}</p>
            </div>
            
            {/* Clinical Agenda Preview */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Clock className="size-4 text-ur-primary" /> Clinic Hours
              </h3>
              <div className="space-y-4">
                {[
                  { day: 'Monday - Friday', time: '09:00 AM - 06:00 PM' },
                  { day: 'Saturday', time: '10:00 AM - 02:00 PM' },
                  { day: 'Sunday', time: 'Closed' }
                ].map(slot => (
                  <div key={slot.day} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500">{slot.day}</span>
                    <span className="text-zinc-300">{slot.time}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-white/5">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
                  Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Courses */}
      <section className="relative z-10 px-6 md:px-16 pb-24">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-headline font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <BookOpen className="size-6 text-ur-primary" /> Healing Courses
            </h2>
            {isOwner && (
              <button onClick={() => navigate('/specialist-dashboard')}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ur-primary hover:underline">
                Manage Courses <ChevronRight className="size-4" />
              </button>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="py-24 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem]">
              <BookOpen className="size-12 text-white/10 mx-auto mb-4" />
              <p className="text-zinc-600 font-black text-xs uppercase tracking-widest">
                {isOwner ? 'No courses yet — create one from your Specialist Dashboard' : 'No courses published yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course.id} className="group bg-white/[0.04] border border-white/10 rounded-[2rem] p-8 hover:bg-white/[0.08] hover:border-ur-primary/30 transition-all duration-300 cursor-pointer">
                  <div className="mb-6">
                    <span className="text-[9px] font-black uppercase tracking-widest text-ur-primary bg-ur-primary/10 px-3 py-1.5 rounded-full border border-ur-primary/20">
                      {course.sessionType || 'Healing Course'}
                    </span>
                  </div>
                  <h3 className="text-xl font-headline font-black text-white mb-3 group-hover:text-ur-primary transition-colors">{course.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3">{course.description}</p>
                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-zinc-500 text-xs font-bold">{course.date ? new Date(course.date).toLocaleDateString() : 'Flexible'}</span>
                    <ChevronRight className="size-4 text-zinc-700 group-hover:text-ur-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showBooking && <BookingModal expert={expert} user={user} onClose={() => setShowBooking(false)} />}
    </div>
  );
}
