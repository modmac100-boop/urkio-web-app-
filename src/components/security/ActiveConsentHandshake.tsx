/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  user: any;
  onAccept: () => void;
}

export const ActiveConsentHandshake: React.FC<Props> = ({ user, onAccept }) => {
  const [agreed, setAgreed] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const lang = navigator.language.startsWith('ar') ? 'ar' : 'en';
  const isRTL = lang === 'ar';

  const handleAccept = async () => {
    if (!agreed) return;
    setIsAccepting(true);
    try {
      let userIp = 'UNKNOWN_INTERNAL';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIp = ipData.ip;
      } catch {
        console.warn('IP fetch failed, logging internal signature.');
      }

      await addDoc(collection(db, 'consent_records'), {
        uid: user.uid,
        email: user.email,
        timestamp: serverTimestamp(),
        policyVersion: 'PDPL-2026-BETA-01',
        action: 'EXPLICIT_HANDSHAKE_ACCEPTANCE',
        userAgent: navigator.userAgent,
        ipAddress: userIp,
        consentType: 'SENSITIVE_DATA_HANDLING_LAW_151',
        status: 'legally_binding',
      });

      await updateDoc(doc(db, 'users', user.uid), {
        consentAccepted: true,
        consentAcceptedAt: serverTimestamp(),
        legalVersionAccepted: '2026.01',
      });

      toast.success(isRTL ? 'تم قبول الشروط والخصوصية بنجاح' : 'Privacy terms accepted successfully');
      onAccept();
    } catch (err) {
      console.error('Consent error:', err);
      toast.error('Failed to log consent. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-4xl overflow-hidden shadow-2xl flex flex-col border border-white/20"
      >
        {/* Header */}
        <div className={`p-10 border-b border-zinc-100 flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="p-4 bg-emerald-500 rounded-3xl text-white shadow-xl shadow-emerald-500/30">
            <span className="material-symbols-outlined text-3xl">handshake</span>
          </div>
          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase">
              {isRTL ? 'مصافحة الموافقة النشطة' : 'Active Consent Handshake'}
            </h2>
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500 mt-1">
              {isRTL ? 'قانون حماية البيانات الشخصية المصري 2026' : 'PDPL 2026 COMPLIANCE PROTOCOL'}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className={`overflow-y-auto p-10 bg-msgr-surface-container-low text-sm leading-relaxed text-zinc-600 font-medium max-h-[45vh] ${isRTL ? 'text-right' : ''}`}>
          {isRTL ? (
            <div className="space-y-6">
              <p className="font-black text-zinc-900 border-r-4 border-emerald-500 pr-4 py-2 bg-emerald-50/50">
                بموجب القانون رقم 151 لسنة 2020، تطلب Urkio موافقتك الصريحة لمعالجة بياناتك الحساسة.
              </p>
              <h3 className="font-black text-emerald-600 italic text-lg mt-8 mb-4">جهة التحكم والاتصال</h3>
              <p>يتم التحكم في بياناتك من قبل منصة Urkio (المرحلة التجريبية الأولى). مسؤول حماية البيانات هو سامر الحلاقي.</p>
              <h3 className="font-black text-emerald-600 italic text-lg mt-8 mb-4">ماذا نعالج؟</h3>
              <p>نقوم بمعالجة البيانات الصحية العقلية، المذكرات الصوتية "هومي"، والبيانات الحيوية المشفرة لتحسين تجربتك العلاجية.</p>
              <h3 className="font-black text-emerald-600 italic text-lg mt-8 mb-4">حقوقك القانونية</h3>
              <p>لديك الحق في الوصول، التصحيح، سحب الموافقة في أي وقت، والحق في مسح البيانات (الحق في النسيان).</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="font-black text-zinc-900 border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50/50">
                Under Law 151/2020, Urkio requires your explicit consent to process your sensitive data.
              </p>
              <h3 className="font-black text-emerald-600 italic text-lg mt-8 mb-4">Controller &amp; Contact</h3>
              <p>Your data is controlled by Urkio (Beta Phase - One). The DPO is Samer Alhalaki.</p>
              <h3 className="font-black text-emerald-600 italic text-lg mt-8 mb-4">What do we process?</h3>
              <p>We process mental health data, "Homii" voice journals, and encrypted biometrics to enhance your therapeutic journey.</p>
              <h3 className="font-black text-emerald-600 italic text-lg mt-8 mb-4">Your Legal Rights</h3>
              <p>You have the right to access, correct, withdraw consent at any time, and the right to erasure (Right to be Forgotten).</p>
            </div>
          )}
        </div>

        {/* Footer: Checkbox + Button */}
        <div className="p-10 border-t border-zinc-100 bg-white space-y-6">

          {/* ✅ Checkbox */}
          <label
            htmlFor="consent-checkbox"
            className={`flex items-start gap-4 cursor-pointer group select-none ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <div className="relative mt-0.5 shrink-0">
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              <div
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all pointer-events-none ${
                  agreed
                    ? 'bg-emerald-600 border-emerald-600'
                    : 'border-zinc-300 group-hover:border-emerald-400'
                }`}
              >
                {agreed && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className={`text-xs font-bold text-zinc-600 leading-relaxed ${isRTL ? 'text-right' : ''}`}>
              {isRTL
                ? 'لقد قرأت وفهمت سياسة الخصوصية وأوافق على معالجة بياناتي الحساسة وفقاً للقانون 151/2020'
                : 'I have read and understood the privacy policy, and I consent to the processing of my sensitive data under Law 151/2020'}
            </span>
          </label>


          {/* Accept Button */}
          <button
            disabled={!agreed || isAccepting}
            onClick={handleAccept}
            className={`w-full py-6 rounded-4xl font-black uppercase text-xs tracking-widest transition-all shadow-xl ${
              agreed
                ? 'bg-msgr-on-surface text-white hover:bg-black active:scale-95 shadow-zinc-400/20'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isAccepting
              ? 'LOGGING CONSENT...'
              : isRTL
              ? 'أقبل الشروط والخصوصية'
              : 'I ACCEPT THE TERMS & PRIVACY'}
          </button>

          <p className="text-[9px] text-center text-zinc-400 font-black uppercase tracking-tighter">
            {isRTL
              ? 'بالنقر على "أقبل"، فإنك توافق كتابياً وبشكل صريح على معالجة بياناتك الحساسة.'
              : 'BY CLICKING ACCEPT, YOU PROVIDE EXPLICIT WRITTEN CONSENT FOR THE PROCESSING OF SENSITIVE DATA.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
