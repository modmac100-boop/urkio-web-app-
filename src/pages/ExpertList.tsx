import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Calendar, 
  ShieldCheck, 
  Verified, 
  Bell, 
  User as UserIcon,
  Stethoscope,
  BookOpen,
  CircleCheck,
  SearchIcon,
  ArrowRightCircle
} from 'lucide-react';
import { clsx } from 'clsx';

export function ExpertList({ user, userData }: { user: any; userData: any }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const q = query(collection(db, 'users'), limit(500));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filter criteria:
        // 1. Me (current user)
        // 2. Specific names: Ayat, Alma, Abed, Judy
        // 3. Must be an expert/specialist or approved
        const allowedNames = ['ayat', 'alma', 'abed', 'judy'];
        
        const filtered = all.filter((u: any) => {
          if (u.isDeleted) return false;
          
          const name = (u.displayName || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          
          // Keep current user
          if (user && u.id === user.uid) return true;
          
          // Keep specific names
          const nameMatch = allowedNames.some(n => name.includes(n));
          if (nameMatch) return true;
          
          // Keep verified experts generally? 
          // The prompt said "keep only me and eny one he is verified expert delete old keep me and Ayat, Alma, Abed, Judy"
          // This implies Ayat/Alma/Abed/Judy ARE the verified experts we want to keep, plus the user.
          // But "eny one he is verified" suggests a general rule too.
          // I'll stick to: User + Specific Names + Approved Experts
          
          return u.verificationStatus === 'approved' || u.role === 'specialist';
        });
        
        setExperts(filtered);
      } catch (err) {
        console.error("Error fetching experts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, [user]);

  const filteredExperts = experts.filter(e => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = (e.displayName || '').toLowerCase().includes(searchLower);
    const specialtyMatch = (e.specialty || e.primaryRole || '').toLowerCase().includes(searchLower);
    const matchesCategory = selectedCategory === 'All' || (e.specialty || '').toLowerCase().includes(selectedCategory.toLowerCase());
    return (nameMatch || specialtyMatch) && matchesCategory;
  });

  const featuredExpert = filteredExperts[0];
  const otherExperts = filteredExperts.slice(1);

  return (
    <div className={clsx(
      "min-h-screen font-sans transition-colors duration-500",
      actualTheme === 'dark' ? "bg-[#050A0F] text-[#e6e2de]" : "bg-[#fbf9f5] text-[#1b1c1a]"
    )}>
      <style>{`
        .expert-card-shadow {
          box-shadow: 0 4px 20px -2px rgba(0,0,0,0.1);
        }
        .font-serif-sc {
          font-family: 'Noto Serif SC', serif;
        }
        .font-space-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }
      `}</style>

      {/* Top Bar Navigation */}
      <nav className={clsx(
        "fixed top-0 left-0 w-full z-50 flex justify-between items-center px-12 py-4 border-b transition-all",
        actualTheme === 'dark' ? "bg-[#050A0F]/90 backdrop-blur-md border-cyan-900/20" : "bg-white/90 backdrop-blur-md border-slate-200"
      )}>
        <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#30B0D0] to-[#C8A96E] bg-clip-text text-transparent cursor-pointer" onClick={() => navigate('/')}>
          URKIO
        </div>
        <div className="hidden md:flex items-center gap-10">
          <button className="uppercase tracking-widest text-xs font-bold opacity-60 hover:opacity-100 transition-all">Discover</button>
          <button className="uppercase tracking-widest text-xs font-bold text-[#30B0D0] border-b-2 border-[#30B0D0] pb-1">Experts</button>
          <button className="uppercase tracking-widest text-xs font-bold opacity-60 hover:opacity-100 transition-all">Network</button>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 opacity-60">
            <Bell className="w-5 h-5 cursor-pointer hover:text-[#30B0D0] transition-colors" />
            <UserIcon className="w-5 h-5 cursor-pointer hover:text-[#30B0D0] transition-colors" onClick={() => navigate('/settings')} />
          </div>
          <button 
            onClick={() => navigate('/verify')}
            className="bg-[#30B0D0] text-[#050A0F] px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#30B0D0]/20"
          >
            Join as Expert
          </button>
        </div>
      </nav>

      <main className="pt-32 px-6 md:px-12 pb-24 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto mb-20">
          <span className="font-space-grotesk text-[#C8A96E] uppercase tracking-[0.3em] text-[10px] font-black mb-6 block">Certified Specialist Directory</span>
          <h1 className="font-serif-sc text-4xl md:text-6xl font-bold mb-8 leading-tight">
            Expertise Guided by <br/> <span className="italic text-[#30B0D0]">Clinical Humanism.</span>
          </h1>
          <p className="text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">
            Connect with world-class practitioners across clinical research, behavioral health, and wellness strategy. Every expert is verified through our rigorous quality framework.
          </p>

          {/* Search Section */}
          <div className="mt-16 relative max-w-3xl mx-auto">
            <div className={clsx(
              "flex items-center p-2 rounded-[2rem] border transition-all",
              actualTheme === 'dark' ? "bg-[#10161D] border-white/10" : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
            )}>
              <Search className="ml-6 mr-3 w-5 h-5 opacity-40" />
              <input 
                className="bg-transparent border-none focus:ring-0 w-full py-4 text-sm font-medium outline-none" 
                placeholder="Search by clinical specialty, name, or focus area..." 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="bg-[#C8A96E] text-[#050A0F] px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#D4B882] transition-all">
                Filter
              </button>
            </div>
            <div className="flex gap-3 mt-6 overflow-x-auto pb-4 scrollbar-hide">
              {['Behavioral Health', 'Integrative Medicine', 'Cognitive Performance', 'Nutritional Biohacking'].map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={clsx(
                    "px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                    selectedCategory === cat 
                      ? "bg-[#30B0D0] text-[#050A0F] border-transparent" 
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-[#30B0D0]/20 border-t-[#30B0D0] rounded-full animate-spin"></div>
            <p className="font-space-grotesk text-[10px] font-black uppercase tracking-widest opacity-40">Scanning Expert Registry...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Featured Expert Card */}
            {featuredExpert && (
              <div className={clsx(
                "md:col-span-8 rounded-[3rem] overflow-hidden border flex flex-col md:flex-row group transition-all duration-700 hover:border-[#30B0D0]/30",
                actualTheme === 'dark' ? "bg-[#10161D] border-white/5" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/40"
              )}>
                <div className="md:w-1/2 h-80 md:h-auto relative overflow-hidden">
                  <img 
                    alt={featuredExpert.displayName} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" 
                    src={featuredExpert.photoURL || 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=800'}
                  />
                  <div className="absolute top-6 left-6">
                    <span className="flex items-center gap-2 bg-[#050A0F]/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 text-[9px] font-black tracking-[0.2em] text-[#C8A96E]">
                      <Verified className="w-3 h-3 fill-current" />
                      VERIFIED EXPERT
                    </span>
                  </div>
                </div>
                <div className="md:w-1/2 p-10 md:p-12 flex flex-col justify-between">
                  <div>
                    <span className="font-space-grotesk text-[10px] font-black text-[#30B0D0] uppercase tracking-widest mb-4 block">Featured Provider</span>
                    <h3 className="font-serif-sc text-3xl font-bold mb-4">{featuredExpert.displayName}</h3>
                    <p className="text-sm opacity-60 leading-relaxed mb-8 line-clamp-3">
                      {featuredExpert.bio || "Leading expert in clinical wellness and behavioral habit formation. Dedicated to evidence-based protocols for long-term health."}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-8">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{featuredExpert.specialty || "Health Lead"}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">10+ Years Clinical</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Starting at</span>
                      <span className="font-space-grotesk text-xl font-bold">${featuredExpert.hourlyRate || '240'} <span className="text-[10px] opacity-40 font-normal">/ session</span></span>
                    </div>
                    <button 
                      onClick={() => navigate(`/expert/${featuredExpert.id}`)}
                      className="bg-[#30B0D0] text-[#050A0F] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#30B0D0]/20"
                    >
                      View Profile <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Small Expert Cards */}
            {otherExperts.map((expert) => (
              <div 
                key={expert.id}
                className={clsx(
                  "md:col-span-4 rounded-[3rem] p-8 flex flex-col justify-between border group transition-all duration-500 hover:scale-[1.02]",
                  actualTheme === 'dark' ? "bg-[#10161D] border-white/5 hover:border-[#30B0D0]/30" : "bg-white border-slate-100 shadow-xl shadow-slate-200/30"
                )}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-white/5 shadow-xl">
                    <img 
                      alt={expert.displayName} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                      src={expert.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName || 'Expert')}&background=random&color=fff&size=512`}
                    />
                  </div>
                  <Verified className="text-[#C8A96E] w-6 h-6 fill-current opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <span className="font-space-grotesk text-[10px] font-black text-[#30B0D0] uppercase tracking-widest mb-2 block">{expert.specialty || "Specialist"}</span>
                  <h3 className="font-serif-sc text-2xl font-bold mb-4">{expert.displayName}</h3>
                  <p className="text-xs opacity-60 leading-relaxed mb-8 line-clamp-2">
                    {expert.bio || "Dedicated to functional health and integrative performance coaching."}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="font-space-grotesk font-bold text-lg">${expert.hourlyRate || '185'} <span className="text-[10px] opacity-40 font-normal">/ hr</span></span>
                  <button 
                    onClick={() => navigate(`/expert/${expert.id}`)}
                    className="text-[#30B0D0] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    View Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Concierge Card */}
            <div className={clsx(
              "md:col-span-4 rounded-[3rem] p-10 border border-dashed text-center flex flex-col items-center justify-center space-y-6",
              actualTheme === 'dark' ? "bg-white/5 border-white/20" : "bg-slate-50 border-slate-300"
            )}>
              <div className="w-16 h-16 rounded-3xl bg-[#C8A96E]/10 flex items-center justify-center mb-4">
                <Stethoscope className="w-8 h-8 text-[#C8A96E]" />
              </div>
              <h3 className="font-serif-sc text-2xl font-bold leading-tight">Can't find a match?</h3>
              <p className="text-xs opacity-60 leading-relaxed">
                Our Concierge Team can help match you with a specialized expert based on your clinical needs.
              </p>
              <button className="w-full py-4 border border-[#C8A96E]/30 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#C8A96E] hover:text-[#050A0F] transition-all">
                Request Matching
              </button>
            </div>
          </div>
        )}

        {/* Verification Standards Section */}
        <section className={clsx(
          "mt-32 rounded-[4rem] p-12 md:p-20 flex flex-col lg:flex-row gap-16 items-center",
          actualTheme === 'dark' ? "bg-white/5 border border-white/5" : "bg-slate-50 border border-slate-200"
        )}>
          <div className="lg:w-1/2">
            <span className="font-space-grotesk text-[#C8A96E] uppercase tracking-[0.2em] text-[10px] font-black mb-6 block">Trust & Standards</span>
            <h2 className="font-serif-sc text-4xl font-bold mb-8 leading-tight">The URKIO <br/> Verification Standard.</h2>
            <p className="text-lg opacity-60 mb-12 leading-relaxed">
              We don't just host profiles; we vet practitioners. Our platform ensures that every expert meets the highest clinical and professional standards.
            </p>
            <ul className="space-y-8">
              {[
                { title: "Credential Authentication", desc: "Manual verification of medical licenses, academic PhDs, and board certifications." },
                { title: "Clinical Experience Audit", desc: "Requirement of minimum 10 years active practice for all senior consulting roles." },
                { title: "Peer-Reviewed Track Record", desc: "Assessment of published research, clinical case studies, and industry impact." }
              ].map((item, i) => (
                <li key={i} className="flex gap-6">
                  <div className="shrink-0 w-10 h-10 rounded-2xl bg-[#30B0D0]/10 flex items-center justify-center">
                    <CircleCheck className="w-6 h-6 text-[#30B0D0]" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">{item.title}</h4>
                    <p className="text-xs opacity-60">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 relative group">
            <div className="aspect-square rounded-[3rem] overflow-hidden border-8 border-white/10 shadow-2xl">
              <img 
                alt="Verification Process" 
                className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0" 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-[#050A0F] p-10 rounded-[2.5rem] border border-[#C8A96E]/20 shadow-2xl max-w-xs animate-in slide-in-from-bottom-8 duration-1000">
              <h4 className="font-serif-sc text-3xl text-[#C8A96E] font-bold mb-3">12-Point</h4>
              <p className="text-xs opacity-60 leading-relaxed font-medium">Multidisciplinary vetting framework applied to every specialist application.</p>
            </div>
          </div>
        </section>

        {/* Newsletter / CTA */}
        <section className="mt-32 py-24 text-center max-w-3xl mx-auto border-t border-white/5">
          <h2 className="font-serif-sc text-4xl font-bold mb-6">Join the Network.</h2>
          <p className="text-lg opacity-60 mb-12">Receive monthly insights on longevity, clinical research, and mental performance from our board-certified experts.</p>
          <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/5 rounded-[2.5rem] border border-white/5">
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 px-8 py-4 text-sm font-medium outline-none" 
              placeholder="Your professional email" 
              type="email"
            />
            <button className="bg-[#30B0D0] text-[#050A0F] px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
              Subscribe
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={clsx(
        "py-16 px-12 border-t transition-all",
        actualTheme === 'dark' ? "bg-[#020508] border-white/5" : "bg-white border-slate-200"
      )}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#30B0D0] to-[#C8A96E] bg-clip-text text-transparent">URKIO</span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">© 2024 URKIO. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-10">
            {['Privacy Policy', 'Terms of Service', 'Contact Us', 'Careers'].map(link => (
              <a key={link} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-[#30B0D0] transition-all" href="#">{link}</a>
            ))}
          </div>
          <div className="flex gap-6 opacity-30">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#30B0D0] transition-colors">public</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-[#30B0D0] transition-colors">language</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
