import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../firebase';
import { Loader2, CheckCircle2, Lock, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export function AuthAction() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!mode || !oobCode) {
      setError("Invalid link. Missing action code or mode.");
      setVerifying(false);
      return;
    }

    if (mode === 'resetPassword') {
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setEmail(email);
          setVerifying(false);
        })
        .catch((error) => {
          setError(error.message || 'Invalid or expired password reset link.');
          setVerifying(false);
        });
    } else {
      setError(`Unsupported mode: ${mode}`);
      setVerifying(false);
    }
  }, [mode, oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || newPassword.length < 6) return;

    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/landing'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="size-10 text-primary animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Verifying link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 end-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mx-20 -my-20"></div>

        <div className="relative z-10">
          <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
            {success ? <CheckCircle2 className="size-8" /> : error ? <XCircle className="size-8" /> : <Lock className="size-8" />}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {success ? 'Password Reset!' : error ? 'Link Expired' : 'Create New Password'}
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            {success 
              ? 'Your password has been successfully reset. Redirecting to login...' 
              : error 
              ? 'This link is invalid or has expired. Please request a new password reset.'
              : `Enter a new strong password for ${email}.`}
          </p>

          {success ? (
            <button 
              onClick={() => navigate('/landing')}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all active:scale-[0.98]"
            >
              Go to Login
            </button>
          ) : error ? (
            <button 
              onClick={() => navigate('/landing')}
              className="w-full h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-all"
            >
              Return Home
            </button>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <button 
                type="submit"
                disabled={loading || newPassword.length < 6}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {loading && <Loader2 className="size-5 animate-spin" />}
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
