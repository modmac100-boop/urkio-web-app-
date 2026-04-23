import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Disc, Sparkles, User, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface BottomNavProps {
  isSpecialRole?: boolean;
}

export function BottomNav({ isSpecialRole }: BottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { id: 'home', path: '/', icon: Home, label: t('nav.homePage') },
    { id: 'messenger', path: '/messenger', icon: MessageCircle, label: t('nav.inbox') },
    { id: 'instantCall', path: '/conference', icon: Disc, label: t('nav.instantCall'), isAction: true },
    ...(isSpecialRole ? [
      { id: 'clinical', path: '/clinical-workstation', icon: Sparkles, label: t('nav.healingHub') },
      { id: 'therapy-room', path: '/therapy-room', icon: Video, label: 'Clinical Studio' }
    ] : []),
    { id: 'profile', path: '/user/me', icon: User, label: t('profile.feed') }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-9999 xl:hidden">
      {/* Glass Decoration */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/80 to-transparent pointer-events-none" />
      
      <div className="relative mx-4 mb-6 px-4 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.id === 'home' && location.pathname === '/');
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => clsx(
                  "relative -top-10 size-16 milled-gradient rounded-full flex items-center justify-center text-white shadow-2xl shadow-ur-primary/40 transform transition-all active:scale-95",
                  isActive && "ring-4 ring-white/20 dark:ring-zinc-800/20"
                )}
              >
                <Icon className="size-8" strokeWidth={2.5} />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                   <span className="text-[10px] font-black uppercase tracking-widest bg-ur-primary text-white px-3 py-1 rounded-full shadow-lg">
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
                "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300",
                isActive ? "text-ur-primary" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              <Icon size={isActive ? 24 : 20} className={clsx("transition-transform", isActive && "scale-110")} />
              <span className={clsx(
                "text-[8px] font-black uppercase tracking-widest",
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
