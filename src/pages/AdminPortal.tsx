import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Shield, Eye, EyeOff, Lock, Mail, ChevronDown, ChevronUp, AlertCircle, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/Logo';



export function AdminPortal() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const ACCESS_GUIDE = [
    {
      step: '01',
      title: t('admin.guide1Title'),
      desc: t('admin.guide1Desc'),
      icon: 'admin_panel_settings',
      color: '#6366f1',
    },
    {
      step: '02',
      title: t('admin.guide2Title'),
      desc: t('admin.guide2Desc'),
      icon: 'mail',
      color: '#0ea5e9',
    },
    {
      step: '03',
      title: t('admin.guide3Title'),
      desc: t('admin.guide3Desc'),
      icon: 'lock',
      color: '#f59e0b',
    },
    {
      step: '04',
      title: t('admin.guide4Title'),
      desc: t('admin.guide4Desc'),
      icon: 'dashboard',
      color: '#10b981',
    },
  ];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        // Validate Admin Passcode
        if (adminPasscode !== 'URKIO_ADMIN_2024') {
          setError('Invalid Admin Access Code. Please contact your administrator.');
          setLoading(false);
          return;
        }
        // Create new admin account
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          email,
          role: 'admin',
          createdAt: serverTimestamp(),
          isOnline: true,
          userType: 'admin'
        });
        navigate('/admin');
      } else {
        // Regular Login
        const cred = await signInWithEmailAndPassword(auth, email, password);
        // Verify admin role
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        const isFounder = email.toLowerCase() === 'urkio@urkio.com' || email.toLowerCase() === 'sameralhalaki@gmail.com';
        const isAdmin = snap.exists() && snap.data().role === 'admin';

        if (isAdmin || isFounder) {
          // If founder but not admin in DB, auto-promote
          if (isFounder && !isAdmin) {
             await setDoc(doc(db, 'users', cred.user.uid), {
               uid: cred.user.uid,
               email: email.toLowerCase(),
               role: 'admin',
               lastLogin: serverTimestamp(),
               userType: 'admin'
             }, { merge: true });
          }
          navigate('/admin');
        } else {
          await auth.signOut();
          setError('Access denied. This portal is restricted to admin accounts only.');
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a moment before trying again.');
      } else {
        setError('Action failed. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError('Failed to send reset email. Please verify the email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Top Bar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Logo className="w-12 h-12" />
          <div className="h-8 w-px bg-white/10" />
          <div>
            <p className="text-white text-xs font-bold uppercase tracking-[0.2em] opacity-60">URKIO PLATFORM</p>
            <p className="text-white text-sm font-black">{t('admin.managementHub')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10">
          <Shield className="w-3.5 h-3.5 text-red-400" />
          <span className="text-red-300 text-xs font-bold uppercase tracking-wider">{t('admin.restrictedAccess')}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row items-stretch">
        {/* LEFT — Branding / Info */}
        <div className="lg:w-1/2 flex flex-col justify-center px-12 py-16">
          <div className="max-w-lg">
            {/* Glowing icon */}
            <div
              className="w-20 h-20 rounded-3xl mb-8 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 0 60px rgba(99,102,241,0.5)' }}
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}>
                monitoring
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              Urkio<br/>
              <span style={{ background: 'linear-gradient(90deg, #818cf8, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('admin.managementPortal')}
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              {t('admin.portalDesc')}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { label: t('admin.totalUsers'), value: '1.2k', icon: 'group' },
                { label: t('admin.activeSessions'), value: '42', icon: 'videocam' },
                { label: t('admin.healthStatus'), value: t('admin.optimal'), icon: 'check_circle' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="material-symbols-outlined text-indigo-400 text-xl">{s.icon}</span>
                  <p className="text-white text-xl font-black mt-1">{s.value}</p>
                  <p className="text-slate-500 text-[10px] font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Collapsible Access Guide */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button
                onClick={() => setGuideOpen(!guideOpen)}
                className="w-full flex items-center justify-between px-6 py-4 text-start"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-indigo-400">help_center</span>
                  <span className="text-white font-bold">{t('admin.howToAccess')}</span>
                </div>
                {guideOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {guideOpen && (
                <div className="px-6 pb-6 space-y-5 border-t border-white/5">
                  {ACCESS_GUIDE.map((item) => (
                    <div key={item.step} className="flex gap-4 pt-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${item.color}22`, border: `1px solid ${item.color}44` }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 20, color: item.color, fontVariationSettings: "'FILL' 1" }}
                        >
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm mb-1">
                          <span className="text-slate-500 me-2">{t('admin.step')} {item.step}</span>
                          {item.title}
                        </p>
                        <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Login Form */}
        <div className="lg:w-1/2 flex items-center justify-center px-8 py-16">
          <div
            className="w-full max-w-md rounded-3xl p-10"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex bg-white/5 p-1.5 rounded-2xl mb-8 border border-white/10">
              <button
                onClick={() => setIsSignUp(false)}
                className={clsx(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  !isSignUp ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {t('admin.signIn')}
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={clsx(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  isSignUp ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {t('admin.signUp')}
              </button>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-black text-white mb-2">
                {isSignUp ? t('admin.createAdminAccount') : t('admin.managementAccess')}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isSignUp 
                  ? t('admin.signUpDesc') 
                  : t('admin.signInDesc')}
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm leading-relaxed font-medium">{error}</p>
              </div>
            )}

            {resetSent && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-emerald-300 text-sm leading-relaxed font-medium">Reset link sent! Please check your inbox at {email}.</p>
              </div>
            )}

            <form onSubmit={handleAction} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-slate-300 text-[10px] font-black uppercase tracking-widest ps-1">
                  {t('admin.adminEmail')}
                </label>
                <div className="relative group">
                  <Mail className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@urkio.com"
                    className="w-full ps-11 ltr:pr-4 rtl:pl-4 py-3.5 rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600 bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-slate-300 text-[10px] font-black uppercase tracking-widest ps-1">
                  {t('admin.secretPassword')}
                </label>
                <div className="relative group">
                  <Lock className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full ps-11 pe-12 py-3.5 rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600 bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute inset-e-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!isSignUp && (
                  <div className="flex justify-end px-1">
                    <button 
                      type="button" 
                      onClick={handleResetPassword}
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                    >
                      {t('admin.forgotPassword', 'Forgot Password?')}
                    </button>
                  </div>
                )}
              </div>

              {/* Secret Admin Passcode (Sign Up Only) */}
              {isSignUp && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-indigo-300 text-[10px] font-black uppercase tracking-widest ps-1">
                    {t('admin.registrationPasscode')}
                  </label>
                  <div className="relative group">
                    <Shield className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-indigo-400" />
                    <input
                      type="password"
                      required
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder={t('admin.registrationPasscodePlaceholder')}
                      className="w-full ps-11 ltr:pr-4 rtl:pl-4 py-3.5 rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-500 bg-indigo-500/5 border border-indigo-500/20 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.05)]"
                    />
                  </div>
                  <p className="text-[10px] text-indigo-300/60 ps-1">{t('admin.contactLead')}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-black text-white text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                style={{
                  background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  boxShadow: loading ? 'none' : '0 10px 30px -5px rgba(79,70,229,0.5)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isSignUp ? t('admin.registering') : t('admin.verifying')}
                  </>
                ) : (
                  <>
                    {isSignUp ? <UserPlus className="w-4.5 h-4.5" /> : <Lock className="w-4.5 h-4.5" />}
                    {isSignUp ? t('admin.createAdminAccountBtn') : t('admin.secureSignIn')}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <p className="text-slate-500 text-xs leading-relaxed">
                {t('admin.portalSecuredDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
