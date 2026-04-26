import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, setDoc, updateDoc, collection, query, where,
  getDocs, addDoc, serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { db, auth, storage } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ProfileLayout } from '../components/ProfileLayout';
import { BookSessionModal } from '../components/BookSessionModal';
import { CreateEventModal } from '../components/CreateEventModal';
import { ArticleCreatorModal } from '../components/profile/ArticleCreatorModal';
import { FollowsModal } from '../components/FollowsModal';
import { SignInModal } from '../components/SignInModal';
import {
  Loader2, Image, Settings, Sparkles, LayoutGrid,
  Shield, Star, BookOpen, Camera, Award, Flame, Trophy, Calendar, Video
} from 'lucide-react';
import { GlassButton } from '../components/GlassButton';
import { StoryBar } from '../components/profile/StoryBar';
import { PostCreator } from '../components/profile/PostCreator';
import { FeedPost } from '../components/profile/FeedPost';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { UserProfileEditor } from '../components/profile/UserProfileEditor';
import { ResumeOverlay } from '../components/profile/ResumeOverlay';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { useCalls } from '../contexts/CallContext';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export function PublicProfile({
  currentUser,
  userData: activeUserData
}: {
  currentUser: any;
  userData?: any;
}) {
  const { t } = useTranslation();
  const { setActiveChatPartner } = useApp();
  const { initiateCall } = useCalls();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'media' | 'articles' | 'events' | 'agenda' | 'settings'>('feed');
  const [selectedExpertForBooking, setSelectedExpertForBooking] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowsModal, setShowFollowsModal] = useState(false);
  const [followsModalType, setFollowsModalType] = useState<'followers' | 'following'>('followers');
  const [activeStories, setActiveStories] = useState<any[]>([]);
  const [isResumeOverlayOpen, setIsResumeOverlayOpen] = useState(false);

  // Auto-open resume overlay when ?resume=1 is in the URL
  useEffect(() => {
    if (searchParams.get('resume') === '1') {
      setIsResumeOverlayOpen(true);
    }
  }, [searchParams]);

  const isOwnProfile = currentUser?.uid === userId;
  const rawRole = ((profileData?.role || profileData?.primaryRole || profileData?.userType || '')).toLowerCase();
  const rawBio = (profileData?.bio || '').toLowerCase();
  const isExpert = 
    ['founder', 'specialist', 'expert', 'case_manager', 'practitioner', 'management', 'editor', 'verified', 'mentor', 'architect', 'curator', 'architectural', 'therapist', 'coach', 'admin'].some(r => rawRole.includes(r)) || 
    ['professional', 'practice', 'clinical', 'architectural', 'expert'].some(r => rawBio.includes(r)) ||
    profileData?.userType === 'expert' || 
    !!profileData?.isExpert ||
    !!profileData?.isVerifiedExpert || 
    !!profileData?.isSpecialist ||
    (profileData?.verificationStatus === 'approved' || profileData?.verificationStatus === 'verified') ||
    ['urkio@urkio.com', 'sameralhalaki@gmail.com'].includes(profileData?.email?.toLowerCase()) ||
    ['urkio@urkio.com', 'sameralhalaki@gmail.com'].includes(currentUser?.email?.toLowerCase());
  const showAgendaTab = isOwnProfile && isExpert;

  const [appointments, setAppointments] = useState<any[]>([]);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    clientName: '',
    clientPhone: '',
    clientAge: '',
    date: '',
    time: '',
    notes: '',
    estimation: '',
    caseCode: '',
    tier: '1',
    category: 'General Anxiety',
    assignedExpert: ''
  });

  const [isOffline, setIsOffline] = useState(false);

  // ─── Fetch profile data ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchProfile = async () => {
      setIsOffline(false);
      setError(null);
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (!snap.exists()) { setError('User not found.'); return; }

        const data = snap.data();
        setProfileData(data);

        // Posts
        const q = query(collection(db, 'posts'), where('authorId', '==', userId));
        const postsSnap = await getDocs(q);
        const posts = postsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        posts.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setUserPosts(posts);

        if (currentUser && currentUser.uid !== userId) {
          const followSnap = await getDoc(doc(db, 'follows', `${currentUser.uid}_${userId}`));
          setIsFollowing(followSnap.exists());
        }

        // Followers count
        const followersQ = query(collection(db, 'follows'), where('followingId', '==', userId));
        const followersSnap = await getDocs(followersQ);
        setFollowersCount(followersSnap.size);

        // Following count
        const followingQ = query(collection(db, 'follows'), where('followerId', '==', userId));
        const followingSnap = await getDocs(followingQ);
        setFollowingCount(followingSnap.size);

        // Fetch stories for this user and filter by date client-side to avoid index requirements
        const storiesQ = query(
          collection(db, 'stories'), 
          where('authorId', '==', userId)
        );
        const storiesSnap = await getDocs(storiesQ);
        const now = Date.now();
        const yesterdayMillis = now - 24 * 60 * 60 * 1000;
        
        const validStories = storiesSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(s => {
            const time = s.createdAt?.toMillis?.() || Number(s.createdAt) || 0;
            return time >= yesterdayMillis;
          })
          .sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || Number(a.createdAt) || 0;
            const timeB = b.createdAt?.toMillis?.() || Number(b.createdAt) || 0;
            return timeA - timeB;
          });
        setActiveStories(validStories);

      } catch (err: any) {
        console.error('Error fetching profile:', err);
        // Distinguish offline/network errors from actual not-found
        const code = err?.code || '';
        const msg = (err?.message || '').toLowerCase();
        if (
          code === 'unavailable' ||
          msg.includes('offline') ||
          msg.includes('network') ||
          msg.includes('client is offline')
        ) {
          setIsOffline(true);
        } else {
          setError(`[${code}] ${err.message}` || 'Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser]);

  // Handle ?tab=settings
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'settings' && isOwnProfile) {
      setActiveTab('settings');
    }
  }, [searchParams, isOwnProfile]);

  // Handle Intent: Automatically open booking modal if requested via URL
  useEffect(() => {
    if (profileData && searchParams.get('action') === 'book' && !isBookingModalOpen) {
      console.log("[Intent] Auto-triggering booking modal for expert:", profileData.displayName);
      setSelectedExpertForBooking(profileData);
      setIsBookingModalOpen(true);
      
      // Clear parameter to prevent repeated triggers on resets
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [profileData, searchParams, isBookingModalOpen]);


  useEffect(() => {
    const handleOpenBooking = (e: any) => {
      if (e.detail) {
        setSelectedExpertForBooking(e.detail);
        setIsBookingModalOpen(true);
      }
    };
    window.addEventListener('open-booking-modal', handleOpenBooking);
    return () => window.removeEventListener('open-booking-modal', handleOpenBooking);
  }, []);

  useEffect(() => {
    if (showAgendaTab && userId) {
      const fetchAppointments = async () => {
        const q = query(collection(db, 'appointments'), where('expertId', '==', userId));
        const snap = await getDocs(q);
        setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      };
      fetchAppointments();
    }
  }, [showAgendaTab, userId]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleSignIn = async (email?: string, password?: string, isGoogle?: boolean) => {
    setSignInError(null);
    setIsAuthenticating(true);
    try {
      if (isGoogle) {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } else if (email && password) {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowSignIn(false);
    } catch (err: any) {
      setSignInError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const toggleFollow = async () => {
    if (!currentUser) { setShowSignIn(true); return; }
    if (!userId || followingLoading) return;
    setFollowingLoading(true);
    try {
      const ref = doc(db, 'follows', `${currentUser.uid}_${userId}`);
      if (!isFollowing) {
        await setDoc(ref, { followerId: currentUser.uid, followingId: userId, createdAt: serverTimestamp() });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success(`Connected with ${profileData?.displayName}`);
      } else {
        await deleteDoc(ref);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Toggle follow error:', err);
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleMessage = () => {
    if (!currentUser) { setShowSignIn(true); return; }
    if (!profileData) return;
    setActiveChatPartner({
      uid: userId,
      displayName: profileData.displayName,
      photoURL: profileData.photoURL,
      isOnline: profileData.isOnline
    });
  };

  const handleVideoCall = async () => {
    if (!currentUser) { setShowSignIn(true); return; }
    if (!profileData || !userId) return;
    const roomId = `${currentUser.uid}_${userId}`;
    await initiateCall(
      { uid: userId, displayName: profileData.displayName, photoURL: profileData.photoURL },
      'video',
      roomId
    );
  };

  const handleAudioCall = async () => {
    if (!currentUser) { setShowSignIn(true); return; }
    if (!profileData || !userId) return;
    const roomId = `${currentUser.uid}_${userId}`;
    await initiateCall(
      { uid: userId, displayName: profileData.displayName, photoURL: profileData.photoURL },
      'audio',
      roomId
    );
  };

  // ─── Owner: avatar upload directly from profile header ───────────────────
  const handleAvatarUpload = async (file: File) => {
    if (!currentUser || !userId) return;
    try {
      const storageRef = ref(storage, `users/${userId}/avatar_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      await updateDoc(doc(db, 'users', userId), { photoURL: downloadUrl });
      if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: downloadUrl });
      setProfileData((prev: any) => ({ ...prev, photoURL: downloadUrl }));
      toast.success('Avatar updated successfully!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Failed to update avatar.');
    }
  };

  // ─── Owner: cover photo upload directly from profile header ──────────────
  const handleCoverUpload = async (file: File) => {
    if (!currentUser || !userId) return;
    try {
      const storageRef = ref(storage, `users/${userId}/cover_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      await updateDoc(doc(db, 'users', userId), { coverPhoto: downloadUrl });
      setProfileData((prev: any) => ({ ...prev, coverPhoto: downloadUrl }));
      toast.success('Cover photo updated successfully!');
    } catch (err) {
      console.error('Cover upload error:', err);
      toast.error('Failed to update cover photo.');
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...newAppointment,
        expertId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      setAppointments(prev => [{ id: docRef.id, ...newAppointment }, ...prev]);
      setIsAddingAppointment(false);
      setNewAppointment({
        clientName: '', clientPhone: '', clientAge: '', date: '', time: '', notes: '',
        estimation: '', caseCode: '', tier: '1', category: 'General Anxiety', assignedExpert: ''
      });
      toast.success('Case added to agenda');
    } catch (err) {
      toast.error('Failed to save case');
    }
  };

  const handleEscalate = async (appt: any) => {
    try {
      await addDoc(collection(db, 'expert_reports'), {
        ...appt,
        type: 'escalation',
        reportedBy: currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success('Case escalated to management');
    } catch (err) {
      toast.error('Escalation failed');
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-bg-main">
        <div className="relative size-20">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
        </div>
      </div>
    );
  }

  // ─── Offline / Connection error ───────────────────────────────────────────
  if (isOffline) {
    return (
      <div className="min-h-screen bg-msgr-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="size-24 rounded-4xl bg-surface border border-border-light shadow-xl flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-5xl text-amber-500">wifi_off</span>
        </div>
        <h1 className="text-3xl font-black text-on-surface mb-3">You're Offline</h1>
        <p className="text-on-surface-variant font-bold uppercase tracking-widest max-w-sm mb-8 text-xs">
          Could not load this profile. Please check your connection and try again.
        </p>
        <div className="flex gap-4">
          <GlassButton
            onClick={() => { setLoading(true); setIsOffline(false); }}
            variant="colorful"
            className="px-10 py-4 rounded-2xl"
          >
            Try Again
          </GlassButton>
          <GlassButton onClick={() => navigate(-1)} className="px-10 py-4 rounded-2xl">
            Go Back
          </GlassButton>
        </div>
      </div>
    );
  }


  // ─── Error state ──────────────────────────────────────────────────────────
  if (error || !profileData || profileData.isDeleted) {
    return (
      <div className="min-h-screen bg-msgr-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="size-24 rounded-4xl bg-surface border border-border-light shadow-xl flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">person_off</span>
        </div>
        <h1 className="text-4xl font-black text-on-surface mb-4">{t('profile.spaceNotFound')}</h1>
        <p className="text-on-surface-variant font-bold uppercase tracking-widest max-w-md mb-8">
          {error || t('profile.spaceNotFoundDesc')}
        </p>
        <GlassButton onClick={() => navigate(-1)} variant="colorful" className="px-12! py-4! rounded-2xl!">
          {t('common.goBack')}
        </GlassButton>
      </div>
    );
  }

  // ─── Privacy Wall ─────────────────────────────────────────────────────────
  if (profileData?.privateProfile && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-msgr-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="size-24 rounded-4xl bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-5xl text-orange-500">lock</span>
        </div>
        <h1 className="text-4xl font-black text-on-surface mb-4">{t('profile.privateSpace')}</h1>
        <p className="text-on-surface-variant font-bold uppercase tracking-widest max-w-md mb-8">
          {t('profile.privateSpaceDesc')}
        </p>
        <GlassButton onClick={() => navigate('/')} variant="colorful" className="px-12! py-4! rounded-2xl!">
          {t('common.returnHome')}
        </GlassButton>
      </div>
    );
  }

  const navigationTabs = [
    { id: 'feed',     icon: LayoutGrid, label: t('profile.feed') || 'Journey Log' },
    { id: 'media',    icon: Image,      label: t('profile.gallery') || 'Media' },
    { id: 'articles', icon: BookOpen,   label: t('profile.editorial') || 'Editorial' },
    { id: 'events',   icon: Star,       label: t('profile.highlights') || 'Highlights' },
    ...(isOwnProfile && isExpert ? [{ id: 'therapy-room', icon: Video, label: 'Clinical Studio' }] : []),
    ...(showAgendaTab ? [{ id: 'agenda', icon: Calendar, label: t('profile.expertAgenda') || 'Agenda' }] : []),
    ...(isOwnProfile ? [{ id: 'settings', icon: Settings, label: t('profile.pageSetup', 'Page Setup') }] : []),
  ];

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <>
      <ProfileLayout
        userData={profileData}
        isOwnProfile={isOwnProfile}
      >
        <div className="space-y-8 animate-fade-in-up">

          {/* Profile Header Card */}
          <ProfileHeader
            displayName={profileData.displayName}
            bio={profileData.bio}
            avatarImage={profileData.photoURL}
            coverImage={profileData.coverPhoto || profileData.coverPhotoURL || profileData.coverURL}
            location={profileData.location}
            website={profileData.website}
            isVerified={profileData.isVerified || profileData.verificationStatus === 'approved'}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollowClick={toggleFollow}
            onMessageClick={handleMessage}
            onEditClick={() => navigate('/settings')}
            onAvatarChange={isOwnProfile ? handleAvatarUpload : undefined}
            onCoverChange={isOwnProfile ? handleCoverUpload : undefined}
            userData={profileData}
            postsCount={userPosts.length}
            followersCount={followersCount}
            followingCount={followingCount}
            onFollowersClick={() => { setFollowsModalType('followers'); setShowFollowsModal(true); }}
            onFollowingClick={() => { setFollowsModalType('following'); setShowFollowsModal(true); }}
            onBookClick={() => setIsBookingModalOpen(true)}
            isExpert={isExpert}
            activeStories={activeStories}
            onShowResume={() => setIsResumeOverlayOpen(true)}
            onVideoCallClick={!isOwnProfile ? handleVideoCall : undefined}
            onAudioCallClick={!isOwnProfile ? handleAudioCall : undefined}
          />

          <div className="mt-8 flex flex-col md:flex-row gap-8">
            {/* Left Sidebar Navigation */}
            <div className="w-full md:w-1/4 shrink-0">
              <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 sticky top-24">
                {navigationTabs.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'settings') {
                        navigate('/settings');
                      } else if (item.id === 'therapy-room') {
                        navigate('/therapy-room');
                      } else {
                        setActiveTab(item.id as any);
                      }
                    }}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl font-label-md w-full whitespace-nowrap transition-colors',
                      activeTab === item.id
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right Main Content */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Stories Bar */}
              <div className="bento-card bg-surface/50 border border-border-light p-6 backdrop-blur-sm">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant/70 mb-6">
                  {t('profile.trendingMoments') || 'Trending Moments'}
                </h3>
                <StoryBar currentUserId={currentUser?.uid} />
              </div>

              {/* Post Creator (own profile only) */}
              {isOwnProfile && (
                <PostCreator
                  userAvatar={profileData.photoURL}
                  userData={profileData}
                  onPostCreated={(newPost) => setUserPosts(prev => [newPost, ...prev])}
                  onEventClick={() => setIsEventModalOpen(true)}
                  onArticleClick={() => setIsArticleModalOpen(true)}
                />
              )}

              {/* ── Tab Panels ───────────────────────────────────────────── */}

              {/* FEED */}
          {activeTab === 'feed' && (
            <div className="grid grid-cols-1 gap-8">
              {userPosts.map((post) => (
                <FeedPost key={post.id} post={post} user={profileData} currentUserId={currentUser?.uid} />
              ))}
              {userPosts.length === 0 && (
                <div className="bento-card border border-dashed border-border-light p-20 text-center bg-msgr-surface-container-low/30 backdrop-blur-sm rounded-[3rem]">
                  <div className="size-20 rounded-4xl bg-surface flex items-center justify-center mx-auto mb-6 shadow-xl border border-border-light">
                    <span className="material-symbols-outlined text-3xl text-primary">draw</span>
                  </div>
                  <h3 className="text-xl font-headline font-black text-on-surface">Silence is Golden</h3>
                  <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mt-2">
                    {profileData.displayName} hasn't impacted the world yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* GALLERY */}
          {activeTab === 'media' && (
            <div className="bento-card bg-surface border border-border-light shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border-light flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-on-surface text-base">Photo Gallery</h3>
                    <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest">
                      {profileData.displayName}'s visual story
                    </p>
                  </div>
                </div>
                {isOwnProfile && (
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" /> Add Photos
                  </button>
                )}
              </div>
              {/* Photo & Video grid — uses post media */}
              {userPosts.filter(p => p.mediaUrl).length > 0 ? (
                <div className="grid grid-cols-3 gap-1 p-1 bg-bg-main/20">
                  {userPosts
                    .filter(p => p.mediaUrl)
                    .map((post, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          'relative overflow-hidden bg-bg-main group cursor-pointer aspect-square',
                          idx % 7 === 0 ? 'col-span-2 row-span-2' : ''
                        )}
                      >
                        {post.mediaType === 'video' ? (
                          <div className="w-full h-full relative">
                            <video
                              src={post.mediaUrl}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute top-2 inset-e-2 size-6 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center">
                              <span className="material-symbols-outlined text-[14px] text-white">videocam</span>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={post.mediaUrl}
                            alt="Gallery"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center items-center gap-4">
                           <div className="flex items-center gap-4 text-white">
                              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">favorite</span> {post.likesCount || 0}</div>
                              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">chat_bubble</span> {post.commentsCount || 0}</div>
                           </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="p-20 text-center">
                  <div className="size-16 rounded-3xl bg-surface flex items-center justify-center mx-auto mb-5 shadow-xl border border-border-light">
                    <Camera className="w-7 h-7 text-on-surface-variant/50" />
                  </div>
                  <h4 className="font-headline font-black text-on-surface">No Photos Yet</h4>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mt-2">
                    Images from posts will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* EDITORIAL */}
          {activeTab === 'articles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-on-surface text-base">Editorial</h3>
                    <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest">
                      Long-form insights & articles
                    </p>
                  </div>
                </div>
              </div>
              {userPosts.filter(p => p.type === 'article' || (p.content && p.content.length > 300)).length > 0 ? (
                userPosts
                  .filter(p => p.type === 'article' || (p.content && p.content.length > 300))
                  .map((post, idx) => (
                    <article key={idx} className="bento-card bg-surface border border-border-light shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 group cursor-pointer">
                      {post.mediaUrl && post.mediaType !== 'video' && (
                        <div className="h-48 overflow-hidden">
                          <img src={post.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest">Editorial</span>
                          <span className="text-[11px] text-on-surface-variant font-semibold">
                            {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface font-medium leading-8 line-clamp-4">{post.content}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <img
                            src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.displayName}`}
                            alt={profileData.displayName}
                            className="size-6 rounded-lg object-cover border border-border-light"
                          />
                          <span className="text-xs font-black text-on-surface">{profileData.displayName}</span>
                        </div>
                      </div>
                    </article>
                  ))
              ) : (
                <div className="bento-card border border-dashed border-border-light p-20 text-center bg-msgr-surface-container-low/30 backdrop-blur-sm rounded-[3rem]">
                  <div className="size-16 rounded-3xl bg-surface flex items-center justify-center mx-auto mb-5 shadow-xl border border-border-light">
                    <BookOpen className="w-7 h-7 text-on-surface-variant/50" />
                  </div>
                  <h4 className="font-headline font-black text-on-surface">No Articles Yet</h4>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mt-2">
                    Long-form content will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* HIGHLIGHTS */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-on-surface text-base">Highlights</h3>
                  <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest">
                    Pinned moments & achievements
                  </p>
                </div>
              </div>

              {/* Achievement cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Flame,  color: 'rose',   label: 'Top Creator',   sublabel: 'Ranked in top 5% this month',  stat: '#3' },
                  { icon: Star,   color: 'amber',  label: 'Rising Star',   sublabel: 'Fastest growing profile',       stat: '+340%' },
                  { icon: Award,  color: 'violet', label: 'Impact Badge',  sublabel: 'High-value content creator',   stat: '12.5K' },
                  { icon: Trophy, color: 'blue',   label: 'Verified Pro',  sublabel: 'Expert-verified specialist',   stat: '✓' },
                ].map((badge, i) => (
                  <div key={i} className="bento-card bg-surface border border-border-light p-6 flex items-center gap-4 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <div className={`size-14 rounded-2xl bg-${badge.color}-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <badge.icon className={`w-7 h-7 text-${badge.color}-500`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline font-black text-on-surface text-sm">{badge.label}</p>
                      <p className="text-[11px] font-semibold text-on-surface-variant mt-0.5 leading-relaxed">{badge.sublabel}</p>
                    </div>
                    <span className={`text-lg font-black text-${badge.color}-500 shrink-0`}>{badge.stat}</span>
                  </div>
                ))}
              </div>

              {/* Pinned posts */}
              {userPosts.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">— Pinned Posts —</p>
                  {userPosts.slice(0, 2).map((post, idx) => (
                    <div key={idx} className="bento-card bg-surface border border-border-light p-5 flex items-start gap-4 hover:shadow-lg transition-all duration-300">
                      <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Star className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface leading-7 line-clamp-3">{post.content}</p>
                        <div className="flex items-center gap-3 mt-3 text-[11px] font-black text-on-surface-variant uppercase tracking-widest">
                          <span>❤ {post.likesCount || 0}</span>
                          <span>💬 {post.commentsCount || 0}</span>
                          <span>🔁 {post.repostsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EXPERT AGENDA */}
          {activeTab === 'agenda' && showAgendaTab && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-headline font-black text-on-surface">Expert Agenda</h2>
                  <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] mt-2">Clinical Case Management & Private Reports</p>
                </div>
                <button
                  onClick={() => setIsAddingAppointment(true)}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all"
                >
                  New Case Entry
                </button>
              </div>

              {isAddingAppointment && (
                <div className="bento-card bg-surface border-2 border-primary/20 p-8 shadow-2xl relative animate-in slide-in-from-top-4 duration-500">
                  <h3 className="text-xl font-headline font-black mb-6">Create Private Case Note</h3>
                  <form onSubmit={handleAddAppointment} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ms-1">Case Code Name (Private)</label>
                        <input
                          required
                          value={newAppointment.caseCode}
                          onChange={e => setNewAppointment({ ...newAppointment, caseCode: e.target.value })}
                          className="w-full bg-msgr-surface-container-low/50 border border-border-light rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="e.g. ALPHA-99"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ms-1">Expert Hub Tier</label>
                        <select
                          value={newAppointment.tier}
                          onChange={e => setNewAppointment({ ...newAppointment, tier: e.target.value })}
                          className="w-full bg-msgr-surface-container-low/50 border border-border-light rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                        >
                          <option value="1">Tier 1: Junior</option>
                          <option value="2">Tier 2: Senior</option>
                          <option value="3">Tier 3: Executive</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ms-1">Psychological Issue Category</label>
                        <select
                          value={newAppointment.category}
                          onChange={e => setNewAppointment({ ...newAppointment, category: e.target.value })}
                          className="w-full bg-msgr-surface-container-low/50 border border-border-light rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                        >
                           {[
                            'General Anxiety', 'Clinical Depression', 'PTSD (Trauma)', 
                            'Bipolar Disorder', 'OCD / Obsessive', 'ADHD / Focus',
                            'Relationship Issues', 'Substance Abuse', 'Grief & Loss',
                            'Work Stress', 'Self Esteem', 'Family Dynamics', 'Panic Attacks'
                          ].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ms-1">Session Date & Time</label>
                        <div className="flex gap-2">
                          <input type="date" required value={newAppointment.date} onChange={e => setNewAppointment({ ...newAppointment, date: e.target.value })} className="flex-1 bg-msgr-surface-container-low/50 border border-border-light rounded-2xl px-4 py-4 text-sm font-bold" />
                          <input type="time" required value={newAppointment.time} onChange={e => setNewAppointment({ ...newAppointment, time: e.target.value })} className="w-32 bg-msgr-surface-container-low/50 border border-border-light rounded-2xl px-4 py-4 text-sm font-bold" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ms-1">Case Estimation & Clinical Assessment</label>
                      <textarea
                        required
                        value={newAppointment.estimation}
                        onChange={e => setNewAppointment({ ...newAppointment, estimation: e.target.value })}
                        className="w-full bg-msgr-surface-container-low/50 border border-border-light rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none"
                        placeholder="Define severity, potential diagnosis range, and required intervention level..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ms-1">Refer to Expert</label>
                         <input
                           value={newAppointment.assignedExpert}
                           onChange={e => setNewAppointment({ ...newAppointment, assignedExpert: e.target.value })}
                           className="w-full bg-bg-main/50 border border-border-light rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                           placeholder="Expert name or UID (optional)..."
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ms-1">Patient Age / Group</label>
                         <input
                           value={newAppointment.clientAge}
                           onChange={e => setNewAppointment({ ...newAppointment, clientAge: e.target.value })}
                           className="w-full bg-bg-main/50 border border-border-light rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                           placeholder="e.g. 28 / Adult"
                         />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ms-1">Confidential Clinical Notes</label>
                      <textarea
                        required
                        value={newAppointment.notes}
                        onChange={e => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                        className="w-full bg-bg-main/50 border border-border-light rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none h-32 resize-none"
                        placeholder="Detail observations, symptoms, and plan..."
                      />
                    </div>
                    <div className="flex justify-end gap-4">
                      <button type="button" onClick={() => setIsAddingAppointment(false)} className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-on-surface-variant hover:bg-bg-main">Cancel</button>
                      <button type="submit" className="bg-primary text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl">Secure Save</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid gap-6">
                {appointments.length === 0 ? (
                  <div className="bento-card border border-dashed border-border-light p-20 text-center bg-bg-main/30 backdrop-blur-sm rounded-[3rem]">
                    <div className="size-20 rounded-4xl bg-surface flex items-center justify-center mx-auto mb-6 shadow-xl border border-border-light">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-headline font-black text-on-surface">Archive Empty</h3>
                    <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mt-2">No active cases recorded in your expert agenda.</p>
                  </div>
                ) : (
                  appointments.map((appt, i) => (
                    <div key={appt.id || i} className="bento-card bg-surface border border-border-light p-8 flex flex-col md:flex-row gap-8 items-start group hover:border-primary/30 transition-all shadow-sm">
                      <div className="size-16 rounded-3xl bg-bg-main flex flex-col items-center justify-center shrink-0 border border-border-light">
                        <span className="text-[10px] font-black uppercase text-on-surface-variant">{new Date(appt.date).toLocaleString('en', { month: 'short' })}</span>
                        <span className="text-xl font-black text-primary leading-none">{new Date(appt.date).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-headline font-black text-on-surface">Case #{appt.caseCode}</h4>
                          <span className="bg-ur-primary/10 text-ur-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {appt.category}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                           <div className="bg-bg-main/50 p-3 rounded-xl border border-border-light">
                              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Clinical Estimation</p>
                              <p className="text-[11px] font-bold text-on-surface line-clamp-2">{appt.estimation || 'No estimation provided.'}</p>
                           </div>
                           <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Assigned Specialist</p>
                              <p className="text-[11px] font-bold text-on-surface">{appt.assignedExpert || 'Awaiting assignment'}</p>
                           </div>
                        </div>
                        <p className="text-xs font-semibold text-on-surface-variant mb-6 leading-relaxed italic border-s-2 border-border-light ps-4">
                          {appt.notes}
                        </p>
                        <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">
                           <div className="flex items-center gap-2 bg-bg-main px-3 py-1.5 rounded-xl"><Sparkles className="w-3 h-3"/> Tier {appt.tier} Expert</div>
                           <div className="flex items-center gap-2 bg-bg-main px-3 py-1.5 rounded-xl"><span className="material-symbols-outlined text-[14px]">schedule</span> {appt.time}</div>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                        <button 
                          onClick={() => handleEscalate(appt)}
                          className="flex-1 md:w-full px-6 py-3 rounded-xl bg-orange-500/10 text-orange-600 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-all border border-orange-500/20"
                        >
                          Escalate Entry
                        </button>
                        <button 
                          onClick={() => toast('Private reports are only visible to you.')}
                          className="flex-1 md:w-full px-6 py-3 rounded-xl bg-bg-main text-on-surface-variant text-[10px] font-black uppercase tracking-widest hover:bg-border-light transition-all"
                        >
                          View Full Case
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SETTINGS / PAGE SETUP */}
          {activeTab === 'settings' && isOwnProfile && (
            <UserProfileEditor 
              user={currentUser} 
              userData={profileData} 
              onSave={() => {
                // Optionally refresh profile data here
                getDoc(doc(db, 'users', userId!)).then(snap => {
                  if (snap.exists()) setProfileData(snap.data());
                });
              }}
            />
          )}
            </div>
          </div>
        </div>
      </ProfileLayout>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookSessionModal
          expert={profileData}
          user={currentUser}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}

      <ResumeOverlay 
        isOpen={isResumeOverlayOpen}
        onClose={() => setIsResumeOverlayOpen(false)}
        expert={profileData}
      />

      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        user={currentUser}
        userData={profileData}
      />

      <ArticleCreatorModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        user={currentUser}
        userData={profileData}
        onArticleCreated={(newArticle) => setUserPosts(prev => [newArticle, ...prev])}
      />

      {/* Sign-in prompt for unauthenticated visitors */}
      <SignInModal
        isOpen={showSignIn}
        onSignIn={handleSignIn}
        onClose={() => { setShowSignIn(false); setSignInError(null); }}
        error={signInError}
        isAuthenticating={isAuthenticating}
      />

      <FollowsModal
        isOpen={showFollowsModal}
        onClose={() => setShowFollowsModal(false)}
        userId={userId || ''}
        type={followsModalType}
        currentUserId={currentUser?.uid}
      />

      {/* ─── FLOATING BOOK NOW BUTTON ─────────────────────────────────────────
           Always visible on the bottom-right corner when visiting an expert's
           profile. Appears ONLY for visitors (not the expert themselves).    */}
      {profileData && !isOwnProfile && isExpert && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
          }}
        >
          <button
            onClick={() => setIsBookingModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'linear-gradient(135deg, #136dec 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              padding: '1rem 2rem',
              fontSize: '0.85rem',
              fontWeight: '900',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 20px 60px rgba(19,109,236,0.4)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span style={{ fontSize: '1.4rem' }}>📅</span>
            Book Session with {profileData.displayName || 'Expert'}
          </button>
        </div>
      )}
    </>
  );
}
