import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Check, X, Copy } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1b1c1a]/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#fbf9f5] border border-[#e4e2de] rounded-[2.5rem] w-full max-w-lg p-10 relative shadow-2xl font-['Manrope']">
        <button onClick={onClose} className="absolute top-8 right-8 text-[#707978] hover:text-[#003634] transition-colors"><X className="size-6" /></button>

        {step === 'form' ? (
          <>
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#003634] mb-2">Book a Session</p>
              <h2 className="text-3xl font-['Newsreader'] font-medium text-[#003634] tracking-tighter">with {expert.displayName}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#707978] uppercase tracking-widest mb-2 block">Date</label>
                  <input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full bg-[#efeeea] border border-[#e4e2de] rounded-2xl px-4 py-3 text-[#1b1c1a] text-sm focus:outline-none focus:border-[#003634]/50"
                    min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#707978] uppercase tracking-widest mb-2 block">Time</label>
                  <input type="time" required value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full bg-[#efeeea] border border-[#e4e2de] rounded-2xl px-4 py-3 text-[#1b1c1a] text-sm focus:outline-none focus:border-[#003634]/50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#707978] uppercase tracking-widest mb-2 block">Session Type</label>
                <select value={form.sessionType} onChange={e => setForm(p => ({ ...p, sessionType: e.target.value }))}
                  className="w-full bg-[#efeeea] border border-[#e4e2de] rounded-2xl px-4 py-3 text-[#1b1c1a] text-sm focus:outline-none">
                  <option value="therapy">One-on-One Therapy</option>
                  <option value="healing-course">Healing Course Session</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#707978] uppercase tracking-widest mb-2 block">Your Message (optional)</label>
                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Briefly describe what you'd like to work on..."
                  rows={3}
                  className="w-full bg-[#efeeea] border border-[#e4e2de] rounded-2xl px-4 py-3 text-[#1b1c1a] text-sm focus:outline-none resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 bg-[#003634] text-[#ffffff] rounded-2xl font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-all disabled:opacity-50">
                {loading ? 'Submitting…' : 'Confirm Session Request'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-8">
            <div className="bg-[#d2e5c9] rounded-full p-6 inline-flex items-center justify-center mx-auto">
              <Check className="size-10 text-[#52634d]" />
            </div>
            <div>
              <h2 className="text-3xl font-['Newsreader'] font-medium text-[#003634] tracking-tighter mb-2">Request Sent!</h2>
              <p className="text-[#707978] text-sm">{expert.displayName} will confirm your session shortly.</p>
            </div>
            <div className="bg-[#efeeea] border border-[#e4e2de] rounded-2xl p-6 space-y-3">
              <p className="text-[10px] font-bold text-[#707978] uppercase tracking-widest">Your Session Room</p>
              <p className="text-2xl font-mono font-bold text-[#003634]">{roomCode}</p>
              <button onClick={copy} className="flex items-center justify-center gap-2 mx-auto text-xs font-bold uppercase tracking-widest text-[#52634d] hover:text-[#003634] transition-colors">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied!' : 'Copy Room Link'}
              </button>
            </div>
            <button onClick={onClose} className="w-full py-4 bg-[#003634] text-[#ffffff] rounded-2xl font-bold text-sm tracking-wide hover:bg-[#1b4d4b] transition-all">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}// ---------- Main Page ----------
export function ExpertPublicSpaceV2({ user, userData }: { user: any; userData: any }) {
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

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
    <div className="min-h-screen bg-[#fbf9f5] flex items-center justify-center">
      <div className="size-12 border-4 border-[#003634] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!expert) return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col items-center justify-center text-[#1b1c1a] gap-6 font-['Manrope']">
      <p className="text-2xl font-bold">Expert not found</p>
      <button onClick={() => navigate(-1)} className="text-[#003634] underline">Go back</button>
    </div>
  );

  const displaySpecialty = expert.specialty ? expert.specialty.join(', ') : (expert.primaryRole || 'EXPERT');
  const coverUrl = expert.coverURL || "https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";
  const avatarUrl = expert.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName || 'E')}&background=003634&color=fff&size=300`;

  const tabs = ['Posts', 'Media', 'Live Replays', 'Reviews', 'Services'];

  return (
    <div className="bg-[#fbf9f5] text-[#1b1c1a] font-['Manrope'] min-h-screen selection:bg-[#9ed0cd]/30">
      
      {/* Top Navigation Shell */}
      <nav className="bg-[#FDFCFB] dark:bg-[#121414] border-b border-[#E6E2DE] dark:border-[#2A2D2D] shadow-[0px_4px_20px_rgba(27,77,75,0.02)] fixed top-0 w-full z-50">
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-7xl mx-auto">
          <span onClick={() => navigate('/')} className="cursor-pointer font-['Newsreader'] font-bold text-2xl text-[#1B4D4B] dark:text-[#3D8C89]">URKIO</span>
          <div className="hidden md:flex items-center space-x-8 font-['Newsreader'] serif tracking-tight text-lg">
            <button className="text-[#1B4D4B]/60 dark:text-[#3D8C89]/60 hover:text-[#1B4D4B] transition-colors duration-200">Feed</button>
            <button className="text-[#1B4D4B] dark:text-[#3D8C89] border-b-2 border-[#1B4D4B] dark:border-[#3D8C89] pb-1">Experts</button>
            <button onClick={() => navigate('/guide')} className="text-[#1B4D4B]/60 dark:text-[#3D8C89]/60 hover:text-[#1B4D4B] transition-colors duration-200">Journey</button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-urkio-agent'))}
              className="flex items-center gap-1.5 text-[#30B0D0] font-bold hover:opacity-80 transition-opacity duration-200"
            >
              <span className="material-symbols-outlined text-[20px]">sparkles</span>
              Urkio Agent
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button className="material-symbols-outlined text-[#1B4D4B]">notifications</button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#c0c8c7]">
              <img alt="User profile" className="w-full h-full object-cover" src={user?.photoURL || avatarUrl} />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="pt-16 pb-24 max-w-7xl mx-auto px-4 md:px-6">
        {/* Header Section */}
        <header className="relative mt-4">
          <div className="aspect-[16/9] md:aspect-[3/1] w-full rounded-2xl overflow-hidden bg-[#efeeea] shadow-sm">
            <img alt="Serene landscape" className="w-full h-full object-cover opacity-90" src={coverUrl} />
          </div>
          <div className="absolute -bottom-12 left-6 md:left-12 flex items-end space-x-4 md:space-x-6">
            <div className="relative">
              <div className="w-24 h-24 md:w-40 md:h-40 rounded-full border-4 border-[#fbf9f5] overflow-hidden shadow-xl bg-[#ffffff]">
                <img alt={expert.displayName} className="w-full h-full object-cover" src={avatarUrl} />
              </div>
              {expert.isVerified && (
                <div className="absolute bottom-1 right-1 md:bottom-3 md:right-3 bg-white rounded-full p-0.5 md:p-1 shadow-md">
                  <span className="material-symbols-outlined text-[#FFD700] text-sm md:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              )}
            </div>
            <div className="mb-4 hidden md:block">
              <div className="flex items-center space-x-2">
                <h1 className="font-['Newsreader'] text-[40px] leading-tight font-semibold text-[#003634]">{expert.displayName}</h1>
                <span className="px-3 py-0.5 bg-[#1b4d4b] text-[#8cbdba] rounded-full text-[12px] font-semibold tracking-wider uppercase">{displaySpecialty}</span>
              </div>
              <p className="font-['Manrope'] text-[14px] font-semibold text-[#707978]">{expert.location || 'San Francisco, CA'}</p>
            </div>
          </div>
        </header>

        {/* Mobile Title/Location (Visible only on mobile) */}
        <div className="mt-16 md:hidden px-4">
          <div className="flex items-center space-x-2">
            <h1 className="font-['Newsreader'] text-3xl font-semibold text-[#003634]">{expert.displayName}</h1>
            <span className="px-2 py-0.5 bg-[#1b4d4b] text-[#8cbdba] rounded-full text-[10px] font-bold uppercase">{displaySpecialty}</span>
          </div>
          <p className="font-['Manrope'] text-[12px] font-semibold text-[#707978]">{expert.location || 'San Francisco, CA'}</p>
        </div>

        {/* Layout Grid */}
        <div className="mt-8 md:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar (Left) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Bio Card */}
            <div className="bg-[#ffffff] p-6 rounded-2xl shadow-[0px_4px_20px_rgba(27,77,75,0.03)] border border-[#e4e2de]/30">
              <h2 className="font-['Newsreader'] text-2xl font-medium text-[#003634] mb-3">About</h2>
              <p className="text-[#404848] font-['Manrope'] text-[16px] leading-relaxed italic mb-4">
                "{expert.bio || 'Specializing in neuro-plasticity and sustainable habit architecture.'}"
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {(expert.tags || ['#CognitiveBehavioral', '#Wellness', '#Leadership']).map((tag: string, i: number) => (
                  <span key={i} className="text-[12px] text-[#52634d] font-semibold">{tag}</span>
                ))}
              </div>
              
              {/* Action Bar */}
              <div className="space-y-3">
                <button 
                  onClick={() => setShowBooking(true)}
                  className="w-full py-3 bg-[#003634] text-[#ffffff] rounded-xl font-['Manrope'] font-semibold shadow-lg shadow-[#003634]/10 transition-transform active:scale-95"
                >
                  Book Appointment
                </button>
                <div className="flex gap-3">
                  <button className="flex-1 py-3 border border-[#52634d] text-[#52634d] rounded-xl font-['Manrope'] font-semibold hover:bg-[#52634d]/5 transition-colors">Follow</button>
                  <button className="flex-1 py-3 border border-[#52634d] text-[#52634d] rounded-xl font-['Manrope'] font-semibold hover:bg-[#52634d]/5 transition-colors">Message</button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f5f3ef] p-4 rounded-xl flex flex-col justify-center items-center text-center">
                <span className="font-['Newsreader'] text-2xl font-medium text-[#003634]">{expert.followersCount || '12.4k'}</span>
                <span className="text-[12px] font-medium text-[#c0c8c7] font-['Manrope']">Followers</span>
              </div>
              <div className="bg-[#f5f3ef] p-4 rounded-xl flex flex-col justify-center items-center text-center">
                <span className="font-['Newsreader'] text-2xl font-medium text-[#003634]">{expert.followingCount || '842'}</span>
                <span className="text-[12px] font-medium text-[#c0c8c7] font-['Manrope']">Following</span>
              </div>
              <div className="bg-[#f5f3ef] p-4 rounded-xl flex flex-col justify-center items-center text-center">
                <span className="font-['Newsreader'] text-2xl font-medium text-[#003634]">{expert.sessionCount || '1,200+'}</span>
                <span className="text-[12px] font-medium text-[#c0c8c7] font-['Manrope']">Sessions</span>
              </div>
              <div className="bg-[#f5f3ef] p-4 rounded-xl flex flex-col justify-center items-center text-center">
                <span className="font-['Newsreader'] text-2xl font-medium text-[#003634]">{expert.livesCount || '45'}</span>
                <span className="text-[12px] font-medium text-[#c0c8c7] font-['Manrope']">Lives Hosted</span>
              </div>
            </div>
          </aside>

          {/* Main Feed (Right) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tabs */}
            <div className="flex items-center space-x-8 border-b border-[#e4e2de] overflow-x-auto pb-px custom-scrollbar">
              {tabs.map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "pb-4 text-[14px] font-semibold font-['Manrope'] whitespace-nowrap transition-colors relative",
                    activeTab === tab ? "text-[#003634]" : "text-[#707978] hover:text-[#003634]"
                  )}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#003634]" />}
                </button>
              ))}
            </div>

            {/* Journey Timeline Section */}
            <section className="bg-[#ffffff] p-8 rounded-2xl border border-[#e4e2de]/30">
              <h3 className="font-['Newsreader'] text-2xl font-medium text-[#003634] mb-8">Professional Journey</h3>
              <div className="relative pl-8 border-l-2 border-[#d2e5c9] space-y-12">
                
                {courses.length > 0 ? courses.map((course, i) => (
                  <div key={course.id} className="relative">
                    <div className={clsx(
                      "absolute -left-[41px] top-0 w-4 h-4 rounded-full border-4 border-[#fbf9f5]",
                      i % 3 === 0 ? "bg-[#003634]" : i % 3 === 1 ? "bg-[#52634d]" : "bg-[#c0c8c7]"
                    )} />
                    <div>
                      <span className="text-[12px] text-[#52634d] font-bold uppercase tracking-widest font-['Manrope']">
                        {new Date(course.date || Date.now()).getFullYear()} • {course.sessionType || 'HEALING COURSE'}
                      </span>
                      <h4 className="font-['Newsreader'] text-2xl text-[#1b4d4b] mt-1">{course.title}</h4>
                      <p className="text-[#404848] font-['Manrope'] text-[16px] mt-2 max-w-xl">{course.description}</p>
                      {course.coverURL && (
                        <div className="mt-4 rounded-xl overflow-hidden aspect-[21/9] bg-[#efeeea]">
                          <img alt={course.title} className="w-full h-full object-cover" src={course.coverURL} />
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <>
                    <div className="relative">
                      <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-[#003634] border-4 border-[#fbf9f5]"></div>
                      <div>
                        <span className="text-[12px] text-[#52634d] font-bold uppercase tracking-widest font-['Manrope']">2023 • Major Release</span>
                        <h4 className="font-['Newsreader'] text-2xl text-[#1b4d4b] mt-1">Book Publication: "The Malleable Mind"</h4>
                        <p className="text-[#404848] font-['Manrope'] text-[16px] mt-2 max-w-xl">Deep dive into sustainable neuro-habit architecture for modern high-performers.</p>
                        <div className="mt-4 rounded-xl overflow-hidden aspect-[21/9] bg-[#efeeea]">
                          <img alt="Book Launch" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1455390582262-044cdead2708?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" />
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-[#52634d] border-4 border-[#fbf9f5]"></div>
                      <div>
                        <span className="text-[12px] text-[#52634d] font-bold uppercase tracking-widest font-['Manrope']">2020 • Entrepreneurship</span>
                        <h4 className="font-['Newsreader'] text-2xl text-[#1b4d4b] mt-1">Neuro-Architecture Clinic Launch</h4>
                        <p className="text-[#404848] font-['Manrope'] text-[16px] mt-2 max-w-xl">Founded a holistic clinical space in San Francisco focusing on evidence-based habit formation.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Post Teaser Card */}
            <article className="bg-[#ffffff] p-6 rounded-2xl border border-[#e4e2de]/30 group">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img alt={expert.displayName} className="w-full h-full object-cover" src={avatarUrl} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#003634] font-['Manrope']">{expert.displayName}</p>
                  <p className="text-[12px] font-medium text-[#707978] font-['Manrope']">2 hours ago</p>
                </div>
              </div>
              <p className="font-['Manrope'] text-[16px] text-[#404848] mb-6">
                The science of "micro-wins" is often underestimated. Small, dopamine-fuelled shifts create the structural integrity required for permanent habit change...
              </p>
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-[#003634]/60 hover:text-[#003634] transition-colors">
                  <span className="material-symbols-outlined text-xl">favorite</span>
                  <span className="text-[12px] font-medium">4.2k</span>
                </button>
                <button className="flex items-center space-x-2 text-[#003634]/60 hover:text-[#003634] transition-colors">
                  <span className="material-symbols-outlined text-xl">chat_bubble</span>
                  <span className="text-[12px] font-medium">128</span>
                </button>
                <button className="flex items-center space-x-2 text-[#003634]/60 hover:text-[#003634] transition-colors">
                  <span className="material-symbols-outlined text-xl">share</span>
                  <span className="text-[12px] font-medium">Share</span>
                </button>
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 pb-safe bg-[#FDFCFB]/90 backdrop-blur-md z-50 border-t border-[#E6E2DE] rounded-t-2xl shadow-[0px_-10px_30px_rgba(27,77,75,0.05)]">
        <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-[#1B4D4B]/50 px-3 py-1">
          <span className="material-symbols-outlined">home</span>
          <span className="font-['Newsreader'] font-medium text-[10px]">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center text-[#1B4D4B]/50 px-3 py-1">
          <span className="material-symbols-outlined">search</span>
          <span className="font-['Newsreader'] font-medium text-[10px]">Explore</span>
        </button>
        <button className="flex flex-col items-center justify-center text-[#1B4D4B]/50 px-3 py-1">
          <span className="material-symbols-outlined">timeline</span>
          <span className="font-['Newsreader'] font-medium text-[10px]">Journey</span>
        </button>
        <button className="flex flex-col items-center justify-center text-[#1B4D4B]/50 px-3 py-1">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="font-['Newsreader'] font-medium text-[10px]">Connect</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-[#1B4D4B]/10 text-[#1B4D4B] rounded-xl px-3 py-1 scale-95 duration-150">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="font-['Newsreader'] font-medium text-[10px]">Profile</span>
        </button>
      </div>

      {showBooking && <BookingModal expert={expert} user={user} onClose={() => setShowBooking(false)} />}
    </div>
  );
}
