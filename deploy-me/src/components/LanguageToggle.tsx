import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages } from 'lucide-react';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 shadow-sm hover:shadow-md transition-all active:scale-95 group"
    >
      <Languages size={16} className="text-ur-primary group-hover:scale-110 transition-transform" />
      <div className="size-4 w-px bg-zinc-100 dark:bg-zinc-800 hidden sm:block"></div>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentLang}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
          className="text-[10px] font-black uppercase tracking-widest"
        >
          {currentLang === 'en' ? 'العربية' : 'English'}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

export default LanguageToggle;
