import React from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { AvatarWithBadges } from './UserBadges';

interface ExpertCardProps {
  expert: any;
  isSelected: boolean;
  onSelect: () => void;
  onMessage: (expert: any) => void;
  onBook: (expert: any) => void;
}

export const ExpertCard: React.FC<ExpertCardProps> = ({ 
  expert, 
  isSelected, 
  onSelect, 
  onMessage, 
  onBook 
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div 
      onClick={onSelect}
      className={clsx(
        "group relative glass-2 rounded-4xl p-8 transition-all duration-500 cursor-pointer overflow-hidden isolate",
        isSelected 
          ? 'ring-4 ring-blue-500/20 shadow-[0_40px_80px_rgba(59,130,246,0.15)] scale-[1.02]' 
          : 'hover:scale-[1.01] hover:shadow-2xl hover:shadow-black/5'
      )}
    >
      {/* Dynamic Ethereal Background */}
      <div className="absolute -top-24 -inset-e-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] group-hover:bg-blue-500/10 transition-colors duration-1000 -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />

      {/* Top Section: Avatar & Rating */}
      <div className="flex items-start justify-between mb-8 relative">
        <div 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/user/${expert.id}`);
          }}
          className="relative size-32 md:size-36 shrink-0" 
        >
          {/* Status Halo */}
          {expert.isOnline && (
            <div className="absolute inset-0 rounded-full floating-halo bg-emerald-500/20" />
          )}
          
          <div className="absolute -inset-1 bg-linear-to-tr from-blue-500 via-indigo-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-100 blur-[2px] transition-opacity duration-700" />
          
          <AvatarWithBadges
            src={expert.photoURL}
            name={expert.displayName || expert.email}
            userData={expert}
            sizeClass="w-full h-full"
            badgeSize="lg"
            hideLevelBadge={true}
            className="rounded-full relative z-10 border-[3px] border-white dark:border-slate-800 shadow-2xl object-cover bg-white dark:bg-slate-900 group-hover:scale-105 transition-transform duration-700"
          />
          
          {/* Verified Shield Overlay */}
          <div className="absolute -bottom-1 -right-1 z-20 size-8 bg-blue-600 text-white rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg">
             <span className="material-symbols-outlined text-[16px] font-black">verified</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full border border-white dark:border-white/5 shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-amber-500 drop-shadow-sm fill-1">star</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{expert.rating || '4.9'}</span>
          </div>
          <div className="px-4 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.15em]">
            {expert.reviewsCount || '120'} {t('healing.sessions')}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="relative z-10 space-y-2">
        <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
          {expert.displayName || expert.email}
        </h3>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-500 dark:text-blue-400 opacity-80">
          {expert.specialty || 'Clinical Specialist'}
        </p>
      </div>

      {/* Expertise Chips */}
      <div className="flex flex-wrap gap-2.5 my-6 relative z-10">
        {((expert.expertSkills && expert.expertSkills.length > 0)
          ? expert.expertSkills.slice(0, 3)
          : (expert.tags || ['Stress Relief', 'Zen Practice', 'Mindfulness'])
        ).map((tag: string, i: number) => (
          <span key={i} className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/5 text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-700">
            {tag}
          </span>
        ))}
      </div>

      {/* Live Domain Ecosystem */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50/50 dark:bg-black/20 rounded-3xl border border-white/40 dark:border-white/5 relative z-10">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Multi-Domain Ecosystem</span>
          <div className="flex gap-2.5">
            {[
              { id: 'web', icon: 'public', color: 'text-blue-500' },
              { id: 'app', icon: 'deployed_code', color: 'text-emerald-500' },
              { id: 'cloud', icon: 'cloud_done', color: 'text-amber-500' }
            ].map((domain) => (
              <div 
                key={domain.id} 
                className="size-9 rounded-xl glass-2 flex items-center justify-center border border-white dark:border-white/10 hover:border-blue-500/50 hover:bg-white transition-all duration-300 group/domain"
              >
                <span className={clsx("material-symbols-outlined text-[16px] transition-transform group-hover/domain:scale-110", domain.color)}>
                  {domain.icon}
                </span>
                <div className="absolute -top-1 -right-1 size-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="ms-auto flex flex-col items-end">
           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Live Now</span>
           <div className="h-1 w-12 bg-emerald-500/20 rounded-full overflow-hidden mt-1">
             <div className="h-full bg-emerald-500 w-2/3 rounded-full" />
           </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="flex flex-col gap-3 relative z-10">
        <button
          onClick={e => { 
            e.stopPropagation();
            onBook(expert);
          }}
          className="w-full py-4.5 rounded-2xl text-[12px] uppercase tracking-[0.2em] font-black text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group/btn shimmer-effect bg-linear-to-br from-msgr-primary to-msgr-primary-light"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
             <span className="material-symbols-outlined text-[20px]">event_available</span>
            {t('healing.bookAppointment')}
          </span>
        </button>
        
        <div className="flex gap-3 mt-1">
          <button
            onClick={e => { 
              e.stopPropagation(); 
              onMessage(expert); 
            }}
            className="flex-1 py-4 rounded-xl text-[11px] uppercase tracking-widest font-black text-blue-600 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 transition-all border border-blue-500/20 active:scale-95"
          >
            Message Space
          </button>
          <button
            onClick={e => { 
              e.stopPropagation(); 
              navigate(`/user/${expert.id}`); 
            }}
            className="flex-1 py-4 rounded-xl text-[11px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 bg-slate-500/5 hover:bg-slate-500/10 transition-all border border-slate-500/20 active:scale-95"
          >
            Clinical Bio
          </button>
        </div>
      </div>
    </div>
  );
};
