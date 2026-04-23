import React from 'react';
import { getUserLevel, isSpecialist, LevelInfo } from '../utils/userLevel';

// ─── Level Badge ──────────────────────────────────────────────────────────────
/**
 * Small circular level badge to overlay on profile/avatar images.
 * size: 'sm' = 20px (for cards), 'md' = 24px (for headers), 'lg' = 28px (for profiles)
 */
export function LevelBadge({
  userData,
  size = 'sm',
  showTooltip = true,
}: {
  userData: any;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}) {
  const info: LevelInfo = getUserLevel(userData);

  const sizeMap = {
    sm: { outer: '20px', font: '8px', fontWeight: 800 },
    md: { outer: '24px', font: '9px', fontWeight: 800 },
    lg: { outer: '28px', font: '10px', fontWeight: 900 },
  };
  const s = sizeMap[size];

  return (
    <div
      title={showTooltip ? `Level ${info.level} — ${info.title}\n${info.xp} XP` : undefined}
      style={{
        width: s.outer,
        height: s.outer,
        borderRadius: '50%',
        background: info.gradientCss,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white',
        boxShadow: `0 2px 8px ${info.color}60`,
        flexShrink: 0,
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          color: '#fff',
          fontSize: s.font,
          fontWeight: s.fontWeight,
          lineHeight: 1,
          letterSpacing: '-0.5px',
        }}
      >
        {info.level}
      </span>
    </div>
  );
}

// ─── Specialist Star Badge ────────────────────────────────────────────────────
/**
 * Green star badge to show beside specialist profile photos.
 */
export function SpecialistStarBadge({
  userData,
  size = 'sm',
}: {
  userData: any;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!isSpecialist(userData)) return null;

  const sizeMap = {
    sm: { outer: '18px', icon: '12px' },
    md: { outer: '22px', icon: '14px' },
    lg: { outer: '26px', icon: '16px' },
  };
  const s = sizeMap[size];

  return (
    <div
      title="Verified Healing Specialist"
      style={{
        width: s.outer,
        height: s.outer,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981, #34d399)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white',
        boxShadow: '0 2px 8px rgba(16,185,129,0.5)',
        flexShrink: 0,
        cursor: 'default',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: s.icon,
          color: '#fff',
          fontVariationSettings: "'FILL' 1",
          lineHeight: 1,
        }}
      >
        star
      </span>
    </div>
  );
}

// ─── Avatar With Badges ───────────────────────────────────────────────────────
/**
 * Drop-in avatar image wrapper that renders the profile photo
 * with a level badge (bottom-left) and optional specialist star (bottom-right).
 */
export function AvatarWithBadges({
  src,
  name,
  userData,
  sizeClass = 'w-9 h-9',
  badgeSize = 'sm',
  className = '',
  isOnline = false,
  hideLevelBadge = false,
  hideSpecialistBadge = false,
}: {
  src?: string;
  name?: string;
  userData: any;
  sizeClass?: string;
  badgeSize?: 'sm' | 'md' | 'lg';
  className?: string;
  isOnline?: boolean;
  hideLevelBadge?: boolean;
  hideSpecialistBadge?: boolean;
}) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}`;
  const showStar = isSpecialist(userData) && !hideSpecialistBadge;

  return (
    <div className={`relative inline-block shrink-0 ${sizeClass}`} style={{ lineHeight: 0 }}>
      <img
        src={src || fallback}
        alt={name || 'Profile'}
        className={`rounded-full object-cover w-full h-full ${className}`}
        referrerPolicy="no-referrer"
        onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
      />

      {/* Level badge — bottom-left */}
      {!hideLevelBadge && (
        <div style={{ position: 'absolute', bottom: -4, left: -4, zIndex: 10 }}>
          <LevelBadge userData={userData} size={badgeSize} />
        </div>
      )}

      {/* Specialist star — bottom-right (only if specialist) */}
      {showStar && (
        <div style={{ position: 'absolute', bottom: -4, right: -4, zIndex: 10 }}>
          <SpecialistStarBadge userData={userData} size={badgeSize} />
        </div>
      )}

      {/* Online indicator — top-right or just beside avatar */}
      {isOnline && (
        <div 
          className="absolute -top-0.5 -right-0.5 size-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full z-20 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
        />
      )}
    </div>
  );
}

// ─── Level Progress Bar ───────────────────────────────────────────────────────
/**
 * Compact progress bar showing XP progress toward next level.
 * Use in profile headers and settings pages.
 */
export function LevelProgressBar({ userData }: { userData: any }) {
  const info = getUserLevel(userData);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center justify-center rounded-full text-white"
            style={{
              background: info.gradientCss,
              width: 28,
              height: 28,
              fontSize: 11,
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            {info.level}
          </div>
          <div>
            <p className="text-xs font-black leading-none" style={{ color: info.color }}>
              Level {info.level} — {info.title}
            </p>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">
              {info.xp} XP
              {info.level < 10 ? ` · ${info.xpForNextLevel - info.xp} XP to level ${info.level + 1}` : ' · Max Level!'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-400">{info.progressPercent}%</span>
      </div>
      {/* Track */}
      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${info.progressPercent}%`, background: info.gradientCss }}
        />
      </div>
    </div>
  );
}
