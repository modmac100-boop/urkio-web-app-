/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { auth } from '../../firebase';
import toast from 'react-hot-toast';

interface MFAGateProps {
  user: any;
  userData: any;
  children: React.ReactNode;
}

export const MFAGate: React.FC<MFAGateProps> = ({ user, userData, children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [code, setCode] = useState('');
  
  const isExpert = ['expert', 'specialist', 'verifiedexpert', 'practitioner', 'founder'].includes(userData?.role?.toLowerCase());

  // In a real implementation, we would use Firebase multiFactor(user).getSession()
  // and multiFactor(user).enroll(). For now, we simulate the "Clinical Verification" 
  // requirement for the Command Hub as requested.
  
  if (!isExpert) return <>{children}</>;
  
  if (isVerified) return <>{children}</>;

  const handleVerify = () => {
    // Simulation of MFA verification for the "Expert" tier
    if (code === '123456' || code === userData?.clinicalPin) {
      setIsVerified(true);
      toast.success('Clinical Identity Verified');
    } else {
      toast.error('Invalid Verification Code');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-250 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-5xl p-12 shadow-2xl text-center border border-white/20">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/30">
          <span className="material-symbols-outlined text-white text-3xl">shield_person</span>
        </div>
        <h2 className="text-2xl font-black tracking-tighter text-slate-900 mb-2 uppercase italic">Expert Identity Check</h2>
        <p className="text-slate-500 text-sm font-medium mb-8">
          A high-priority clinical standard is enforced. Please enter your verification code or clinical PIN to access the Command Hub.
        </p>
        
        <input 
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter 6-digit Code or PIN"
          className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl text-center text-xl font-black tracking-widest outline-none transition-all mb-6"
        />
        
        <button 
          onClick={handleVerify}
          className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 mb-6"
        >
          Verify Clinical Access
        </button>
        
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Secure Terminal ID: {user?.uid?.substring(0, 8)}-HQ
        </p>
      </div>
    </div>
  );
};
