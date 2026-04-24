import React from 'react';
import clsx from 'clsx';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'light' | 'dark' | 'colorful';
}

export function GlassButton({ children, className, variant = 'light', ...props }: GlassButtonProps) {
  const baseStyles = "relative overflow-hidden rounded-full backdrop-blur-xl border transition-all duration-300 flex items-center justify-center gap-2 font-medium px-6 py-3 hover:-translate-y-0.5 active:translate-y-0";
  
  const variants = {
    light: "bg-white/40 border-white/60 text-slate-800 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] hover:bg-white/50 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]",
    dark: "bg-slate-900/40 border-slate-700/50 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-slate-900/50 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
    colorful: "bg-teal-500/30 border-teal-300/50 text-teal-900 shadow-[0_8px_32px_0_rgba(20,184,166,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] hover:bg-teal-500/40 hover:shadow-[0_8px_32px_0_rgba(20,184,166,0.3)]",
  };

  return (
    <button className={clsx(baseStyles, variants[variant], className)} {...props}>
      <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/20 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
