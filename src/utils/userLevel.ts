/**
 * User Journey Level System
 * Levels 1-10 that grow organically based on platform activity.
 * Each milestone adds XP; level thresholds increase exponentially.
 */

export interface LevelInfo {
  level: number;
  xp: number;
  xpForNextLevel: number;
  progressPercent: number;
  title: string;
  color: string; // tailwind gradient classes
  gradientCss: string;
}

// XP awards per milestone
export const XP_MILESTONES = {
  accountCreated:         50,  // always true
  onboardingCompleted:    100, // hobbies selected
  profilePhotoUploaded:   75,
  bioCompleted:           50,
  joinedCommunity:        25,
  firstPost:              100,
  firstLike:              25,
  firstComment:           25,
  firstMessage:           50,
  firstBooking:           150,
  sessionCompleted:       200,
  expertVerified:         300,
  followers10:            100,
  followers50:            200,
  followers100:           350,
  posts10:                200,
  posts25:                350,
  events1:                100,
  circles1:               75,
  dietitianVerified:      300,
};

// Level thresholds (total XP needed to reach that level)
const LEVEL_XP_THRESHOLDS = [
  0,    // Level 1
  150,  // Level 2
  350,  // Level 3
  600,  // Level 4
  950,  // Level 5
  1400, // Level 6
  2000, // Level 7
  2800, // Level 8
  3800, // Level 9
  5000, // Level 10
];

const LEVEL_TITLES = [
  'Newcomer',
  'Explorer',
  'Seeker',
  'Connector',
  'Achiever',
  'Mentor',
  'Expert',
  'Leader',
  'Champion',
  'Legend',
];

const LEVEL_COLORS = [
  { color: '#94a3b8', gradientCss: 'linear-gradient(135deg, #94a3b8, #64748b)' }, // slate
  { color: '#60a5fa', gradientCss: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }, // blue
  { color: '#34d399', gradientCss: 'linear-gradient(135deg, #34d399, #10b981)' }, // emerald
  { color: '#a78bfa', gradientCss: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }, // violet
  { color: '#fb923c', gradientCss: 'linear-gradient(135deg, #fb923c, #ea580c)' }, // orange
  { color: '#f472b6', gradientCss: 'linear-gradient(135deg, #f472b6, #ec4899)' }, // pink
  { color: '#38bdf8', gradientCss: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }, // sky
  { color: '#fbbf24', gradientCss: 'linear-gradient(135deg, #fbbf24, #d97706)' }, // amber
  { color: '#f87171', gradientCss: 'linear-gradient(135deg, #f87171, #dc2626)' }, // red
  { color: '#c084fc', gradientCss: 'linear-gradient(135deg, #c084fc, #7c3aed, #f472b6)' }, // legendary
];

/** Calculate total XP from user data fields */
export function calculateUserXP(userData: any): number {
  if (!userData) return 0;
  let xp = XP_MILESTONES.accountCreated;

  if (userData.onboardingCompleted) xp += XP_MILESTONES.onboardingCompleted;
  if (userData.photoURL) xp += XP_MILESTONES.profilePhotoUploaded;
  if (userData.bio && userData.bio.length > 20) xp += XP_MILESTONES.bioCompleted;

  // Posts
  const posts = Number(userData.postsCount || 0);
  if (posts >= 1) xp += XP_MILESTONES.firstPost;
  if (posts >= 10) xp += XP_MILESTONES.posts10;
  if (posts >= 25) xp += XP_MILESTONES.posts25;

  // Followers
  const followers = Number(userData.followersCount || 0);
  if (followers >= 10) xp += XP_MILESTONES.followers10;
  if (followers >= 50) xp += XP_MILESTONES.followers50;
  if (followers >= 100) xp += XP_MILESTONES.followers100;

  // Expert / dietitian verified
  const role = (userData.role || '').toLowerCase();
  const primaryRole = (userData.primaryRole || '').toLowerCase();
  if (['specialist', 'admin', 'practitioner', 'verifiedexpert'].includes(role)) {
    xp += XP_MILESTONES.expertVerified;
  }
  if (primaryRole.includes('dietitian') || role.includes('dietitian')) {
    xp += XP_MILESTONES.dietitianVerified;
  }

  // Bookings, circle, events
  if (userData.bookingsCount && userData.bookingsCount >= 1) xp += XP_MILESTONES.firstBooking;
  if (userData.sessionsCompleted && userData.sessionsCompleted >= 1) xp += XP_MILESTONES.sessionCompleted;
  if (userData.circlesJoined && userData.circlesJoined >= 1) xp += XP_MILESTONES.circles1;
  if (userData.eventsAttended && userData.eventsAttended >= 1) xp += XP_MILESTONES.events1;

  return xp;
}

/** Get level info from XP value */
export function getLevelFromXP(xp: number): LevelInfo {
  let level = 1;
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const currentThreshold = LEVEL_XP_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_XP_THRESHOLDS[Math.min(level, LEVEL_XP_THRESHOLDS.length - 1)];
  const progressInLevel = xp - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  const progressPercent = level >= 10 ? 100 : Math.min(100, Math.round((progressInLevel / levelRange) * 100));

  const colorInfo = LEVEL_COLORS[Math.min(level - 1, LEVEL_COLORS.length - 1)];

  return {
    level,
    xp,
    xpForNextLevel: level >= 10 ? xp : nextThreshold,
    progressPercent,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    color: colorInfo.color,
    gradientCss: colorInfo.gradientCss,
  };
}

/** Convenience: compute level info directly from userData */
export function getUserLevel(userData: any): LevelInfo {
  const xp = calculateUserXP(userData);
  return getLevelFromXP(xp);
}

/** Check if user is a specialist (any variant) */
export function isSpecialist(userData: any): boolean {
  if (!userData) return false;
  const role = (userData.role || '').toLowerCase();
  const primary = (userData.primaryRole || '').toLowerCase();
  const specialty = (userData.specialty || '').toLowerCase();
  return (
    role.includes('specialist') ||
    role.includes('expert') ||
    primary.includes('specialist') ||
    primary.includes('expert') ||
    specialty.includes('specialist') ||
    specialty.includes('expert') ||
    specialty.includes('healing') ||
    userData.specialistApplication === 'approved' ||
    ['specialist', 'expert', 'case_manager', 'admin', 'verifiedexpert'].includes(role)
  );
}
