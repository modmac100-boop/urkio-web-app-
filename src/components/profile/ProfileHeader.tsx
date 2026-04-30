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
  /** Triggered when visitor clicks video/audio call buttons on expert profiles */
  onVideoCallClick?: () => void;
  onAudioCallClick?: () => void;
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
      color: 'var(--msgr-primary)',
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
  onVideoCallClick,
  onAudioCallClick,
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
      <div className="rounded-xl overflow-hidden shadow-[0px_10px_30px_rgba(27,77,75,0.05)] bg-surface-container group/header">
        {/* ── Cover Image ─────────────────────────────────────────────────── */}
        <div className="aspect-21/9 md:aspect-16/6 relative bg-bg-main">
          <img
            src={displayCover || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80'}
            alt="Cover"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover/header:scale-105 cursor-zoom-in"
            onClick={() => setSelectedFullImage(displayCover || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>

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
                className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-white/20 text-on-surface-variant hover:bg-white transition-all shadow-md text-[10px] font-bold uppercase tracking-wider"
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
        <div className="px-6 pb-6 relative">
          
          {/* Avatar & Identity */}
          <div className="flex flex-col md:flex-row md:items-end -mt-12 md:-mt-16 gap-4 mb-6">
            <div className="relative inline-block cursor-pointer group/avatar" onClick={handleAvatarClick}>
              <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-surface bg-surface overflow-hidden shadow-lg transition-transform duration-700 group-hover/avatar:scale-105 ${hasActiveStories ? 'ring-4 ring-primary ring-offset-2 ring-offset-surface' : ''}`}>
                <img
                  src={displayAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-1 right-1 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {roleBadge.label}
              </div>
              
              {isOwnProfile && !hasActiveStories && (
                <div className="absolute inset-0 m-auto opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 bg-black/40 backdrop-blur-sm size-12 rounded-full flex items-center justify-center text-white">
                  <Plus className="w-6 h-6" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-headline-md text-on-background leading-tight text-3xl md:text-4xl truncate">{displayName}</h1>
                {isVerified && <CheckCircle2 className="size-6 text-primary shrink-0" fill="currentColor" />}
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant font-label-sm mt-1">
                <MapPin className="w-4 h-4" />
                {location || 'Global Network'}
                {website && (
                  <>
                    <span className="mx-2 text-outline-variant">•</span>
                    <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> Website
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {isOwnProfile ? (
                <>
                  <button onClick={() => setUploadModalOpen(true)} className="px-4 py-2 bg-primary text-on-primary rounded-full font-label-md hover:opacity-90 transition-opacity text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Broadcast
                  </button>
                  <button onClick={() => navigate('/therapy-room')} className="px-4 py-2 border border-primary text-primary rounded-full font-label-md hover:bg-primary/5 transition-colors text-sm flex items-center gap-2">
                    <Video className="w-4 h-4" /> Studio
                  </button>
                  <button onClick={onEditClick} className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-full font-label-md hover:bg-surface transition-colors text-sm">
                    Edit Profile
                  </button>
                  <button onClick={handleShare} className="p-2 border border-outline-variant text-on-surface-variant rounded-full hover:bg-surface transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={onFollowClick} className={`px-6 py-2 rounded-full font-label-md transition-colors text-sm ${isFollowing ? 'border border-primary text-primary hover:bg-primary/5' : 'bg-primary text-on-primary hover:opacity-90'}`}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button onClick={onMessageClick} className="px-6 py-2 border border-primary text-primary rounded-full font-label-md hover:bg-primary/5 transition-colors text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                  {isExpert && onVideoCallClick && (
                    <button onClick={onVideoCallClick} className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-md hover:bg-secondary-container/80 transition-colors text-sm flex items-center gap-2">
                      <Video className="w-4 h-4" /> Call
                    </button>
                  )}
                  {isExpert && onBookClick && (
                    <button onClick={onBookClick} className="px-4 py-2 bg-primary text-on-primary rounded-full font-label-md hover:opacity-90 transition-opacity text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Book
                    </button>
                  )}
                  <button onClick={() => setContactOpen(true)} className="p-2 border border-outline-variant text-on-surface-variant rounded-full hover:bg-surface transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button onClick={handleShare} className="p-2 border border-outline-variant text-on-surface-variant rounded-full hover:bg-surface transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-outline-variant/30">
            <div className="text-center md:text-left cursor-pointer hover:bg-surface-container-highest/50 rounded-lg p-2 transition-colors" onClick={onFollowersClick}>
              <p className="font-headline-sm text-primary">{followersCount}</p>
              <p className="font-label-sm text-on-surface-variant">Followers</p>
            </div>
            <div className="text-center md:text-left cursor-pointer hover:bg-surface-container-highest/50 rounded-lg p-2 transition-colors" onClick={onFollowingClick}>
              <p className="font-headline-sm text-primary">{followingCount}</p>
              <p className="font-label-sm text-on-surface-variant">Following</p>
            </div>
            <div className="text-center md:text-left">
              <p className="font-headline-sm text-primary">{postsCount}</p>
              <p className="font-label-sm text-on-surface-variant">Posts & Highlights</p>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1">
                <p className="font-headline-sm text-primary">{isExpert ? 'Expert' : '4'}</p>
                <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <p className="font-label-sm text-on-surface-variant">{isExpert ? 'Status Level' : 'Journeyer Level'}</p>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-6 max-w-2xl">
            <p className="font-body-lg text-on-surface mb-4">
              {bio || 'Seeking harmony between professional ambition and internal stillness.'}
            </p>
            {socialIcons.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {socialIcons.map(({ key, Icon, label, color, href }) => (
                  <a key={key} href={href!} target="_blank" rel="noopener noreferrer" title={label} className="p-2 bg-surface-container-highest text-on-surface-variant rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm">#Growth</span>
              <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm">#Network</span>
              {isExpert && <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm">#Expert</span>}
            </div>
          </div>
        </div>
      </div>

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
            window.location.reload(); 
          }}
        />
      )}

      <ContactInfoModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        userData={userData || { displayName }}
      />

      {/* Fullscreen Image Viewer */}
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
