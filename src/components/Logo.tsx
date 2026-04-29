import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8", showText = false }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl font-black tracking-tighter text-msgr-primary dark:text-blue-400">
        URKIO
      </span>
      {showText && (
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-1 py-0.5 rounded relative -top-2">
          Beta
        </span>
      )}
    </div>
  );
};

export default Logo;
