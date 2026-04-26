import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Search, BrainCircuit, CalendarClock, Stethoscope, ArrowRight, Star, Verified, Filter, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export function ExpertList({ user, userData }: { user: any; userData: any }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const q = query(collection(db, 'users'), limit(100));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filter for experts/specialists
        const filtered = all.filter((u: any) => {
          if (u.isDeleted) return false;
          const email = (u.email || '').toLowerCase();
          const name = (u.displayName || '').toLowerCase();
          const isFounder = email === 'urkio@urkio.com';
          const isDrSara = name.includes('sara ghassan');
          if (isFounder || isDrSara) return true;
          return u.verificationStatus === 'approved';
        });
        setExperts(filtered);
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
    const matchesCategory = selectedCategory === 'All' || roleContent.includes(selectedCategory.toLowerCase());
    return (nameMatch || roleMatch) && matchesCategory;
  });

  const recommendedExperts = filteredExperts.slice(0, 3);
  const allSpecialists = filteredExperts.slice(3); // or show all

  return (
    <div className="min-h-screen bg-[#fbf9f5] dark:bg-[#050A0F] text-[#1b1c1a] dark:text-[#EDE8E4] font-sans selection:bg-[#baece9] selection:text-[#00201f] pb-24">
      {/* Header omitted since the app shell provides the global header/nav, but we add padding to push content down */}
      <main className="pt-8 px-6 md:px-12 max-w-[1400px] mx-auto">
        <section className="mb-16">
          <div className="max-w-3xl">
            <h1 className="font-heading text-4xl md:text-5xl font-semibold text-[#003634] dark:text-[#30B0D0] mb-4">Find your guide.</h1>
            <p className="font-body text-lg text-[#404848] dark:text-[#6B8E7D] max-w-2xl">
              Connect with clinical specialists and holistic practitioners tailored to your personal growth journey.
            </p>
          </div>
          
          <div className="mt-10 p-2 bg-[#f5f3ef] dark:bg-[#0A111A] rounded-[2rem] shadow-sm border border-[#c0c8c7]/30 dark:border-[#6B8E7D]/30 flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[300px] flex items-center px-6">
              <Search className="text-[#707978] dark:text-[#6B8E7D] mr-3 w-5 h-5" />
              <input 
                className="bg-transparent border-none focus:ring-0 w-full font-body text-[#1b1c1a] dark:text-[#EDE8E4] outline-none" 
                placeholder="Search by name, specialty, or focus..." 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="h-10 w-px bg-[#c0c8c7]/50 dark:bg-[#6B8E7D]/50 hidden md:block"></div>
            <div className="flex gap-2 p-1 overflow-x-auto">
              <button 
                onClick={() => setSelectedCategory('Specialty')}
                className={clsx("flex items-center gap-2 px-4 py-2 rounded-full border transition-colors whitespace-nowrap", selectedCategory === 'Specialty' ? 'bg-[#1b4d4b] text-[#8cbdba] border-transparent dark:bg-[#1b6a7e] dark:text-[#EDE8E4]' : 'border-[#c0c8c7] hover:bg-[#e4e2de]/50 dark:border-[#6B8E7D]/50 dark:hover:bg-[#161d27]/50')}
              >
                <BrainCircuit className="w-4 h-4" />
                <span className="text-sm font-semibold">Specialty</span>
              </button>
              <button 
                onClick={() => setSelectedCategory('Availability')}
                className={clsx("flex items-center gap-2 px-4 py-2 rounded-full border transition-colors whitespace-nowrap", selectedCategory === 'Availability' ? 'bg-[#1b4d4b] text-[#8cbdba] border-transparent dark:bg-[#1b6a7e] dark:text-[#EDE8E4]' : 'border-[#c0c8c7] hover:bg-[#e4e2de]/50 dark:border-[#6B8E7D]/50 dark:hover:bg-[#161d27]/50')}
              >
                <CalendarClock className="w-4 h-4" />
                <span className="text-sm font-semibold">Availability</span>
              </button>
              <button 
                onClick={() => setSelectedCategory('All')}
                className={clsx("flex items-center gap-2 px-4 py-2 rounded-full border transition-colors whitespace-nowrap", selectedCategory === 'All' ? 'bg-[#1b4d4b] text-[#8cbdba] border-transparent dark:bg-[#1b6a7e] dark:text-[#EDE8E4]' : 'border-[#c0c8c7] hover:bg-[#e4e2de]/50 dark:border-[#6B8E7D]/50 dark:hover:bg-[#161d27]/50')}
              >
                <Stethoscope className="w-4 h-4" />
                <span className="text-sm font-semibold">Clinical + Holistic</span>
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="py-20 text-center"><span className="animate-pulse">Loading experts...</span></div>
        ) : (
          <>
            {recommendedExperts.length > 0 && (
              <section className="mb-20">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="font-heading text-3xl font-semibold text-[#003634] dark:text-[#30B0D0] mb-2">Recommended for You</h2>
                    <p className="font-body text-[#404848] dark:text-[#6B8E7D]">Based on your interest in Mindfulness and Cognitive Health</p>
                  </div>
                  <button className="text-[#003634] dark:text-[#30B0D0] font-semibold text-sm flex items-center gap-1 hover:underline">
                    View all <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recommendedExperts.map((expert, idx) => (
                    <div key={expert.id} className="group bg-[#ffffff] dark:bg-[#050A0F] rounded-xl overflow-hidden border border-[#c0c8c7]/20 dark:border-[#6B8E7D]/20 hover:shadow-2xl transition-all duration-300 flex flex-col">
                      <div className="h-48 relative overflow-hidden bg-[#e4e2de] dark:bg-[#161d27]">
                        <img 
                          alt={expert.displayName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          src={expert.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName || 'Expert')}&background=random&color=fff&size=512`}
                        />
                        {idx === 0 && (
                          <div className="absolute top-4 right-4 bg-teal-900/90 text-stone-50 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-md">Top Rated</div>
                        )}
                        {idx === 1 && (
                          <div className="absolute top-4 right-4 bg-[#4c4533] dark:bg-[#C8A96E]/90 text-[#bdb29c] dark:text-[#050A0F] px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-md">New Expert</div>
                        )}
                      </div>
                      <div className="p-8 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-heading text-2xl font-semibold text-[#003634] dark:text-[#30B0D0]">{expert.displayName || "Dr. Expert"}</h3>
                            <span className="bg-[#d2e5c9] dark:bg-[#6B8E7D]/30 text-[#566751] dark:text-[#EDE8E4] px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase mt-1 inline-block">
                              {expert.specialty || expert.primaryRole || "Clinical Psychology"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[#4d4634] dark:text-[#C8A96E]">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-semibold">{expert.rating || '4.9'}</span>
                          </div>
                        </div>
                        <p className="font-body text-[#404848] dark:text-[#6B8E7D] line-clamp-2 mb-6">
                          {expert.bio || `Specializing in integrative trauma therapy and somatic experiencing with a focus on long-term resilience.`}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-4 pt-6 border-t border-[#c0c8c7]/30 dark:border-[#6B8E7D]/30">
                          <div className="text-sm text-[#404848] dark:text-[#6B8E7D] flex flex-col">
                            <span className="opacity-70">Next available</span>
                            <span className="text-[#003634] dark:text-[#30B0D0] font-semibold">Tomorrow, 10:00 AM</span>
                          </div>
                          <button 
                            onClick={() => navigate(`/user/${expert.id}`)}
                            className="bg-[#003634] dark:bg-[#30B0D0] text-[#ffffff] dark:text-[#050A0F] px-5 py-2 rounded-full font-semibold text-sm active:scale-95 transition-transform"
                          >
                            Quick Book
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="font-heading text-3xl font-semibold text-[#003634] dark:text-[#30B0D0]">All Specialists</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[#404848] dark:text-[#6B8E7D]">Sorted by: <span className="text-[#003634] dark:text-[#30B0D0] font-bold">Best Match</span></span>
                  <button className="p-2 rounded-lg border border-[#c0c8c7] dark:border-[#6B8E7D] hover:bg-[#e4e2de]/50 dark:hover:bg-[#161d27]/50 transition-colors">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredExperts.map((expert, idx) => (
                  <div key={expert.id} className="flex flex-col md:flex-row bg-[#eae8e4]/40 dark:bg-[#161d27]/40 rounded-2xl border border-[#c0c8c7]/10 dark:border-[#6B8E7D]/10 p-6 gap-8 hover:bg-[#eae8e4] dark:hover:bg-[#161d27] transition-colors">
                    <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden flex-shrink-0 bg-[#e4e2de] dark:bg-[#050A0F]">
                      <img 
                        alt={expert.displayName} 
                        className="w-full h-full object-cover" 
                        src={expert.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName || 'Expert')}&background=random&color=fff&size=512`}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-heading text-2xl font-bold text-[#003634] dark:text-[#30B0D0]">{expert.displayName || "Expert Name"}</h4>
                            <p className="text-sm font-semibold text-[#3a4b36] dark:text-[#6B8E7D] flex items-center gap-1.5 mt-1">
                              <Verified className="w-4 h-4 text-[#30B0D0]" /> 
                              {expert.specialty || expert.primaryRole || "Licensed Specialist"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end">
                            {idx % 2 === 0 ? (
                              <>
                                <span className="px-3 py-1 bg-[#ede1c9] dark:bg-[#C8A96E]/20 text-[#211b0c] dark:text-[#C8A96E] rounded-full text-[10px] font-bold">HOLISTIC</span>
                                <span className="px-3 py-1 bg-[#baece9] dark:bg-[#30B0D0]/20 text-[#00201f] dark:text-[#30B0D0] rounded-full text-[10px] font-bold">MINDFULNESS</span>
                              </>
                            ) : (
                              <>
                                <span className="px-3 py-1 bg-[#d4e8cc] dark:bg-[#6B8E7D]/20 text-[#101f0e] dark:text-[#6B8E7D] rounded-full text-[10px] font-bold">CLINICAL</span>
                                <span className="px-3 py-1 bg-[#baece9] dark:bg-[#30B0D0]/20 text-[#00201f] dark:text-[#30B0D0] rounded-full text-[10px] font-bold">CBT</span>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="font-body text-[#404848] dark:text-[#6B8E7D] mt-4 max-w-2xl line-clamp-3">
                          {expert.bio || expert.about || "Provides evidence-based therapy for individuals navigating life transitions and anxiety disorders. Maintains a focus on intersectional identities and cultural care."}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-[#c0c8c7]/20 dark:border-[#6B8E7D]/20">
                        <div className="flex gap-8">
                          <div>
                            <p className="text-[10px] font-bold text-[#707978] dark:text-[#6B8E7D] uppercase tracking-widest mb-1">Session Price</p>
                            <p className="font-heading text-2xl font-bold text-[#003634] dark:text-[#30B0D0]">
                              ${expert.hourlyRate || '150'}<span className="text-sm font-normal text-[#404848] dark:text-[#6B8E7D]">/hr</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#707978] dark:text-[#6B8E7D] uppercase tracking-widest mb-1">Experience</p>
                            <p className="font-heading text-2xl font-bold text-[#003634] dark:text-[#30B0D0]">
                              {expert.yearsExperience || '10+'}<span className="text-sm font-normal text-[#404848] dark:text-[#6B8E7D]"> yrs</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => navigate(`/user/${expert.id}`)}
                            className="px-6 py-2.5 border border-[#003634] dark:border-[#30B0D0] text-[#003634] dark:text-[#30B0D0] rounded-full font-semibold text-sm hover:bg-[#003634]/5 dark:hover:bg-[#30B0D0]/10 transition-colors"
                          >
                            View Profile
                          </button>
                          <button 
                            onClick={() => navigate(`/user/${expert.id}?action=book`)}
                            className="px-6 py-2.5 bg-[#003634] dark:bg-[#30B0D0] text-[#ffffff] dark:text-[#050A0F] rounded-full font-semibold text-sm active:scale-95 transition-transform"
                          >
                            Book Consultation
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredExperts.length === 0 && (
                  <div className="py-20 text-center text-[#404848] dark:text-[#6B8E7D] font-semibold">
                    No specialists found matching your search.
                  </div>
                )}
              </div>

              {filteredExperts.length > 3 && (
                <div className="mt-12 flex justify-center">
                  <button className="px-8 py-3 bg-[#eae8e4] dark:bg-[#161d27] text-[#003634] dark:text-[#30B0D0] font-semibold text-sm rounded-full hover:bg-[#e4e2de] dark:hover:bg-[#0A111A] transition-colors flex items-center gap-2">
                    Show more specialists
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
