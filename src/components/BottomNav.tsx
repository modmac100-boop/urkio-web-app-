import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Disc, Sparkles, User, Video, Brain, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface BottomNavProps {
  isSpecialRole?: boolean;
}

export function BottomNav({ isSpecialRole }: BottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();

  // Hide on full-screen pages
  const hideOnPaths = ['/homii', '/therapy-room', '/live'];
  if (hideOnPaths.some(p => location.pathname.startsWith(p))) return null;

  const baseItems = [
    { id: 'home', path: '/', icon: Home, label: t('nav.homePage') },
    { id: 'messenger', path: '/messenger', icon: MessageCircle, label: t('nav.inbox') },
    { id: 'instantCall', path: '/conference', icon: Disc, label: t('nav.instantCall'), isAction: true },
    { id: 'homii', path: '/homii', icon: Brain, label: 'Homii' },
    { id: 'profile', path: '/user/me', icon: User, label: t('profile.feed') }
  ];

  // Expert gets an extra "Clinical Studio" replacing the Homii slot
  const expertItems = [
    { id: 'home', path: '/', icon: Home, label: t('nav.homePage') },
    { id: 'messenger', path: '/messenger', icon: MessageCircle, label: t('nav.inbox') },
    { id: 'instantCall', path: '/conference', icon: Disc, label: t('nav.instantCall'), isAction: true },
    { id: 'clinical', path: '/agenda', icon: Sparkles, label: 'Hub' },
    { id: 'therapy-room', path: '/therapy-room', icon: Stethoscope, label: 'Session' },
  ];

  const navItems = isSpecialRole ? expertItems : baseItems;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[9999] xl:hidden">
      {/* Glass Decoration */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
      
      <div className="relative mx-3 mb-4 px-3 py-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex items-center justify-between" style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.id === 'home' && location.pathname === '/');
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => clsx(
                  "relative -top-8 size-14 milled-gradient rounded-full flex items-center justify-center text-white shadow-2xl shadow-ur-primary/40 transform transition-all active:scale-95",
                  isActive && "ring-4 ring-white/20 dark:ring-zinc-800/20"
                )}
              >
                <Icon className="size-7" strokeWidth={2.5} />
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                   <span className="text-[9px] font-black uppercase tracking-widest bg-ur-primary text-white px-2.5 py-1 rounded-full shadow-lg">
                      {t('nav.instantCall')}
                   </span>
                </div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 px-2.5 py-2 rounded-2xl transition-all duration-300 min-w-[44px] min-h-[44px] justify-center",
                isActive ? "text-ur-primary" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              <Icon size={isActive ? 22 : 18} className={clsx("transition-transform", isActive && "scale-110")} />
              <span className={clsx(
                "text-[8px] font-black uppercase tracking-widest leading-none",
                !isActive && "opacity-60"
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
