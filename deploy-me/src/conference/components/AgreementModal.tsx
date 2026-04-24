import React, { useState } from 'react';
import { ShieldCheck, X, FileText, AlertTriangle, UserCheck } from 'lucide-react';
import clsx from 'clsx';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  isJoining?: boolean;
}

export function AgreementModal({ isOpen, onClose, onAgree, isJoining = false }: AgreementModalProps) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Background glow */}
        <div className="absolute top-0 inset-e-0 size-64 bg-teal-500/10 blur-3xl rounded-full -mie-20 -mt-20 pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center border border-teal-500/20">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Session Agreement</h2>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Required before joining</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <p className="text-slate-300 text-sm leading-relaxed">
            By proceeding to {isJoining ? "join" : "start"} this session, you are entering a secure, encrypted Urkio environment. To maintain safety and trust for all members and specialists, you must agree to the following terms:
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-4">
              <div className="mt-1 text-teal-400"><UserCheck className="size-5" /></div>
              <div>
                <h4 className="text-white font-bold mb-1">Good Behavior & Respect</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  You agree to conduct yourself with the utmost respect towards all participants. Harassment, abuse, or inappropriate conduct will result in immediate removal and potential account suspension.
                </p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-4">
              <div className="mt-1 text-teal-400"><FileText className="size-5" /></div>
              <div>
                <h4 className="text-white font-bold mb-1">Confidentiality & Privacy</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  You are legally and ethically bound to protect any sensitive information, treatment details, or personal cases shared during this session. What is discussed in this room, stays in this room.
                </p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-4">
              <div className="mt-1 text-teal-400"><AlertTriangle className="size-5" /></div>
              <div>
                <h4 className="text-white font-bold mb-1">No Unauthorized Recording</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Recording, screen capturing, or broadcasting this session without explicit consent from all parties is strictly prohibited.
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-4 p-4 mt-6 bg-teal-500/10 border border-teal-500/20 rounded-2xl cursor-pointer hover:bg-teal-500/20 transition-colors">
            <div className="relative flex items-center justify-center mt-0.5">
              <input 
                type="checkbox" 
                className="peer appearance-none size-6 border-2 border-teal-500/50 rounded-lg checked:bg-teal-500 checked:border-teal-500 transition-all cursor-pointer"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <div className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-sm">I accept the Terms and Conditions</p>
              <p className="text-teal-500/80 text-xs mt-1">I will uphold confidentiality and respect during this session.</p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
          >
            Cancel
          </button>
            <button 
              disabled={!agreed}
              onClick={onAgree}
              className={clsx(
                "flex-2 py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2",
              agreed 
                ? "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 active:scale-[0.98]" 
                : "bg-white/10 text-slate-500 cursor-not-allowed opacity-50"
            )}
          >
            I Agree & {isJoining ? "Join" : "Start"} Session
          </button>
        </div>
      </div>
    </div>
  );
}
