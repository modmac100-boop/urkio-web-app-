import React from 'react';
import { 
  User, 
  Shield, 
  MapPin, 
  Link as LinkIcon, 
  Search, 
  MoreHorizontal, 
  Image as ImageIcon,
  FileText,
  Video as VideoIcon,
  ChevronRight,
  Activity,
  Award,
  Globe,
  X,
  Instagram,
  Twitter,
  Linkedin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface ExpertInfoSidebarProps {
  partner: any;
  show: boolean;
  onClose: () => void;
  isSpecialRole?: boolean;
}

export function ExpertInfoSidebar({ partner, show, onClose, isSpecialRole }: ExpertInfoSidebarProps) {
  const { t } = useTranslation();
  if (!partner) return null;

  return (
    <aside className={clsx(
      "h-full flex flex-col border-s border-white/5 bg-[#0F111A] transition-all duration-500 ease-in-out z-50 overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.3)] md:relative md:shadow-none",
      show ? "w-96 opacity-100" : "w-0 opacity-0 border-s-0"
    )}>
      {/* Header */}
      <div className="h-[76px] shrink-0 border-b border-white/5 flex items-center justify-between px-8 bg-[#0F111A]">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Profile Context</h3>
        <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
        {/* Profile Stats */}
        <div className="p-8 flex flex-col items-center text-center">
          <div className="relative group mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <img 
              src={partner.photoURL || `https://ui-avatars.com/api/?name=${partner.displayName || '?'}&background=random`} 
              className="relative size-32 rounded-[40px] object-cover border-4 border-white/5 shadow-2xl transition-transform duration-500 group-hover:scale-105" 
              alt="" 
            />
            {partner.isOnline && (
              <div className="absolute -bottom-1 -inset-e-1 size-6 bg-emerald-500 rounded-full border-4 border-[#0F111A] shadow-xl" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">{partner.displayName}</h2>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6">
            {partner.role || partner.occupation || "Member"}
          </p>

          <div className="flex gap-4 mb-10">
            <SocialIcon icon={<Instagram size={18} />} />
            <SocialIcon icon={<Twitter size={18} />} />
            <SocialIcon icon={<Linkedin size={18} />} />
          </div>

          <div className="w-full grid grid-cols-2 gap-4">
             <StatCard label="Trust Score" value="98%" color="text-emerald-500" />
             <StatCard label="Experience" value="5+ Years" color="text-primary" />
          </div>
        </div>

        {/* Sections */}
        <div className="px-8 space-y-10">
          <section>
            <SectionHeader title="Information" />
            <div className="space-y-4">
              <InfoItem icon={<MapPin size={18} />} label="Location" value={partner.location || 'Global'} />
              <InfoItem icon={<Globe size={18} />} label="Language" value="English, Arabic" />
              <InfoItem icon={<Award size={18} />} label="Verification" value="Level 4 Authenticated" />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Shared Assets" />
              <button className="text-[10px] font-bold text-primary hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <AssetCard icon={<ImageIcon size={20} />} label="Media" count={12} color="bg-blue-500/10 text-blue-400" />
               <AssetCard icon={<FileText size={20} />} label="Docs" count={5} color="bg-purple-500/10 text-purple-400" />
            </div>
          </section>

          <section>
            <SectionHeader title="Private Notes" />
            <div className="bg-white/5 border border-white/5 p-5 rounded-[32px] text-xs text-white/40 italic leading-relaxed">
              No private notes added yet. (Notes are only visible to you)
            </div>
          </section>

          <button className="w-full h-14 bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 rounded-[20px] text-red-500 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group">
            <Shield size={18} className="group-hover:scale-110 transition-transform" />
            Block Contact
          </button>
        </div>
      </div>
    </aside>
  );
}

const SectionHeader = ({ title }: { title: string }) => (
  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-4">{title}</h4>
);

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-4 group cursor-pointer">
    <div className="size-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:text-primary transition-colors">
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-white/20 font-bold uppercase tracking-tight">{label}</p>
      <p className="text-xs text-white/80 font-medium">{value}</p>
    </div>
  </div>
);

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
  <button className="size-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5">
    {icon}
  </button>
);

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-white/5 border border-white/5 p-4 rounded-3xl text-start">
    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">{label}</p>
    <p className={clsx("text-lg font-black", color)}>{value}</p>
  </div>
);

const AssetCard = ({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) => (
  <button className="flex flex-col items-center gap-3 p-5 bg-white/5 border border-white/5 rounded-[32px] hover:bg-white/10 transition-all group">
    <div className={clsx("size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", color)}>
      {icon}
    </div>
    <div className="text-center">
      <p className="text-xs font-bold text-white/90">{label}</p>
      <p className="text-[10px] text-white/20 font-medium">{count} items</p>
    </div>
  </button>
);
