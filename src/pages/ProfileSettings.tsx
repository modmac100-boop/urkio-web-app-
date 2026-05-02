import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import {
  User, Globe, Save, Loader2, Camera,
  DollarSign, ArrowLeft, Phone, Mail,
  Instagram, Linkedin, Youtube, Twitter,
  Facebook, Music /* TikTok substitute */, Trash2
} from 'lucide-react';
import { ProfileLayout } from '../components/ProfileLayout';
import { GlassButton } from '../components/GlassButton';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

/* ─── WhatsApp inline SVG ───────────────────────────────────────────────────── */
function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* ─── Reusable Field ─────────────────────────────────────────────────────────── */
function Field({
  label,
  prefix,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  Icon,
  color,
  hint,
}: {
  label: string;
  prefix?: string;
  name: string;
  value: string;
  onChange: (e: any) => void;
  placeholder: string;
  type?: string;
  Icon?: React.ElementType;
  color?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 px-1">
        {Icon && <Icon style={{ color }} className="w-4 h-4" />}
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute inset-s-4 top-1/2 -translate-y-1/2 font-black text-on-surface-variant/50 text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx(
            'w-full bg-bg-main/60 border border-border-light rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:border-primary/40 transition-all placeholder:text-on-surface-variant/30',
            prefix ? 'ps-9' : ''
          )}
        />
      </div>
      {hint && <p className="text-[10px] text-on-surface-variant/50 px-2">{hint}</p>}
    </div>
  );
}

/* ─── Image resizer util ─────────────────────────────────────────────────────── */
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
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export function ProfileSettings({
  user,
  userData,
  onUserDataChange,
}: {
  user: any;
  userData: any;
  onUserDataChange?: (updated: any) => void;
}) {
  const navigate = useNavigate();
  const isExpert = ['specialist', 'expert', 'case_manager', 'admin', 'management', 'manager', 'verifiedexpert', 'practitioner'].includes(userData?.role?.toLowerCase() || '');

  const [saving, setSaving]             = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover]   = useState(false);

  // Local preview states so UI updates immediately without waiting for parent re-render
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview]   = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    specialty: '',
    website: '',
    phone: '',
    email: '',
    whatsapp: '',
    instagram: '',
    twitter: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
    hourlyRate: '',
    isOnline: false,
    privateProfile: false,
    hubName: '',
    accentColor: '#004e99',
    vaultPin: '1111',
    autoAcceptBookings: false,
  });


  const [hubDataLoaded, setHubDataLoaded] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        bio: userData.bio || '',
        location: userData.location || '',
        specialty: userData.specialty || '',
        website: userData.website || '',
        phone: userData.phone || '',
        email: userData.email || user?.email || '',
        whatsapp: userData.whatsapp || '',
        instagram: userData.instagram || '',
        twitter: userData.twitter || '',
        facebook: userData.facebook || '',
        tiktok: userData.tiktok || '',
        youtube: userData.youtube || '',
        linkedin: userData.linkedin || '',
        hourlyRate: userData.hourlyRate || '',
        isOnline: userData.isOnline || false,
        privateProfile: userData.privateProfile || false,
        hubName: '',
        accentColor: '#004e99',
        vaultPin: '1111',
        autoAcceptBookings: false,
      });

      // Fetch specialist hub data if it exists
      if (isExpert && !hubDataLoaded) {
        import('firebase/firestore').then(({ doc, getDoc }) => {
          getDoc(doc(db, 'specialist_hubs', user.uid)).then((snap) => {
            if (snap.exists()) {
              const hubs = snap.data();
              setFormData(prev => ({
                ...prev,
                hubName: hubs.hubName || '',
                accentColor: hubs.branding?.accentColor || '#004e99',
                vaultPin: hubs.settings?.vaultPin || '1111',
                autoAcceptBookings: hubs.settings?.autoAcceptBookings || false,
              }));
            }
            setHubDataLoaded(true);
          });
        });
      }
    }
  }, [userData, user, isExpert]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
    setSuccess(false);
    setError(null);
  };

  /* ── Avatar upload ─────────────────────────────────────────────────────── */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      // Local preview
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      
      const uploadPromise = async () => {
        const storageRef = ref(storage, `users/${user.uid}/avatar_${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadUrl });
        if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: downloadUrl });
        
        onUserDataChange?.({ photoURL: downloadUrl });
        return downloadUrl;
      };

      toast.promise(uploadPromise(), {
        loading: 'Uploading profile photo...',
        success: 'Profile photo updated!',
        error: 'Failed to upload profile photo.'
      });

      await uploadPromise();
      setAvatarPreview(null); // Clear preview now that it's in DB
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  /* ── Cover photo upload ────────────────────────────────────────────────── */
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    setError(null);
    try {
      // Local preview
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);

      const uploadPromise = async () => {
        const storageRef = ref(storage, `users/${user.uid}/cover_${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        await updateDoc(doc(db, 'users', user.uid), { coverPhoto: downloadUrl });
        onUserDataChange?.({ coverPhoto: downloadUrl });
        return downloadUrl;
      };

      toast.promise(uploadPromise(), {
        loading: 'Uploading cover photo...',
        success: 'Cover photo updated!',
        error: 'Failed to upload cover photo.'
      });

      await uploadPromise();
      setCoverPreview(null);
    } catch (err: any) {
      console.error("Cover upload error:", err);
      setError('Failed to upload cover photo. Please try again.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  /* ── Submit ────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setSuccess(false); setError(null);
    try {
      const updateData: any = {
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        specialty: formData.specialty,
        website: formData.website,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
        twitter: formData.twitter,
        facebook: formData.facebook,
        tiktok: formData.tiktok,
        youtube: formData.youtube,
        linkedin: formData.linkedin,
        privateProfile: formData.privateProfile,
      };
      if (isExpert) {
        updateData.hourlyRate = formData.hourlyRate;
        updateData.isOnline   = formData.isOnline;
      }
      await updateDoc(doc(db, 'users', user.uid), updateData);

      // Update Specialist Hub settings if applicable
      if (isExpert) {
        await updateDoc(doc(db, 'specialist_hubs', user.uid), {
          hubName: formData.hubName,
          'branding.accentColor': formData.accentColor,
          'settings.vaultPin': formData.vaultPin,
          'settings.autoAcceptBookings': formData.autoAcceptBookings,
          updatedAt: serverTimestamp()
        });
      }

      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: formData.displayName });
      onUserDataChange?.(updateData); // ← sync global userData so Nav/Layout updates too
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      "Are you absolutely sure? This will deactivate your profile and remove you from all search results. You will be signed out immediately."
    );
    
    if (!confirmed) return;
    
    try {
      setSaving(true);
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        isDeleted: true,
        status: 'deactivated',
        deactivatedAt: serverTimestamp()
      });
      
      // Sign out
      await auth.signOut();
      
      toast.success("Account deactivated. We're sorry to see you go.");
      navigate('/');
    } catch (err: any) {
      console.error("Error deactivating account:", err);
      toast.error("Failed to deactivate account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // isExpert is declared at the top of the component

  // Resolve final avatar & cover to display (local preview takes priority)
  const currentAvatar = avatarPreview || userData?.photoURL || user?.photoURL
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || user?.email || 'U')}`;
  const currentCover = coverPreview || userData?.coverPhoto || null;

  return (
    <ProfileLayout
      userData={userData}
      isOwnProfile={true}
      sidebar={
        <div className="flex flex-col gap-6">
          {/* ── Avatar card ── */}
          <div className="bento-card border border-border-light p-8 bg-surface">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">Profile Photo</h3>
            <div className="relative group mx-auto size-36">
              <img
                src={currentAvatar}
                alt="Avatar"
                className="size-full rounded-4xl border-4 border-surface object-cover shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-4xl opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm"
              >
                {uploadingAvatar ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                  <><Camera className="w-8 h-8 mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Change Photo</span></>
                )}
              </label>
              <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            </div>
            <p className="text-[10px] text-center mt-6 font-bold text-on-surface-variant/50 uppercase tracking-widest">Recommended: 400×400 px</p>
          </div>

          {/* ── Cover photo card ── */}
          <div className="bento-card border border-border-light p-6 bg-surface">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Cover Photo</h3>
            <div className="relative group rounded-2xl overflow-hidden border border-border-light aspect-video bg-linear-to-br from-primary/20 to-accent/20">
              {currentCover
                ? <img src={currentCover} alt="Cover" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                    <span className="material-symbols-outlined text-4xl">image</span>
                  </div>
              }
              <div className="absolute top-0 inset-inline-0 h-48 bg-linear-to-br from-msgr-primary to-[#001c37] opacity-10 dark:opacity-40" />
              <label
                htmlFor="cover-upload"
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm"
              >
                {uploadingCover ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <><Camera className="w-6 h-6 mb-1" /><span className="text-[10px] font-black uppercase tracking-widest">Change Cover</span></>
                )}
              </label>
              <input type="file" id="cover-upload" accept="image/*" className="hidden" onChange={handleCoverChange} disabled={uploadingCover} />
            </div>
            <p className="text-[10px] text-center mt-3 font-bold text-on-surface-variant/50 uppercase tracking-widest">Recommended: 1200×400 px</p>
          </div>

          {/* Quick tips */}
          <div className="bento-card border border-border-light p-6 bg-primary/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">💡 Profile Tips</h3>
            <ul className="space-y-3 text-[11px] font-bold text-on-surface-variant">
              <li>✅ Add WhatsApp so users can message you directly</li>
              <li>✅ Instagram & TikTok links show on your public profile</li>
              <li>✅ A clear bio with your specialty gets 3× more views</li>
              <li>✅ Your phone is shown only in the Contact modal</li>
            </ul>
          </div>

          {/* Expert controls */}
          {isExpert && (
            <div className="bento-card border border-primary/20 p-8 bg-primary/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>Expert Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface/60 rounded-2xl border border-border-light">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">Visibility</p>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase">{formData.isOnline ? 'Online & Available' : 'Offline'}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="isOnline" checked={formData.isOnline} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:inset-s-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                  </label>
                </div>
                <div className="p-4 bg-surface/60 rounded-2xl border border-border-light">
                  <p className="text-xs font-black uppercase tracking-wider mb-2">Hourly Rate (USD)</p>
                  <div className="relative">
                    <DollarSign className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className="w-full ltr:pl-9 rtl:pr-9 bg-transparent border-none text-xl font-black text-primary p-0 focus:ring-0" placeholder="85" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(`/user/${user?.uid}`)}
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> View My Profile
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-24">

        {/* ── Identity & Bio ─────────────────────────────────────────────── */}
        <section className="bento-card border border-border-light p-8 bg-surface">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight">Identity & Bio</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Display Name" name="displayName" value={formData.displayName} onChange={handleChange} placeholder="Your full name" />
            <Field label="Location" name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" Icon={Globe} />
            {isExpert && (
              <div className="md:col-span-2">
                <Field label="Professional Specialty" name="specialty" value={formData.specialty} onChange={handleChange} placeholder="e.g. Trauma Specialist, Life Coach" />
              </div>
            )}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 px-1">Your Story (Bio)</label>
              <textarea
                name="bio" value={formData.bio} onChange={handleChange} rows={4}
                placeholder="Briefly describe your journey or mission..."
                className="w-full bg-bg-main/60 border border-border-light rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:border-primary/40 transition-all resize-none placeholder:text-on-surface-variant/30"
              />
            </div>
          </div>
        </section>

        {/* ── Contact Info ───────────────────────────────────────────────── */}
        <section className="bento-card border border-border-light p-8 bg-surface">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Contact Info</h2>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Shown in your Contact modal to visitors</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="WhatsApp Number" name="whatsapp" value={formData.whatsapp}
              Icon={WhatsAppIcon} color="#25D366"
              onChange={handleChange} placeholder="+1 555 000 0000"
              hint="Include country code. Visitors can tap to message you." />
            <Field label="Phone" name="phone" value={formData.phone}
              Icon={Phone} color="#3b82f6"
              onChange={handleChange} type="tel" placeholder="+1 555 000 0000" />
          </div>
        </section>

        {/* ── Social Presence ────────────────────────────────────────────── */}
        <section className="bento-card border border-border-light p-8 bg-surface">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Social Presence</h2>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Clickable icons appear on your public profile</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Instagram" name="instagram" value={formData.instagram}
              Icon={Instagram} color="#E1306C"
              onChange={handleChange} prefix="@" placeholder="username" />
            <Field label="Twitter / X" name="twitter" value={formData.twitter}
              Icon={Twitter} color="#000000"
              onChange={handleChange} prefix="@" placeholder="username" />
            <Field label="Facebook" name="facebook" value={formData.facebook}
              Icon={Facebook} color="#1877F2"
              onChange={handleChange} placeholder="https://facebook.com/..." />
            <Field label="TikTok" name="tiktok" value={formData.tiktok}
              Icon={Music} color="#010101"
              onChange={handleChange} prefix="@" placeholder="username" />
            <Field label="YouTube" name="youtube" value={formData.youtube}
              Icon={Youtube} color="#FF0000"
              onChange={handleChange} placeholder="https://youtube.com/@..." />
            <Field label="LinkedIn" name="linkedin" value={formData.linkedin}
              Icon={Linkedin} color="#0A66C2"
              onChange={handleChange} placeholder="https://linkedin.com/in/..." />
            <Field label="Website" name="website" value={formData.website}
              Icon={Globe} color="#6366f1"
              onChange={handleChange} type="url" placeholder="https://yoursite.com" />
          </div>
        </section>
        {/* ── Privacy & Security ─────────────────────────────────────────── */}
        <section className="bento-card border border-border-light p-8 bg-surface">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Privacy & Security</h2>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Control who can see your information</p>
            </div>
          </div>
          
          <div className="space-y-6">
             <div className="flex items-center justify-between p-6 bg-orange-50/50 dark:bg-orange-500/5 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                <div className="max-w-md">
                   <p className="text-sm font-black uppercase tracking-wide text-orange-700 dark:text-orange-400">Hide Profile from Public Hub</p>
                   <p className="text-[11px] text-orange-600/70 dark:text-orange-400/60 font-bold mt-1">When enabled, your profile will not appear in the Specialist Hub or search results for other users.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="privateProfile" checked={formData.privateProfile} onChange={handleChange} className="sr-only peer" />
                  <div className="w-14 h-7 bg-orange-200 dark:bg-orange-900/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500 shadow-sm" />
                </label>
             </div>
          </div>
        </section>

        {/* ── Danger Zone ────────────────────────────────────────────────── */}
        <section className="bento-card border border-red-200 dark:border-red-900/30 p-8 bg-red-50/10 dark:bg-red-900/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-red-600 dark:text-red-400">Danger Zone</h2>
              <p className="text-[10px] font-bold text-red-600/60 dark:text-red-400/60 uppercase tracking-widest">Irreversible account actions</p>
            </div>
          </div>
          
          <div className="p-6 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-md text-center md:text-start">
              <p className="text-sm font-black uppercase tracking-wide text-red-700 dark:text-red-400">Deactivate My Account</p>
              <p className="text-[11px] text-red-600/70 dark:text-red-400/60 font-bold mt-1">
                This will hide your profile from all discovery tools and public hub. You will be signed out and your account will be marked as deactivated. This action is irreversible.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={saving}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              Delete My Account
            </button>
          </div>
        </section>

        {/* ── Expert Hub & Practice ──────────────────────────────────────── */}
        {isExpert && (
          <section className="bento-card border border-blue-200 dark:border-blue-900/30 p-8 bg-blue-50/10 dark:bg-blue-900/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Expert Hub & Practice</h2>
                <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Configure your clinical environment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field 
                label="Hub Name" name="hubName" 
                value={formData.hubName} onChange={handleChange} 
                placeholder="e.g. Dr. Smith's Wellness Center" 
              />
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 px-1">
                  Hub Accent Color
                </label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" name="accentColor" 
                    value={formData.accentColor} onChange={handleChange}
                    className="size-12 rounded-xl border-2 border-white dark:border-slate-800 shadow-sm cursor-pointer"
                  />
                  <span className="text-xs font-bold font-mono uppercase text-on-surface-variant/60">{formData.accentColor}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 px-1">
                  Practice Vault PIN
                </label>
                <input 
                  type="password" name="vaultPin" maxLength={4}
                  value={formData.vaultPin} onChange={handleChange}
                  className="w-full bg-bg-main/60 border border-border-light rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:border-primary/40 transition-all text-center tracking-[1em]"
                  placeholder="1111"
                />
                <p className="text-[10px] text-on-surface-variant/50 px-2 mt-1">4-digit security code for confidential reports</p>
              </div>

              <div className="flex items-center justify-between p-6 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-border-light self-end">
                <div>
                   <p className="text-xs font-black uppercase tracking-wide">Auto-Accept Bookings</p>
                   <p className="text-[10px] text-on-surface-variant/60 font-bold mt-1">Automatically confirm all incoming session requests.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="autoAcceptBookings" checked={formData.autoAcceptBookings} onChange={handleChange} className="sr-only peer" />
                  <div className="w-14 h-7 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-sm" />
                </label>
              </div>
            </div>
          </section>
        )}

        {/* ── Save ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-primary/5 rounded-5xl border border-primary/20 border-dashed">
          <div>
            <p className="text-sm font-bold">Unsaved Changes</p>
            <p className="text-xs text-on-surface-variant/60 font-medium">Your profile is not automatically saved.</p>
          </div>
          <GlassButton type="submit" variant="colorful" disabled={saving} className="flex-1 md:flex-none px-12! py-4! shadow-xl shadow-primary/20">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin me-2" />Saving...</> : <><Save className="w-5 h-5 me-2" />Save Profile</>}
          </GlassButton>
        </div>
      </form>

      {/* ── Toast notifications ─────────────────────────────────────────── */}
      {success && (
        <div className="fixed bottom-10 inset-s-1/2 -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-bounce z-50">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-black uppercase tracking-widest text-xs">Profile Saved! Changes are now live.</span>
        </div>
      )}
      {error && (
        <div className="fixed bottom-10 inset-s-1/2 -translate-x-1/2 bg-red-500 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-pulse z-50">
          <span className="material-symbols-outlined">error</span>
          <span className="font-black uppercase tracking-widest text-xs">{error}</span>
        </div>
      )}
    </ProfileLayout>
  );
}
