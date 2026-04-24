import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, Calendar, Heart, BadgeCheck, Settings, HelpCircle, 
  Star, ChevronRight, Filter, MessageSquare, Briefcase, Award,
  Clock, DollarSign, ExternalLink, ShieldCheck, Phone
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { AvatarWithBadges } from '../components/UserBadges';
import clsx from 'clsx';

export function HealingCenter({ user, userData }: { user: any; userData: any }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        // Query for approved experts and specialists directly
        const qSpecialists = query(collection(db, 'users'), where('role', '==', 'specialist'), limit(100));
        const qVerified = query(collection(db, 'users'), where('verificationStatus', '==', 'approved'), limit(100));
        
        const [specSnap, verSnap] = await Promise.all([getDocs(qSpecialists), getDocs(qVerified)]);
        
        const resultMap = new Map();
        specSnap.docs.forEach(d => resultMap.set(d.id, { id: d.id, ...d.data() }));
        verSnap.docs.forEach(d => resultMap.set(d.id, { id: d.id, ...d.data() }));
        
        const expertsArray = Array.from(resultMap.values()).filter((e: any) => !e.isDeleted);
        setExperts(expertsArray);
      } catch (err) {
        console.error("Error fetching experts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, []);

  const filteredExperts = experts.filter(e => {
    const roleContent = (e.specialty || e.primaryRole || e.specialization || '').toLowerCase();
    const nameMatch = (e.displayName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = roleContent.includes(searchQuery.toLowerCase());
    
    // Check if category matches search or role
    const matchesCategory = selectedCategory === 'All' || roleContent.includes(selectedCategory.toLowerCase());
    return (nameMatch || roleMatch) && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e1e2ea] font-['Manrope'] selection:bg-[#a8c8ff]/30">
      
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#a8c8ff]/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#c3c0ff]/5 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section - Marketplace Style */}
      <section className="relative pt-24 pb-40 px-8 overflow-hidden">
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-20">
            <div className="max-w-4xl">
               <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[#a8c8ff]/10 border border-[#a8c8ff]/20 text-[#a8c8ff] text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-[0_0_20px_rgba(168,200,255,0.1)]">
                 <span className="size-2 rounded-full bg-[#a8c8ff] animate-ping" />
                 Global Healing Syndicate
               </div>
               <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-[0.85] text-white mb-10">
                 Elite <span className="text-transparent bg-clip-text bg-linear-to-r from-[#a8c8ff] via-msgr-primary-container to-[#c3c0ff]">Synergy</span> <br />
                 for Harmony.
               </h1>
               <p className="text-xl text-[#8b919e] font-medium leading-relaxed max-w-2xl">
                 Access an exclusive network of verified practitioners dedicating their clinical brilliance to your personal transformation. Secure. Verified. Ethereal.
               </p>
            </div>
            
            <div className="hidden lg:block shrink-0">
               <div className="size-32 rounded-full border border-white/10 flex items-center justify-center relative group">
                  <div className="absolute inset-0 rounded-full border border-[#a8c8ff]/20 animate-[spin_8s_linear_infinite]" />
                  <Heart className="size-10 text-[#a8c8ff] group-hover:scale-110 transition-transform duration-500" />
               </div>
            </div>
          </div>

          {/* Search Bento - Integrated */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-6xl">
            <div className="md:col-span-8 relative group">
              <div className="absolute inset-0 bg-[#a8c8ff]/5 rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-4xl p-2 flex items-center">
                <Search className="ml-6 size-5 text-[#a8c8ff]" />
                <input 
                  type="text" 
                  placeholder="Query by name, specialty, or clinical focus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none py-4 px-6 focus:ring-0 text-white text-sm font-semibold placeholder-[#414752]"
                />
              </div>
            </div>
            <div className="md:col-span-4">
              <button className="w-full h-full bg-[#a8c8ff] text-[#003062] rounded-4xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all py-6 md:py-0">
                Execute Directory Search
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-8 -mt-20 relative z-20">
         {/* Trust Protocol Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: BadgeCheck, val: '500+', label: 'Verified Clinical Experts', color: 'text-[#a8c8ff]' },
              { icon: Star, val: '4.95', label: 'Average Syndicate Rating', color: 'text-[#c3c0ff]' },
              { icon: ShieldCheck, val: '100%', label: 'Encrypted Privacy Protocol', color: 'text-emerald-400' }
            ].map((stat, i) => (
              <div key={i} className="bg-[#161920]/80 backdrop-blur-2xl border border-white/5 rounded-4xl p-10 shadow-2xl flex items-center gap-8 group hover:border-[#a8c8ff]/30 transition-all duration-500">
                <div className={clsx("size-16 rounded-3xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500", stat.color)}>
                  <stat.icon className="size-8" />
                </div>
                <div>
                  <h4 className="text-3xl font-black text-white italic leading-none mb-1">{stat.val}</h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b919e]">{stat.label}</p>
                </div>
              </div>
            ))}
         </div>

         {/* Main Marketplace Layout */}
         <div className="mt-20 grid grid-cols-1 xl:grid-cols-12 gap-16 pb-40">
            
            {/* Navigational Refinement */}
            <aside className="xl:col-span-3">
               <div className="bg-[#161920]/50 backdrop-blur-xl border border-white/5 rounded-4xl p-10 sticky top-28 shadow-xl">
                  <div className="flex items-center gap-3 mb-10">
                    <Filter className="size-5 text-[#a8c8ff]" />
                    <h3 className="text-lg font-black italic text-white">Refine Axis</h3>
                  </div>
                  
                  <div className="space-y-10">
                     <div>
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[#414752] block mb-6">Expertise Vertical</label>
                        <div className="space-y-2.5">
                           {['All', 'Clinical Therapy', 'Nutrition', 'Biohacking', 'Spiritual', 'Performance'].map((cat) => (
                             <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={clsx(
                                  "w-full text-start px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
                                  selectedCategory === cat ? "bg-[#a8c8ff] text-[#003062] shadow-[0_10px_20px_rgba(168,200,255,0.15)]" : "bg-white/5 text-[#8b919e] hover:bg-white/10 hover:text-white"
                                )}
                             >
                               {cat}
                               {selectedCategory === cat && <div className="absolute right-4 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-[#003062]" />}
                             </button>
                           ))}
                        </div>
                     </div>

                     <div className="pt-10 border-t border-white/5">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[#414752] block mb-6">Availability Protocol</label>
                        <div className="space-y-4">
                           {['Instant Access', 'Verified Online', 'Upcoming Slots'].map((pref) => (
                             <label key={pref} className="flex items-center gap-4 group cursor-pointer">
                                <div className="size-6 rounded-xl border-2 border-white/10 bg-white/5 flex items-center justify-center group-hover:border-[#a8c8ff]/40 transition-all">
                                   <div className="size-2 rounded-full bg-[#a8c8ff] scale-0 group-hover:scale-100 transition-transform" />
                                </div>
                                <span className="text-[11px] font-bold text-[#8b919e] group-hover:text-white transition-colors">{pref}</span>
                             </label>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </aside>

            {/* Expert Nexus */}
            <section className="xl:col-span-9 space-y-12">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div>
                    <h2 className="text-4xl font-black italic text-white mb-2">Featured Practitioners</h2>
                    <p className="text-sm font-medium text-[#8b919e]">Highest rated experts in the current cycle</p>
                  </div>
                  <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[#8b919e] text-[10px] font-black uppercase tracking-widest">
                     Primary Vector: <span className="text-[#a8c8ff] cursor-pointer hover:text-white transition-colors">Recommended</span>
                  </div>
               </div>

               {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {[1, 2, 3, 4, 5, 6].map(i => (
                     <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                   ))}
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredExperts.map((expert) => (
                      <div 
                        key={expert.id}
                        onClick={() => navigate(`/user/${expert.id}?resume=1`)}
                        className="group bg-[#22242c] rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer flex flex-col shadow-2xl hover:-translate-y-1 hover:shadow-3xl border border-white/5"
                      >
                         {/* Card Header: Edge-to-edge Image */}
                         <div className="relative h-40 w-full overflow-hidden flex items-center justify-center bg-linear-to-br from-[#f8f9fa] to-[#d1d5db]">
                           <img 
                             src={expert.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName || 'Expert')}&background=random&color=fff&size=256`}
                             alt={expert.displayName}
                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                           />
                           
                           {/* Bottom fade into card bg */}
                           <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-[#22242c] to-transparent pointer-events-none" />

                           {/* Active Badge */}
                           {expert.isOnline && (
                             <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 backdrop-blur-md rounded-full border border-emerald-500/20">
                               <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                               <span className="text-[8px] font-black tracking-widest uppercase text-emerald-400">ACTIVE</span>
                             </div>
                           )}

                           {/* Star Rating */}
                           <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                             <Star className="size-3 fill-amber-400 text-amber-400" />
                             <span className="text-[10px] font-black text-white">{expert.rating || '4.9'}</span>
                           </div>
                         </div>

                         {/* Card Body */}
                         <div className="p-4 pt-0 flex flex-col flex-1 relative z-10">
                            
                            <div className="flex items-center justify-between mb-0.5 mt-3">
                               <h3 className="text-base font-bold text-white tracking-tight group-hover:text-[#a8c8ff] transition-colors line-clamp-1 mr-1">
                                 {expert.displayName || "Elite Practitioner"}
                               </h3>
                               <span className="text-[9px] font-bold text-[#8b919e] uppercase tracking-widest shrink-0">
                                 {expert.hourlyRate ? `$${expert.hourlyRate}/HR` : 'PREMIUM'}
                               </span>
                            </div>

                            <p className="text-[9px] font-semibold text-[#a8c8ff] mb-2">
                               {expert.specialty || expert.primaryRole || "Psychologist"}
                            </p>

                            <p className="text-[11px] font-medium text-[#8b919e] italic leading-relaxed line-clamp-2 mb-3">
                               "{expert.bio || "Dedicated to transforming human potential through architectural healing and mindfulness."}"
                            </p>

                            <div className="flex items-center gap-3 mb-3">
                               <div className="flex items-center gap-1 text-[#8b919e]">
                                 <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                 <span className="text-[8px] font-black uppercase tracking-widest">{expert.location || 'DAMASCUS'}</span>
                               </div>
                               <div className="flex items-center gap-1 text-[#8b919e]">
                                 <Calendar className="size-3" />
                                 <span className="text-[8px] font-black uppercase tracking-widest">{expert.experience || '8+ YEARS'}</span>
                               </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3 mt-auto">
                               {(expert.tags || ['STRESS RELIEF', 'MINDFULNESS', 'TRAUMA ZEN']).slice(0,3).map((tag: string) => (
                                 <span key={tag} className="px-1.5 py-0.5 bg-white/5 rounded-md text-[7px] font-black text-[#8b919e] uppercase tracking-widest whitespace-nowrap">
                                   {tag}
                                 </span>
                               ))}
                            </div>

                            <div className="flex flex-col gap-2 mt-auto">
                               <div className="flex gap-1.5">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); navigate(`/user/${expert.id}?action=book`) }}
                                   className="flex-1 bg-[#b0cfff] text-[#122b5e] rounded-lg py-2 px-3 flex items-center justify-between hover:brightness-110 active:scale-95 transition-all shadow-md"
                                 >
                                   <span className="text-[10px] font-black uppercase tracking-widest">BOOK NOW</span>
                                   <ChevronRight className="size-3 stroke-[3px]" />
                                 </button>
                                 <button 
                                   onClick={(e) => { 
                                     e.stopPropagation(); 
                                     navigate(`/conference/${expert.id}?type=video`);
                                   }}
                                   className="flex-1 bg-emerald-500 text-white rounded-lg py-2 px-3 flex items-center justify-between hover:brightness-110 active:scale-95 transition-all shadow-md"
                                 >
                                   <span className="text-[10px] font-black uppercase tracking-widest">INSTANT CALL</span>
                                   <Phone className="size-3" />
                                 </button>
                               </div>

                               <div className="flex gap-1.5">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); navigate(`/messenger?partnerId=${expert.id}`) }}
                                   className="flex-1 bg-[#2f313a] rounded-lg py-1.5 px-3 flex items-center justify-center gap-1.5 text-white hover:bg-[#3a3c46] transition-colors shadow-md text-[9px] font-black uppercase tracking-widest"
                                 >
                                   <MessageSquare className="size-3" />
                                   MESSAGE
                                 </button>

                                 <button 
                                   onClick={(e) => { e.stopPropagation(); navigate(`/user/${expert.id}`) }}
                                   className="flex-1 bg-[#2f313a] rounded-lg py-1.5 px-3 flex items-center justify-center text-white hover:bg-[#3a3c46] transition-colors shadow-md text-[9px] font-black uppercase tracking-widest"
                                 >
                                   PROFILE
                                 </button>
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}

               {/* Elite Application Banner */}
               <div className="bg-[#161920] border border-white/10 rounded-[4rem] p-16 overflow-hidden relative group shadow-2xl">
                  <div className="absolute -top-20 -right-20 size-96 bg-[#a8c8ff]/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-16">
                     <div className="max-w-2xl text-center xl:text-left">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#c3c0ff]/10 border border-[#c3c0ff]/20 text-[#c3c0ff] text-[9px] font-black uppercase tracking-[0.25em] mb-8">
                          Syndicate Recruitment
                        </div>
                        <h3 className="text-5xl font-black italic text-white mb-6 leading-tight">
                          Join the <span className="text-[#a8c8ff]">Urkio</span> Network.
                        </h3>
                        <p className="text-[#8b919e] text-lg font-medium leading-relaxed mb-10 max-w-xl">
                          We are actively seeking world-class practitioners to join our elite healing sanctuary. Apply for clinical verification and expand your reach.
                        </p>
                        <button 
                          onClick={() => navigate('/verify')}
                          className="px-12 py-5 bg-[#a8c8ff] text-[#003062] rounded-4xl font-black uppercase tracking-widest text-[12px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#a8c8ff]/20"
                        >
                           Submit Application
                        </button>
                     </div>
                     <div className="relative">
                        <div className="absolute inset-0 bg-[#a8c8ff]/20 rounded-full blur-3xl scale-110 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="size-64 rounded-[4rem] bg-linear-to-tr from-[#a8c8ff] to-msgr-primary-container flex items-center justify-center rotate-6 group-hover:rotate-0 transition-transform duration-700 relative z-10 shadow-3xl">
                           <Award className="size-32 text-white/90" />
                        </div>
                     </div>
                  </div>
               </div>
            </section>
         </div>
      </div>
    </div>
  );
}
