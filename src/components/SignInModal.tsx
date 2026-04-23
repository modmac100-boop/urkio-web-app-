import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export function SignInModal({ 
  isOpen, 
  onClose, 
  onSignIn, 
  onSwitchToSignUp,
  error,
  isAuthenticating = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSignIn: (email?: string, password?: string, isGoogle?: boolean, isApple?: boolean) => void;
  onSwitchToSignUp?: () => void;
  error?: string | null;
  isAuthenticating?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [error, isOpen]);

  if (!isOpen) return null;

  const isPending = isLoading || isAuthenticating;

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      await onSignIn(email, password, false);
      // If we reach here and there's no error in props, we assume success
      // We check for error in the next tick via useEffect or just check if it's still null
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 400);
    } catch (err) {
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await onSignIn(undefined, undefined, true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      await onSignIn(undefined, undefined, false, true);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 400);
    } catch (err) {
      console.error("Apple Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setResetError(t('auth.enterEmailReset', 'Please enter your email to reset your password.'));
      return;
    }
    setIsLoading(true);
    setResetError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/60 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative my-auto cursor-default"
      >
        <div className="relative z-10">

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-in zoom-in-95 duration-500">
            <div className="size-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.welcome')}!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">{t('auth.signInSuccess', 'Redirecting you to the sanctuary...')}</p>
            <div className="w-16 h-1 bg-primary rounded-full animate-pulse"></div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="px-8 pt-8 pb-4 text-center">
              <div className="inline-flex items-center justify-center size-12 bg-primary/10 rounded-xl mb-4 text-primary">
                <span className="material-symbols-outlined text-3xl">login</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('auth.welcomeBack')}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">{t('auth.signInSubtitle')}</p>
            </div>

            {/* Modal Content */}
            <div className="px-8 pb-8 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}
          {resetError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {resetError}
            </div>
          )}
          {resetEmailSent && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
              {t('auth.resetEmailSent', 'If an account exists for this email address, a password reset link has been sent to your inbox.')}
            </div>
          )}

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={handleGoogleSignIn} disabled={isPending} className="flex items-center justify-center gap-2 h-11 px-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50">
              {isPending ? (
                <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <img alt="Google Logo" className="size-5" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"/>
              )}
              <span>{t('auth.google')}</span>
            </button>
            <button onClick={handleAppleSignIn} disabled={isPending} className="flex items-center justify-center gap-2 h-11 px-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50">
              {isPending ? (
                <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

          {/* Signin Form */}
          <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">{t('auth.emailLabel')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute inset-s-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                <input 
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 h-12 bg-[#FBFBFB] dark:bg-slate-800/50 border border-black/5 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 transition-all outline-none" 
                  id="email" 
                  placeholder="name@example.com" 
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">{t('auth.passwordLabel')}</label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-xs font-bold text-primary hover:underline focus:outline-none"
                  disabled={isPending}
                >
                  {t('auth.forgotPassword', 'Forgot Password?')}
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute inset-s-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                <input 
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 h-12 bg-[#FBFBFB] dark:bg-slate-800/50 border border-black/5 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 transition-all outline-none" 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isPending}
                />
                <button 
                  className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70" 
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t('auth.signInButton')}</span>
                    <span className={`material-symbols-outlined text-xl ${isRTL ? 'rotate-180' : ''}`}>arrow_forward</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
            <span className="text-slate-500 dark:text-slate-400">{t('auth.noAccount')} </span>
            <button 
              onClick={onSwitchToSignUp}
              className="text-primary font-bold hover:underline"
              type="button"
            >
              {t('auth.signUpLink')}
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
