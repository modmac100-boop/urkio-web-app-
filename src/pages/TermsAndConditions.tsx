import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, AlertTriangle, BookOpen, Globe, CheckCircle2, ChevronRight, Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export const TermsAndConditions: React.FC<{ user?: any }> = ({ user }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const isRTL = i18n.language === 'ar';

  // Toggle language globally using i18next
  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const handleAgree = async () => {
    if (!user) {
      toast.error(i18n.language === 'ar' ? "يرجى تسجيل الدخول أولاً لتسجيل موافقتك." : "Please log in first to record your consent.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if already consented to this specific edition
      const consentsRef = collection(db, 'Legal_Consents');
      const q = query(consentsRef, where("userId", "==", user.uid), where("edition", "==", "Edition One - Beta System"));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(consentsRef, {
          userId: user.uid,
          email: user.email,
          edition: "Edition One - Beta System",
          languageSelected: i18n.language,
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent
        });
      }
      
      setHasConsented(true);
      toast.success(i18n.language === 'ar' ? 'اشكرك! تم تسجيل موافقتك بنجاح.' : 'Thank you! Your consent has been recorded successfully.', { icon: '✅' });
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error("Consent Error:", error);
      toast.error(i18n.language === 'ar' ? 'حدث خطأ أثناء تسجيل الموافقة.' : 'Failed to record consent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sections mapping to translation keys
  const sections = [
    { key: 'section1', icon: AlertTriangle, items: 2 },
    { key: 'section2', icon: BookOpen, items: 1 },
    { key: 'section3', icon: Globe, items: 4, hasDesc: true },
    { key: 'section4', icon: Shield, items: 3 },
    { key: 'section5', icon: Shield, items: 1 },
    { key: 'section6', icon: Shield, items: 2 },
    { key: 'section7', icon: AlertTriangle, items: 1 }
  ];

  return (
    <div className={clsx("min-h-screen bg-[#faf9f6] text-[#1b1c1a] font-body p-4 sm:p-8 md:p-20 transition-all duration-500", isRTL ? "font-arabic" : "font-sans")} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20">
                  <Shield className="size-6" />
               </div>
               <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter italic font-headline text-blue-900 leading-tight">
                 {t('terms.title')}
               </h1>
            </div>
            <p className="text-blue-600/80 font-bold tracking-widest uppercase text-xs">
              {t('terms.subtitle')}
            </p>
          </div>
          <button 
            onClick={toggleLanguage}
            className="px-6 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-100 transition-all font-headline text-zinc-600 shrink-0 flex items-center gap-2"
          >
            <Languages className="size-4" />
            {i18n.language === 'ar' ? 'English Version' : 'النسخة العربية'}
          </button>
        </header>

        <div className="bg-white p-8 md:p-16 rounded-[3rem] border border-zinc-100 shadow-xl shadow-zinc-200/40 relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>
          
          <p className="text-lg font-medium text-zinc-600 mb-12 leading-relaxed bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
            {t('terms.welcome')}
          </p>

          <div className="space-y-12 leading-relaxed">
            {sections.map((section, idx) => (
              <section key={idx} className="group">
                <h2 className="text-xl font-black mb-4 text-blue-900 flex items-center gap-3">
                   <section.icon className="size-6 text-blue-500 group-hover:scale-110 transition-transform" strokeWidth={2.5}/>
                   {t(`terms.${section.key}_title`)}
                </h2>
                {section.hasDesc && <p className="mb-4 text-zinc-600 font-medium">{t(`terms.${section.key}_desc`)}</p>}
                
                <ul className="space-y-3 text-zinc-600 font-medium list-none px-2">
                  {section.key === 'section3' ? (
                    <>
                      <li className="flex gap-3 items-start"><ChevronRight className={clsx("size-4 mt-1 shrink-0 text-blue-400", isRTL && "rotate-180")} /><span>{t('terms.section3_syria')}</span></li>
                      <li className="flex gap-3 items-start"><ChevronRight className={clsx("size-4 mt-1 shrink-0 text-blue-400", isRTL && "rotate-180")} /><span>{t('terms.section3_egypt')}</span></li>
                      <li className="flex gap-3 items-start"><ChevronRight className={clsx("size-4 mt-1 shrink-0 text-blue-400", isRTL && "rotate-180")} /><span>{t('terms.section3_uae')}</span></li>
                      <li className="flex gap-3 items-start"><ChevronRight className={clsx("size-4 mt-1 shrink-0 text-blue-400", isRTL && "rotate-180")} /><span>{t('terms.section3_others')}</span></li>
                    </>
                  ) : (
                    Array.from({ length: section.items }).map((_, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <ChevronRight className={clsx("size-4 mt-1 shrink-0 text-blue-400", isRTL && "rotate-180")} />
                        <span>{t(`terms.${section.key}_item${i+1}`)}</span>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-16 p-8 bg-zinc-50 border border-zinc-200 rounded-3xl box-border relative overflow-hidden">
             <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">{t('terms.declaration')}</h3>
             <p className="text-xl font-bold text-zinc-800 italic leading-snug">
               {t('terms.declarationText')}
             </p>

             <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={handleAgree}
                  disabled={isSubmitting || hasConsented}
                  className={clsx(
                    "w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3",
                    hasConsented 
                       ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30"
                       : "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 disabled:opacity-50"
                  )}
                >
                  {isSubmitting ? (
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : hasConsented ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <Shield className="size-5" />
                  )}
                  {hasConsented ? (isRTL ? 'تم تأكيد الموافقة' : 'Consent Recorded') : t('terms.agreeBtn')}
                </button>
                {(!user) && (
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
                    {isRTL ? '* يجب تسجيل الدخول للموافقة' : '* Login required to agree'}
                  </p>
                )}
             </div>
          </div>
        </div>

        <footer className="mt-12 text-center pb-20">
           <button 
             onClick={() => navigate(-1)}
             className="text-zinc-500 font-black uppercase text-xs tracking-widest hover:text-zinc-900 transition-colors"
           >
             {t('terms.backBtn')}
           </button>
        </footer>
      </div>
    </div>
  );
};
