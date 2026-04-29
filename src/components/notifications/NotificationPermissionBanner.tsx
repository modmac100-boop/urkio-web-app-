/**
 * NotificationPermissionBanner
 *
 * A beautiful, dismissible banner that asks the user to enable
 * OS-level browser notifications. Shows once per session if
 * permission hasn't been granted yet.
 *
 * Behavior:
 * - Hidden if permission is already 'granted' or 'denied'
 * - Dismissed permanently if user clicks "Not now"
 * - Persisted via localStorage key 'urkio_notif_banner_dismissed'
 * - Fully bilingual: Arabic (RTL) + English
 * - Animated slide-in from top
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface NotificationPermissionBannerProps {
  onRequest: () => Promise<NotificationPermission>;
}

export function NotificationPermissionBanner({ onRequest }: NotificationPermissionBannerProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);
    const [result, setResult] = useState<NotificationPermission | null>(null);

  // Determine if we should show
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    const dismissed = localStorage.getItem('urkio_notif_banner_dismissed');
    if (dismissed === 'true') return;

    // Small delay so it doesn't appear instantly on load
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleAllow = useCallback(async () => {
    setRequesting(true);
    try {
      const permission = await onRequest();
      setResult(permission);
      setTimeout(() => setVisible(false), 2000);
    } finally {
      setRequesting(false);
    }
  }, [onRequest]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem('urkio_notif_banner_dismissed', 'true');
    setVisible(false);
  }, []);

  if (!visible) return null;

  // ── Strings ────────────────────────────────────────────────────────────────
  const strings = {
    title: isRTL
      ? 'ابق على اطلاع دائم 🔔'
      : 'Stay in the loop 🔔',
    body: isRTL
      ? 'فعّل الإشعارات لتصلك تنبيهات فورية عند وصول رسالة، أو متابعة جديدة، أو أي حدث مهم — مباشرة على جهازك.'
      : 'Enable notifications to get instant alerts for new messages, follows, events, and more — right on your device.',
    allow: isRTL ? 'تفعيل الإشعارات' : 'Enable Notifications',
    dismiss: isRTL ? 'ليس الآن' : 'Not now',
    granted: isRTL ? '✅ تم تفعيل الإشعارات!' : '✅ Notifications enabled!',
    denied:  isRTL ? '❌ تم رفض الإذن.' : '❌ Permission denied.',
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="fixed top-4 inset-s-1/2 -translate-x-1/2 z-9999 w-[calc(100vw-2rem)] max-w-xl
                 animate-in fade-in slide-in-from-top-4 duration-500"
    >
      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/20"
        style={{
          background: 'linear-gradient(135deg, #004e99 0%, #0066cc 50%, #1a7fe8 100%)',
        }}
      >
        {/* Decorative blur circle */}
        <div
          className="absolute -top-10 -inset-e-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
        />

        <div className="relative p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Bell icon */}
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
            <span
              className="material-symbols-outlined text-white text-3xl"
              style={{
                fontVariationSettings: "'FILL' 1",
                animation: 'bell-ring 1.2s ease-in-out infinite',
              }}
            >
              notifications_active
            </span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-base leading-tight mb-1">
              {result ? (result === 'granted' ? strings.granted : strings.denied) : strings.title}
            </p>
            {!result && (
              <p className="text-white/80 text-[11px] font-bold leading-relaxed line-clamp-2 uppercase tracking-wide">
                {strings.body}
              </p>
            )}
          </div>

          {/* Actions */}
          {!result && (
            <div className={`flex items-center gap-3 shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={handleAllow}
                disabled={requesting}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-msgr-primary text-xs font-black uppercase tracking-widest
                           hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-60"
              >
                {requesting ? (
                  <span className="w-4 h-4 border-2 border-msgr-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    notifications_active
                  </span>
                )}
                {strings.allow}
              </button>

              <button
                onClick={handleDismiss}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title={strings.dismiss}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bell ring animation style */}
      <style>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          10%       { transform: rotate(-20deg); }
          20%       { transform: rotate(20deg); }
          30%       { transform: rotate(-15deg); }
          40%       { transform: rotate(15deg); }
          50%       { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
