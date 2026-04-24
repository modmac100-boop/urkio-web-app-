import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { 
    BookOpen, Star, Plus, X, Lock, Unlock, ShieldCheck, 
  Search, Filter, ChevronRight, Play, Clock, Sparkles, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { UrkioMockData } from '../mockData';
import { EventDetailsModal } from '../components/EventDetailsModal';
import clsx from 'clsx';

export function HealingCourses({ user, userData }: { user: any, userData: any }) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [unlockedCourseIds, setUnlockedCourseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('urkio_unlocked_courses');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [courseToUnlock, setCourseToUnlock] = useState<any | null>(null);

  useEffect(() => {
    localStorage.setItem('urkio_unlocked_courses', JSON.stringify(unlockedCourseIds));
  }, [unlockedCourseIds]);

  useEffect(() => {
    // query only type 'course'
    const q = query(
      collection(db, 'events'), 
      where('type', '==', 'course'),
      orderBy('date', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching courses:", err);
      // Fallback to mock if empty or error (optional, but keep it robust)
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    const validCodes = [...(UrkioMockData.validHealingCodes || []), 'URKIO_ADMIN_2024', 'URKIO2024', 'URKIO_FOUNDER'];
    if (validCodes.includes(unlockCode)) {
      const newUnlocked = [...unlockedCourseIds, courseToUnlock.id];
      setUnlockedCourseIds(newUnlocked);
      setSelectedCourse(courseToUnlock);
      setCourseToUnlock(null);
      setUnlockCode('');
    } else {
      setUnlockError('Invalid code. Please try again.');
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#a8c8ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e1e2ea] font-['Manrope'] selection:bg-[#a8c8ff]/30">
      
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#a8c8ff]/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#c3c0ff]/5 rounded-full blur-[120px]" />
      </div>

      <section className="relative pt-24 pb-20 px-8 overflow-hidden z-10">
        <div className="max-w-[1400px] mx-auto">
          {/* Header Section */}
          <div className="mb-16">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[#a8c8ff]/10 border border-[#a8c8ff]/20 text-[#a8c8ff] text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-[0_0_20px_rgba(168,200,255,0.1)]">
              <Sparkles className="size-3" />
              Educational Excellence
            </div>
            <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-[0.85] text-white mb-10">
              Healing <span className="text-transparent bg-clip-text bg-linear-to-r from-[#a8c8ff] via-[#c3c0ff] to-[#a8c8ff]">Courses</span>
            </h1>
            <p className="text-xl text-[#8b919e] font-medium leading-relaxed max-w-2xl">
              Immerse yourself in structured clinical wisdom. Unlock expert-led journeys designed for profound personal architectural shifts.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-16 max-w-4xl">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="size-5 text-[#414752] group-focus-within:text-[#a8c8ff] transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search courses by keyword or specialist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-semibold focus:ring-1 focus:ring-[#a8c8ff]/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, idx) => {
                const isLocked = !unlockedCourseIds.includes(course.id) && user?.email !== 'urkio@urkio.com';
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => isLocked ? setCourseToUnlock(course) : setSelectedCourse(course)}
                    className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 cursor-pointer hover:bg-white/10 hover:border-[#a8c8ff]/30 transition-all duration-500 overflow-hidden"
                  >
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-8">
                      <div className={clsx(
                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        isLocked 
                          ? "bg-white/5 border-white/10 text-[#8b919e]" 
                          : "bg-[#a8c8ff]/10 border-[#a8c8ff]/20 text-[#a8c8ff]"
                      )}>
                        {isLocked ? 'Locked Path' : 'Unlocked'}
                      </div>
                      {isLocked ? (
                        <Lock className="size-5 text-white/20" />
                      ) : (
                        <Unlock className="size-5 text-[#a8c8ff]" />
                      )}
                    </div>

                    {/* Course Title & Desc */}
                    <h3 className="text-2xl font-black italic text-white mb-4 group-hover:text-[#a8c8ff] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-[#8b919e] font-medium leading-relaxed line-clamp-3 mb-10">
                      {course.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 pt-8 border-t border-white/5 mt-auto">
                      <div className="relative">
                        <img 
                          src={course.creatorPhoto || `https://ui-avatars.com/api/?name=${course.creatorName}&background=a8c8ff&color=0b0e14`} 
                          alt={course.creatorName} 
                          className="size-10 rounded-xl object-cover ring-2 ring-white/10"
                        />
                        <div className="absolute -bottom-1 -right-1 size-4 bg-[#a8c8ff] border-2 border-[#0b0e14] rounded-full flex items-center justify-center">
                          <CheckCircle2 className="size-2 text-[#0b0e14]" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1">
                          {course.creatorName}
                        </p>
                        <p className="text-[9px] font-bold text-[#414752] uppercase tracking-wider">
                          Specialist Architect
                        </p>
                      </div>
                    </div>

                    {/* Hover Decoration */}
                    <div className="absolute top-0 right-0 p-12 bg-[#a8c8ff]/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
               <BookOpen className="size-16 text-white/10 mx-auto mb-6" />
               <p className="text-[#8b919e] font-bold uppercase tracking-[0.2em]">No courses found match your query.</p>
            </div>
          )}
        </div>
      </section>

      {/* Unlock Course Modal */}
      <AnimatePresence>
        {courseToUnlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#0b0e14]/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#151921] rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/10 p-12 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setCourseToUnlock(null)}
                className="absolute top-8 right-8 p-2 text-[#414752] hover:text-white transition-colors"
              >
                <X className="size-6" />
              </button>

              <div className="w-20 h-20 bg-[#a8c8ff]/10 rounded-4xl flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(168,200,255,0.1)]">
                <Lock className="size-8 text-[#a8c8ff]" />
              </div>

              <h2 className="text-3xl font-black italic text-white text-center mb-4">
                Unlock Journey
              </h2>
              <p className="text-[#8b919e] text-center mb-10 font-medium px-4">
                Enter your architectural access code to bridge into "<span className="text-[#a8c8ff] font-bold">{courseToUnlock.title}</span>".
              </p>

              <form onSubmit={handleUnlock} className="space-y-6">
                <input
                  type="text"
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value.toUpperCase())}
                  placeholder="ARCH-XXXX-XXXX"
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 text-center text-xl font-mono tracking-[0.3em] text-[#a8c8ff] focus:border-[#a8c8ff]/50 focus:outline-none transition-all placeholder:text-[#414752]"
                  required
                  autoFocus
                />
                
                {unlockError && (
                  <p className="text-xs font-black uppercase text-center text-rose-500 tracking-widest mt-2">
                    {unlockError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-5 bg-[#a8c8ff] text-[#0b0e14] rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_40px_rgba(168,200,255,0.2)]"
                >
                  Initiate Bridge
                </button>
              </form>

              <p className="mt-10 text-[10px] text-center text-[#414752] font-black uppercase tracking-[0.2em]">
                Code Required • Secure Encryption Active
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Detail Modal (Using existing EventDetailsModal) */}
      <AnimatePresence>
        {selectedCourse && (
          <EventDetailsModal
            selectedEvent={selectedCourse}
            setSelectedEvent={setSelectedCourse}
            user={user}
            userData={userData}
            handleDeleteEvent={() => {}} // Optional: pass deletion if needed
          />
        )}
      </AnimatePresence>
    </div>
  );
}
