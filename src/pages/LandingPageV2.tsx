import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Menu, X, ArrowRight, Shield, Activity, Star, Check, Sparkles } from 'lucide-react';
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
    { label: t('landing.navNetwork', 'The Network'), href: '#graph' },
    { label: t('landing.navPillars', 'Pillars'), href: '#pillars' },
    { label: t('landing.navInvestment', 'Investment'), href: '#investment' },
  ];

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

  return (
    <div
      className={clsx(
        "min-h-screen bg-[#050A0F] text-[#EDE8E4] transition-colors duration-300 overflow-x-hidden font-body",
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
          className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#30B0D0] rounded-full blur-[150px] opacity-10"
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
            ? 'bg-[#050A0F]/80 backdrop-blur-md border-b border-white/5 shadow-lg'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button
              onClick={() => navigate('/')}
              className="font-headline text-2xl font-black tracking-tight text-white hover:text-[#30B0D0] transition-colors flex items-center gap-2 relative z-10"
            >
              <div className="size-8 rounded-lg bg-gradient-to-br from-[#30B0D0] to-[#C8A96E] p-[1px]">
                <div className="w-full h-full bg-[#050A0F] rounded-md flex items-center justify-center">
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
                  className="text-white/60 hover:text-[#30B0D0] transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-[#30B0D0] transition-all group-hover:w-full"></span>
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
                className="hidden lg:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-[#30B0D0] transition-colors"
              >
                <Sparkles className="size-4" />
                Urkio Agent
              </button>
              <button
                onClick={openSignIn}
                className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-colors"
              >
                {t('common.login', 'Sign In')}
              </button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(48,176,208,0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openSignUp('user')}
                className="bg-[#30B0D0] text-[#050A0F] px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all"
              >
                Start Your Journey
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
              className="md:hidden bg-[#050A0F]/95 backdrop-blur-xl border-t border-white/5 px-6 py-6 space-y-4 absolute w-full left-0 right-0 top-20"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-black uppercase tracking-widest text-white/80 hover:text-[#30B0D0] transition-colors py-2"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-urkio-agent'));
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 text-xl font-black tracking-tight text-[#30B0D0] py-2"
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
                  className="bg-[#30B0D0] text-[#050A0F] py-4 rounded-xl font-black text-sm uppercase tracking-widest"
                >
                  Start Your Journey
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-12 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
            >
              <div className="size-2 rounded-full bg-[#C8A96E] animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[#C8A96E]">
                The Premier Care Economy Platform
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="font-headline text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1]"
            >
              Your Journey <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#30B0D0] to-[#C8A96E] italic pr-4">
                Within
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl leading-relaxed font-medium"
            >
              {isRTL
                ? 'ارتقِ بمسارك المهني من خلال منظومة متكاملة من الإرشاد التنفيذي والتواصل عالي القرب.'
                : 'Elevate your professional trajectory through a curated ecosystem of executive mentorship and high-proximity networking. Powered by secure, AES-256 encrypted clinical connections.'}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px rgba(48,176,208,0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openSignUp('user')}
                className="w-full sm:w-auto bg-[#30B0D0] text-[#050A0F] px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all"
              >
                Start Your Journey
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.95 }}
                onClick={openSignIn}
                className="w-full sm:w-auto border border-white/20 text-white px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
              >
                View Manifesto
                <ArrowRight className={clsx('size-4', isRTL && 'rotate-180')} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(48,176,208,0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new CustomEvent('open-urkio-agent'))}
                className="w-full sm:w-auto border border-[#30B0D0]/30 text-[#30B0D0] px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
              >
                <Sparkles className="size-4" />
                Talk to Urkio Agent
              </motion.button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Features & Encryption ── */}
      <section className="py-24 relative z-10 bg-[#050A0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-sm group hover:border-[#30B0D0]/50 transition-colors">
              <div className="size-16 rounded-2xl bg-[#30B0D0]/10 flex items-center justify-center text-[#30B0D0] mb-8 group-hover:scale-110 transition-transform">
                <Activity className="size-8" />
              </div>
              <h3 className="text-2xl font-headline font-black mb-4">The Journey Timeline</h3>
              <p className="text-white/60 leading-relaxed">
                Track your cognitive and professional growth through an integrated timeline. Measure milestones, reflect on guided sessions, and visualize your evolution.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-sm group hover:border-[#C8A96E]/50 transition-colors">
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
            {[
              { name: 'Dr. Sarah Jenkins', title: 'Executive Coach', tags: ['Leadership', 'Cognitive Agility'] },
              { name: 'Marcus Vance', title: 'Clinical Therapist', tags: ['Resilience', 'Stress Mgt'], verified: true },
              { name: 'Elena Rostova', title: 'Wellness Architect', tags: ['Holistic Health', 'Focus'] }
            ].map((expert, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -10, boxShadow: "0px 20px 40px rgba(0,0,0,0.5)" }}
                className="bg-[#050A0F] border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#30B0D0]/0 to-[#C8A96E]/0 group-hover:from-[#30B0D0]/10 group-hover:to-[#C8A96E]/10 transition-colors duration-500 pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-16 rounded-full bg-white/10 p-1">
                    <img src={`https://i.pravatar.cc/150?u=${i+50}`} className="w-full h-full rounded-full object-cover" alt={expert.name} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      {expert.name}
                      {expert.verified && <Star className="size-4 text-[#C8A96E] fill-[#C8A96E]" />}
                    </h4>
                    <p className="text-[#30B0D0] text-sm font-semibold">{expert.title}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {expert.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-white/60">
                      {tag}
                    </span>
                  ))}
                </div>

                <button className="w-full py-4 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-[#050A0F] transition-all relative z-10">
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
                {t('landing.socialGraphTitle', 'The Social Graph')}
              </h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                {t('landing.socialGraphDesc', 'Urkio maps your professional landscape beyond simple connections. We visualize your 1st, 2nd, and 3rd-degree professional proximity, uncovering hidden nodes of influence that define your career trajectory.')}
              </p>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="shrink-0 size-10 rounded-xl bg-[#30B0D0]/10 text-[#30B0D0] flex items-center justify-center border border-[#30B0D0]/20">
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
                 <div className="absolute top-0 -translate-y-1/2 size-8 bg-[#30B0D0] rounded-full shadow-[0_0_20px_#30B0D0]"/>
                 <div className="absolute bottom-0 translate-y-1/2 size-6 bg-[#C8A96E] rounded-full shadow-[0_0_15px_#C8A96E]"/>
                 <div className="absolute left-0 -translate-x-1/2 size-4 bg-white rounded-full shadow-[0_0_10px_white]"/>
                 <div className="w-32 h-32 border border-white/20 rounded-full flex items-center justify-center">
                    <div className="size-16 bg-[#050A0F] border-2 border-[#30B0D0] rounded-full flex items-center justify-center font-headline font-black text-xl text-[#30B0D0]">
                      U
                    </div>
                 </div>
               </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section id="pillars" className="py-24 relative z-10 bg-[#050A0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-5xl font-black mb-4">
              {t('landing.pillarsTitle', 'Pillars of Excellence')}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#30B0D0] to-[#C8A96E] mx-auto rounded-full mb-6" />
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              {t('landing.pillarsSubtitle', 'Foundational structures designed for the modern executive.')}
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
                className="group p-10 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#30B0D0]/50 transition-all duration-300"
              >
                <div className="size-14 bg-[#050A0F] border border-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#30B0D0] group-hover:border-[#30B0D0] transition-colors">
                  <span className="material-icons-outlined text-white/60 group-hover:text-[#050A0F] text-2xl">
                    {pillar.icon}
                  </span>
                </div>
                <h3 className="font-headline text-2xl font-black mb-4">{pillar.title}</h3>
                <p className="text-white/50 leading-relaxed">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Investment / Pricing ── */}
      <section id="investment" className="py-24 relative z-10 bg-[#020406]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-5xl font-black mb-6">
              {t('landing.investmentTitle', 'Investment in Excellence')}
            </h2>
            
            <div className="inline-flex bg-[#050A0F] p-1.5 rounded-full border border-white/10">
              <button
                onClick={() => setActivePricingCategory('users')}
                className={clsx(
                  "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                  activePricingCategory === 'users' ? "bg-[#30B0D0] text-[#050A0F]" : "text-white/60 hover:text-white"
                )}
              >
                User Track
              </button>
              <button
                onClick={() => setActivePricingCategory('pros')}
                className={clsx(
                  "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                  activePricingCategory === 'pros' ? "bg-[#C8A96E] text-[#050A0F]" : "text-white/60 hover:text-white"
                )}
              >
                Professional Track
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
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col hover:border-white/30 transition-colors">
              <h3 className="font-headline text-xl font-bold mb-2">Essential Pass</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">$0</span><span className="text-white/40">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex gap-3 text-white/70"><Check className="size-5 text-[#30B0D0]" /> Public Forum Access</li>
                <li className="flex gap-3 text-white/70"><Check className="size-5 text-[#30B0D0]" /> Resource Library</li>
              </ul>
              <button onClick={() => openSignUp()} className="w-full py-4 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-[#050A0F] transition-all">Start Free</button>
            </div>

            <div className="bg-gradient-to-b from-[#30B0D0]/20 to-[#050A0F] border border-[#30B0D0] p-8 rounded-[2rem] flex flex-col scale-105 relative shadow-[0_0_50px_rgba(48,176,208,0.1)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#30B0D0] text-[#050A0F] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</div>
              <h3 className="font-headline text-xl font-bold mb-2">Growth Tier</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">$49</span><span className="text-white/40">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex gap-3 text-white"><Check className="size-5 text-[#30B0D0]" /> All Free Features</li>
                <li className="flex gap-3 text-white"><Check className="size-5 text-[#30B0D0]" /> Monthly Coach Check-in</li>
                <li className="flex gap-3 text-white"><Check className="size-5 text-[#30B0D0]" /> Community Contribution</li>
              </ul>
              <button onClick={() => openSignUp()} className="w-full py-4 bg-[#30B0D0] text-[#050A0F] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all">Upgrade</button>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col hover:border-white/30 transition-colors">
              <h3 className="font-headline text-xl font-bold mb-2">Transformation</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">$399</span><span className="text-white/40">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex gap-3 text-white/70"><Check className="size-5 text-[#30B0D0]" /> 1-on-1 Clinical Therapy</li>
                <li className="flex gap-3 text-white/70"><Check className="size-5 text-[#30B0D0]" /> On-Demand Crisis Line</li>
              </ul>
              <button onClick={() => openSignUp()} className="w-full py-4 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-[#050A0F] transition-all">Begin Transformation</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Call to Action ── */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D91]/20 to-transparent pointer-events-none" />
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
            className="bg-[#EDE8E4] text-[#050A0F] px-12 py-6 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:shadow-[0_0_40px_rgba(237,232,228,0.3)] transition-all"
          >
            Create Your Account
          </motion.button>
        </div>
      </section>

    </div>
  );
}
