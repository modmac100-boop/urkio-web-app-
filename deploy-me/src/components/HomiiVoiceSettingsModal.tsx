import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { 
  Settings, Lock, Shield, Volume2, MicOff, 
  Cloud, Zap, CheckCircle2, ChevronDown 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface HomiiVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HomiiVoiceSettingsModal({ isOpen, onClose }: HomiiVoiceSettingsModalProps) {
  const [encryptionLevel, setEncryptionLevel] = useState<'Standard' | 'Military' | 'Quantum'>('Military');
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [voiceScrambling, setVoiceScrambling] = useState(false);
  const [autoVault, setAutoVault] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Voice settings synchronized across the network.');
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex w-full max-w-[500px] flex-col rounded-3xl bg-[#0a0f1e]/90 border border-slate-800 shadow-[0_0_50px_rgba(79,70,229,0.1)] overflow-hidden backdrop-blur-2xl"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-800 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Settings className="size-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white italic tracking-tighter">Network Settings</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Homii Voice Control</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-xl h-10 w-10 bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </header>

          {/* Body */}
          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            {/* Encryption Level */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Encryption Level</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['Standard', 'Military', 'Quantum'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEncryptionLevel(level as any)}
                    className={clsx(
                      "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all duration-300",
                      encryptionLevel === level 
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.2)]" 
                        : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                    )}
                  >
                    {level === 'Standard' && <Lock className="size-5" />}
                    {level === 'Military' && <Shield className="size-5" />}
                    {level === 'Quantum' && <Zap className="size-5" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{level}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Voice Processing</h3>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={clsx("size-10 rounded-xl flex items-center justify-center transition-colors", noiseReduction ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500")}>
                    <Volume2 className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Neural Noise Reduction</h4>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">Filters background interference</p>
                  </div>
                </div>
                <button 
                  onClick={() => setNoiseReduction(!noiseReduction)}
                  className={clsx("w-12 h-6 rounded-full transition-colors relative", noiseReduction ? "bg-emerald-500" : "bg-slate-700")}
                >
                  <div className={clsx("size-5 rounded-full bg-white absolute top-0.5 transition-all", noiseReduction ? "left-6.5" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={clsx("size-10 rounded-xl flex items-center justify-center transition-colors", voiceScrambling ? "bg-purple-500/10 text-purple-400" : "bg-slate-800 text-slate-500")}>
                    <MicOff className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Voice Scrambling</h4>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">Anonymize vocal characteristics</p>
                  </div>
                </div>
                <button 
                  onClick={() => setVoiceScrambling(!voiceScrambling)}
                  className={clsx("w-12 h-6 rounded-full transition-colors relative", voiceScrambling ? "bg-purple-500" : "bg-slate-700")}
                >
                  <div className={clsx("size-5 rounded-full bg-white absolute top-0.5 transition-all", voiceScrambling ? "left-6.5" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={clsx("size-10 rounded-xl flex items-center justify-center transition-colors", autoVault ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-800 text-slate-500")}>
                    <Cloud className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Auto-Vaulting</h4>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">Automatically encrypt & store</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAutoVault(!autoVault)}
                  className={clsx("w-12 h-6 rounded-full transition-colors relative", autoVault ? "bg-indigo-500" : "bg-slate-700")}
                >
                  <div className={clsx("size-5 rounded-full bg-white absolute top-0.5 transition-all", autoVault ? "left-6.5" : "left-0.5")} />
                </button>
              </div>
            </div>

          </div>

          {/* Footer */}
          <footer className="p-8 pt-4 border-t border-slate-800 bg-[#0a0f1e]/90">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 text-white h-14 font-black text-sm uppercase tracking-widest transition-all hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-50 shadow-[0_0_30px_rgba(79,70,229,0.3)]"
            >
              {isSaving ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="size-5" />
                  Synchronize
                </>
              )}
            </button>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
