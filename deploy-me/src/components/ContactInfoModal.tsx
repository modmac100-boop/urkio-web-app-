import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Instagram, Twitter, Linkedin, Globe, Phone, Mail, 
  MessageCircle, Youtube, Music, Facebook 
} from 'lucide-react';
import { GlassButton } from './GlassButton';

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({ isOpen, onClose, userData }) => {
  if (!userData) return null;

  const contactMethods = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      value: userData.whatsapp,
      icon: MessageCircle,
      color: 'bg-green-500',
      textColor: 'text-green-500',
      href: userData.whatsapp ? `https://wa.me/${userData.whatsapp.replace(/\D/g, '')}` : null,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      value: userData.facebook,
      icon: Facebook,
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      href: userData.facebook?.startsWith('http') ? userData.facebook : `https://facebook.com/${userData.facebook}`,
    },
    {
      id: 'instagram',
      label: 'Instagram',
      value: userData.instagram,
      icon: Instagram,
      color: 'bg-pink-500',
      textColor: 'text-pink-500',
      href: userData.instagram ? `https://instagram.com/${userData.instagram.replace('@', '')}` : null,
    },
    {
      id: 'twitter',
      label: 'Twitter (X)',
      value: userData.twitter,
      icon: Twitter,
      color: 'bg-black',
      textColor: 'text-slate-900 dark:text-white',
      href: userData.twitter ? `https://twitter.com/${userData.twitter.replace('@', '')}` : null,
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      value: userData.tiktok,
      icon: Music, // TikTok icon substitute from Lucide
      color: 'bg-slate-900',
      textColor: 'text-slate-900 dark:text-white',
      href: userData.tiktok ? `https://tiktok.com/@${userData.tiktok.replace('@', '')}` : null,
    },
    {
      id: 'youtube',
      label: 'YouTube',
      value: userData.youtube,
      icon: Youtube,
      color: 'bg-red-600',
      textColor: 'text-red-600',
      href: userData.youtube?.startsWith('http') ? userData.youtube : `https://youtube.com/@${userData.youtube}`,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      value: userData.linkedin,
      icon: Linkedin,
      color: 'bg-blue-700',
      textColor: 'text-blue-700',
      href: userData.linkedin?.startsWith('http') ? userData.linkedin : `https://linkedin.com/in/${userData.linkedin}`,
    },
    {
      id: 'website',
      label: 'Website',
      value: userData.website,
      icon: Globe,
      color: 'bg-slate-500',
      textColor: 'text-slate-600 dark:text-slate-400',
      href: userData.website?.startsWith('http') ? userData.website : `https://${userData.website}`,
    },
    {
      id: 'phone',
      label: 'Phone',
      value: userData.phone,
      icon: Phone,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      href: userData.phone ? `tel:${userData.phone}` : null,
    },
    {
      id: 'email',
      label: 'Email',
      value: userData.email,
      icon: Mail,
      color: 'bg-primary',
      textColor: 'text-primary',
      href: userData.email ? `mailto:${userData.email}` : null,
    }
  ].filter(method => method.value);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-linear-to-b from-slate-50 to-transparent dark:from-slate-800/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Contact Info</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Connect with {userData.displayName}</p>
              </div>
              <button 
                onClick={onClose}
                className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {contactMethods.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {contactMethods.map((method) => (
                    <motion.a
                      key={method.id}
                      href={method.href || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ x: 10 }}
                      className="group flex items-center gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all"
                    >
                      <div className={`size-14 rounded-2xl ${method.color} flex items-center justify-center text-white shadow-lg shadow-${method.id}/20 group-hover:scale-110 transition-transform`}>
                        <method.icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{method.label}</p>
                        <p className={`text-sm font-bold truncate ${method.textColor}`}>{method.value}</p>
                      </div>
                      <div className="size-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary/30 transition-all">
                        <Globe className="w-5 h-5" />
                      </div>
                    </motion.a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No public contact info available.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-4">Urkio Professional Network</p>
              <GlassButton onClick={onClose} variant="colorful" className="w-full py-4! rounded-2xl!">
                Close Details
              </GlassButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
