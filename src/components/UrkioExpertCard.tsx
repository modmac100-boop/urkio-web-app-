import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, ShieldCheck, MapPin, Calendar, MessageSquare, ChevronRight, FileText } from 'lucide-react';
import clsx from 'clsx';

interface UrkioExpertCardProps {
  expert: any;
  onBook: (expert: any) => void;
  onMessage: (expert: any) => void;
}

export const UrkioExpertCard: React.FC<UrkioExpertCardProps> = ({ 
  expert, 
  onBook, 
  onMessage 
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="expert-card-urkio animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Media Section */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={expert.photoURL || `https://ui-avatars.com/api/?name=${expert.displayName}&background=random`} 
          alt={expert.displayName} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#1d2026] via-transparent to-transparent opacity-80" />
        
        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {expert.isOnline && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20">
              <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
            </div>
          )}
          {expert.verificationStatus === 'approved' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#a8c8ff]/10 backdrop-blur-md border border-[#a8c8ff]/20">
              <ShieldCheck className="size-3 text-[#a8c8ff]" />
              <span className="text-[10px] font-black text-[#a8c8ff] uppercase tracking-widest">Verified</span>
            </div>
          )}
        </div>

        {/* Rating Floating Badge */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-xl">
          <Star className="size-3 text-amber-400 fill-amber-400" />
          <span className="text-xs font-black text-white">{expert.rating || '4.9'}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#e1e2ea] group-hover:text-[#a8c8ff] transition-colors duration-300">
              {expert.displayName}
            </h3>
            <span className="text-[10px] font-black text-[#8b919e] uppercase tracking-widest">
              {expert.hourlyRate ? `$${expert.hourlyRate}/hr` : 'Premium'}
            </span>
          </div>
          <p className="text-sm font-semibold text-[#a8c8ff] mt-1">{expert.primaryRole || 'Global Healing Specialist'}</p>
        </div>

        <p className="text-xs text-[#c1c6d4] leading-relaxed line-clamp-2 italic">
          "{expert.bio || 'Dedicated to transforming human potential through architectural healing and mindfulness.'}"
        </p>

        {/* Location & Languages */}
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#8b919e]">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3" />
            <span>{expert.location || 'Global Hub'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3" />
            <span>{expert.yearsOfExperience || '8'}+ Years</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {((expert.expertSkills || ['Stress Relief', 'Mindfulness', 'Trauma Zen']).slice(0, 3)).map((tag: string, i: number) => (
            <span key={i} className="px-2.5 py-1 rounded-md bg-[#32353b] text-[9px] font-bold text-[#c1c6d4] border border-white/5 uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <button 
            onClick={() => onBook(expert)}
            className="flex-2 py-3.5 rounded-xl bg-[#a8c8ff] text-[#003062] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-[#c3c0ff] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#a8c8ff]/10"
          >
            {t('healing.bookNow')}
            <ChevronRight className="size-4" />
          </button>
          <button 
            onClick={() => onMessage(expert)}
            className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center transition-all hover:bg-white/10"
          >
            <MessageSquare className="size-4" />
          </button>
          <button 
            onClick={() => navigate(`/user/${expert.id}`)}
            className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-[#a8c8ff] text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/10"
          >
            {t('healing.profile')}
          </button>
          {expert.resumeUrl && (
            <a 
              href={expert.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-emerald-400 flex items-center justify-center transition-all hover:bg-white/10"
              title="View Expert Resume"
            >
              <FileText className="size-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
