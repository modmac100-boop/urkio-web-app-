import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Menu, X, ArrowRight, Shield, Activity, Star, Check, Sparkles, Brain, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  onLogin: (email?: string, password?: string, isGoogle?: boolean) => void;
  onSignUp: (data: any, isGoogle: boolean, isApple: boolean) => void;
  authError?: string | null;
  setAuthError?: (error: string | null) => void;
  isAuthenticating?: boolean;
}

export function LandingPageV2({
  onLogin,
  onSignUp,
  authError,
  setAuthError,
  isAuthenticating,
}: LandingPageProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePricingCategory, setActivePricingCategory] = useState<'users' | 'pros'>('users');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  const openSignUp = (type: 'user' | 'expert' = 'user') => {
    window.dispatchEvent(new CustomEvent('open-signup', { detail: { type } }));
  };

  const openSignIn = () => {
    window.dispatchEvent(new CustomEvent('open-signin'));
  };

  const navLinks = [
    { label: t('landing.navNetwork', 'Network'), href: '#graph' },
    { label: t('landing.navPillars', 'Pillars'), href: '#pillars' },
    { label: t('landing.navInvestment', 'Investment'), href: '#investment' },
    { label: isRTL ? 'الشركاء' : 'Partners', href: '/ashraqat' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) return;
    e.preventDefault();
    navigate(href);
  };

  const pillars = [
    {
      icon: 'psychology',
      title: t('landing.pillar1Title', 'Self-Development'),
      desc: t('landing.pillar1Desc', 'Cultivate the internal resilience and cognitive agility required to lead in volatile markets.'),
    },
    {
      icon: 'military_tech',
      title: t('landing.pillar2Title', 'Executive Mentorship'),
      desc: t('landing.pillar2Desc', 'Direct access to legacy builders who have navigated the challenges you face today.'),
    },
    {
      icon: 'trending_up',
      title: t('landing.pillar3Title', 'Professional Growth'),
      desc: t('landing.pillar3Desc', 'Strategic positioning and network mobilization to ensure your upward trajectory remains consistent.'),
    },
  ];

  const expertPool = [
    { name: 'Dr. Sarah Jenkins', title: 'Executive Coach', tags: ['Leadership', 'Cognitive Agility'], image: 'https://i.pravatar.cc/150?u=jenkins', verified: true },
    { name: 'Marcus Vance', title: 'Clinical Therapist', tags: ['Resilience', 'Stress Mgt'], image: 'https://i.pravatar.cc/150?u=vance', verified: true },
    { name: 'Elena Rostova', title: 'Wellness Architect', tags: ['Holistic Health', 'Focus'], image: 'https://i.pravatar.cc/150?u=rostova', verified: false },
    { name: 'Dr. Alan Curtis', title: 'Trauma Specialist', tags: ['PTSD', 'EMDR'], image: 'https://i.pravatar.cc/150?u=curtis', verified: true },
    { name: 'Amina Khalid', title: 'Mindfulness Guide', tags: ['Meditation', 'Anxiety'], image: 'https://i.pravatar.cc/150?u=khalid', verified: false },
    { name: 'Dr. Robert Chen', title: 'Cognitive Behavioral Expert', tags: ['CBT', 'Depression'], image: 'https://i.pravatar.cc/150?u=chen', verified: true },
    { name: 'Sofia Martinez', title: 'Relationship Coach', tags: ['Communication', 'Conflict'], image: 'https://i.pravatar.cc/150?u=martinez', verified: false },
    { name: 'David Kim', title: 'Career Transition Mentor', tags: ['Burnout', 'Work-Life Balance'], image: 'https://i.pravatar.cc/150?u=kim', verified: true },
    { name: 'Layla Hassan', title: 'Child Psychologist', tags: ['Parenting', 'Child Dev'], image: 'https://i.pravatar.cc/150?u=hassan', verified: true },
    { name: 'Dr. James Wilson', title: 'Addiction Counselor', tags: ['Recovery', 'Support'], image: 'https://i.pravatar.cc/150?u=wilson', verified: false },
    { name: 'Yuki Tanaka', title: 'Somatic Therapist', tags: ['Mind-Body', 'Breathwork'], image: 'https://i.pravatar.cc/150?u=tanaka', verified: true },
    { name: 'Zara Ahmed', title: 'Life Transition Specialist', tags: ['Grief', 'Empowerment'], image: 'https://i.pravatar.cc/150?u=ahmed', verified: false }
  ];

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };

  const weekNum = getWeekNumber(new Date());
  const startIndex = (weekNum * 3) % expertPool.length;
  const weeklyExperts = [
    expertPool[startIndex],
    expertPool[(startIndex + 1) % expertPool.length],
    expertPool[(startIndex + 2) % expertPool.length]
  ];

  return (
    <div
      className={clsx(
        "min-h-screen bg-ur-on-surface text-ur-background transition-colors duration-300 overflow-x-hidden font-body",
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Background Aura / Particles ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-ur-primary rounded-full blur-[150px] opacity-10"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#C8A96E] rounded-full blur-[150px] opacity-10"
        />
      </div>

      {/* ── Navigation ── */}
      <nav
        className={clsx(
          'fixed top-0 w-full z-50 transition-all duration-500',
          scrolled
            ? 'bg-ur-on-surface/80 backdrop-blur-md border-b border-white/5 shadow-lg'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button
              onClick={() => navigate('/')}
              className="font-headline text-2xl font-black tracking-tight text-white hover:text-ur-primary transition-colors flex items-center gap-2 relative z-10"
            >
              <div className="size-8 rounded-lg bg-linear-to-br from-ur-primary to-[#C8A96E] p-px">
                <div className="w-full h-full bg-ur-on-surface rounded-md flex items-center justify-center">
                  <span className="text-[14px] leading-none">U</span>
                </div>
              </div>
              URKIO
            </button>

            <div className="hidden md:flex items-center gap-8 text-[11px] font-black tracking-[0.2em] uppercase">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-white/60 hover:text-ur-primary transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-ur-primary transition-all group-hover:w-full"></span>
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <button
                onClick={toggleLanguage}
                className="hidden sm:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                <Globe className="size-4" />
                {isRTL ? 'EN' : 'AR'}
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-urkio-agent'))}
                className="hidden lg:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-ur-primary transition-colors"
              >
                <Sparkles className="size-4" />
                {isRTL ? 'المرشد' : 'Agent'}
              </button>
              <button
                onClick={openSignIn}
                className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-colors"
              >
                {t('common.login', 'Login')}
              </button>
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0px 0px 30px rgba(48,176,208,0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openSignUp('user')}
                className="bg-ur-primary hover:bg-linear-to-r hover:from-ur-primary hover:to-blue-800 text-ur-on-surface px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-500"
              >
                {isRTL ? 'انضم الآن' : 'Join Urkio'}
              </motion.button>
              <button
                className="md:hidden p-2 text-white/80 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-ur-on-surface/95 backdrop-blur-xl border-t border-white/5 px-6 py-6 space-y-4 absolute w-full left-0 right-0 top-20"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleNavClick(e, link.href);
                  }}
                  className="block text-sm font-black uppercase tracking-widest text-white/80 hover:text-ur-primary transition-colors py-2"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-urkio-agent'));
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 text-xl font-black tracking-tight text-ur-primary py-2"
              >
                <Sparkles className="size-6" />
                Urkio Agent
              </button>
              <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                <button onClick={openSignIn} className="text-sm font-black uppercase tracking-widest text-white/80 py-2 text-start">
                  {t('common.login', 'Sign In')}
                </button>
                <button
                  onClick={() => { openSignUp('user'); setMobileMenuOpen(false); }}
                  className="bg-ur-primary hover:bg-linear-to-r hover:from-ur-primary hover:to-blue-800 text-ur-on-surface py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-500"
                >
                  Start Your Journey
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-[90vh] flex items-center pt-28 pb-16 overflow-hidden z-10 bg-ur-on-surface">
        {/* Aesthetic overlays */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 inset-e-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-ur-primary/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 inset-s-0 translate-y-1/2 -translate-x-1/4 w-[800px] h-[800px] bg-[#0A3D91]/10 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ur-primary/10 border border-ur-primary/20 mb-8 backdrop-blur-sm"
            >
              <div className="size-2 rounded-full bg-ur-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-ur-primary">
                {isRTL ? 'تشفير تام وقنوات آمنة' : 'Secure & Fully Encrypted Channels'}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className={clsx(
                "text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-white",
                isRTL ? "font-['Tajawal',sans-serif]" : "font-headline"
              )}
            >
              {isRTL ? (
                <>أوركيو: رحلتك نحو <span className="text-ur-primary italic">التشافي</span> والارتقاء بذاتك</>
              ) : (
                <>Urkio: Your Path to Healing & Self-Mastery <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-ur-primary to-[#C8A96E] italic pr-4">
                    Healing and Self-Elevation
                  </span></>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-base md:text-xl text-white/80 mb-12 max-w-2xl leading-relaxed font-medium tracking-wide"
            >
              {isRTL
                ? 'مساحتك الخاصة للتنفس، التعافي، والنمو. لا تحمل عبء مشاعرك وحدك.. نحن نؤمن بك.'
                : 'A sanctuary for healing, breathing, and becoming. You don\'t have to carry it all alone. We hear you.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-8"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0px 10px 40px rgba(48,176,208,0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openSignUp('user')}
                className="w-full sm:w-auto bg-ur-primary hover:bg-linear-to-r hover:from-ur-primary hover:to-blue-800 text-ur-on-surface px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-500 shadow-lg shadow-ur-primary/20"
              >
                {isRTL ? 'ابدأ رحلة العودة لذاتك' : 'Begin Your Return to Self'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.95 }}
                onClick={openSignIn}
                className="w-full sm:w-auto border border-white/20 text-white px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
              >
                {t('landing.viewManifesto', 'View Manifesto')}
                <ArrowRight className={clsx('size-4', isRTL && 'rotate-180')} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(48,176,208,0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new CustomEvent('open-urkio-agent'))}
                className="w-full sm:w-auto border border-ur-primary/30 text-ur-primary px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
              >
                <Sparkles className="size-4" />
                {isRTL ? 'تحدث مع المرشد الذكي' : 'Talk to Urkio Agent'}
              </motion.button>
            </motion.div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 py-4 border-t border-white/5 w-full max-w-2xl text-sm font-medium text-white/60">
              <span className="flex items-center gap-2">
                <span className="text-ur-primary">🔒</span>
                {isRTL ? 'تشفير عالي الخصوصية (AES-256)' : 'End-to-End Encryption (AES-256)'}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-ur-primary">👥</span>
                {isRTL ? 'نخبة من الخبراء والمرشدين الموثوقين' : 'Top Verified Guides & Experts'}
              </span>
            </div>

          </div>
        </div>
      </section>


      {/* ── Features & Encryption ── */}
      <section className="py-24 relative z-10 bg-ur-on-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="bg-white/5 border border-white/10 p-10 rounded-5xl backdrop-blur-sm group hover:border-ur-primary/50 transition-colors">
              <div className="size-16 rounded-2xl bg-ur-primary/10 flex items-center justify-center text-ur-primary mb-8 group-hover:scale-110 transition-transform">
                <Activity className="size-8" />
              </div>
              <h3 className="text-2xl font-headline font-black mb-4">The Journey Timeline</h3>
              <p className="text-white/60 leading-relaxed">
                Track your cognitive and professional growth through an integrated timeline. Measure milestones, reflect on guided sessions, and visualize your evolution.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-10 rounded-5xl backdrop-blur-sm group hover:border-[#C8A96E]/50 transition-colors">
              <div className="size-16 rounded-2xl bg-[#C8A96E]/10 flex items-center justify-center text-[#C8A96E] mb-8 group-hover:scale-110 transition-transform">
                <Shield className="size-8" />
              </div>
              <h3 className="text-2xl font-headline font-black mb-4">Clinical Grade Security</h3>
              <p className="text-white/60 leading-relaxed">
                Your private sessions and notes are protected by AES-256 encryption. We enforce a zero-compromise approach to your data, ensuring absolute confidentiality.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Expert Showcase ── */}
      <section className="py-24 relative z-10 bg-[#020406]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-headline font-black mb-6">World-Class Practitioners</h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Connect directly with verified experts in the care economy, ready to guide your next breakthrough.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {weeklyExperts.map((expert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -10, boxShadow: "0px 20px 40px rgba(0,0,0,0.5)" }}
                className="bg-ur-on-surface border border-white/10 rounded-4xl p-8 relative overflow-hidden group"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-linear-to-br from-ur-primary/0 to-[#C8A96E]/0 group-hover:from-ur-primary/10 group-hover:to-[#C8A96E]/10 transition-colors duration-500 pointer-events-none" />

                <div className="flex items-center gap-4 mb-6">
                  <div className="size-16 rounded-full bg-white/10 p-1">
                    <img src={expert.image} className="w-full h-full rounded-full object-cover" alt={expert.name} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      {expert.name}
                      {expert.verified && <Star className="size-4 text-[#C8A96E] fill-[#C8A96E]" />}
                    </h4>
                    <p className="text-ur-primary text-sm font-semibold">{expert.title}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {expert.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-white/60">
                      {tag}
                    </span>
                  ))}
                </div>

                <button className="w-full py-4 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-ur-on-surface transition-all relative z-10">
                  View Profile
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Graph / Bridge ── */}
      <section id="graph" className="py-24 relative z-10 bg-[#020406] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <h2 className="font-headline text-3xl lg:text-4xl font-black mb-6">
                {isRTL ? 'الشبكة: من الاتصال الرقمي إلى الترابط الإنساني' : 'The Network: From Digital Contact to Human Connection'}
              </h2>
              <div className="font-serif italic text-ur-primary text-lg md:text-xl border-s-2 border-ur-primary/40 ps-4 mb-6 leading-relaxed">
                {isRTL
                  ? '"ما وراء الخوارزميات: نبض الإنسانية المشترك."'
                  : '"Beyond the Algorithm: A Pulse of Shared Humanity."'}
              </div>
              <p className="text-white/80 text-sm md:text-base mb-8 leading-relaxed tracking-wide font-sans">
                {isRTL
                  ? 'في عالم من الضجيج الرقمي المشتت، تعيد "أوركيو" استرداد جوهر الاتصال. شبكتنا لم تُبنَ على مقاييس الغرور أو التصفح اللانهائي؛ بل هي "رسم بياني اجتماعي" حيّ صُمم لرسم مسارك نحو التعافي. نحن نجسر الفجوة بين الألم المنعزل والتشافي الجماعي، لنخلق مرفأً آمناً حيث يمثل كل اتصال مصدراً للقوة، وكل تفاعل خطوة نحو الاكتمال.'
                  : 'In a world of fragmented digital noise, URKIO reclaims the essence of connection. Our network is not built on vanity metrics or endless scrolling; it is a living "Social Graph" designed to map your path to recovery. We bridge the gap between isolated pain and collective healing, creating a safe harbor where every node is a source of strength and every interaction is a step toward wholeness.'}
              </p>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="shrink-0 size-10 rounded-xl bg-ur-primary/10 text-ur-primary flex items-center justify-center border border-ur-primary/20">
                    <Activity className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{t('landing.directProximity', 'Direct Proximity')}</h4>
                    <p className="text-white/50 text-sm">{t('landing.directProximityDesc', 'Deepen relationships with immediate decision-makers.')}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="shrink-0 size-10 rounded-xl bg-[#C8A96E]/10 text-[#C8A96E] flex items-center justify-center border border-[#C8A96E]/20">
                    <Globe className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{t('landing.extendedNetwork', 'Extended Network')}</h4>
                    <p className="text-white/50 text-sm">{t('landing.extendedNetworkDesc', 'Bridge gaps into new industries through curated warm intros.')}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="relative h-[400px] flex items-center justify-center bg-white/5 rounded-[3rem] border border-white/10">
              {/* Abstract nodes animation instead of the old complex one */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="relative w-64 h-64 border border-white/10 rounded-full flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 -translate-y-1/2 size-8 bg-ur-primary rounded-full shadow-[0_0_20px_var(--ur-primary)]"
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-0 translate-y-1/2 size-6 bg-[#C8A96E] rounded-full shadow-[0_0_15px_#C8A96E]"
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute left-0 -translate-x-1/2 size-4 bg-white rounded-full shadow-[0_0_10px_white]"
                />
                <div className="w-32 h-32 border border-white/20 rounded-full flex items-center justify-center">
                  <div className="size-16 bg-ur-on-surface border-2 border-ur-primary rounded-full flex items-center justify-center font-headline font-black text-xl text-ur-primary">
                    U
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section id="pillars" className="py-24 relative z-10 bg-linear-to-b from-ur-on-surface to-[#012330]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-5xl font-black mb-4">
              {isRTL ? 'المرتكزات: العمارة الداخلية للروح' : 'The Pillars: The Internal Architecture of the Soul'}
            </h2>
            <div className="w-16 h-1 bg-linear-to-r from-ur-primary to-[#C8A96E] mx-auto rounded-full mb-6" />

            <div className="font-serif italic text-[#C8A96E] text-lg md:text-xl mb-4 max-w-2xl mx-auto leading-relaxed">
              {isRTL
                ? '"ركائز الهوية السيادية."'
                : '"The Pillars of Sovereign Identity."'}
            </div>
            <p className="text-white/60 text-sm md:text-base max-w-3xl mx-auto leading-relaxed font-sans">
              {isRTL
                ? 'تطوير الذات دون أساس هو مجرد إصلاح مؤقت. تمثل مرتكزاتنا التزاماً بـ "النزاهة الجذرية". من خلال دمج التشفير المتقدم (الخصوصية) مع البصيرة النفسية العميقة (العلم)، نخلق هيكلاً لذاتك الجديدة. نحن نضمن أن نموك ليس مجرد مرحلة عابرة، بل هو تحول بنيوي يحميك من الآثار الجانبية للتوتر الحديث وتآكل الهوية.'
                : 'Personal development without a foundation is merely a temporary fix. Our pillars represent a commitment to "Radical Integrity." By combining Advanced Cryptography (Privacy) with Deep Psychological Insights (Science), we create a scaffold for your new self. We ensure that your growth is not just a phase, but a structural transformation that shields you from the side effects of modern stress and identity erosion.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((pillar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="group p-10 rounded-4xl bg-white/5 border border-white/10 hover:border-ur-primary/50 transition-all duration-300"
              >
                <div className="size-14 bg-ur-on-surface border border-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-ur-primary group-hover:border-ur-primary transition-colors">
                  <div className="text-white/60 group-hover:text-ur-on-surface transition-colors">
                    {pillar.icon === 'psychology' && <Brain className="size-6" />}
                    {pillar.icon === 'military_tech' && <Shield className="size-6" />}
                    {pillar.icon === 'trending_up' && <TrendingUp className="size-6" />}
                  </div>
                </div>
                <h3 className="font-headline text-2xl font-black mb-4">{pillar.title}</h3>
                <p className="text-white/50 leading-relaxed">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Investment / Pricing ── */}
      <section id="investment" className="py-24 relative z-10 bg-linear-to-b from-[#012330] to-[#001220]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-5xl font-black mb-4">
              {isRTL ? 'الاستثمار: صناعة الثروة النفسية' : 'The Investment: Creating Psychological Wealth'}
            </h2>

            <div className="font-serif italic text-ur-primary text-lg md:text-xl mb-6 max-w-2xl mx-auto leading-relaxed">
              {isRTL
                ? '"الاستثمار في هندسة الغد."'
                : '"Investing in the Architecture of Tomorrow."'}
            </div>

            <p className="text-white/60 text-sm md:text-base max-w-3xl mx-auto mb-8 leading-relaxed font-sans">
              {isRTL
                ? 'العملة الأكثر قيمة في عام 2026 هي المرونة النفسية. الاستثمار في "أوركيو" هو استثمار في "رأس المال الاجتماعي" و"التوازن الشخصي". نحن نمكّنك من تحويل نقاط ضعفك إلى أصول من الحكمة. عندما تشفي نفسك، فإنك توازن عائلتك؛ وعندما توازن عائلتك، فإنك تقوي المجتمع. هذا هو العائد الأسمى: مجتمع من الشخصيات المبنية، المستعدة للقيادة بوضوح ورحمة.'
                : 'The most valuable currency in 2026 is mental resilience. Investing in URKIO is an investment in "Social Capital" and "Personal Equilibrium." We empower you to turn your vulnerabilities into assets of wisdom. When you heal yourself, you stabilize your family; when you stabilize your family, you strengthen society. This is the ultimate return: a community of built personalities, ready to lead with clarity and compassion.'}
            </p>

            <div className="inline-flex bg-ur-on-surface p-1.5 rounded-full border border-white/10">
              <button
                onClick={() => setActivePricingCategory('users')}
                className={clsx(
                  "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                  activePricingCategory === 'users' ? "bg-ur-primary text-ur-on-surface" : "text-white/60 hover:text-white"
                )}
              >
                {isRTL ? 'مسار المستخدم' : 'User Track'}
              </button>
              <button
                onClick={() => setActivePricingCategory('pros')}
                className={clsx(
                  "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                  activePricingCategory === 'pros' ? "bg-[#C8A96E] text-ur-on-surface" : "text-white/60 hover:text-white"
                )}
              >
                {isRTL ? 'المسار المهني' : 'Professional Track'}
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={activePricingCategory}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {/* Keeping the dynamic pricing structure short for brevity but styling it completely */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-4xl flex flex-col hover:border-white/30 transition-colors">
              <h3 className="font-headline text-xl font-bold mb-2">{isRTL ? 'الباقة الأساسية' : 'Essential Pass'}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">{isRTL ? '0 ر.س' : '0 SR'}</span><span className="text-white/40">{isRTL ? '/شهر' : '/mo'}</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex gap-3 text-white/70"><Check className="size-5 text-ur-primary" /> {isRTL ? 'منتدى عام' : 'Public Forum Access'}</li>
                <li className="flex gap-3 text-white/70"><Check className="size-5 text-ur-primary" /> {isRTL ? 'مكتبة الموارد' : 'Resource Library'}</li>
              </ul>
              <button onClick={() => openSignUp()} className="w-full py-4 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-ur-on-surface transition-all">{isRTL ? 'ابدأ مجاناً' : 'Start Free'}</button>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-4xl flex flex-col hover:border-white/30 transition-colors">
              <h3 className="font-headline text-xl font-bold mb-2">{isRTL ? 'باقة النمو' : 'Growth Tier'}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">{isRTL ? '185 ر.س' : '185 SR'}</span><span className="text-white/40">{isRTL ? '/شهر' : '/mo'}</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex gap-3 text-white"><Check className="size-5 text-ur-primary" /> {isRTL ? 'جميع الميزات المجانية' : 'All Free Features'}</li>
                <li className="flex gap-3 text-white"><Check className="size-5 text-ur-primary" /> {isRTL ? 'متابعة شهرية مع موجه' : 'Monthly Coach Check-in'}</li>
                <li className="flex gap-3 text-white"><Check className="size-5 text-ur-primary" /> {isRTL ? 'تدريب متطور بالذكاء الاصطناعي' : 'Premium AI Coaching'}</li>
                <li className="flex gap-3 text-white"><Check className="size-5 text-ur-primary" /> {isRTL ? 'المساهمة في المجتمع' : 'Community Contribution'}</li>
              </ul>
              <button onClick={() => openSignUp()} className="w-full py-4 bg-ur-primary text-ur-on-surface rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all">{isRTL ? 'ترقية الباقة' : 'Upgrade'}</button>
            </div>

            <div className="bg-linear-to-b from-[#C8A96E]/20 to-ur-on-surface border border-[#C8A96E] p-8 rounded-4xl flex flex-col scale-105 relative shadow-[0_0_50px_rgba(200,169,110,0.1)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#C8A96E] text-ur-on-surface px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{isRTL ? 'الأكثر شيوعاً' : 'Most Popular'}</div>
              <h3 className="font-headline text-xl font-bold mb-2">{isRTL ? 'التحول الشامل' : 'Transformation'}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">{isRTL ? '750 ر.س' : '750 SR'}</span><span className="text-white/40">{isRTL ? '/شهر' : '/mo'}</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex gap-3 text-white/70"><Check className="size-5 text-ur-primary" /> {isRTL ? 'جلسات علاج فردية' : '1-on-1 Clinical Therapy'}</li>
                <li className="flex gap-3 text-white/70"><Check className="size-5 text-ur-primary" /> {isRTL ? 'خط دعم الأزمات الفوري' : 'On-Demand Crisis Line'}</li>
              </ul>
              <button onClick={() => openSignUp()} className="w-full py-4 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-ur-on-surface transition-all">{isRTL ? 'ابدأ التحول' : 'Begin Transformation'}</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Call to Action ── */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-[#0A3D91]/20 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-headline font-black mb-8"
          >
            Ready to Begin?
          </motion.h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openSignUp('user')}
            className="bg-ur-background text-ur-on-surface px-12 py-6 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:shadow-[0_0_40px_rgba(237,232,228,0.3)] transition-all"
          >
            Create Your Account
          </motion.button>
        </div>
      </section>

    </div>
  );
}
