import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { 
  User, Mail, Globe, Save, Loader2, Camera, DollarSign, 
  ArrowLeft, Shield, Bell, HelpCircle, Share2, LogOut,
  Image as ImageIcon, CheckCircle2, AlertCircle, X, Video
} from 'lucide-react';
import { ProfileLayout } from '../components/ProfileLayout';
import { GlassButton } from '../components/GlassButton';
import { LevelProgressBar } from '../components/UserBadges';
import clsx from 'clsx';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CallInterface } from '../components/messaging/CallInterface';
import { toast } from 'react-hot-toast';

type SettingsTab = 'profile' | 'privacy' | 'notifications' | 'social' | 'help';

export function Settings({ user, userData: initialUserData, onSave }: { user: any, userData: any, onSave?: () => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
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

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Please select an image under 5MB.");
      return;
    }

    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingCover(true);
    
    setError(null);
    try {
      // Create storage reference
      const extension = file.name.split('.').pop() || 'jpg';
      const storagePath = `users/${user.uid}/${type}_${Date.now()}.${extension}`;
      const storageRef = ref(storage, storagePath);

      // Upload file
      const uploadPromise = async () => {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        const userRef = doc(db, 'users', user.uid);
        const updateField = type === 'avatar' ? { photoURL: downloadURL } : { coverPhoto: downloadURL };
        await updateDoc(userRef, updateField);
        
        if (type === 'avatar' && auth.currentUser) {
          await updateProfile(auth.currentUser, {
            photoURL: downloadURL
          });
        }
        return downloadURL;
      };

      toast.promise(uploadPromise(), {
        loading: `Uploading ${type}...`,
        success: `${type === 'avatar' ? 'Profile' : 'Cover'} photo updated successfully!`,
        error: `Failed to upload ${type}.`
      });

      await uploadPromise();
      
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingCover(false);
      
      setSuccess(true);
      onSave?.(); // Propagate refresh
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      setError(`Failed to upload ${type}. ${error.message || 'Please try again.'}`);
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

      // Ensure expert fields only if relevant
      const isProfessional = ['specialist', 'expert', 'case_manager', 'admin', 'management', 'manager', 'verifiedexpert', 'practitioner'].includes(userData?.role?.toLowerCase() || '');
      if (!isProfessional) {
        delete updateData.hourlyRate;
        delete updateData.isOnline;
      }

      await updateDoc(userRef, updateData);
      setSuccess(true);
      setIsDirty(false);
      
      // Refresh local userData
      const updatedSnap = await getDoc(userRef);
      if (updatedSnap.exists()) setUserData(updatedSnap.data());

      onSave?.(); // Refresh global state
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(`Failed to update settings: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  const isExpert = userData?.role === 'specialist' || userData?.role === 'admin' || userData?.primaryRole;

  const NavItem = ({ id, icon: Icon, label }: { id: SettingsTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={clsx(
        "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 w-full text-start",
        activeTab === id 
          ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" 
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-4">
              <div className="size-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[32px]">settings</span>
              </div>
              Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Manage your profile, privacy, and account preferences.</p>
          </div>
          <div className="flex gap-3 self-start md:self-auto">
            <GlassButton 
              variant="colorful" 
              onClick={() => {
                setTestCallStatus('calling');
                // Automatically "connect" after 2 seconds
                setTimeout(() => setTestCallStatus('active'), 2000);
              }} 
              className="px-6! py-2.5!"
            >
              <Video className="w-4 h-4 me-2" />
              Test Call System
            </GlassButton>
            <GlassButton type="submit" variant="colorful" disabled={saving} className="flex-1 md:flex-none px-12! py-4! shadow-xl shadow-primary/20">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin me-2" />Saving...</> : <><Save className="w-5 h-5 me-2" />Save Profile</>}
          </GlassButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Settings Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-2">
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl border border-white/20 dark:border-slate-800 p-4 shadow-xl">
              <NavItem id="profile" icon={User} label="Profile & Bio" />
              <NavItem id="privacy" icon={Shield} label="Privacy & Security" />
              <NavItem id="notifications" icon={Bell} label="Notifications" />
              <NavItem id="social" icon={Share2} label="Social Channels" />
              <NavItem id="help" icon={HelpCircle} label="Help & Support" />
            </div>

            <button 
              onClick={async () => {
                try {
                  await auth.signOut();
                  sessionStorage.clear();
                  window.location.replace('/landing');
                } catch (error) {
                  console.error('Error signing out:', error);
                }
              }}
              className="group flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all duration-300 w-full text-start"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-bold text-sm tracking-tight">Sign Out</span>
            </button>
          </div>

          {/* Settings Content Area */}
          <div className="lg:col-span-9">
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-inset-e-4 duration-500">
              
              {/* Profile Section */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  {/* Visual Identity Card */}
                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-5xl p-20 text-center flex flex-col items-center gap-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Visual Identity
                    </h3>

                    <div className="space-y-10">
                      {/* Avatar Upload */}
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group size-32 md:size-40 shrink-0">
                          <div className="absolute -inset-1.5 bg-linear-to-tr from-primary via-purple-500 to-pink-500 rounded-full blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative size-full rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                            <img 
                              src={userData?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} 
                              alt="Profile" 
                              className="size-full rounded-4xl border-4 border-white dark:border-slate-800 object-cover shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                            <label
                              htmlFor="avatar-upload"
                              className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-4xl opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm"
                            >
                              {uploadingAvatar ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
                            </label>
                          </div>
                          <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} disabled={uploadingAvatar} />
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-start">
                          <h4 className="font-black text-lg">Profile Picture</h4>
                          <p className="text-sm text-slate-500 font-medium">This is how you will be recognized in the community. Recommended: Square image, at least 400x400px.</p>
                          <GlassButton variant="dark" className="px-6! py-2! text-xs" onClick={() => document.getElementById('avatar-upload')?.click()}>
                            Change Photo
                          </GlassButton>
                        </div>
                        {/* Level Progress Bar & Profile Preview Hint */}
                        <div className="mt-4 flex flex-col gap-4">
                          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                            <LevelProgressBar userData={userData} />
                          </div>
                          <Link 
                            to={`/user/${user.uid}`}
                            className="flex items-center gap-2 p-4 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary transition-all group"
                          >
                            <User className="w-5 h-5" />
                            <div className="text-start">
                              <p className="text-xs font-black uppercase tracking-widest">Public View</p>
                              <p className="text-[10px] font-medium opacity-70">See how others see your profile</p>
                            </div>
                            <span className="material-symbols-outlined ms-auto group-hover:translate-x-1 transition-transform">arrow_forward</span>
                          </Link>
                        </div>
                      </div>

                      <div className="h-px bg-white/10 dark:bg-slate-800 w-full" />

                      {/* Cover Upload */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-lg">Cover Header</h4>
                          <GlassButton variant="dark" className="px-6! py-2! text-xs" onClick={() => document.getElementById('cover-upload')?.click()}>
                            Change Cover
                          </GlassButton>
                        </div>
                        <div className="relative h-48 w-full rounded-5xl overflow-hidden border-2 border-dashed border-white/20 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/30 flex items-center justify-center group">
                          {(userData?.coverPhoto || userData?.coverURL) ? (
                            <img src={userData.coverPhoto || userData.coverURL} alt="Cover" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <ImageIcon className="w-12 h-12" />
                              <p className="text-xs font-bold uppercase tracking-widest">No Cover Uploaded</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            {uploadingCover ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Camera className="w-10 h-10 text-white" />}
                          </div>
                          <input type="file" id="cover-upload" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} disabled={uploadingCover} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium italic">Landscape image works best (16:9 ratio, approx 1200x480px).</p>
                      </div>
                    </div>
                  </div>

                  {/* Identity Information Card */}
                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl p-8 border border-white/20 dark:border-slate-800 shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      About You
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Display Name</label>
                        <input 
                          type="text" 
                          name="displayName" 
                          value={formData.displayName} 
                          onChange={handleChange}
                          className="w-full bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
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
                            className="w-full bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 rounded-2xl ps-11 p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
                            placeholder="City, Country"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Professional Specialty / Role</label>
                        <input 
                          type="text" 
                          name="specialty" 
                          value={formData.specialty} 
                          onChange={handleChange}
                          className="w-full bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
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
                          className="w-full bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed" 
                          placeholder="Share your story, mission, or what you're currently focused on..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expert Specific Settings */}
                  {isExpert && (
                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl p-8 border border-white/20 dark:border-slate-800 shadow-xl mt-8">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Expert Availability
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/20">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Availability Status</label>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-black text-slate-900 dark:text-white">Currently Online</p>
                              <p className="text-xs text-slate-500">Enable this to be shown as available for sessions.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" name="isOnline" checked={formData.isOnline} onChange={handleChange} className="sr-only peer" />
                              <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        </div>

                        <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/20">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Hourly Rate (USD)</label>
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
                          <p className="text-[10px] text-slate-400 mt-2 italic">Urkio platform fees are not included in this rate.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Privacy Section */}
              {activeTab === 'privacy' && (
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl p-8 border border-white/20 dark:border-slate-800 shadow-xl space-y-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Privacy & Security
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/10">
                      <div>
                        <p className="font-black text-lg">Public Profile</p>
                        <p className="text-sm text-slate-500">Allow search engines and non-users to see your profile.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/10">
                      <div>
                        <p className="font-black text-lg">Online Status Visibility</p>
                        <p className="text-sm text-slate-500">Show when you are currently active on the platform.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="showOnlineStatus" checked={formData.showOnlineStatus} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/10">
                      <div>
                        <p className="font-black text-lg">Direct Messages</p>
                        <p className="text-sm text-slate-500">Allow people you don't follow to send you message requests.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="allowMessagesFromNonFriends" checked={formData.allowMessagesFromNonFriends} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-white/10">
                    <h4 className="font-black text-red-500 mb-4 tracking-tight">Danger Zone</h4>
                    <GlassButton variant="colorful" className="bg-red-500/10! text-red-500! border-red-500/20! hover:bg-red-500! hover:text-white! transition-all px-8!">
                      Deactivate Account
                    </GlassButton>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeTab === 'notifications' && (
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl p-8 border border-white/20 dark:border-slate-800 shadow-xl space-y-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notification Preferences
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/10">
                      <div>
                        <p className="font-black text-lg">Email Notifications</p>
                        <p className="text-sm text-slate-500">Receive summaries and message alerts via email.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="emailNotifs" checked={formData.emailNotifs} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/10">
                      <div>
                        <p className="font-black text-lg">Push Notifications</p>
                        <p className="text-sm text-slate-500">Enable real-time alerts in your browser/app.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="pushNotifs" checked={formData.pushNotifs} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-white/10">
                      <div>
                        <p className="font-black text-lg">In-App Alerts</p>
                        <p className="text-sm text-slate-500">Activity dots and bell icon notifications.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="inAppNotifs" checked={formData.inAppNotifs} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Section */}
              {activeTab === 'social' && (
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl p-8 border border-white/20 dark:border-slate-800 shadow-xl space-y-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Social Presence
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Website URL</label>
                      <div className="relative">
                        <Globe className="absolute inset-s-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="url" 
                          name="website" 
                          value={formData.website} 
                          onChange={handleChange}
                          className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-2xl ps-12 p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
                          placeholder="https://yourwork.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">WhatsApp</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute inset-s-5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">chat</span>
                        <input 
                          type="text" 
                          name="whatsapp" 
                          value={formData.whatsapp} 
                          onChange={handleChange}
                          className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-2xl ps-12 p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
                          placeholder="+123456789"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">X (Twitter)</label>
                      <div className="relative">
                        <span className="absolute inset-s-5 top-1/2 -translate-y-1/2 font-black text-slate-400">@</span>
                        <input 
                          type="text" 
                          name="twitter" 
                          value={formData.twitter} 
                          onChange={handleChange}
                          className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-2xl ps-12 p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
                          placeholder="yourhandle"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Instagram</label>
                      <div className="relative">
                         <span className="absolute inset-s-5 top-1/2 -translate-y-1/2 font-black text-slate-400">@</span>
                        <input 
                          type="text" 
                          name="instagram" 
                          value={formData.instagram} 
                          onChange={handleChange}
                          className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-2xl ps-12 p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
                          placeholder="yourhandle"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">LinkedIn</label>
                      <div className="relative">
                         <span className="absolute inset-s-5 top-1/2 -translate-y-1/2 font-black text-slate-400">in</span>
                        <input 
                          type="url" 
                          name="linkedin" 
                          value={formData.linkedin || ''} 
                          onChange={handleChange}
                          className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-2xl ps-12 p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
                          placeholder="https://linkedin.com/in/yourhandle"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Facebook</label>
                      <div className="relative">
                         <span className="absolute inset-s-5 top-1/2 -translate-y-1/2 font-black text-slate-400">fb</span>
                        <input 
                          type="text" 
                          name="facebook" 
                          value={formData.facebook || ''} 
                          onChange={handleChange}
                          className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-2xl ps-12 p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
                          placeholder="yourpage"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">TikTok</label>
                      <div className="relative">
                         <span className="absolute inset-s-5 top-1/2 -translate-y-1/2 font-black text-slate-400">@</span>
                        <input 
                          type="text" 
                          name="tiktok" 
                          value={formData.tiktok || ''} 
                          onChange={handleChange}
                          className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-2xl ps-12 p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
                          placeholder="yourhandle"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">YouTube</label>
                      <div className="relative">
                         <span className="absolute inset-s-5 top-1/2 -translate-y-1/2 font-black text-slate-400">yt</span>
                        <input 
                          type="text" 
                          name="youtube" 
                          value={formData.youtube || ''} 
                          onChange={handleChange}
                          className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-2xl ps-12 p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
                          placeholder="channel/handle"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Help & Support Section */}
              {activeTab === 'help' && (
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl p-8 border border-white/20 dark:border-slate-800 shadow-xl space-y-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Help & Community Support
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-primary/5 rounded-4xl border border-primary/10 group cursor-pointer hover:bg-primary/10 transition-all">
                      <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                        <HelpCircle className="w-6 h-6" />
                      </div>
                      <h4 className="font-black text-xl mb-2">Help Center</h4>
                      <p className="text-sm text-slate-500 mb-6">Explore our guides, FAQs and tutorials to get the most out of Urkio.</p>
                      <span className="text-primary font-black text-xs uppercase tracking-widest">Visit Documentation →</span>
                    </div>

                    <div className="p-8 bg-blue-500/5 rounded-4xl border border-blue-500/10 group cursor-pointer hover:bg-blue-500/10 transition-all">
                      <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                        <Mail className="w-6 h-6" />
                      </div>
                      <h4 className="font-black text-xl mb-2">Direct Support</h4>
                      <p className="text-sm text-slate-500 mb-6">Need technical help? Our team is available to assist you with any issues.</p>
                      <span className="text-blue-500 font-black text-xs uppercase tracking-widest">Contact Support →</span>
                    </div>
                  </div>

                  <div className="bg-slate-500/5 p-8 rounded-4xl border border-slate-500/10">
                    <p className="text-center text-xs font-bold text-slate-400 italic">Version 2.4.0 (Alpha Build) • © 2026 Urkio Collective</p>
                  </div>
                </div>
              )}

              {/* Floating Save Button (Always visible on mobile, sticky on desktop) */}
              <div className="sticky bottom-8 inset-s-0 inset-e-0 z-40 lg:relative lg:bottom-0">
                <div className="bg-primary/5 dark:bg-primary/20 backdrop-blur-xl lg:bg-transparent p-6 lg:p-0 rounded-4xl lg:rounded-none border border-primary/20 lg:border-none flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h4 className="font-black text-lg text-slate-900 dark:text-white">Unsaved Changes</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Remember to save your preferences before leaving.</p>
                  </div>
                  <GlassButton 
                    type="submit" 
                    variant="colorful" 
                    disabled={saving}
                    className="w-full md:w-auto px-16! py-5! shadow-2xl shadow-primary/30 active:scale-95"
                  >
                    {saving ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-black uppercase tracking-widest text-xs">Synchronizing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Save className="w-5 h-5" />
                        <span className="font-black uppercase tracking-widest text-xs">Save All Settings</span>
                      </div>
                    )}
                  </GlassButton>
                </div>
              </div>

              {/* Feedback Toasts */}
              {success && (
                <div className="fixed top-24 inset-s-1/2 -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 duration-500 z-100 border-2 border-white/20 backdrop-blur-md">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-white/20">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h5 className="font-black text-xs uppercase tracking-widest">Update Successful</h5>
                    <p className="text-[10px] font-medium opacity-90">Your profile has been synchronized globally.</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/user/${user.uid}`)}
                    className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-white hover:bg-white hover:text-green-500 transition-all"
                  >
                    View Result
                  </button>
                </div>
              )}

              {error && (
                <div className="fixed top-24 inset-s-1/2 -translate-x-1/2 bg-red-500 text-white px-10 py-5 rounded-4xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 duration-500 z-100">
                  <AlertCircle className="w-6 h-6" />
                  <span className="font-black uppercase tracking-widest text-xs">{error}</span>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>

      {/* Test Call Interface Overlay */}
      {testCallStatus && (
        <CallInterface
          status={testCallStatus}
          type="video"
          partner={{
            uid: 'test-partner',
            displayName: 'Urkio Support Bot',
            photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Urkio'
          }}
          onAccept={() => setTestCallStatus('active')}
          onDecline={() => setTestCallStatus(null)}
          onEnd={() => setTestCallStatus(null)}
        />
      )}
    </div>
  );
}
