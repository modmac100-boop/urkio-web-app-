import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../firebase';
import { 
  User, Mail, Globe, Save, Loader2, Camera, DollarSign, 
  Shield, Bell, HelpCircle, Share2, LogOut,
  Image as ImageIcon, CheckCircle2, AlertCircle, Video
} from 'lucide-react';
import { GlassButton } from '../GlassButton';
import { LevelProgressBar } from '../UserBadges';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CallInterface } from '../messaging/CallInterface';
import { toast } from 'react-hot-toast';

type SettingsTab = 'profile' | 'privacy' | 'notifications' | 'social' | 'help';

export function UserProfileEditor({ 
  user, 
  userData: initialUserData, 
  onSave 
}: { 
  user: any; 
  userData: any; 
  onSave?: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>('profile');
  const [userData, setUserData] = useState(initialUserData);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [testCallStatus, setTestCallStatus] = useState<'ringing' | 'calling' | 'active' | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    whatsapp: '',
    twitter: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    website: '',
    occupation: '',
    gender: '',
    age: '',
    hourlyRate: '',
    isOnline: false,
    specialty: '',
    location: '',
    // Privacy
    isPublic: true,
    showOnlineStatus: true,
    allowMessagesFromNonFriends: true,
    // Notifications
    emailNotifs: true,
    pushNotifs: true,
    inAppNotifs: true,
    statusMessage: '',
    statusActivity: '',
    hasActiveStory: false,
  });

  useEffect(() => {
    if (userData && !isDirty) {
      let initialSpecialty = userData.specialty || '';
      if (!initialSpecialty) {
        if (userData.skills) {
           initialSpecialty = Array.isArray(userData.skills) ? userData.skills.join(', ') : userData.skills;
        } else if (userData.primaryRole) {
           initialSpecialty = userData.primaryRole;
        }
      }

      setFormData(prev => ({
        ...prev,
        displayName: userData.displayName || userData.fullName || '',
        bio: userData.bio || userData.applicationLetter || '',
        whatsapp: userData.whatsapp || '',
        twitter: userData.twitter || '',
        linkedin: userData.linkedin || '',
        instagram: userData.instagram || '',
        facebook: userData.facebook || '',
        tiktok: userData.tiktok || '',
        youtube: userData.youtube || '',
        website: userData.website || '',
        occupation: userData.occupation || '',
        gender: userData.gender || '',
        age: userData.age || '',
        hourlyRate: userData.hourlyRate || '',
        isOnline: userData.isOnline || false,
        specialty: initialSpecialty,
        location: userData.location || '',
        isPublic: userData.isPublic ?? true,
        showOnlineStatus: userData.showOnlineStatus ?? true,
        allowMessagesFromNonFriends: userData.allowMessagesFromNonFriends ?? true,
        emailNotifs: userData.emailNotifs ?? true,
        pushNotifs: userData.pushNotifs ?? true,
        inAppNotifs: userData.inAppNotifs ?? true,
        statusMessage: userData.statusMessage || '',
        statusActivity: userData.statusActivity || '',
        hasActiveStory: userData.hasActiveStory || false,
      }));
    }
  }, [userData, isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
    setIsDirty(true);
    setSuccess(false);
    setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Please select an image under 5MB.");
      return;
    }

    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingCover(true);
    
    setError(null);
    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const storagePath = `users/${user.uid}/${type}_${Date.now()}.${extension}`;
      const storageRef = ref(storage, storagePath);

      const uploadPromise = async () => {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        const userRef = doc(db, 'users', user.uid);
        const updateField = type === 'avatar' ? { photoURL: downloadURL } : { coverPhoto: downloadURL };
        await updateDoc(userRef, updateField);
        
        if (type === 'avatar' && auth.currentUser) {
          await updateProfile(auth.currentUser, { photoURL: downloadURL });
        }
        return downloadURL;
      };

      await toast.promise(uploadPromise(), {
        loading: `Uploading ${type}...`,
        success: `${type === 'avatar' ? 'Profile' : 'Cover'} photo updated!`,
        error: `Failed to upload ${type}.`
      });

      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingCover(false);
      
      setSuccess(true);
      onSave?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(`Error uploading ${type}:`, err);
      setError(`Failed to upload ${type}.`);
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData: any = { ...formData };

      const isProfessional = ['specialist', 'expert', 'case_manager', 'admin', 'management', 'manager', 'verifiedexpert', 'practitioner'].includes(userData?.role?.toLowerCase() || '');
      if (!isProfessional) {
        delete updateData.hourlyRate;
        delete updateData.isOnline;
      }

      // If user provided a status, activate the story and set timestamp
      if (formData.statusMessage || formData.statusActivity) {
        updateData.hasActiveStory = true;
        updateData.statusUpdatedAt = serverTimestamp();
      } else {
        updateData.hasActiveStory = false;
      }

      await updateDoc(userRef, updateData);
      setSuccess(true);
      setIsDirty(false);
      
      const updatedSnap = await getDoc(userRef);
      if (updatedSnap.exists()) setUserData(updatedSnap.data());

      onSave?.(); 
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(`Failed to update: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const isExpert = ['specialist', 'expert', 'case_manager', 'admin', 'management', 'manager', 'verifiedexpert', 'practitioner'].includes(userData?.role?.toLowerCase() || '');

  const NavItem = ({ id, icon: Icon, label }: { id: SettingsTab, icon: any, label: string }) => (
    <button
      type="button"
      onClick={() => setActiveSubTab(id)}
      className={clsx(
        "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 w-full text-start",
        activeSubTab === id 
          ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" 
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="animate-in fade-in-up duration-700">
      {/* Settings Header (Internal) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </div>
            {t('profile.pageSetup', 'Page Setup')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            {t('profile.setupSubtitle', 'Customize your presence and account preferences.')}
          </p>
        </div>
        <div className="flex gap-3">
          <GlassButton 
            variant="colorful" 
            onClick={() => {
              setTestCallStatus('calling');
              setTimeout(() => setTestCallStatus('active'), 2000);
            }} 
            className="px-6! py-2.5!"
          >
            <Video className="w-4 h-4 md:me-2" />
            <span className="hidden md:inline">Test Call System</span>
          </GlassButton>
          <GlassButton 
            onClick={handleSubmit} 
            variant="colorful" 
            disabled={saving || !isDirty} 
            className="px-10! py-4! shadow-xl shadow-primary/20"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin me-2" />Saving...</> : <><Save className="w-4 h-4 me-2" />Save Changes</>}
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sub-navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-surface/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-4xl border border-white/20 dark:border-slate-800 p-3 shadow-xl">
            <NavItem id="profile" icon={User} label={t('settings.profileBio', 'Profile & Bio')} />
            <NavItem id="privacy" icon={Shield} label={t('settings.privacy', 'Privacy & Security')} />
            <NavItem id="notifications" icon={Bell} label={t('settings.notifications', 'Notifications')} />
            <NavItem id="social" icon={Share2} label={t('settings.social', 'Social Channels')} />
            <NavItem id="help" icon={HelpCircle} label={t('settings.help', 'Help & Support')} />
          </div>

          <button 
            type="button"
            onClick={async () => {
              try {
                await auth.signOut();
                sessionStorage.clear();
                window.location.replace('/landing');
              } catch (err) {
                console.error('Signout error:', err);
              }
            }}
            className="group flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all duration-300 w-full text-start mt-2"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold text-sm tracking-tight">{t('nav.signOut')}</span>
          </button>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-9">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {activeSubTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Identity Information Card */}
                <div className="bg-surface/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-4xl p-8 border border-white/20 dark:border-slate-800 shadow-xl">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Identity & Bio
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Display Name</label>
                      <input 
                        type="text" 
                        name="displayName" 
                        value={formData.displayName} 
                        onChange={handleChange}
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-slate-700/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                        placeholder="How the world sees you"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Location</label>
                      <div className="relative">
                        <Globe className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          name="location" 
                          value={formData.location} 
                          onChange={handleChange}
                          className="w-full bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-slate-700/50 rounded-2xl ps-11 p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Occupation</label>
                      <input 
                        type="text" 
                        name="occupation" 
                        value={formData.occupation} 
                        onChange={handleChange}
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-slate-700/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                        placeholder="e.g. Engineer, Artist"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Gender</label>
                      <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleChange}
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-slate-700/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                      >
                        <option value="">{t('auth.selectOption', 'Select...')}</option>
                        <option value="Male">{t('auth.genderMale', 'Male')}</option>
                        <option value="Female">{t('auth.genderFemale', 'Female')}</option>
                        <option value="Other">{t('auth.genderOther', 'Other')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Age</label>
                      <input 
                        type="number" 
                        name="age" 
                        value={formData.age} 
                        onChange={handleChange}
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-slate-700/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                        placeholder="25"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Professional Specialty / Role</label>
                      <input 
                        type="text" 
                        name="specialty" 
                        value={formData.specialty} 
                        onChange={handleChange}
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-slate-700/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                        placeholder="e.g. Content Creator, Developer, Enthusiast"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Personal Bio</label>
                      <textarea 
                        name="bio" 
                        value={formData.bio} 
                        onChange={handleChange}
                        rows={4}
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-slate-700/50 rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none leading-relaxed" 
                        placeholder="Share your story, mission, or what you're currently focused on..."
                      />
                    </div>
                  </div>
                </div>

                {isExpert && (
                  <div className="bg-surface/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-4xl p-8 border border-white/20 dark:border-slate-800 shadow-xl mt-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Expert Availability
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/20 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">Currently Online</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Toggle availability</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" name="isOnline" checked={formData.isOnline} onChange={handleChange} className="sr-only peer" />
                          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/20">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Hourly Rate (USD)</label>
                        <div className="relative">
                          <span className="absolute inset-s-0 top-1/2 -translate-y-1/2 text-2xl font-black text-primary">$</span>
                          <input 
                            type="number" 
                            name="hourlyRate" 
                            value={formData.hourlyRate} 
                            onChange={handleChange}
                            className="w-full ps-8 bg-transparent border-none text-4xl font-black text-slate-900 dark:text-white p-0 focus:ring-0" 
                            placeholder="80"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PRIVACY */}
            {activeSubTab === 'privacy' && (
              <div className="bg-surface/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-4xl p-8 border border-white/20 dark:border-slate-800 shadow-xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy & Security
                </h3>
                <div className="space-y-6">
                  {[
                    { name: 'isPublic', label: 'Public Profile', desc: 'Allow non-users to see your profile.' },
                    { name: 'showOnlineStatus', label: 'Online Status Visibility', desc: 'Show when you are currently active.' },
                    { name: 'allowMessagesFromNonFriends', label: 'Direct Messages', desc: 'Allow messages from anyone.' }
                  ].map(item => (
                    <div key={item.name} className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/10">
                      <div>
                        <p className="font-black text-lg">{item.label}</p>
                        <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name={item.name} checked={(formData as any)[item.name]} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSubTab === 'notifications' && (
              <div className="bg-surface/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-4xl p-8 border border-white/20 dark:border-slate-800 shadow-xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notification Preferences
                </h3>
                <div className="space-y-6">
                   {[
                    { name: 'emailNotifs', label: 'Email Notifications', desc: 'Summaries and message alerts.' },
                    { name: 'pushNotifs', label: 'Push Notifications', desc: 'Real-time alerts in browser.' },
                    { name: 'inAppNotifs', label: 'In-App Alerts', desc: 'Activity dots and bell icon.' }
                  ].map(item => (
                    <div key={item.name} className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/10">
                      <div>
                        <p className="font-black text-lg">{item.label}</p>
                        <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name={item.name} checked={(formData as any)[item.name]} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SOCIAL */}
            {activeSubTab === 'social' && (
              <div className="bg-surface/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-4xl p-8 border border-white/20 dark:border-slate-800 shadow-xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Social Presence & Stories
                </h3>

                {/* Status Update Section */}
                <div className="p-8 bg-linear-to-br from-primary/10 to-indigo-500/5 rounded-4xl border border-primary/20 shadow-inner">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <div>
                      <h4 className="font-black text-lg">Broadcast Your Status</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Visible for 24 hours on the home stories bar</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Activity Emoji</label>
                      <input 
                        type="text" 
                        name="statusActivity" 
                        value={formData.statusActivity} 
                        onChange={handleChange}
                        maxLength={2}
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-slate-700/50 rounded-2xl p-4 text-2xl text-center focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                        placeholder="🔥"
                      />
                    </div>
                    <div className="md:col-span-9 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Status Message</label>
                      <input 
                        type="text" 
                        name="statusMessage" 
                        value={formData.statusMessage} 
                        onChange={handleChange}
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-slate-700/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                        placeholder="What's happening right now?"
                      />
                    </div>
                  </div>

                  {formData.hasActiveStory && (
                    <div className="mt-6 flex items-center justify-between p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600">Your status is currently live!</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, statusMessage: '', statusActivity: '', hasActiveStory: false }));
                          setIsDirty(true);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                      >
                        Clear Now
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative flex items-center py-4">
                  <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="shrink mx-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Connect Socials</span>
                  <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: 'website', label: 'Website', icon: Globe, placeholder: 'https://site.com' },
                    { name: 'whatsapp', label: 'WhatsApp', icon: ImageIcon, placeholder: '+1...' },
                    { name: 'instagram', label: 'Instagram', prefix: '@', placeholder: 'user' },
                    { name: 'twitter', label: 'Twitter (X)', prefix: '@', placeholder: 'user' },
                    { name: 'linkedin', label: 'LinkedIn', prefix: 'in/', placeholder: 'user' },
                    { name: 'youtube', label: 'YouTube', prefix: '@', placeholder: 'channel' }
                  ].map(social => (
                    <div key={social.name} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{social.label}</label>
                      <div className="relative">
                        {social.icon ? <social.icon className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /> : <span className="absolute inset-s-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">{social.prefix}</span>}
                        <input 
                          type="text" name={social.name} value={(formData as any)[social.name]} onChange={handleChange}
                          className="w-full bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-slate-700/50 rounded-2xl ps-12 p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                          placeholder={social.placeholder}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HELP */}
            {activeSubTab === 'help' && (
              <div className="bg-surface/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-4xl p-8 border border-white/20 dark:border-slate-800 shadow-xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Help & Support
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-primary/5 rounded-4xl border border-primary/10 group cursor-pointer hover:bg-primary/10 transition-all text-center">
                    <HelpCircle className="w-8 h-8 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-black text-lg mb-1">Help Center</h4>
                    <p className="text-xs text-slate-500 font-medium mb-4">FAQS and guides.</p>
                    <span className="text-primary font-black text-[10px] uppercase tracking-widest">Documentation →</span>
                  </div>
                  <div className="p-8 bg-blue-500/5 rounded-4xl border border-blue-500/10 group cursor-pointer hover:bg-blue-500/10 transition-all text-center">
                    <Mail className="w-8 h-8 text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-black text-lg mb-1">Support</h4>
                    <p className="text-xs text-slate-500 font-medium mb-4">Contact our team.</p>
                    <span className="text-blue-500 font-black text-[10px] uppercase tracking-widest">Message Us →</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Save Bar (Internal) */}
            <div className={clsx(
              "sticky bottom-4 z-50 p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl rounded-[2.5rem] border border-primary/20 shadow-2xl transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-6",
              isDirty ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
            )}>
              <div className="text-center md:text-start">
                <h4 className="font-black text-lg text-slate-900 dark:text-white">Unsaved Changes</h4>
                <p className="text-xs text-slate-500 font-medium">Remember to save your preferences before leaving.</p>
              </div>
              <GlassButton 
                type="submit" 
                variant="colorful" 
                disabled={saving}
                className="w-full md:w-auto px-16! py-5! shadow-2xl shadow-primary/30"
              >
                {saving ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-black uppercase tracking-widest text-xs">Syncing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Save className="w-4 h-4" />
                    <span className="font-black uppercase tracking-widest text-xs">Save All Settings</span>
                  </div>
                )}
              </GlassButton>
            </div>
          </form>
        </div>
      </div>

      {testCallStatus && (
        <CallInterface
          status={testCallStatus}
          type="video"
          partner={{
            uid: 'test-bot',
            displayName: 'Urkio Support Bot',
            photoURL: ''
          }}
          onAccept={() => setTestCallStatus('active')}
          onDecline={() => setTestCallStatus(null)}
          onEnd={() => setTestCallStatus(null)}

        />
      )}
    </div>
  );
}
