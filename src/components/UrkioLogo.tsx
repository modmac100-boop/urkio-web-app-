import React from 'react';

// Icon-only version of the Urkio logo (the stylized U mark)
export const UrkioLogo = ({ className = "text-2xl" }: { className?: string }) => {
  return (
    <span className={`font-black tracking-tighter text-[#004e99] dark:text-blue-400 ${className}`}>
      U
    </span>
  );
};

export default UrkioLogo;
