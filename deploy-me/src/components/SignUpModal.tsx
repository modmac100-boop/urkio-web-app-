import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SignUpModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  onSwitchToSignIn,
  initialType,
  error,
  isAuthenticating = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onComplete: (data: any, isGoogle: boolean, isApple: boolean) => Promise<void> | void;
  onSwitchToSignIn?: () => void;
  initialType: 'user' | 'expert';
  error?: string | null;
  isAuthenticating?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [userType, setUserType] = useState<'user' | 'expert'>(initialType);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isPending = isLoading || isAuthenticating;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    age: '',
    location: '',
    phone: '',
    occupation: '',
    pronouns: '',
    goals: 'Personal Growth',
    bio: '',
    primaryRole: 'Psychologist',
    skills: '',
    npiNumber: '',
    baaAccepted: false,
    joinCommunity: true,
    termsAccepted: false,
  });

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setUserType(initialType);
    setLocalError(null);
  }, [initialType, isOpen]);

  useEffect(() => {
    setIsLoading(false);
  }, [error, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, isGoogle = false, isApple = false) => {
    if (e) e.preventDefault();
    setLocalError(null);

    const isSocial = isGoogle || isApple;

    if (!isSocial && !formData.termsAccepted) {
      setLocalError(isRTL ? "يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة." : "Please accept the Terms of Use & Privacy Policy to continue.");
      return;
    }

    if (userType === 'expert' && !formData.baaAccepted && !isSocial) {
      setLocalError("Please accept the Business Associate Agreement (BAA) to continue.");
      return;
    }

    if (!isSocial && formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    
    setIsLoading(true);
    try {
      await onComplete({
        userType,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        age: formData.age,
        location: formData.location,
        phone: formData.phone,
        occupation: formData.occupation,
        ...(userType === 'user' ? {
          pronouns: formData.pronouns,
          goals: formData.goals,
          bio: formData.bio,
        } : {
          primaryRole: formData.primaryRole,
          skills: formData.skills,
          npiNumber: formData.npiNumber,
          baaAccepted: formData.baaAccepted,
          joinCommunity: formData.joinCommunity,
        })
      }, isGoogle, isApple);
      
      setIsSuccess(true);
      // Immediate redirect feeling
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 500); // Reduced delay for better feel
    } catch (err: any) {
      console.error("Signup submission error:", err);
      // Only set local error if App.tsx hasn't already set a global auth error
      if (!error) {
        setLocalError(err.message || "An unexpected error occurred during signup.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto cursor-pointer transition-all duration-300"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-[480px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border border-white/40 dark:border-white/10 overflow-hidden relative my-auto cursor-default transform transition-all"
      >
        <div className="relative z-10">

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-in zoom-in-95 duration-500">
            <div className="size-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.welcome')}!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">{t('auth.accountCreatedSuccess')}</p>
            <div className="w-16 h-1 bg-primary rounded-full animate-pulse"></div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="px-8 pt-10 pb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-primary/10 to-transparent -z-10 rounded-t-2xl pointer-events-none" />
          <div className="inline-flex items-center justify-center size-14 bg-linear-to-br from-primary/20 to-primary/5 rounded-2xl mb-4 text-primary border border-primary/20 shadow-inner">
            <span className="material-symbols-outlined text-3xl drop-shadow-sm">rocket_launch</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">{t('auth.createAccount')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t('auth.signUpSubtitle')}</p>
        </div>

        {/* Modal Content */}
        <div className="px-8 pb-8 max-h-[calc(100vh-200px)] overflow-y-auto">
          {(error || localError) && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error || localError}</span>
            </div>
          )}

          <div className="flex p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl mb-8 shadow-inner border border-slate-200/50 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setUserType('user')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                userType === 'user' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              {t('auth.member')}
            </button>
            <button
              type="button"
              onClick={() => setUserType('expert')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                userType === 'expert' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              {t('auth.expert')}
            </button>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={(e) => handleSubmit(e, true, false)} disabled={isPending} className="flex items-center justify-center gap-2 h-12 px-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-300 transform active:scale-[0.98] text-sm font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50">
              {isPending ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <img alt="Google Logo" className="size-5" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"/>
              )}
              <span>{t('auth.google')}</span>
            </button>
            <button onClick={(e) => handleSubmit(e, false, true)} disabled={isPending} className="flex items-center justify-center gap-2 h-12 px-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-300 transform active:scale-[0.98] text-sm font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50">
              {isPending ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <span className="material-symbols-outlined text-xl">ios</span>
              )}
              <span>{t('auth.apple')}</span>
            </button>
          </div>

          <div className="relative flex items-center py-4">
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="shrink mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">{t('auth.orContinueWith')}</span>
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Signup Form */}
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" htmlFor="name">{t('auth.fullNameLabel')}</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute inset-s-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">person</span>
                <input 
                  className="w-full ltr:pl-12 rtl:pr-12 ltr:pr-4 rtl:pl-4 h-12 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none" 
                  id="name" 
                  placeholder="John Doe" 
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">{t('auth.emailLabel')}</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute inset-s-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">mail</span>
                <input 
                  className="w-full ltr:pl-12 rtl:pr-12 ltr:pr-4 rtl:pl-4 h-12 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none" 
                  id="email" 
                  placeholder="name@example.com" 
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" htmlFor="password">{t('auth.passwordLabel')}</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute inset-s-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">lock</span>
                <input 
                  className="w-full ltr:pl-12 rtl:pr-12 ltr:pr-12 rtl:pl-12 h-12 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none" 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  disabled={isPending}
                  minLength={6}
                />
                <button 
                  className="absolute inset-e-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" htmlFor="confirmPassword">{t('auth.confirmPasswordLabel', 'Confirm Password')}</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute inset-s-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">lock_reset</span>
                <input 
                  className="w-full ltr:pl-12 rtl:pr-12 ltr:pr-12 rtl:pl-12 h-12 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none" 
                  id="confirmPassword" 
                  placeholder="••••••••" 
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={isPending}
                  minLength={6}
                />
                <button 
                  className="absolute inset-e-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="age">{t('auth.ageLabel', 'Age')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute inset-s-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">cake</span>
                  <input 
                    className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 h-12 bg-[#FBFBFB] dark:bg-slate-800/50 border border-black/5 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 transition-all outline-none" 
                    id="age" 
                    placeholder="25" 
                    type="number"
                    required
                    min="18"
                    max="120"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="phone">{t('auth.phoneLabel', 'Phone Number')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute inset-s-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">phone</span>
                  <input 
                    className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 h-12 bg-[#FBFBFB] dark:bg-slate-800/50 border border-black/5 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 transition-all outline-none" 
                    id="phone" 
                    placeholder="+1 234 567 8900" 
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="location">{t('auth.locationLabel', 'Location / Country')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute inset-s-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">location_on</span>
                <input 
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 h-12 bg-[#FBFBFB] dark:bg-slate-800/50 border border-black/5 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 transition-all outline-none" 
                  id="location" 
                  placeholder="City, Country" 
                  type="text"
                  required
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="occupation">{t('auth.occupationLabel', 'Occupation')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute inset-s-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">work</span>
                <input 
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 h-12 bg-[#FBFBFB] dark:bg-slate-800/50 border border-black/5 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 transition-all outline-none" 
                  id="occupation" 
                  placeholder="e.g. Engineer" 
                  type="text"
                  required
                  value={formData.occupation}
                  onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                  disabled={isPending}
                />
              </div>
            </div>

            {userType === 'expert' && (
              <div className="pt-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="skills">{t('auth.skillsLabel', 'Expertise / Skills')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute inset-s-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">psychology</span>
                    <select 
                      className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer" 
                      id="skills" 
                      required
                      value={formData.skills}
                      onChange={e => setFormData({ ...formData, skills: e.target.value })}
                      disabled={isPending}
                    >
                      <option value="" disabled>{t('auth.selectOption', 'Select...')}</option>
                      <option value="Doctor">{t('auth.skillDoctor', 'Doctor')}</option>
                      <option value="Psychologist">{t('auth.skillPsychologist', 'Psychologist')}</option>
                      <option value="Therapist">{t('auth.skillTherapist', 'Therapist')}</option>
                      <option value="Social Worker">{t('auth.skillSocialWorker', 'Social Worker')}</option>
                      <option value="Life Coach">{t('auth.skillLifeCoach', 'Life Coach')}</option>
                      <option value="Child Difficulties">{t('auth.skillChildDifficulties', 'Child Difficulties')}</option>
                      <option value="Case Manager">{t('auth.skillCaseManager', 'Case Manager')}</option>
                      <option value="Healing Specialist">{t('auth.skillHealingSpecialist', 'Healing Specialist')}</option>
                      <option value="Other">{t('auth.skillOther', 'Other')}</option>
                    </select>
                    <span className="material-symbols-outlined absolute inset-e-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
                  </div>
                </div>

                <label className="relative p-8 bg-linear-to-r from-emerald-500/5 via-primary/5 to-purple-500/5 dark:from-emerald-500/10 dark:via-primary/10 dark:to-purple-500/10 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden group flex items-start gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.baaAccepted}
                    onChange={e => setFormData({ ...formData, baaAccepted: e.target.checked })}
                    className="mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t('auth.baaAgreement')}
                  </span>
                </label>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-3">
              <label className="relative p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 group flex items-start gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={formData.termsAccepted}
                  onChange={e => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  {isRTL ? 'أوافق على ' : 'I agree to the '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold" onClick={(e) => e.stopPropagation()}>
                    {isRTL ? 'شروط الاستخدام وسياسة الخصوصية' : 'Terms of Use & Privacy Policy'}
                  </a>
                  {isRTL ? ' الخاصة بأوركيو' : ' of Urkio'}
                </span>
              </label>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button 
                className="w-full h-14 bg-linear-to-r from-primary to-[#10b981] hover:from-primary/95 hover:to-[#10b981]/95 text-white font-black rounded-xl shadow-[0_8px_16px_-4px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_20px_-6px_rgba(16,185,129,0.4)] transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:filter-none relative overflow-hidden group" 
                type="submit"
                disabled={isPending}
                onClick={(e) => handleSubmit(e, false, false)}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
                <div className="relative z-10 flex items-center gap-2">
                  {isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t('auth.getStarted')}</span>
                      <span className="material-symbols-outlined text-[20px] rtl:rotate-180 transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </form>

          {/* Footer Text */}
          <div className="mt-8 text-center text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
            <span className="text-slate-500 dark:text-slate-400">{t('auth.alreadyHaveAccount')} </span>
            <button 
              onClick={onSwitchToSignIn}
              className="text-primary font-black hover:opacity-80 transition-opacity"
            >
              {t('auth.logInLink')}
            </button>
          </div>
          </div>
          </>
        )}
        </div>
      </div>
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-8 right-8 text-white/50 hover:text-white transition-all z-60 p-4 rounded-full hover:bg-white/10 active:scale-95 bg-black/20 backdrop-blur-md border border-white/10 pointer-events-auto shadow-2xl"
        aria-label="Close"
        type="button"
      >
        <X className="w-8 h-8" />
      </button>

    </div>
  );
}
