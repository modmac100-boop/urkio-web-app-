import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { 
  Search, Users, Calendar, Zap, Rocket, 
  MessageSquare, UserCircle, Settings, LayoutGrid, 
  Command, X, ChevronRight, Activity, Bell,
  BookOpen, Mic, Shield, CreditCard, HelpCircle,
  Stethoscope, Globe, Sparkles
} from 'lucide-react';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { t } = useTranslation();
  const { setActiveChatPartner } = useApp();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick Navigation Links (Sitemap)
  const navigationLinks = [
    { id: 'nav-dashboard', type: 'nav', title: 'Specialist Dashboard', icon: LayoutGrid, path: '/specialist-dashboard', subtitle: 'Practice analytics & overview' },
    { id: 'nav-messenger', type: 'nav', title: 'Messenger Hub', icon: MessageSquare, path: '/messenger', subtitle: 'End-to-end secure communication' },
    { id: 'nav-agenda', type: 'nav', title: 'My Agenda', icon: Calendar, path: '/agenda', subtitle: 'Patient bookings & schedule' },
    { id: 'nav-workstation', type: 'nav', title: 'Clinical Workstation', icon: Stethoscope, path: '/clinical-workstation', subtitle: 'HIPAA-compliant treatment suite' },
    { id: 'nav-homii', type: 'nav', title: 'Homii Voice Journal', icon: Mic, path: '/homii', subtitle: 'Aura & Tone profile analytics' },
    { id: 'nav-library', type: 'nav', title: 'Healing Library', icon: BookOpen, path: '/healing-courses', subtitle: 'Specialist-led education' },
    { id: 'nav-center', type: 'nav', title: 'Healing Center', icon: Globe, path: '/healing-center', subtitle: 'Social feed & community' },
    { id: 'nav-vault', type: 'nav', title: 'Secret Vault', icon: Shield, path: '/vault', subtitle: 'Encrypted asset storage' },
    { id: 'nav-settings', type: 'nav', title: 'System Settings', icon: Settings, path: '/settings', subtitle: 'Account & privacy preferences' },
  ];

  // Quick Actions
  const quickActions = [
    { id: 'act-call', type: 'action', title: 'Start Instant Call', icon: Zap, action: () => navigate('/conference/URK-NEW-XZ'), subtitle: 'Launch new video room' },
    { id: 'act-verify', type: 'action', title: 'Expert Verification', icon: Rocket, action: () => navigate('/verify'), subtitle: 'Apply for clinical status' },
  ];

  // Handle Global Shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        setIsSearching(true);
        const searchLower = searchTerm.toLowerCase();
        const searchPrefix = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
        
        try {
          // 1. User Search (Display Name & Email)
          const usersQ = query(
            collection(db, 'users'),
            where('displayName', '>=', searchPrefix),
            where('displayName', '<=', searchPrefix + '\uf8ff'),
            limit(10)
          );
          
          // 2. Clinical Cases
          const casesQ = query(
            collection(db, 'appointments'),
            where('clientName', '>=', searchPrefix),
            where('clientName', '<=', searchPrefix + '\uf8ff'),
            limit(5)
          );

          // 3. Courses (Library)
          const coursesQ = query(
            collection(db, 'events'),
            where('type', '==', 'course'),
            where('title', '>=', searchPrefix),
            where('title', '<=', searchPrefix + '\uf8ff'),
            limit(5)
          );

          const [userSnap, caseSnap, courseSnap] = await Promise.all([
            getDocs(usersQ),
            getDocs(casesQ),
            getDocs(coursesQ)
          ]);

          const userResults = userSnap.docs
            .map(doc => ({ id: doc.id, type: 'user', ...doc.data() }))
            .filter((u: any) => !u.isDeleted);
          const caseResults = caseSnap.docs.map(doc => ({ 
            id: doc.id, 
            type: 'case', 
            title: doc.data().clientName, 
            subtitle: `Active Patient Case: ${doc.data().caseCode || 'URK-ACT'}`,
            icon: Activity 
          }));
          const courseResults = courseSnap.docs.map(doc => ({
            id: doc.id,
            type: 'nav',
            title: doc.data().title,
            subtitle: `Library Course: ${doc.data().creatorName || 'Urkio'}`,
            path: '/healing-courses',
            icon: BookOpen
          }));

          const filteredNav = navigationLinks.filter(n => n.title.toLowerCase().includes(searchLower) || n.subtitle.toLowerCase().includes(searchLower));
          const filteredActions = quickActions.filter(a => a.title.toLowerCase().includes(searchLower));

          setResults([...filteredNav, ...filteredActions, ...caseResults, ...courseResults, ...userResults]);
        } catch (error) {
          console.error("Search error:", error);
          const navItems = navigationLinks.filter(n => n.title.toLowerCase().includes(searchLower));
          setResults(navItems);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([...navigationLinks, ...quickActions]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelect = useCallback((item: any) => {
    setIsOpen(false);
    if (item.type === 'nav') {
      navigate(item.path);
    } else if (item.type === 'action') {
      item.action();
    } else if (item.type === 'user') {
      navigate(`/user/${item.id}`);
    } else if (item.type === 'case') {
      navigate(`/clinical-workstation`);
      // Optional: set a global state to select this case specifically
    }
  }, [navigate]);

  // Keyboard navigation through results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) handleSelect(results[selectedIndex]);
    }
  };

  return (
    <>
      {/* Search Trigger in Header */}
      <button 
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-3 bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 hover:bg-white/10 px-4 py-2 rounded-2xl transition-all duration-300 w-48 lg:w-64"
      >
        <Search className="size-4 text-slate-400 group-hover:text-primary transition-colors" />
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">Search anything...</span>
        <div className="ms-auto flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <kbd className="text-[10px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded-md font-sans">⌘</kbd>
          <kbd className="text-[10px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded-md font-sans">K</kbd>
        </div>
      </button>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-200 flex items-start justify-center pt-24 md:pt-40 px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-[#0b0e14]/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-white/95 dark:bg-[#161920]/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <Search className={clsx("size-6 transition-colors", isSearching ? "text-primary animate-pulse" : "text-slate-400")} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter keywords or commands..."
                  className="flex-1 bg-transparent border-none text-lg font-medium focus:ring-0 outline-none text-slate-900 dark:text-white placeholder-slate-500"
                />
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white p-2">
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 max-h-[500px] overflow-y-auto p-4 custom-scrollbar">
                {results.length > 0 ? (
                  <div className="space-y-6">
                    {/* Categories of Results */}
                    {['nav', 'action', 'case', 'user'].map(type => {
                      const categoryItems = results.filter(item => item.type === type);
                      if (categoryItems.length === 0) return null;

                      return (
                        <div key={type}>
                          <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                            {type === 'nav' ? 'Navigation' : type === 'action' ? 'Quick Actions' : 'People & Experts'}
                          </h3>
                          <div className="space-y-1">
                            {categoryItems.map((item) => {
                              const globalIndex = results.indexOf(item);
                              const isSelected = globalIndex === selectedIndex;
                              const Icon = item.icon || UserCircle;

                              return (
                                <button
                                  key={item.id}
                                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                                  onClick={() => handleSelect(item)}
                                  className={clsx(
                                    "w-full flex items-center gap-4 p-3 rounded-2xl transition-all text-start group",
                                    isSelected ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.01]" : "hover:bg-white/5 text-slate-400 hover:text-white"
                                  )}
                                >
                                  <div className={clsx(
                                    "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                    isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-white/5"
                                  )}>
                                    {item.type === 'user' ? (
                                      <img 
                                        src={item.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName || 'User')}`} 
                                        className="size-10 rounded-xl object-cover" 
                                        alt="" 
                                      />
                                    ) : (
                                      <Icon className="size-5" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={clsx(
                                      "text-sm font-bold truncate",
                                      isSelected ? "text-white" : "text-slate-900 dark:text-white"
                                    )}>
                                      {item.displayName || item.title || item.fullName}
                                    </p>
                                    <p className={clsx(
                                      "text-[10px] font-medium truncate opacity-70 uppercase tracking-widest mt-0.5",
                                      isSelected ? "text-white/80" : "text-slate-500"
                                    )}>
                                      {item.type === 'user' ? (item.primaryRole || item.role || 'Verified User') : item.subtitle}
                                    </p>
                                  </div>
                                  <ChevronRight className={clsx(
                                    "size-4 transition-transform",
                                    isSelected ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0 group-hover:opacity-40"
                                  )} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <Command className="size-12 text-slate-700 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-500 font-medium">No matches found for "{searchTerm}"</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-black/20 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1 rounded">↵</kbd> Select</span>
                  <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1 rounded">↑↓</kbd> Navigate</span>
                  <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1 rounded">esc</kbd> Close</span>
                </div>
                <div className="flex items-center gap-2 text-primary opacity-60">
                   <Zap className="size-3" /> Powered by URKIO
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
