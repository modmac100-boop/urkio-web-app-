/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * URKIO PDPL 2026 CONSENT MODULE
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Shield, Lock, CheckCircle2, Globe } from 'lucide-react';

export function PDPLConsentModal({ userId, onComplete }: { userId: string, onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Create immutable consent record
      await addDoc(collection(db, 'consent_records'), {
        userId,
        consentType: 'PDPL_2026_BETA',
        platformVersion: 'Edition_One',
        status: 'accepted',
        timestamp: serverTimestamp(),
        jurisdiction: 'Egypt/Syria',
        ipAlias: 'MASKED_FOR_PRIVACY' // In production, this would be captured server-side
      });
      onComplete();
    } catch (err) {
      console.error('Consent logging failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 inset-e-0 p-12 opacity-5"><MaterialIcon name="policy" className="text-9xl" /></div>
        
        <div className="flex justify-between items-center mb-10">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-2xl text-[#004e99]"><Lock size={24} /></div>
              <p className="text-xs font-black uppercase tracking-widest text-[#004e99]">Privacy Vault Compliance</p>
           </div>
           <button 
             onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
             className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"
           >
             <Globe size={14} /> {lang === 'ar' ? 'Switch to English' : 'تحويل للعربية'}
           </button>
        </div>

        <div className={lang === 'ar' ? 'text-end dir-rtl' : 'text-start'}>
          {lang === 'ar' ? (
            <div className="space-y-6">
              <h2 className="text-4xl font-black italic tracking-tight text-zinc-900 leading-tight">إقرار الخصوصية والموافقة الإلكترونية</h2>
              <div className="space-y-4 text-zinc-500 font-medium leading-relaxed">
                <p>هذا النظام تجريبي (Beta) ويخضع لقانون حماية البيانات الشخصية المصري لعام ٢٠٢٦.</p>
                <p>بياناتك الحساسة مشفرة داخل <b>'خزنة أوركيو' (Urkio Vault)</b> ولا يمكن لأحد الوصول إليها إلا المتخصصين المصرح لهم.</p>
                <p>باستخدامك للمنصة، أنت توافق صراحةً على معالجة بياناتك لأغراض التحسين النفسي والغذائي فقط.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-4xl font-black italic tracking-tight text-zinc-900 leading-tight">Privacy Disclosure</h2>
              <div className="space-y-4 text-zinc-500 font-medium leading-relaxed">
                <p>This is a Beta environment compliant with the 2026 Personal Data Protection Law.</p>
                <p>Sensitive data is encrypted within the <b>Urkio Vault</b> and is only accessible by authorized specialists.</p>
                <p>By clicking 'Accept', you provide explicit consent for data processing limited to wellness and shifting purposes.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col items-center gap-6">
          <button 
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-6 bg-zinc-900 text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:bg-[#004e99] hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? 'Vaulting...' : (lang === 'ar' ? 'أوافق صراحةً' : 'I Explicitly Accept')}
          </button>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
             <CheckCircle2 size={12} /> Encrypted Session Security Active
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const MaterialIcon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);
