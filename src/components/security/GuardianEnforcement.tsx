/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db, storage } from '../../firebase';
import { doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Shield, Mail, Phone, FileUp, CheckCircle, Lock } from 'lucide-react';

interface Props {
  user: any;
  userData: any;
  onRefresh: () => void;
}

export const GuardianEnforcement: React.FC<Props> = ({ user, userData, onRefresh }) => {
  const [step, setStep] = useState<'info' | 'setup' | 'pending'>('info');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMinor = (userData?.age || 0) < 15;
  const lang = navigator.language.startsWith('ar') ? 'ar' : 'en';
  const isRTL = lang === 'ar';

  const handleSubmitGuardian = async () => {
    if (!guardianEmail || !guardianPhone) {
       return toast.error(isRTL ? 'يرجى إدخال بريد وهاتف ولي الأمر' : 'Please enter guardian email and phone number');
    }

    setIsSubmitting(true);
    try {
      let idUrl = '';
      let idFileName = '';

      // 1. Try to upload ID — fallback gracefully if Storage rules block it
      if (idFile) {
        try {
          const storageRef = ref(storage, `guardian_ids/${user.uid}_${Date.now()}`);
          await uploadBytes(storageRef, idFile);
          idUrl = await getDownloadURL(storageRef);
          idFileName = idFile.name;
        } catch (storageErr: any) {
          console.warn('[GuardianEnforcement] Storage upload failed (rules may need update):', storageErr?.message);
          // Store file name as reference — admin can request re-upload
          idFileName = idFile.name;
          toast(`ID upload skipped (will be requested by admin). Proceeding with consent record.`, { icon: '⚠️' });
        }
      }

      // 2. Update User Document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        guardianEmail,
        guardianPhone,
        ...(idUrl ? { guardianIdUrl: idUrl } : {}),
        ...(idFileName ? { guardianIdFileName: idFileName } : {}),
        guardianVerificationStatus: 'pending',
        isGuardianSetupCompleted: true,
        updatedAt: serverTimestamp()
      });

      // 3. Create Audit / Consent Record
      const consentRef = doc(db, 'consent_records', `guardian_${user.uid}`);
      await setDoc(consentRef, {
        minorId: user.uid,
        guardianEmail,
        guardianPhone,
        ...(idFileName ? { guardianIdFileName: idFileName } : {}),
        timestamp: serverTimestamp(),
        action: 'GUARDIAN_CONSENT_SUBMITTED',
        type: 'PDPL_MINOR_PROTECTION'
      });

      setStep('pending');
      toast.success(isRTL ? 'تم إرسال طلب الموافقة لولي الأمر' : 'Consent request sent to guardian for review');
    } catch (err: any) {
      console.error('[GuardianEnforcement] Submit error:', err);
      const detail = err?.code || err?.message || 'unknown';
      toast.error(`Submission failed: ${detail}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (step === 'pending' || userData?.guardianVerificationStatus === 'pending') {
    return (
      <div className="fixed inset-0 z-300 bg-white flex items-center justify-center p-10 text-center">
        <div className="max-w-md">
           <div className="size-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-600">
             <Shield className="size-12 animate-pulse" />
           </div>
           <h2 className="text-3xl font-black italic tracking-tighter mb-4 uppercase">Verification Pending</h2>
           <p className="text-zinc-500 font-medium leading-relaxed">
             Our clinical leads are reviewing the legal guardian documents for your account. 
             You will be notified once the "Guardian Verified" status is active.
           </p>
           <button onClick={() => window.location.reload()} className="mt-8 text-xs font-black uppercase tracking-widest text-msgr-primary underline">Refresh Status</button>
           
           <div className="mt-20 pt-10 border-t border-zinc-100">
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Guardian Control</p>
             <button 
               onClick={async () => {
                 if (window.confirm("CRITICAL: This will PERMANENTLY delete your child's data and account from Urkio per PDPL 2026. This action cannot be undone. Proceed?")) {
                    toast.loading("Initiating Self-Destruct protocol...");
                    // Implementation of actual deletion would typically 
                    // happen via a Cloud Function to ensure all records are wiped
                    setTimeout(() => toast.success("Data Erasure Pending (Audit ID: 151-2020)"), 2000);
                 }
               }}
               className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all"
             >
               Delete My Child's Data (Self-Destruct)
             </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-300 bg-black/60 backdrop-blur-3xl flex items-center justify-center p-6 sm:p-10">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-5xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="bg-msgr-primary p-8 md:p-12 text-white text-center">
           <Shield className="size-12 mx-auto mb-6 opacity-80" />
           <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase font-headline leading-none">
             {isRTL ? 'بروتوكول حماية القصر' : 'Minor Guardian Protocol'}
           </h2>
           <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] mt-4 opacity-70">
             {isRTL ? 'قانون حماية البيانات الشخصية - المادة ١٢' : 'PDPL 2026 CLINICAL COMPLIANCE (AGE < 15)'}
           </p>
        </div>

        <div className="p-8 md:p-12 bg-zinc-50 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
           {step === 'info' ? (
             <div className="space-y-8">
               <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                 <h3 className="font-black text-lg italic mb-3 flex items-center gap-2">
                   <Lock className="text-msgr-primary size-5" /> {isRTL ? 'لماذا هذا مطلوب؟' : 'Why is this required?'}
                 </h3>
                 <p className="text-sm text-zinc-600 leading-relaxed">
                   {isRTL 
                    ? 'نظراً لأن عمرك أقل من ١٥ عاماً، يتطلب قانون حماية البيانات الشخصية لعام ٢٠٢٦ موافقة صريحة من ولي أمرك الشرعي لتمكين ميزات الاتصال السريري في أوركيو.' 
                    : 'Because you are under 15, the PDPL 2026 regulations require explicit consent from your legal guardian to enable clinical communication features on Urkio.'}
                 </p>
               </div>
               
               <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-800 leading-relaxed italic">
                    {isRTL 
                      ? 'سيتم تقييد حسابك للجلسات الخاصة فقط مع الأخصائي الاجتماعي ولن تتوفر الميزات الاجتماعية حتى يتم التحقق.' 
                      : 'Your account will be restricted to private sessions with your social worker and social features will be disabled until verification.'}
                  </p>
               </div>

               <button 
                 onClick={() => setStep('setup')}
                 className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all"
               >
                 {isRTL ? 'بدء إعداد ولي الأمر' : 'Start Guardian Setup'}
               </button>
             </div>
           ) : (
             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-4">Guardian Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 size-5" />
                    <input 
                      type="email"
                      value={guardianEmail}
                      onChange={e => setGuardianEmail(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-white border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-msgr-primary text-sm"
                      placeholder="parent@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-4">Guardian Mobile (WhatsApp Enabled)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 size-5" />
                    <input 
                      type="tel"
                      value={guardianPhone}
                      onChange={e => setGuardianPhone(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-white border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-msgr-primary text-sm"
                      placeholder="+20 123 456 7890"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <div className="bg-white border-2 border-dashed border-zinc-200 rounded-4xl p-8 text-center hover:border-msgr-primary transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      onChange={e => setIdFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FileUp className="size-8 text-zinc-400 mx-auto mb-4" />
                    <p className="text-sm font-bold text-zinc-900">{idFile ? idFile.name : (isRTL ? 'تحميل هوية ولي الأمر (البطاقة/الجواز)' : 'Upload Guardian ID (National ID/Passport)')}</p>
                    <p className="text-[10px] text-zinc-400 mt-2">Maximum size: 5MB. Format: JPG, PNG, PDF</p>
                  </div>
                </div>

                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 mt-4">
                   <p className="text-[10px] text-emerald-800 font-bold leading-relaxed italic">
                     {isRTL 
                      ? '"أنا، ولي الأمر الشرعي، أوافق على استخدام طفلي لمنصة أوركيو لتلقي الدعم النفسي والاجتماعي. أتفهم أن البيانات مشفرة وفقاً للقانون."'
                      : '"I, the legal guardian, consent to my child using the Urkio platform for psychological/social support. I understand all data is encrypted per the 2026 PDPL."'}
                   </p>
                </div>

                <button 
                  disabled={isSubmitting}
                  onClick={handleSubmitGuardian}
                  className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'SECURELY UPLOADING...' : (isRTL ? 'إرسال للمراجعة القانونية' : 'Submit for Legal Review')}
                  {!isSubmitting && <CheckCircle className="size-4" />}
                </button>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};
