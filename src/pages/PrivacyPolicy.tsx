/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const isRTL = lang === 'ar';

  return (
    <div className={clsx("min-h-screen bg-[#faf9f6] text-[#1b1c1a] font-body p-8 md:p-20", isRTL && "dir-rtl")} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-600/20">
                  <span className="material-symbols-outlined text-2xl">policy</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic font-headline">
                 {isRTL ? 'سياسة الخصوصية (PDPL 2026)' : 'Privacy Policy (PDPL 2026)'}
               </h1>
            </div>
            <p className="text-zinc-500 font-medium">
              {isRTL ? 'بيان حماية البيانات الشخصية لجمهورية مصر العربية' : 'Personal Data Protection Statement for the Arab Republic of Egypt'}
            </p>
          </div>
          <button 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-all font-headline"
          >
            {lang === 'ar' ? 'English Version' : 'النسخة العربية'}
          </button>
        </header>

        <div className="space-y-12 bg-white p-10 md:p-16 rounded-[3rem] border border-zinc-100 shadow-sm leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-black italic mb-6 text-emerald-700 flex items-center gap-3">
               <span className="material-symbols-outlined">fingerprint</span>
               {isRTL ? '1. جهة التحكم (Identity of the Controller)' : '1. Identity of the Controller'}
            </h2>
            <div className="space-y-4 text-zinc-600 font-medium">
              <p><strong>{isRTL ? 'الجهة:' : 'Entity:'}</strong> Urkio (Beta Phase - Edition One).</p>
              <p><strong>{isRTL ? 'مسؤول حماية البيانات (DPO):' : 'Data Protection Officer (DPO):'}</strong> Samer Alhalaki.</p>
              <p><strong>{isRTL ? 'الأساس القانوني:' : 'Legal Basis:'}</strong> {isRTL ? 'تتم المعالجة بناءً على موافقة كتابية صريحة (المادة 12 من قانون حماية البيانات الشخصية) وتنفيذ خدمات العافية.' : 'Processing is based on Explicit Written Consent (Art. 12 of PDPL) and the fulfillment of wellness services.'}</p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-black italic mb-6 text-emerald-700 flex items-center gap-3">
               <span className="material-symbols-outlined">analytics</span>
               {isRTL ? '2. البيانات التي نجمعها (Data Collection)' : '2. Data Collection'}
            </h2>
            <ul className="space-y-4 text-zinc-600 font-medium list-disc list-inside">
              <li><strong>{isRTL ? 'البيانات الحساسة:' : 'Sensitive Data:'}</strong> {isRTL ? 'التوجه النفسي، تاريخ الصحة العقلية، ومذكرات "هومي" الصوتية.' : 'Psychological orientation, mental health history, and "Homii" voice journals.'}</li>
              <li><strong>{isRTL ? 'البيانات التقنية:' : 'Technical Data:'}</strong> {isRTL ? 'عناوين IP، معرفات الأجهزة (MacBook/Mobile)، وسجلات الجلسات للأمان.' : 'IP addresses, device identifiers (MacBook/Mobile), and session logs for security.'}</li>
              <li><strong>{isRTL ? 'القياسات الحيوية (Biometrics):' : 'Biometrics:'}</strong> {isRTL ? 'يتم تخزين الأنماط الصوتية من وكيل الصوت فقط لنسخ الجلسات ويتم تشفيرها.' : 'Voice patterns from the Voice Agent are stored only for session transcription and encrypted.'}</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-black italic mb-6 text-emerald-700 flex items-center gap-3">
               <span className="material-symbols-outlined">verified_user</span>
               {isRTL ? '3. حقوق المستخدم (User Rights)' : '3. User Rights'}
            </h2>
            <p className="mb-4 text-zinc-500 italic text-sm">{isRTL ? 'بموجب القانون رقم 151 لسنة 2020، يحق لكل مستخدم في Urkio:' : 'Under Law 151/2020, every Urkio user has the right to:'}</p>
            <ul className="space-y-4 text-zinc-600 font-medium list-decimal list-inside">
              <li><strong>{isRTL ? 'الوصول والمراجعة:' : 'Access & Review:'}</strong> {isRTL ? 'رؤية ما تحتويه "خزنة التشخيص" بالضبط.' : 'See exactly what the "Diagnostic Vault" contains.'}</li>
              <li><strong>{isRTL ? 'التصحيح:' : 'Correction:'}</strong> {isRTL ? 'تحديث أي معلومات سريرية أو شخصية.' : 'Update any clinical or personal information.'}</li>
              <li><strong>{isRTL ? 'الحق في النسيان:' : 'The Right to be Forgotten:'}</strong> {isRTL ? 'طلب المسح الدائم لبياناتهم (ما لم تكن مطلوبة بموجب قوانين الاحتفاظ بالسجلات الطبية).' : 'Request the permanent deletion of their data (unless required by medical record retention laws).'}</li>
              <li><strong>{isRTL ? 'الانسحاب:' : 'Withdrawal:'}</strong> {isRTL ? 'سحب الموافقة في أي وقت، مما سيوقف معالجة الذكاء الاصطناعي على الفور.' : 'Withdraw consent at any time, which will immediately stop the AI processing.'}</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-black italic mb-6 text-emerald-700 flex items-center gap-3">
               <span className="material-symbols-outlined">security</span>
               {isRTL ? '4. الأمن والتشفير (Security & Encryption)' : '4. Security & Encryption'}
            </h2>
            <ul className="space-y-4 text-zinc-600 font-medium">
              <li><strong>{isRTL ? 'حماية شاملة:' : 'End-to-End Protection:'}</strong> {isRTL ? 'يتم تشفير جميع البيانات أثناء السكون وأثناء النقل.' : 'All data is encrypted at rest and in transit.'}</li>
              <li><strong>{isRTL ? 'قاعدة الـ 72 ساعة:' : 'The 72-Hour Rule:'}</strong> {isRTL ? 'في حالة حدوث خرق، ستقوم Urkio بإخطار مركز حماية البيانات الشخصية (PDPC) في غضون 72 ساعة والمستخدمين المتأثرين في غضون 3 أيام.' : 'In the event of a breach, Urkio will notify the PDPC within 72 hours and the affected users within 3 days.'}</li>
              <li><strong>{isRTL ? 'التخزين المحلي:' : 'Local Storage:'}</strong> {isRTL ? 'تتم معالجة البيانات المتعلقة بالمقيمين المصريين بما يتوافق مع تراخيص نقل البيانات عبر الحدود.' : 'Data relating to Egyptian residents is processed in compliance with cross-border transfer licenses.'}</li>
            </ul>
          </section>
        </div>

        <footer className="mt-16 text-center">
           <button 
             onClick={() => navigate(-1)}
             className="text-zinc-400 font-black uppercase text-xs tracking-widest hover:text-zinc-900 transition-colors"
           >
             {isRTL ? 'العودة للمنصة' : 'Back to Urkio Platform'}
           </button>
        </footer>
      </div>
    </div>
  );
};
