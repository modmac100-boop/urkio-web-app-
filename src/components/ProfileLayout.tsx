import React, { useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LevelBadge, SpecialistStarBadge } from './UserBadges';
import { isSpecialist } from '../utils/userLevel';
import { PackagesModal } from './PackagesModal';

interface ProfileLayoutProps {
  children: React.ReactNode;
  coverImage?: string;
  avatarImage?: string;
  displayName?: string;
  username?: string;
  bio?: string;
  location?: string;
  isExpert?: boolean;
  isVerified?: boolean;
  isOwnProfile?: boolean;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  sidebar?: React.ReactNode;
  tabs?: React.ReactNode;
  userData?: any;
  onContactClick?: () => void;
  hideBioSection?: boolean;
  specialty?: string;
}

export function ProfileLayout({
  children,
  coverImage,
  avatarImage,
  displayName,
  username,
  bio,
  location,
  isExpert,
  isVerified,
  isOwnProfile,
  primaryAction,
  secondaryAction,
  sidebar,
  tabs,
  userData,
  onContactClick,
  hideBioSection,
  specialty
}: ProfileLayoutProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const [isPackagesOpen, setIsPackagesOpen] = useState(false);
  const [caseStatus, setCaseStatus] = useState<'pending' | 'accepted'>('pending');

  const handleAcceptCase = () => {
    setCaseStatus('accepted');
    toast.success("Case #ALPHA-72 accepted! It has been moved to your active clinical queue.");
  };

  const handlePostponeCase = () => {
    toast("Case #ALPHA-72 postponed for 24 hours.", {
      icon: '⏳',
    });
  };

  return (
    <main className="min-h-screen bg-bg-main dark:bg-bg-main pt-24 pb-12 w-full font-body">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column - Now takes more space */}
          <div className="lg:col-span-12 xl:col-span-9 space-y-8 mx-auto w-full">
            {children}
            
            {/* Horizontal Navigation or integrated sidebar */}
            <div className="mt-8">
              {sidebar}
            </div>
          </div>

          {/* Sidebar Right: Activity & Widgets */}
          <aside className="hidden xl:block xl:col-span-3 sticky top-24 space-y-6">
             <div className="bento-card p-6 border border-border-light shadow-sm">
                <h4 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                   <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                   Recent Activity
                </h4>
                <div className="space-y-4">
                    {/* Achievement Entry */}
                    <div 
                      className="group cursor-pointer"
                      onClick={() => toast.success("Achievement Unlocked: Milestone reached! View your full collection in the Badge Studio.", {
                        style: { borderRadius: '1rem', border: '1px solid #10b981', background: '#ecfdf5', color: '#065f46' }
                      })}
                    >
                      <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-main transition-colors border border-transparent hover:border-border-light">
                        <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-[20px]">bolt</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface leading-tight">Achievement Unlocked</p>
                          <p className="text-xs text-on-surface-variant mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </div>

                    {/* NEW: Upcoming Case with Status Logic */}
                    <div className="bento-card border-none bg-bg-main/50 p-4 rounded-2xl relative group overflow-hidden">
                      <div className="absolute top-0 inset-e-0 w-1 p-3 flex flex-col gap-1 items-end">
                         <div className={clsx(
                           "size-2 rounded-full animate-pulse",
                           caseStatus === 'accepted' ? "bg-emerald-500" : "bg-rose-500"
                         )} title={caseStatus === 'accepted' ? "Case Active" : "Pending Expert Action"}></div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                         <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                           <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
                         </div>
                         <div className="flex-1">
                             <p className={clsx("text-xs font-black uppercase tracking-widest mb-1", caseStatus === 'accepted' ? "text-emerald-500" : "text-rose-500")}>
                               {caseStatus === 'accepted' ? "Active Case" : "Upcoming Case"}
                             </p>
                             <p className="text-sm font-bold text-on-surface leading-tight">Case #ALPHA-72</p>
                            <p className="text-[10px] text-on-surface-variant mt-1 font-medium italic">"Patient requires trauma-informed assessment..."</p>
                                                        <div className="flex gap-2 mt-4">
                                {caseStatus === 'pending' ? (
                                  <>
                                    <button 
                                      className="flex-1 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-rose-500/20 hover:scale-105 transition-transform"
                                      onClick={handleAcceptCase}
                                     >
                                      Accepted
                                    </button>
                                    <button 
                                      className="flex-1 py-2 bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-300 transition-colors"
                                      onClick={handlePostponeCase}
                                    >
                                      Postpone
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    className="w-full py-2 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 flex items-center justify-center gap-2"
                                    onClick={() => navigate('/specialist-dashboard')}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                    Open Workstation
                                  </button>
                                )}
                             </div>
                         </div>
                      </div>
                    </div>

                    {/* Active Healing Status */}
                    <div 
                      className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                      onClick={() => navigate('/healing-courses')}
                    >
                      <div className="size-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white animate-pulse">
                        <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface leading-tight">Active Healing</p>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">In Progress • Green Status</p>
                      </div>
                    </div>
                </div>
                <button 
                   onClick={() => navigate('/specialist-dashboard')}
                   className="w-full mt-6 py-3 rounded-2xl border-2 border-primary/10 text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all duration-300"
                 >
                   View Full History
                 </button>
             </div>

             <div className="bento-card p-6 text-white border-0" style={{ backgroundImage: 'linear-gradient(to bottom right, var(--color-primary), var(--color-accent))' }}>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Premium Feature</p>
                <h4 className="mt-2 font-headline text-xl font-black">Urkio Plus+</h4>
                <p className="mt-3 text-sm font-medium text-white/80 leading-relaxed">Get 10x more visibility and detailed insights on your content.</p>
                <button
                  onClick={() => setIsPackagesOpen(true)}
                  className="mt-6 w-full py-3 bg-white text-primary rounded-2xl text-sm font-black hover:scale-105 active:scale-95 transition-transform shadow-lg cursor-pointer"
                >
                  Upgrade Now
                </button>
             </div>
             
             <PackagesModal isOpen={isPackagesOpen} onClose={() => setIsPackagesOpen(false)} />
          </aside>

        </div>
      </div>
    </main>
  );
}
