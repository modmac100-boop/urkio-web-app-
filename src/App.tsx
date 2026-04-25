/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, OAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { generateUserCode } from './utils/generateUserCode';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import React, { Suspense, lazy } from 'react';

// Lazy load heavy dashboard components
// Lazy load heavy dashboard components
const UrkioGuide = lazy(() => import('./pages/UrkioGuide').then(m => ({ default: m.UrkioGuide })));
const ExpertVerificationForm = lazy(() => import('./pages/ExpertVerificationForm').then(m => ({ default: m.ExpertVerificationForm })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminPortal = lazy(() => import('./pages/AdminPortal').then(m => ({ default: m.AdminPortal })));
const AdminBetaInsights = lazy(() => import('./pages/AdminBetaInsights').then(m => ({ default: m.AdminBetaInsights })));
const ExpertDashboard = lazy(() => import('./pages/ExpertDashboard').then(m => ({ default: m.ExpertDashboard })));
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Messenger = lazy(() => import('./pages/Messenger'));
const PublicProfile = lazy(() => import('./pages/PublicProfile').then(m => ({ default: m.PublicProfile })));
const Homii = lazy(() => import('./pages/Homii').then(m => ({ default: m.Homii })));
const LiveStreamStudio = lazy(() => import('./pages/LiveStreamStudio').then(m => ({ default: m.LiveStreamStudio })));
const SecretVault = lazy(() => import('./pages/SecretVault').then(m => ({ default: m.SecretVault })));
const HealingRoom = lazy(() => import('./healing-suite/pages/HealingRoom').then(m => ({ default: m.HealingRoom })));

const ExpertList = lazy(() => import('./pages/ExpertList').then(m => ({ default: m.ExpertList })));
const HealingCenter = lazy(() => import('./pages/HealingCenter').then(m => ({ default: m.HealingCenter })));
const HealingCourses = lazy(() => import('./pages/HealingCourses').then(m => ({ default: m.HealingCourses })));
const TherapyRoom = lazy(() => import('./pages/TherapyRoom').then(m => ({ default: m.TherapyRoom })));
const SpecialistDashboard = lazy(() => import('./pages/SpecialistDashboard').then(m => ({ default: m.SpecialistDashboard })));
const Agenda = lazy(() => import('./pages/Agenda').then(m => ({ default: m.Agenda })));
const ClinicalWorkstation = lazy(() => import('./pages/ClinicalWorkstation').then(m => ({ default: m.ClinicalWorkstation })));

import { Tasks } from './pages/Tasks';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { Events } from './pages/Events';
import { Settings } from './pages/Settings';
import { ProfileSettings } from './pages/ProfileSettings';
import {Loader2} from 'lucide-react';
import { Notifications } from './pages/Notifications';
import { StreamCallRoom } from './components/messaging/StreamCallRoom';
import { useParams, useSearchParams } from 'react-router-dom';
import { Landing as ConferenceLanding } from './conference/pages/Landing';
import { Room as ConferenceRoom } from './conference/pages/Room';
import { AuthAction } from './pages/AuthAction';
import PatientJourney from './pages/PatientJourney';

// Guest Conference Join Screen — shown to unauthenticated users with a direct room link
function GuestConferenceJoin() {
  const { roomId } = useParams();
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center font-body">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 size-[500px] bg-ur-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 max-w-md w-full space-y-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="size-20 milled-gradient rounded-[2rem] flex items-center justify-center shadow-2xl shadow-ur-primary/30">
            <span className="material-symbols-outlined text-white text-4xl">videocam</span>
          </div>
          <div>
            <h1 className="text-4xl font-headline font-black text-white tracking-tighter">Join Session</h1>
            <p className="text-zinc-500 text-sm font-medium mt-2">
              Room <span className="text-ur-primary font-mono font-black">{roomId}</span>
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
          <p className="text-zinc-400 text-sm leading-relaxed">
            You&apos;ve been invited to a private Urkio session. Sign in or create a free account to join.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                sessionStorage.setItem('urkio_post_login_redirect', `/conference/${roomId}`);
                window.dispatchEvent(new CustomEvent('open-signin'));
              }}
              className="w-full py-4 milled-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-ur-primary/20 active:scale-95 transition-all"
            >
              Sign In to Join
            </button>
            <button
              onClick={() => {
                sessionStorage.setItem('urkio_post_login_redirect', `/conference/${roomId}`);
                window.dispatchEvent(new CustomEvent('open-signup'));
              }}
              className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 active:scale-95 transition-all"
            >
              Create Free Account
            </button>
          </div>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
            🔒 End-to-end encrypted · PDPL 2026 compliant
          </p>
        </div>
      </div>
    </div>
  );
}

import { OnboardingModal } from './components/OnboardingModal';
import { ThemeProvider } from './contexts/ThemeContext';
import { useWebPushNotifications } from './hooks/useWebPushNotifications';
import { NotificationPermissionBanner } from './components/notifications/NotificationPermissionBanner';
import { AppProvider, useApp } from './contexts/AppContext';
import { CallProvider } from './contexts/CallContext';
import { VoiceAgentWidget } from './components/VoiceAgentWidget';
import toast, { Toaster } from 'react-hot-toast';
import { SessionTimeout } from './components/security/SessionTimeout';
import { MFAGate } from './components/security/MFAGate';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ActiveConsentHandshake } from './components/security/ActiveConsentHandshake';



function RoomPageRoute({ user, userData }: any) {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = (searchParams.get('type') as 'audio' | 'video') || 'video';

  if (!roomId) return <Navigate to="/" replace />;

  return (
    <StreamCallRoom
      callId={roomId}
      user={user}
      userData={userData}
      type={type}
      onLeaveRoom={() => navigate(-1)}
    />
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Track the sessionId we wrote so we don't self-invalidate on re-renders
  const currentSessionIdRef = React.useRef<string | null>(null);

  // Callback for child pages (Settings, ProfileSettings) to refresh the global userData
  const refreshUserData = async () => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) setUserData(snap.data());
    } catch (e) {
      console.warn('Failed to refresh user data:', e);
    }
  };

  // ── Web Push Notifications ───────────────────────────────────────────────
  // Fires a native OS notification whenever the user gets a new unread event
  const { requestPermission } = useWebPushNotifications(user?.uid);

  useEffect(() => {
    // Check for redirect result when the app loads
    const checkRedirect = async () => {
      // Check if we have a pending redirect
      const isRedirectPending = sessionStorage.getItem('urkio_redirect_pending') === 'true';
      if (isRedirectPending) {
        setIsAuthenticating(true);
      }

      try {
        console.log('[Auth] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("[Auth] Redirect login successful:", result.user.email);
        }
      } catch (error: any) {
        console.error("[Auth] Redirect result error:", error);
        
        let errorMessage = 'An error occurred during authentication.';
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          errorMessage = 'Login was cancelled. Please try again if you\'d like to sign in.';
        } else if (error.message?.includes('redirect_uri_mismatch') || error.code?.includes('redirect-uri-mismatch')) {
          errorMessage = 'Google Configuration Error (redirect_uri_mismatch). Please ensure ALL domains (urkio.com, gen-lang-client-0305219649.web.app) are whitelisted in your Google Cloud Console.';
        } else {
          errorMessage = error.message;
        }
        
        setAuthError(errorMessage);
        setLoading(false);
      } finally {
        setIsAuthenticating(false);
        sessionStorage.removeItem('urkio_redirect_pending');
      }
    };
    checkRedirect();

    // Add a safety timeout to prevent infinite loading if Firebase hangs
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth loading timed out. Forcing loading state to false.");
        setLoading(false);
      }
    }, 8000); // Reduced from 15s to 8s for snappier perceived performance

    let userDocUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous user listener if it exists
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      // Reset session ID ref on sign-out
      if (!currentUser) {
        currentSessionIdRef.current = null;
      }

      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Generate a STABLE session ID for this login instance (only if not already set)
          if (!currentSessionIdRef.current) {
            currentSessionIdRef.current = Math.random().toString(36).substring(7);
          }
          const sessionId = currentSessionIdRef.current;
          const userRef = doc(db, 'users', currentUser.uid);
          
          // ── CONSOLIDATED INITIAL WRITE ──────────────────────────────────────
          // Only perform the write if we're not currently authenticating or just signed up
          const justSignedUp = sessionStorage.getItem('urkio_just_signed_up') === 'true';
          if (!justSignedUp) {
            setDoc(userRef, {
              isOnline: true,
              currentSessionId: sessionId,
              lastActive: serverTimestamp(),
              lastIp: 'CLIENT_SIDE_MASKED'
            }, { merge: true }).catch(err => console.warn("Error in consolidated auth sync:", err));
            sessionStorage.setItem('urkio_session_start_time', Date.now().toString());
          }

          // Real-time listener for the user's document
          userDocUnsubscribe = onSnapshot(userRef, async (userSnap) => {
            if (userSnap.exists()) {
              const data = userSnap.data();
              const now = Date.now();
              
              // Force founder permissions for Urkio admin
              if (currentUser.email === 'urkio@urkio.com' && data.role !== 'founder') {
                console.log("[Auth] Elevating Urkio admin to Founder role...");
                await updateDoc(userRef, { role: 'founder', userType: 'expert' }).catch(err => console.warn('Founder upgrade error:', err));
                return;
              }
              
              // Migration/Self-healing: If userType is expert but role is user, fix it
              if (data.userType === 'expert' && data.role === 'user') {
                console.log("[Auth] Promoting expert user to specialist role...");
                await updateDoc(userRef, { role: 'specialist', verificationStatus: 'pending' }).catch(err => console.warn('Expert promotion error:', err));
                return;
              }

              // Update state only if data changed to prevent re-render loops
              setUserData(prev => {
                const isDifferent = JSON.stringify(prev) !== JSON.stringify(data);
                return isDifferent ? data : prev;
              });

              // 🛡️ [Security] Session Revocation — refined for high-latency environments
              if (
                data?.currentSessionId &&
                data.currentSessionId !== currentSessionIdRef.current
              ) {
                const lastActiveMs = data.lastActive?.toMillis?.() ?? 0;
                // Only invalidate if the other session is truly "newer" (within last 30s)
                if (lastActiveMs > 0 && now - lastActiveMs < 30000) {
                  // Final check: don't invalidate if we just logged in (< 5s ago)
                  // This handles Firestore propagation lag where we see our own "old" session ID briefly
                  const sessionAge = now - (sessionStorage.getItem('urkio_session_start_time') ? Number(sessionStorage.getItem('urkio_session_start_time')) : 0);
                  if (sessionAge > 5000) {
                    console.warn("[Security] Session invalidated by newer login on another device.");
                    currentSessionIdRef.current = null;
                    auth.signOut();
                    toast.error('Session invalidated. You have been logged in on another device.');
                    return;
                  }
                }
              }

              // 🛡️ [Anonymity] Ensure user has a unique code (DEFERRED)
              if (!data.userCode) {
                setTimeout(async () => {
                   const snap = await getDoc(userRef);
                   if (snap.exists() && !snap.data().userCode) {
                     const userCode = generateUserCode();
                     console.log(`[Anonymity] Generating code for ${currentUser.email}: ${userCode}`);
                     await updateDoc(userRef, { userCode }).catch(err => console.warn('Error backfilling userCode:', err));
                   }
                }, 5000);
              }

              // 🛠️ [Specialist Hub] Automated Provisioning (DEFERRED)
              const isExpert = (data.role && ['specialist', 'expert', 'case_manager', 'admin', 'management', 'manager', 'verifiedexpert', 'practitioner'].includes(data.role.toLowerCase())) || currentUser.email === 'urkio@urkio.com' || currentUser.email === 'banason150@gmail.com' || currentUser.email === 'sameralhalaki@gmail.com';
              if (isExpert && !data.hasSpecialistHub) {
                setTimeout(() => {
                  import('./utils/specialistProvisioning').then(({ provisionSpecialistHub }) => {
                    provisionSpecialistHub(currentUser.uid, data).catch(err => console.error("Provisioning failed:", err));
                  });
                }, 8000);
              }

              setLoading(false);
              clearTimeout(loadingTimeout);

              // Re-trigger onboarding if they haven't finished it
              if (data.onboardingCompleted === false) {
                setShowOnboarding(true);
              }
            } else {
              console.log("No user document found, checking signup data...");
              const storedData = sessionStorage.getItem('urkio_signup_data');
              const signUpData = storedData ? JSON.parse(storedData) : null;
              
              const rawUserType = signUpData?.userType || signUpData?.role || '';
              const isCaseManager = signUpData?.skills === 'Case Manager' || rawUserType === 'case_manager';
              const isExpert = !isCaseManager && (rawUserType === 'expert' || rawUserType === 'specialists' || rawUserType === 'specialist' || rawUserType === 'practitioner');
              
              const newUserData: any = {
                uid: currentUser.uid,
                email: currentUser.email || signUpData?.email || '',
                displayName: signUpData?.fullName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
                photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(signUpData?.fullName || currentUser.email || 'User')}`,
                role: 'user', 
                verificationStatus: 'none',
                isOnline: true, 
                lastActive: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                bio: signUpData?.bio || '',
                pronouns: signUpData?.pronouns || '',
                goals: signUpData?.goals || '',
                primaryRole: '',
                skills: '',
                npiNumber: '',
                baaAccepted: false,
                userType: 'user',
                fullName: signUpData?.fullName || '',
                age: signUpData?.age ? Number(signUpData.age) : null,
                gender: signUpData?.gender || '',
                location: signUpData?.location || '',
                phone: signUpData?.phone || '',
                occupation: signUpData?.occupation || '',
                maritalStatus: signUpData?.maritalStatus || '',
                onboardingCompleted: false,
                userCode: generateUserCode()
              };

              await setDoc(userRef, newUserData);
              // The snapshot listener will catch this new document and call setUserData
              sessionStorage.removeItem('urkio_signup_data');
              setShowOnboarding(true);
              sessionStorage.setItem('urkio_just_signed_up', 'true');
            }
          }, (error) => {
            console.error("Error in user data snapshot:", error);
            
            if (error.code === 'permission-denied') {
              setAuthError("Permission denied: Could not fetch user profile document.");
            } else if (error.code === 'resource-exhausted') {
              setAuthError("Urkio is currently under high load (Firestore Quota Limit).");
            }
            
            setLoading(false);
          });

        } catch (error: any) {
          console.error("Error in onAuthStateChanged setup:", error);
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      } else {
        setUserData(null);
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    });

    // Add a secondary timeout for the entire auth observer just in case
    const authObserverTimeout = setTimeout(() => {
      if (loading) {
        console.warn("[Auth] Auth observer timed out. Forcing loading state to false.");
        setLoading(false);
      }
    }, 7000); // Reduced from 12s to 7s to match main timeout context

    // Heartbeat for presence
    const heartbeatInterval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userRef, {
            lastActive: serverTimestamp(),
            isOnline: true
          }, { merge: true });
        } catch (e) {
          console.warn("Heartbeat failed:", e);
        }
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Offline on tab close (Best effort)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        // We don't wait for this as tab might be closing
        setDoc(userRef, { isOnline: false }, { merge: true }).catch(() => {});
      } else if (document.visibilityState === 'visible' && auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        setDoc(userRef, { isOnline: true, lastActive: serverTimestamp() }, { merge: true }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      if (userDocUnsubscribe) userDocUnsubscribe();
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(loadingTimeout);
      clearTimeout(authObserverTimeout);
    };
  }, []);

  // [Optimized] Security listener now merged into the main onAuthStateChanged listener above.

  // Safety timeout for isAuthenticating state (specifically for mobile redirects)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAuthenticating) {
      console.log("[Auth] Starting isAuthenticating safety timeout...");
      timeout = setTimeout(() => {
        console.warn("[Auth] isAuthenticating state timed out. Resetting flag.");
        setIsAuthenticating(false);
        setLoading(false); // Also force loading off if we're in a middle of something
        sessionStorage.removeItem('urkio_redirect_pending');
      }, 8000); // Reduced from 15s to 8s
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isAuthenticating]);

  const handleLogin = async (email?: string, password?: string, isGoogle?: boolean, isApple?: boolean) => {
    setAuthError(null);
    setIsAuthenticating(true);
    console.log('[Auth] Initiating login...', { isGoogle, isApple, email: email ? '***' : null });

    try {
      if (isGoogle) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        console.log('[Auth] Starting Google sign-in with popup');
        const result = await signInWithPopup(auth, provider);
        console.log('[Auth] Google popup sign-in successful:', result.user.email);
        setIsAuthenticating(false);
      } else if (isApple) {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        
        console.log('[Auth] Starting Apple sign-in with popup');
        const result = await signInWithPopup(auth, provider);
        console.log('[Auth] Apple popup sign-in successful:', result.user.email);
        setIsAuthenticating(false);
      } else if (email && password) {
        console.log('[Auth] Starting Email/Password sign-in');
        await signInWithEmailAndPassword(auth, email, password);
        setIsAuthenticating(false);
      }
    } catch (error: any) {
      console.error('[Auth] Login error detail:', error);
      setIsAuthenticating(false);
      
      let errorMessage = 'An unexpected error occurred during sign-in.';
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password sign-in is not enabled in Firebase Console.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again if you\'d like to sign in.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for authentication. Check Firebase Console.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      setAuthError(errorMessage);
    }
  };

  const handleSignUp = async (signUpData: any, isGoogle: boolean, isApple: boolean) => {
    setAuthError(null);
    setIsAuthenticating(true);
    console.log('[Auth] SignUp attempt:', { isGoogle, isApple, email: signUpData.email });
    sessionStorage.setItem('urkio_signup_data', JSON.stringify(signUpData));

    try {
      if (isGoogle || isApple) {
        const provider = isGoogle ? new GoogleAuthProvider() : new OAuthProvider('apple.com');
        if (isApple) {
          (provider as OAuthProvider).addScope('email');
          (provider as OAuthProvider).addScope('name');
        }
        
        console.log(`[Auth] Starting ${isGoogle ? 'Google' : 'Apple'} sign-up with popup`);
        const result = await signInWithPopup(auth, provider);
        console.log(`[Auth] ${isGoogle ? 'Google' : 'Apple'} popup sign-up successful:`, result.user.email);
        setIsAuthenticating(false);
      } else if (signUpData.email && signUpData.password) {
        await createUserWithEmailAndPassword(auth, signUpData.email, signUpData.password);
        setIsAuthenticating(false);
      }
    } catch (error: any) {
      console.error('[Auth] Error signing up:', error);
      setIsAuthenticating(false);
      sessionStorage.removeItem('urkio_signup_data');
      
      let errorMessage = error.message;
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password sign-in is not enabled. Please enable it in the Firebase Console.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-up was cancelled. Please try again if you\'d like to join.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for authentication. Check Firebase Console.';
      } else if (error.message && error.message.includes('redirect_uri_mismatch')) {
        errorMessage = 'Google configuration error (redirect_uri_mismatch). Please ensure the redirect URI is whitelisted.';
      }
      
      setAuthError(errorMessage);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing Urkio...</p>
      </div>
    );
  }

  return (
    <AppProvider>
      <ThemeProvider>
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        {user && <SessionTimeout />}
          <Router>
            <CallProvider>
              <Layout 
              user={user} 
              userData={userData}
              onLogin={handleLogin}
              onSignUp={handleSignUp}
              authError={authError}
              setAuthError={setAuthError}
              isAuthenticating={isAuthenticating}
            >
              <Suspense fallback={
                <div className="flex items-center justify-center p-20">
                  <Loader2 className="w-10 h-10 animate-spin text-ur-primary" />
                </div>
              }>
                <Routes>
                  {/* Public Routes - Accessible to everyone */}
                  <Route path="/landing" element={
                    user ? <Navigate to="/" replace /> : <LandingPage onLogin={handleLogin} onSignUp={handleSignUp} authError={authError} setAuthError={setAuthError} isAuthenticating={isAuthenticating} />
                  } />
                  <Route path="/expert-list" element={<ExpertList user={user} userData={userData} />} />
                  <Route path="/healing-courses" element={<HealingCourses user={user} userData={userData} />} />
                  <Route path="/therapy-room" element={user ? <TherapyRoom user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/dietitians" element={<Navigate to="/expert-list" replace />} />
                  <Route path="/user/:userId" element={<PublicProfile currentUser={user} userData={userData} />} />
                  <Route path="/user/:userId/edit" element={user ? <Navigate to={`/user/${user.uid}?tab=settings`} replace /> : <Navigate to="/landing" replace />} />
                  
                  {/* Core Logic: If logged in, show dashboard. If not, show landing page at root */}
                  <Route path="/" element={
                    user ? <Home user={user} userData={userData} /> : <Navigate to="/landing" replace />
                  } />

                  {/* Private Routes - Require authentication */}
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsAndConditions user={user} />} />
                  <Route path="/healing-center" element={<HealingCenter user={user} userData={userData} />} />
                  <Route path="/specialist-hub" element={<Navigate to="/healing-center" replace />} />
                  <Route path="/specialist-dashboard" element={user ? <SpecialistDashboard user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/expert-dashboard" element={user ? <ExpertDashboard user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/agenda" element={user ? <MFAGate user={user} userData={userData}><Agenda user={user} userData={userData} /></MFAGate> : <Navigate to="/landing" replace />} />
                  <Route path="/clinical-workstation" element={user ? <MFAGate user={user} userData={userData}><ClinicalWorkstation user={user} userData={userData} /></MFAGate> : <Navigate to="/landing" replace />} />
                  <Route path="/records" element={user ? <ClinicalWorkstation user={user} userData={userData} initialTab="records" /> : <Navigate to="/landing" replace />} />
                  <Route path="/notes" element={user ? <ClinicalWorkstation user={user} userData={userData} initialTab="notes" /> : <Navigate to="/landing" replace />} />
                  <Route path="/plans" element={user ? <ClinicalWorkstation user={user} userData={userData} initialTab="plans" /> : <Navigate to="/landing" replace />} />
                  {/* <Route path="/clinical/new" element={user ? <ClinicalIntake user={user} userData={userData} /> : <Navigate to="/landing" replace />} /> */}
                  <Route path="/experts" element={<Navigate to="/expert-list" replace />} />
                  <Route path="/guide" element={user ? <UrkioGuide user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/verify" element={user ? <ExpertVerificationForm user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/admin-portal" element={<AdminPortal />} />
                  <Route path="/admin" element={user ? <MFAGate user={user} userData={userData}><AdminDashboard user={user} userData={userData} /></MFAGate> : <Navigate to="/admin-portal" replace />} />
                  <Route path="/admin/beta-insights" element={user ? <MFAGate user={user} userData={userData}><AdminBetaInsights user={user} userData={userData} /></MFAGate> : <Navigate to="/admin-portal" replace />} />
                  <Route path="/tasks" element={user ? <MFAGate user={user} userData={userData}><Tasks user={user} /></MFAGate> : <Navigate to="/landing" replace />} />
                  <Route path="/journey" element={user ? <MFAGate user={user} userData={userData}><PatientJourney user={user} userData={userData} /></MFAGate> : <Navigate to="/landing" replace />} />
                  <Route path="/events" element={user ? <Events user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/profile" element={user ? <Navigate to={`/user/${user.uid}?tab=settings`} replace /> : <Navigate to="/landing" replace />} />
                  <Route path="/settings" element={user ? <Settings user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/homii" element={user ? <Homii user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/live" element={user ? <LiveStreamStudio user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/vault" element={user ? <SecretVault user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/room/:roomId" element={user ? <RoomPageRoute user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/call/:roomId" element={user ? <RoomPageRoute user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/conference" element={user ? <LiveStreamStudio user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/conference/:roomId" element={user ? <ConferenceRoom user={user} userData={userData} /> : <GuestConferenceJoin />} />
                  <Route path="/healing-suite/:sessionId" element={user ? <HealingRoom user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/messenger" element={user ? <Messenger user={user} userData={userData} /> : <Navigate to="/landing" replace />} />
                  <Route path="/inbox" element={user ? <Navigate to="/messenger" replace /> : <Navigate to="/landing" replace />} />
                  
                  <Route path="/auth/action" element={<AuthAction />} />

                  <Route path="*" element={<Navigate to={user ? "/" : "/landing"} replace />} />
                </Routes>
              </Suspense>
            </Layout>
          
          {/* Onboarding: shown after new signup, requires hobbies (all users) + skills (experts) */}
          {showOnboarding && user && userData && (
            <OnboardingModal
              isOpen={showOnboarding}
              user={user}
              userData={userData}
              onComplete={() => {
                setShowOnboarding(false);
                sessionStorage.removeItem('urkio_just_signed_up');
              }}
            />
          )}

          {/* OS Push Notification Permission Banner — only for logged-in users */}
          {user && <NotificationPermissionBanner onRequest={requestPermission} />}

          {/* Floating AI Voice Agent — visible to ALL logged-in users */}
          {user && <VoiceAgentWidget user={user} userData={userData} />}
            
            </CallProvider>
          </Router>
      </ThemeProvider>
    </AppProvider>
  );
}
