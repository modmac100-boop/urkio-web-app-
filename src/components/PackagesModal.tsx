import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function PackagesModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-zinc-900 rounded-5xl p-10 max-w-lg w-full shadow-2xl border border-zinc-100 dark:border-zinc-800 text-center overflow-hidden"
        >
          {/* Decorative background */}
          <div className="absolute -top-32 -inset-s-32 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -inset-e-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <button onClick={onClose} className="absolute top-6 inset-e-6 w-10 h-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-full transition-colors z-10">
             <span className="material-symbols-outlined">close</span>
          </button>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 mb-6 relative">
              <div className="absolute inset-0 bg-linear-to-tr from-amber-400 to-amber-600 rounded-4xl rotate-6 shadow-xl opacity-20" />
              <div className="absolute inset-0 bg-linear-to-tr from-amber-400 to-amber-600 rounded-4xl -rotate-3 shadow-xl" />
              <span className="material-symbols-outlined text-white text-5xl absolute inset-0 flex items-center justify-center">diamond</span>
            </div>

            <h3 className="font-headline font-black text-3xl mb-2 text-zinc-900 dark:text-white">
              Urkio <span className="text-amber-500">GOLD</span>
            </h3>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-8">Premium Packages</p>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl p-8 border border-zinc-100 dark:border-zinc-800 w-full mb-8">
               <span className="material-symbols-outlined text-4xl text-zinc-300 mb-4 animate-pulse">hourglass_empty</span>
               <h4 className="text-lg font-black text-zinc-900 dark:text-white mb-2">Coming Soon</h4>
               <p className="text-xs text-zinc-500 leading-relaxed">
                 We are currently crafting exclusive subscription tiers designed to completely transform your practice and visibility on the platform. Stay tuned!
               </p>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-black text-white text-sm tracking-widest uppercase transition-all hover:-translate-y-1 active:scale-95 shadow-xl shadow-amber-500/25"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}
            >
              Notify Me
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
