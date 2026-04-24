import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MapPin, Link as LinkIcon, Calendar, MoreHorizontal,
  MessageSquare, CheckCircle2, Share2, Phone,
  Instagram, Linkedin, Youtube, Globe,
  Facebook, Music, Mail, Twitter, Camera, Loader2, Plus, X, Award, Video
} from 'lucide-react';
import { GlassButton } from '../GlassButton';
import { ContactInfoModal } from '../ContactInfoModal';
import { StoryViewer, StoryUploadModal, Story } from './StoryBar';

/* ─── Image resizer (same util as ProfileSettings) ──────────────────────────── */
function resizeImageToBase64(file: File, maxSize: number, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (evt) => {
      const img = new Image();
      img.src = evt.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = Math.round(height * (maxSize / width)); width = maxSize; }
        } else {
          if (height > maxSize) { width = Math.round(width * (maxSize / height)); height = maxSize; }
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/* ─── WhatsApp SVG (not in lucide) ─────────────────────────────────────────── */
function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ─── Props ─────────────────────────────────────────────────────────────────── */
interface ProfileHeaderProps {
  displayName: string;
  username?: string;
  bio?: string;
  avatarImage?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  joinedDate?: string;
  isVerified?: boolean;
  isOwnProfile?: boolean;
  onEditClick?: () => void;
  onMessageClick?: () => void;
  onFollowClick?: () => void;
  isFollowing?: boolean;
  /** Called with a File object after the owner uploads a new avatar */
  onAvatarChange?: (file: File) => void;
  /** Called with a File object after the owner uploads a new cover photo */
  onCoverChange?: (file: File) => void;
  /** Full user data object — used for social links */
  userData?: any;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onBookClick?: () => void;
  isExpert?: boolean;
  profileViews?: string;
  connections?: string;
  activeStories?: Story[];
  onShowResume?: () => void;
}

/* ─── Social icon definitions ───────────────────────────────────────────────── */
function buildSocialIcons(userData: any) {
  if (!userData) return [];
  return [
    {
      key: 'whatsapp',
      Icon: WhatsAppIcon,
      label: 'WhatsApp',
      color: '#25D366',
      href: userData.whatsapp
        ? `https://wa.me/${String(userData.whatsapp).replace(/\D/g, '')}`
        : null,
    },
    {
      key: 'linkedin',
      Icon: Linkedin,
      label: 'LinkedIn',
      color: '#0A66C2',
      href: userData.linkedin
        ? userData.linkedin.startsWith('http') ? userData.linkedin : `https://linkedin.com/in/${userData.linkedin}`
        : null,
    },
    {
      key: 'instagram',
      Icon: Instagram,
      label: 'Instagram',
      color: '#E1306C',
      href: userData.instagram
        ? `https://instagram.com/${userData.instagram.replace('@', '')}`
        : null,
    },
    {
      key: 'twitter',
      Icon: Twitter,
      label: 'X / Twitter',
      color: '#000000',
      href: userData.twitter
        ? `https://twitter.com/${userData.twitter.replace('@', '')}`
        : null,
    },
    {
      key: 'facebook',
      Icon: Facebook,
      label: 'Facebook',
      color: '#1877F2',
      href: userData.facebook
        ? userData.facebook.startsWith('http') ? userData.facebook : `https://facebook.com/${userData.facebook}`
        : null,
    },
    {
      key: 'tiktok',
      Icon: Music,
      label: 'TikTok',
      color: '#010101',
      href: userData.tiktok
        ? `https://tiktok.com/@${userData.tiktok.replace('@', '')}`
        : null,
    },
    {
      key: 'youtube',
      Icon: Youtube,
      label: 'YouTube',
      color: '#FF0000',
      href: userData.youtube
        ? userData.youtube.startsWith('http') ? userData.youtube : `https://youtube.com/@${userData.youtube}`
        : null,
    },
    {
      key: 'website',
      Icon: Globe,
      label: 'Website',
      color: '#6366f1',
      href: userData.website
        ? userData.website.startsWith('http') ? userData.website : `https://${userData.website}`
        : null,
    },
    {
      key: 'phone',
      Icon: Phone,
      label: 'Phone',
      color: '#3b82f6',
      href: userData.phone ? `tel:${userData.phone}` : null,
    },
    {
      key: 'email',
      Icon: Mail,
      label: 'Email',
      color: '#004e99',
      href: userData.email ? `mailto:${userData.email}` : null,
    },
  ].filter(s => s.href);
}

/* ─── Component ─────────────────────────────────────────────────────────────── */
export function ProfileHeader({
  displayName,
  bio,
  avatarImage,
  coverImage,
  location,
  website,
  joinedDate,
  isVerified,
  isOwnProfile,
  onEditClick,
  onMessageClick,
  onFollowClick,
  isFollowing,
  onAvatarChange,
  onCoverChange,
  userData,
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
  onFollowersClick,
  onFollowingClick,
  onBookClick,
  isExpert: propIsExpert,
  profileViews = "1.2k",
  connections = "842",
  activeStories = [],
  onShowResume,
}: ProfileHeaderProps) {
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied]           = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover,  setUploadingCover]  = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [localCover,  setLocalCover]  = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);

  const rawRole = (userData?.role || '').toLowerCase();
  const rawBio = (bio || '').toLowerCase();
  const isExpert = propIsExpert ||
    ['founder', 'specialist', 'expert', 'case_manager', 'practitioner', 'management', 'editor', 'verified', 'mentor', 'architect', 'curator', 'architectural', 'therapist', 'coach', 'admin'].some(r => rawRole.includes(r)) || 
    ['professional', 'practice', 'clinical', 'architectural', 'expert'].some(r => rawBio.includes(r)) ||
    userData?.userType === 'expert' || 
    !!userData?.isExpert ||
    !!userData?.isVerifiedExpert || 
    !!userData?.isSpecialist ||
    (userData?.verificationStatus === 'approved');

  // Dynamic role badge — derived from actual user data
  const roleBadge = (() => {
    if (userData?.verificationStatus === 'approved' || userData?.isSpecialist || userData?.isVerifiedExpert) {
      return { label: 'Verified Expert', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' };
    }
    if (['specialist', 'expert', 'practitioner', 'therapist', 'coach', 'mentor'].some(r => rawRole.includes(r))) {
      return { label: 'Specialist', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' };
    }
    if (['admin', 'founder', 'management'].some(r => rawRole.includes(r))) {
      return { label: 'Staff', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20' };
    }
    return { label: 'Member', color: 'text-on-surface-variant bg-surface border border-border-light' };
  })();

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setLocalAvatar(previewUrl);
      onAvatarChange?.(file);
    } catch { 
      toast.error('Failed to update avatar'); 
    } finally { 
      setUploadingAvatar(false); 
      e.target.value = ''; 
    }
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setLocalCover(previewUrl);
      onCoverChange?.(file);
    } catch {
      toast.error('Failed to update cover photo');
    } finally { 
      setUploadingCover(false); 
      e.target.value = ''; 
    }
  };

  const displayAvatar = localAvatar || avatarImage;
  const displayCover  = localCover  || coverImage;

  const socialIcons = buildSocialIcons(userData);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: displayName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const hasActiveStories = activeStories.length > 0;
  
  const handleAvatarClick = () => {
    if (hasActiveStories) {
      setViewerOpen(true);
    } else if (isOwnProfile) {
      setUploadModalOpen(true);
    } else if (displayAvatar) {
      // For others, if no stories, show the photo bigger
      setSelectedFullImage(displayAvatar);
    }
  };

  return (
    <>
      <div className="bento-card overflow-hidden border border-border-light shadow-sm bg-surface dark:bg-surface group/header">

        {/* ── Cover Image ─────────────────────────────────────────────────── */}
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-bg-main">
          <img
            src={displayCover || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80'}
            alt="Cover"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover/header:scale-105 cursor-zoom-in"
            onClick={() => setSelectedFullImage(displayCover || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')}
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-surface to-transparent" />

          {isOwnProfile && (
            <>
              {/* Hidden file input for cover */}
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleCoverFile}
                disabled={uploadingCover}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute top-6 inset-e-6 flex items-center gap-2 px-4 py-2.5 bg-surface/80 backdrop-blur-md rounded-xl border border-border-light text-on-surface-variant hover:bg-surface hover:scale-110 transition-all shadow-xl text-xs font-black uppercase tracking-widest"
              >
                {uploadingCover
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Camera className="w-4 h-4" />}
                {uploadingCover ? 'Uploading…' : 'Change Cover'}
              </button>
            </>
          )}
        </div>

        {/* ── Profile Info ─────────────────────────────────────────────────── */}
        <div className="px-6 sm:px-10 pb-10">
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between -mt-20 sm:-mt-24 gap-6">

            {/* Avatar */}
            <div className="relative inline-block group/avatar cursor-pointer" onClick={handleAvatarClick}>
              <div className={`size-32 sm:size-44 rounded-[42px] p-1.5 transition-all duration-700 transform group-hover/header:rotate-2 ${
                hasActiveStories 
                  ? 'bg-linear-to-tr from-[#136dec] via-[#8b5cf6] to-[#ec4899] animate-gradient-xy shadow-xl shadow-primary/20' 
                  : 'bg-surface dark:bg-zinc-800 border border-border-light shadow-2xl'
              }`}>
                <div className="w-full h-full rounded-[34px] bg-bg-main overflow-hidden p-0.5">
                  <img
                    src={displayAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-[32px] transition-transform duration-700 group-hover/avatar:scale-110"
                  />
                </div>
              </div>
              
              {isOwnProfile && !hasActiveStories && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 bg-black/40 backdrop-blur-md size-16 rounded-full flex items-center justify-center text-white border border-white/20">
                  <Plus className="size-8" />
                </div>
              )}

              {isVerified && (
                <div className="absolute bottom-4 right-4 bg-primary text-white p-1.5 rounded-xl border-4 border-surface shadow-xl z-10 transition-transform hover:scale-110">
                  <CheckCircle2 className="w-4 h-4 fill-primary" />
                </div>
              )}
            </div>
            
            {/* Modal components at end of return */}
            {viewerOpen && (
              <StoryViewer
                groups={[{ uid: userData?.uid, displayName, photoURL: avatarImage, stories: activeStories }]}
                initialGroupIdx={0}
                currentUserId={userData?.uid}
                onClose={() => setViewerOpen(false)}
              />
            )}

            {uploadModalOpen && isOwnProfile && (
              <StoryUploadModal
                user={userData}
                currentUserId={userData?.uid}
                onClose={() => setUploadModalOpen(false)}
                onSuccess={() => {
                  setUploadModalOpen(false);
                  window.location.reload(); // Simple way to refresh status
                }}
              />
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pb-2">
              {isOwnProfile ? (
                <>
                  <GlassButton
                    onClick={() => setUploadModalOpen(true)}
                    variant="colorful"
                    className="px-8! py-3! rounded-2xl! font-black uppercase tracking-widest text-xs"
                    style={{ background: 'linear-gradient(135deg, #136dec, #8b5cf6)' }}
                  >
                    <Plus className="w-4 h-4 me-2" />
                    BROADCAST STATUS
                  </GlassButton>
                  <GlassButton
                    onClick={() => navigate('/therapy-room')}
                    variant="colorful"
                    className="px-8! py-3! rounded-2xl! font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 scale-105"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' }}
                  >
                    <Video className="w-4 h-4 me-2" />
                    Launch Clinical Sanctuary
                  </GlassButton>
                  <GlassButton
                    onClick={onEditClick}
                    variant="light"
                    className="px-8! py-3! rounded-2xl! font-black uppercase tracking-widest text-xs"
                  >
                    Edit Studio
                  </GlassButton>
                  <button
                    onClick={handleShare}
                    title={copied ? 'Copied!' : 'Share profile'}
                    className="p-3 bg-bg-main rounded-2xl border border-border-light text-on-surface hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-3 bg-bg-main rounded-2xl border border-border-light text-on-surface hover:bg-white transition-all shadow-sm">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  {userData?.role === 'specialist' && (
                    <GlassButton
                      onClick={() => {
                        const roomId = `URK-${(userData.uid || '0000').slice(-4).toUpperCase()}-XZ`;
                        window.location.href = `/conference/${roomId}`;
                      }}
                      variant="colorful"
                      className="px-6! py-3! rounded-2xl! font-black uppercase tracking-widest text-xs"
                      style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}
                    >
                      <Phone className="w-4 h-4 me-2" />
                      INSTANT CALL
                    </GlassButton>
                  )}
                  <GlassButton
                    onClick={onFollowClick}
                    variant={isFollowing ? 'light' : 'colorful'}
                    className="px-8! py-3! rounded-2xl! font-black uppercase tracking-widest text-xs"
                  >
                    {isFollowing ? 'CONNECTED' : 'CONNECT'}
                  </GlassButton>
                  <GlassButton
                    onClick={onMessageClick}
                    variant="light"
                    className="px-6! py-3! rounded-2xl! font-black uppercase tracking-widest text-xs"
                  >
                    <MessageSquare className="w-4 h-4 me-2" />
                    MESSAGE
                  </GlassButton>
                  {isExpert && (
                    <GlassButton
                      onClick={() => {
                        console.log('Book Clicked');
                        onBookClick();
                      }}
                      variant="colorful"
                      className="px-6! py-3! rounded-2xl! font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 scale-105"
                      style={{ background: 'linear-gradient(135deg, #136dec, #8b5cf6)', opacity: 1, visibility: 'visible' }}
                    >
                      <Calendar className="w-4 h-4 me-2" />
                      BOOK APPOINTMENT
                    </GlassButton>
                  )}
                  {isExpert && onShowResume && (
                    <GlassButton
                      onClick={onShowResume}
                      variant="colorful"
                      className="px-6! py-3! rounded-2xl! font-black uppercase tracking-widest text-xs"
                      style={{ background: 'linear-gradient(135deg, #a8c8ff, #0a66c2)', color: '#fff' }}
                    >
                      <Award className="w-4 h-4 me-2" />
                      SHOW MY RESUME
                    </GlassButton>
                  )}
                  {/* Contact / Social button */}
                  <button
                    onClick={() => setContactOpen(true)}
                    title="Contact Info & Social Links"
                    className="p-3 bg-bg-main rounded-2xl border border-border-light text-on-surface hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-sm"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleShare}
                    title={copied ? 'Copied!' : 'Share profile'}
                    className="p-3 bg-bg-main rounded-2xl border border-border-light text-on-surface hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-3 bg-bg-main rounded-2xl border border-border-light text-on-surface hover:bg-white transition-all shadow-sm">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Name / Bio / Meta ─────────────────────────────────────────── */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <h1 className="text-3xl sm:text-4xl font-headline font-black text-on-surface mb-2 flex items-center gap-3 flex-wrap">
                {displayName}
                <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-lg tracking-widest uppercase align-middle ${roleBadge.color}`}>
                  {(userData?.verificationStatus === 'approved' || userData?.isSpecialist) && (
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fillRule="evenodd" clipRule="evenodd" /></svg>
                  )}
                  {roleBadge.label}
                </span>
              </h1>
              <p className="text-base text-on-surface-variant font-semibold tracking-tight max-w-2xl leading-relaxed">
                {bio || 'Curating professional experiences and editorial excellence at the intersection of design and technology.'}
              </p>

            {/* Stats Row (Moved here) */}
              <div className="flex flex-wrap gap-4 mt-8">
                <div 
                  className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-border-light shadow-sm group transition-all hover:scale-105"
                >
                  <span className="text-xs font-black text-white bg-linear-to-tr from-blue-600 to-primary px-3 py-1.5 rounded-lg shadow-md">{profileViews}</span>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">
                    Profile Views
                  </p>
                </div>
                <div 
                  className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-border-light shadow-sm group transition-all hover:scale-105"
                >
                  <span className="text-xs font-black text-white bg-linear-to-tr from-purple-600 to-accent px-3 py-1.5 rounded-lg shadow-md">{connections}</span>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">
                    Connections
                  </p>
                </div>
                <div 
                  className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-border-light shadow-sm group transition-all hover:scale-105"
                >
                  <span className="text-xs font-black text-on-surface bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">{postsCount}</span>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">
                    Posts
                  </p>
                </div>
                <div 
                  onClick={onFollowersClick}
                  className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-border-light shadow-sm group cursor-pointer transition-all hover:scale-105"
                >
                  <span className="text-xs font-black text-white bg-emerald-500 px-3 py-1.5 rounded-lg shadow-md">{followersCount}</span>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none group-hover:text-primary transition-colors">
                    Followers
                  </p>
                </div>
                <div 
                  onClick={onFollowingClick}
                  className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-border-light shadow-sm group cursor-pointer transition-all hover:scale-105"
                >
                  <span className="text-xs font-black text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 rounded-lg shadow-md">{followingCount}</span>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none group-hover:text-purple-500 transition-colors">
                    Following
                  </p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 text-sm font-bold text-on-surface-variant/80 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {location || 'Global Editor'}
                </div>
                {website && (
                  <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Website
                  </a>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  {joinedDate || 'Joined 2023'}
                </div>
              </div>

              {/* ── Social Icons Row ────────────────────────────────────────── */}
              {socialIcons.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  {socialIcons.map(({ key, Icon, label, color, href }) => (
                    <a
                      key={key}
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={label}
                      className="group relative size-10 rounded-2xl flex items-center justify-center border border-border-light bg-bg-main hover:scale-110 hover:border-transparent hover:shadow-lg transition-all duration-200"
                      style={{ '--icon-color': color } as React.CSSProperties}
                    >
                      <Icon
                        className="w-5 h-5 text-on-surface-variant group-hover:text-white transition-colors"
                        style={{ color: 'inherit' }}
                      />
                      {/* colour fill on hover via inline style overlay */}
                      <span
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"
                        style={{ backgroundColor: color }}
                      />
                      {/* Tooltip */}
                      <span className="absolute -top-8 inset-s-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {label}
                      </span>
                    </a>
                  ))}

                  {/* "View All" opens ContactInfoModal */}
                  {!isOwnProfile && (
                    <button
                      onClick={() => setContactOpen(true)}
                      className="h-10 px-4 rounded-2xl bg-bg-main border border-border-light text-[11px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      All Contacts
                    </button>
                  )}
                </div>
              )}

              {/* Show contact button even if no social icons set (guest profile) */}
              {socialIcons.length === 0 && !isOwnProfile && (
                <button
                  onClick={() => setContactOpen(true)}
                  className="mt-6 flex items-center gap-2 h-10 px-5 rounded-2xl bg-bg-main border border-border-light text-[11px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all"
                >
                  <Phone className="w-4 h-4" /> Contact Info
                </button>
              )}
            </div>

            <div className="lg:col-span-4 flex flex-col justify-center">
              {/* Stats moved to name section */}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contact Info Modal ──────────────────────────────────────────────── */}
      <ContactInfoModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        userData={userData || { displayName }}
      />

      {/* ── Fullscreen Image Viewer ─────────────────────────────────────── */}
      {selectedFullImage && (
        <div 
          className="fixed inset-0 z-200 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedFullImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90 group"
            onClick={(e) => { e.stopPropagation(); setSelectedFullImage(null); }}
          >
            <X className="w-8 h-8 group-hover:scale-110" />
          </button>
          
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedFullImage} 
              alt="Viewing Full Image"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500"
            />
            
            <div className="absolute -bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-white font-medium shadow-xl">
              <span className="truncate max-w-[150px]">{displayName}</span>
              <div className="w-px h-4 bg-white/20" />
              <a 
                href={selectedFullImage} 
                download
                className="flex items-center gap-2 hover:text-primary transition-all hover:scale-105"
                onClick={e => e.stopPropagation()}
                title="Download Image"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">Save</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
