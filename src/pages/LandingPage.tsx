import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Menu, X, Check, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface LandingPageProps {
  onLogin: (email?: string, password?: string, isGoogle?: boolean) => void;
  onSignUp: (data: any, isGoogle: boolean, isApple: boolean) => void;
  authError?: string | null;
  setAuthError?: (error: string | null) => void;
  isAuthenticating?: boolean;
}

export function LandingPage({
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
    { label: isRTL ? 'شركاؤنا' : 'Our Partners', href: '/ashraqat' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) return;
    e.preventDefault();
    navigate(href);
  };

  const pillars = [
    {
      icon: 'spa',
      title: t('landing.pillar1Title', 'Self-Development'),
      desc: t('landing.pillar1Desc', 'Cultivate the internal resilience and cognitive agility required to lead in volatile markets.'),
    },
    {
      icon: 'volunteer_activism',
      title: t('landing.pillar2Title', 'Executive Mentorship'),
      desc: t('landing.pillar2Desc', 'Direct access to legacy builders who have navigated the challenges you face today.'),
    },
    {
      icon: 'auto_awesome',
      title: t('landing.pillar3Title', 'Professional Growth'),
      desc: t('landing.pillar3Desc', 'Strategic positioning and network mobilization to ensure your upward trajectory remains consistent.'),
    },
  ];

  const userTiers = [
    {
      name: t('landing.tierEssential', 'The Essential Pass'),
      price: '$0',
      period: '/mo',
      desc: 'Introduction & Awareness',
      features: [
        'Public Forum Access (View-only)',
        'Fundamental Resource Library',
        'Community Events (Audience)',
        'Baseline Progress Tracker',
      ],
      cta: 'Start for Free',
      highlighted: false,
    },
    {
      name: t('landing.tierGrowth', 'The Growth Tier'),
      price: '$49',
      period: '/mo',
      desc: 'Facilitated Social Development',
      features: [
        'All Free Features',
        'Facilitated Group Access',
        'Monthly Coach Check-in',
        'Full Library & Tool Access',
        'Active Community Contribution',
      ],
      cta: 'Upgrade to Growth',
      highlighted: true,
      badge: 'Best Value',
    },
    {
      name: t('landing.tierTransformation', 'Transformation Package'),
      price: '$399',
      period: '/mo',
      desc: 'Accelerated & Clinical Wellness',
      features: [
        'All Standard Features',
        'Weekly 1-on-1 Clinical Therapy',
        'Personalized Development Plan',
        'On-Demand Crisis Text Line',
        'Exclusive Masterclasses',
      ],
      cta: 'Begin Transformation',
      highlighted: false,
    },
  ];

  const proTiers = [
    {
      name: t('landing.tierPractitioner', 'Accredited Practitioner Track'),
      price: '$1,499',
      period: ' + $199/mo',
      desc: 'For Licensed Clinicians & Specialists',
      features: [
        'Social Dev Integration Certification',
        'Digital Practice Optimization',
        'Urkio EHR & Compliance Mastery',
        'Priority Referral Placement',
        'Outcome Analytics Toolkit',
      ],
      cta: 'Apply for Certification',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      name: t('landing.tierVisionary', 'Visionary Leadership Program'),
      price: '$2,999',
      period: '/yr',
      desc: 'Future Platform Architects & Advocates',
      features: [
        'Urkio Governance Mastery',
        'Digital Community Architect Training',
        'Strategic Mediation Training',
        'C-Suite Mentorship Pairing',
        'Platform Innovation Cohort',
      ],
      cta: 'Join Annual Cohort',
      highlighted: false,
    },
  ];

  const currentTiers = activePricingCategory === 'users' ? userTiers : proTiers;

  return (
    <div
      className={clsx(
        "min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden",
        "font-['Inter','Outfit',sans-serif]"
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ══════════════════════ NAV ══════════════════════ */}
      <nav
        className={clsx(
          'fixed top-0 w-full z-50 transition-all duration-300',
          scrolled
            ? 'landing-glass border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="font-['Outfit'] text-2xl font-bold tracking-tight text-[#0A3D91] dark:text-blue-400 hover:opacity-80 transition-opacity"
            >
              URKIO
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-5 text-sm font-semibold tracking-wide uppercase">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-slate-600 dark:text-slate-400 hover:text-[#0A3D91] dark:hover:text-blue-400 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition-all text-slate-600 dark:text-slate-400"
              >
                <Globe className="size-4" />
                {isRTL ? 'EN' : 'العربية'}
              </button>
              <button
                onClick={openSignIn}
                className="hidden sm:block text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#0A3D91] transition-colors"
              >
                {t('common.login', 'Sign In')}
              </button>
              <button
                onClick={() => openSignUp('user')}
                className="bg-[#0A3D91] hover:bg-blue-900 text-white px-2.5 py-1 rounded-md text-[10px] font-bold transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-[#0A3D91]/20"
              >
                {t('landing.joinElite', 'Join the Elite')}
              </button>
              <button
                className="md:hidden p-2 text-slate-600 dark:text-slate-400"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden landing-glass border-t border-slate-200/50 dark:border-slate-800/50 px-6 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleNavClick(e, link.href);
                }}
                className="block text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 hover:text-[#0A3D91] transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
              <button onClick={openSignIn} className="text-sm font-bold text-slate-600 dark:text-slate-400 py-2 text-start">
                {t('common.login', 'Sign In')}
              </button>
              <button
                onClick={() => { openSignUp('user'); setMobileMenuOpen(false); }}
                className="bg-[#0A3D91] text-white py-3 rounded-lg font-bold text-sm"
              >
                {t('landing.joinElite', 'Join the Elite')}
              </button>
              <button onClick={toggleLanguage} className="text-sm font-bold text-slate-500 dark:text-slate-400 py-2 text-start flex items-center gap-2">
                <Globe className="size-4" /> {isRTL ? 'EN' : 'العربية'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-ur-on-surface">
        {/* Aesthetic overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 inset-e-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-ur-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 inset-s-0 translate-y-1/2 -translate-x-1/4 w-[800px] h-[800px] bg-[#0A3D91]/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-ur-primary/10 border border-ur-primary/20 mb-6">
              <span className="size-2 rounded-full bg-ur-primary animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-ur-primary">
                {isRTL ? 'تشفير تام وقنوات آمنة' : 'Secure & Fully Encrypted Channels'}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className={clsx(
              "text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-white",
              isRTL ? "font-['Tajawal',sans-serif]" : "font-['Outfit',sans-serif]"
            )}>
              {isRTL ? (
                <>أوركيو: رحلتك نحو <span className="text-ur-primary italic">التشافي</span> والارتقاء بذاتك</>
              ) : (
                <>Urkio: Your Journey Toward <span className="text-ur-primary italic">Healing</span> and Self-Elevation</>
              )}
            </h1>

            {/* Subtext */}
            <p className="text-base md:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              {isRTL
                ? 'مساحة آمنة، تشفير تام، ومرشدون يفهمونك. طوّر ذاتك، ابنِ مجتمعك، واكتشف قوتك الكامنة في رحلة تعافي استثنائية.'
                : 'Safe space, full encryption, and guides who truly understand. Develop yourself, build your community, and discover your potential.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => openSignUp('user')}
                className="w-full sm:w-auto bg-ur-primary text-slate-950 px-8 py-4 rounded-xl font-bold text-base shadow-2xl shadow-ur-primary/30 hover:bg-[#259cbd] transition-all hover:-translate-y-1 active:scale-95"
              >
                {isRTL ? 'ابدأ رحلتك الآن' : 'Start Your Journey'}
              </button>
              <button
                onClick={openSignIn}
                className="w-full sm:w-auto border border-slate-700 hover:border-ur-primary px-8 py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 text-slate-300 hover:text-white"
              >
                {t('landing.viewManifesto', 'View Manifesto')}
                <ArrowRight className={clsx('size-5', isRTL && 'rotate-180')} />
              </button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 py-4 border-t border-white/5 max-w-2xl mx-auto text-sm font-medium text-slate-400">
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


      {/* ══════════════════════ THE SOCIAL GRAPH ══════════════════════ */}
      <section id="graph" className="py-6 bg-white dark:bg-[#0f172a] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Orb Visualization */}
            <div className="relative h-[300px] flex items-center justify-center order-last lg:order-first">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[100px] h-[100px] border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center opacity-50">
                  <div className="w-[100px] h-[100px] border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center">
                    <div className="w-[50px] h-[50px] border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center">
                      <div className="size-10 bg-[#0A3D91] rounded-full shadow-2xl shadow-[#0A3D91]/50 flex items-center justify-center text-white font-['Outfit'] font-black text-xs">
                        U
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated Nodes */}
              <div className="absolute top-1/4 inset-s-1/4 social-node">
                <div className="size-10 bg-[#0A3D91]/20 border border-[#0A3D91] rounded-full flex items-center justify-center">
                  <span className="material-icons-outlined text-[#0A3D91] text-sm">person</span>
                </div>
              </div>
              <div className="absolute bottom-1/3 inset-e-1/4 social-node" style={{ animationDelay: '1s' }}>
                <div className="size-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <span className="material-icons-outlined text-slate-500 text-sm">group</span>
                </div>
              </div>
              <div className="absolute top-1/2 inset-e-0 social-node" style={{ animationDelay: '2s' }}>
                <div className="size-8 bg-slate-100 dark:bg-slate-800 rounded-full" />
              </div>
              <div className="absolute top-16 inset-e-1/3 social-node" style={{ animationDelay: '1.5s' }}>
                <div className="size-6 bg-[#0A3D91]/30 rounded-full border border-[#0A3D91]/50" />
              </div>

              {/* Stats bar */}
              <div className="absolute bottom-4 inset-s-0 inset-e-0 flex justify-center gap-12">
                {[
                  { label: t('landing.proximity1st', '1st'), sub: t('landing.proximity', 'Proximity') },
                  { label: t('landing.network2nd', '2nd'), sub: t('landing.network', 'Network') },
                  { label: t('landing.influence3rd', '3rd'), sub: t('landing.influence', 'Influence') },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl font-bold text-[#0A3D91]">{s.label}</p>
                    <p className="text-xs uppercase tracking-widest text-slate-400">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Copy */}
            <div>
              <h2 className="font-['Outfit'] text-2xl font-bold mb-4">
                {t('landing.socialGraphTitle', 'The Social Graph')}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                {t('landing.socialGraphDesc', 'Urkio maps your professional landscape beyond simple connections. We visualize your 1st, 2nd, and 3rd-degree professional proximity, uncovering hidden nodes of influence that define your career trajectory.')}
              </p>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="shrink-0 size-8 rounded bg-[#0A3D91]/10 text-[#0A3D91] flex items-center justify-center">
                    <span className="material-icons-outlined text-sm">insights</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{t('landing.directProximity', 'Direct Proximity')}</h4>
                    <p className="text-slate-500 text-sm">{t('landing.directProximityDesc', 'Deepen relationships with immediate decision-makers.')}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="shrink-0 size-8 rounded bg-[#0A3D91]/10 text-[#0A3D91] flex items-center justify-center">
                    <span className="material-icons-outlined text-sm">hub</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{t('landing.extendedNetwork', 'Extended Network')}</h4>
                    <p className="text-slate-500 text-sm">{t('landing.extendedNetworkDesc', 'Bridge gaps into new industries through curated warm intros.')}</p>
                  </div>
                </li>
              </ul>
              <button
                onClick={() => openSignUp('user')}
                className="mt-6 inline-flex items-center gap-2 bg-[#0A3D91] text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-900 transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-[#0A3D91]/20"
              >
                {t('landing.exploreGraph', 'Explore Your Network')}
                <ArrowRight className={clsx('size-4', isRTL && 'rotate-180')} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ BRIDGE SECTION ══════════════════════ */}
      <section className="py-6 bg-slate-50 dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0A3D91] rounded-xl p-4 lg:p-6 relative overflow-hidden">
            {/* Dot pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
            <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-['Outfit'] text-2xl lg:text-3xl font-bold text-white mb-4">
                  {t('landing.bridgeTitle', 'Bridge the Gap Between Ambition and Mastery')}
                </h2>
                <p className="text-blue-100 text-lg mb-5 leading-relaxed">
                  {t('landing.bridgeDesc', 'Access a direct line to industry titans. Urkio facilitates meaningful exchange between world-class experts and rising leaders, transforming distance into mentorship.')}
                </p>
                <div className="flex flex-wrap gap-4">
                  {[
                    t('landing.badge1on1', '1-on-1 Strategy'),
                    t('landing.badgeGlobal', 'Global Industry Leaders'),
                    t('landing.badgeROI', 'Accelerated ROI'),
                  ].map((badge) => (
                    <div key={badge} className="bg-white/10 backdrop-blur px-4 py-2 rounded-full text-white text-xs font-medium border border-white/20">
                      {badge}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 flex flex-col justify-center gap-6">
                  {/* Mentor card */}
                  <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/10 -translate-x-4 rtl:translate-x-4">
                    <div className="size-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-black font-['Outfit'] text-xl">E</div>
                    <div>
                      <p className="text-white font-bold">{t('landing.executiveMentor', 'Executive Mentor')}</p>
                      <p className="text-blue-200 text-xs uppercase tracking-tighter">{t('landing.fortune500', 'Fortune 500 Lead')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className="material-icons-outlined text-white text-4xl animate-pulse">sync</span>
                  </div>

                  {/* Member card */}
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl self-end translate-x-4 rtl:-translate-x-4 shadow-2xl">
                    <div className="size-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-black font-['Outfit'] text-xl">U</div>
                    <div>
                      <p className="text-slate-900 font-bold">{t('landing.urkioMember', 'Urkio Member')}</p>
                      <p className="text-slate-500 text-xs uppercase tracking-tighter">{t('landing.risingLeader', 'Rising Leader')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ PILLARS ══════════════════════ */}
      <section id="pillars" className="py-6 bg-white dark:bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-['Outfit'] text-2xl font-bold mb-2">
              {t('landing.pillarsTitle', 'Pillars of Excellence')}
            </h2>
            <div className="w-12 h-1 bg-[#0A3D91] mx-auto rounded-full mb-4" />
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              {t('landing.pillarsSubtitle', 'Foundational structures designed for the modern executive.')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {pillars.map((pillar, i) => (
              <div
                key={i}
                onClick={() => openSignUp('user')}
                className="group p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0A3D91]/50 transition-all duration-300 hover:shadow-2xl cursor-pointer nexus-card"
              >
                <div className="size-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center mb-5 group-hover:bg-[#0A3D91] group-hover:text-white transition-colors">
                  <span className="material-icons-outlined text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors text-lg">
                    {pillar.icon}
                  </span>
                </div>
                <h3 className="font-['Outfit'] text-xl font-bold mb-2">{pillar.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ INVESTMENT / PRICING ══════════════════════ */}
      <section id="investment" className="py-6 bg-slate-50 dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="font-['Outfit'] text-4xl font-bold mb-4">
              {t('landing.investmentTitle', 'Investment in Excellence')}
            </h2>
            <p className="text-slate-500 mb-8">{t('landing.investmentSubtitle', 'Tiered access for varying stages of professional influence.')}</p>
            
            <div className="inline-flex bg-white dark:bg-slate-800 p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActivePricingCategory('users')}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-sm font-bold transition-all",
                  activePricingCategory === 'users' ? "bg-[#0A3D91] text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:text-[#0A3D91] hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                User & Patient Ecosystem
              </button>
              <button
                onClick={() => setActivePricingCategory('pros')}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-sm font-bold transition-all",
                  activePricingCategory === 'pros' ? "bg-[#0A3D91] text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:text-[#0A3D91] hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                Professional Growth Tracks
              </button>
            </div>
          </div>

          <div className={clsx(
            "grid gap-8 max-w-6xl mx-auto",
            activePricingCategory === 'users' ? "md:grid-cols-3" : "md:grid-cols-2 max-w-4xl"
          )}>
            {currentTiers.map((tier, i) => (
              <div
                key={i}
                className={clsx(
                  'p-3 rounded-xl flex flex-col transition-all duration-300 relative',
                  tier.highlighted
                    ? 'bg-[#0A3D91] text-white scale-105 shadow-2xl shadow-[#0A3D91]/20'
                    : 'bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 hover:shadow-xl'
                )}
              >
                {tier.badge && (
                  <div className="absolute top-0 inset-s-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/20 text-white whitespace-nowrap">
                    {tier.badge}
                  </div>
                )}

                <div className="mb-8">
                  <h3 className={clsx('font-["Outfit"] text-xl font-bold mb-2', !tier.highlighted && 'text-slate-900 dark:text-white')}>
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className={clsx('text-2xl font-bold tracking-tight', !tier.highlighted && 'text-slate-900 dark:text-white')}>
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className={tier.highlighted ? 'text-blue-200 font-medium' : 'text-slate-500 font-medium'}>
                        {tier.period}
                      </span>
                    )}
                  </div>
                </div>

                {tier.desc && (
                  <p className={clsx('text-sm mb-8 leading-relaxed grow', tier.highlighted ? 'text-blue-100' : 'text-slate-500')}>
                    {tier.desc}
                  </p>
                )}

                {tier.features.length > 0 && (
                  <ul className="space-y-4 mb-10 grow">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <Check className={clsx('size-5 shrink-0', tier.highlighted ? 'text-blue-200' : 'text-green-500')} />
                        <span className={tier.highlighted ? 'text-blue-100' : 'text-slate-700 dark:text-slate-300'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={() => openSignUp(activePricingCategory === 'pros' ? 'expert' : 'user')}
                  className={clsx(
                    'w-full py-4 rounded-xl font-bold transition-all active:scale-95',
                    tier.highlighted
                      ? 'bg-white text-[#0A3D91] hover:bg-blue-50'
                      : 'border border-[#0A3D91] text-[#0A3D91] hover:bg-[#0A3D91]/5'
                  )}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FINAL CTA ══════════════════════ */}
      <section className="py-12 bg-white dark:bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0A3D91] rounded-xl p-4 md:p-6 text-center text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
            <div className="absolute top-[-20%] inset-e-[-5%] size-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-10">
              <h2 className="font-['Outfit'] text-3xl md:text-2xl font-bold tracking-tight leading-tight">
                {isRTL ? 'حدد مسارك المهني.' : 'Define Your Professional\nTrajectory.'}
              </h2>
              <p className="text-blue-100 text-lg max-w-xl mx-auto">
                {isRTL
                  ? 'انضم إلى نخبة المحترفين الذين يشكّلون مستقبلهم من خلال الإرشاد الاستراتيجي والشبكات عالية القرب.'
                  : 'Join an elite cohort of professionals shaping their future through strategic mentorship and high-proximity networking.'}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => openSignUp('user')}
                  className="px-6 py-3 bg-white text-[#0A3D91] rounded-2xl font-bold text-base hover:scale-105 active:scale-95 transition-transform shadow-xl"
                >
                  {t('landing.joinElite', 'Join the Elite')}
                </button>
                <button
                  onClick={openSignIn}
                  className="px-6 py-3 bg-transparent border-2 border-white/30 text-white rounded-2xl font-bold text-base hover:bg-white/10 transition-all"
                >
                  {t('common.login', 'Sign In')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer className="bg-white dark:bg-[#0f172a] py-10 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-sm">
              <span className="font-['Outfit'] text-xl font-bold text-[#0A3D91] block mb-4">URKIO</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {t('landing.footerDesc', 'Defining the architectural future of professional proximity and social capital.')}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 text-sm">
              {[
                {
                  title: t('landing.footerNetwork', 'Network'),
                  links: [t('landing.socialGraph', 'Social Graph'), t('landing.nexusNodes', 'Nexus Nodes'), t('landing.mentorship', 'Mentorship')],
                },
                {
                  title: t('landing.footerManifesto', 'Manifesto'),
                  links: [t('landing.ourVision', 'Our Vision'), t('landing.principles', 'Principles'), t('nav.privacyPolicy', 'Privacy')],
                },
                {
                  title: t('landing.footerConnect', 'Connect'),
                  links: [t('nav.contactUs', 'Contact Us'), t('nav.helpCenter', 'Help Center'), t('nav.about', 'About')],
                },
              ].map((section) => (
                <div key={section.title}>
                  <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-slate-900 dark:text-white">
                    {section.title}
                  </h4>
                  <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                    {section.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="hover:text-[#0A3D91] transition-colors">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between text-xs text-slate-400 gap-4">
            <p>© 2025 URKIO. {t('landing.allRightsReserved', 'All rights reserved.')} PDPL 2026 Compliant.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-[#0A3D91] transition-colors">{t('nav.termsOfService', 'Terms of Service')}</a>
              <a href="#" className="hover:text-[#0A3D91] transition-colors">{t('landing.executiveAgreement', 'Executive Agreement')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
