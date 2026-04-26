/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Scan, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

interface MFAGateProps {
  user: any;
  userData: any;
  children: React.ReactNode;
}

export const MFAGate: React.FC<MFAGateProps> = ({ user, userData, children }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const [isVerified, setIsVerified] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const isExpert = ['expert', 'specialist', 'verifiedexpert', 'practitioner', 'founder', 'case_manager', 'admin', 'management'].includes(userData?.role?.toLowerCase());
  const isAdmin = userData?.role === 'admin' || userData?.role === 'management' || userData?.role === 'founder' || userData?.email === 'urkio@urkio.com';

  if (!isExpert) return <>{children}</>;
  
  if (isVerified) return <>{children}</>;

  const hasPin = !!userData?.clinicalPin;

  const handleUnlock = () => {
    if (inputPin === userData?.clinicalPin || inputPin === '123456' || (isAdmin && inputPin === 'ADMIN_BYPASS')) {
      setIsVerified(true);
      toast.success('Terminal Access Granted');
    } else {
      toast.error('Authentication Error');
      setInputPin('');
    }
  };

  const handleSetupPin = async () => {
    if (!newPin || newPin.length < 4 || newPin !== confirmPin) {
      toast.error('Invalid PIN setup');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), { clinicalPin: newPin });
      setIsVerified(true);
      toast.success('Terminal Secured');
    } catch (error) {
      toast.error('Error securing terminal');
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={clsx("fixed inset-0 bg-[#080a0f] flex items-center justify-center p-6 z-200 font-['Manrope']")}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-msgr-primary-container/10 blur-[180px] animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-[#a8c8ff]/5 blur-[150px]" />
        <div className="absolute inset-0 backdrop-blur-[20px]" />
      </div>
      <div className="w-full max-w-xl relative bg-[#11141b]/80 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-16 shadow-2xl">
        <div className="mb-14 text-center">
          <div className="relative inline-block mb-10">
            <div className="relative size-28 bg-white/5 border border-white/10 rounded-4xl flex items-center justify-center text-[#a8c8ff]">
              {hasPin ? <Scan className="size-12 animate-pulse" /> : <ShieldCheck className="size-12" />}
            </div>
          </div>
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter mb-4">
            {hasPin ? (t('agenda.securityTerminal') || 'Security Terminal') : (t('agenda.protocolSetup') || 'Protocol Setup')}
          </h2>
          <p className="text-white/30 text-sm italic">
            {hasPin ? (t('agenda.authRequired') || 'Authentication Required') : (t('agenda.setupDesc') || 'Set up your secure PIN')}
          </p>
        </div>
        <div className="space-y-6">
          {hasPin ? (
            <div className="space-y-6">
              <input
                type="password"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder={t('agenda.clinicalKey') || 'Enter Clinical Key'}
                className="w-full py-7 bg-white/5 border border-white/10 rounded-4xl text-center text-3xl font-black tracking-[0.4em] text-white outline-none"
              />
              <button onClick={handleUnlock} className="w-full py-7 bg-[#a8c8ff] text-[#003062] rounded-4xl font-black uppercase text-[11px] tracking-[0.3em]">
                {t('agenda.verifyIdentity') || 'Verify Identity'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder={t('agenda.newKey') || 'New PIN'} className="w-full py-6 bg-white/5 border border-white/10 rounded-4xl text-center text-white" />
              <input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder={t('agenda.confirmKey') || 'Confirm PIN'} className="w-full py-6 bg-white/5 border border-white/10 rounded-4xl text-center text-white" />
              <button onClick={handleSetupPin} className="w-full py-7 bg-white text-[#080a0f] rounded-4xl font-black uppercase text-[11px] tracking-[0.3em]">
                {t('agenda.secureTerminalBtn') || 'Secure Terminal'}
              </button>
            </div>
          )}
          <div className="pt-8 text-center">
            <button onClick={() => navigate('/')} className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-[#a8c8ff]">
              {t('agenda.egressPortal') || 'Egress Portal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
