import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { onSnapshot, collection, query, where, limit, getDocs, orderBy, doc, updateDoc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { Bell } from 'lucide-react';
import { auth, db } from '../firebase';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { BottomNav } from './BottomNav';
import { GlobalSearch } from './GlobalSearch';
import { NotificationCenter } from './notifications/NotificationCenter';
import LanguageToggle from './LanguageToggle';
import { Sidebar } from './Sidebar';
import { SideChat } from './messaging/SideChat';
import { Logo } from './Logo';
import { SignInModal } from './SignInModal';
import { SignUpModal } from './SignUpModal';
import { AvatarWithBadges } from './UserBadges';
import { CallInterface } from './messaging/CallInterface';

export function Layout({ 
  children, 
  user, 
  userData,
  onLogin,
  onSignUp,
  authError,
  setAuthError,
  isAuthenticating 
}: any) {
  const { actualTheme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isClinical = location.pathname === '/specialist-hub' || location.pathname.startsWith('/room');
  const isAdmin = location.pathname === '/admin';
  const isRTL = i18n.language === 'ar';

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [signupType, setSignupType] = useState<'user' | 'expert'>('user');
  const { activeChatPartner, setActiveChatPartner } = useApp();


  useEffect(() => {
    const handleOpenSignIn = () => {
      setIsSignInModalOpen(true);
    };
    const handleOpenSignUp = (e: any) => {
      if (e.detail?.type) setSignupType(e.detail.type);
      setIsSignUpModalOpen(true);
    };

    window.addEventListener('open-signin', handleOpenSignIn);
    window.addEventListener('open-signup', handleOpenSignUp);

    if (sessionStorage.getItem('urkio_just_signed_up') === 'true') {
      sessionStorage.removeItem('urkio_just_signed_up');
      navigate('/profile');
    }

    return () => {
      window.removeEventListener('open-signin', handleOpenSignIn);
      window.removeEventListener('open-signup', handleOpenSignUp);
    };
  }, [navigate]);

  // ── Auto-close auth modals once user is authenticated ──────────────────────
  useEffect(() => {
    if (user) {
      setIsSignInModalOpen(false);
      setIsSignUpModalOpen(false);
      setAuthError(null);
    }
  }, [user, setAuthError]);


  useEffect(() => {
    if (!user?.uid) return;

    // Listen for unread notifications
    const qNotif = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    }, (err) => console.error("Notif snapshot error:", err));

    // Listen for conversations with unread messages
    const qMsg = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      where('unreadCount.' + user.uid, '>', 0)
    );
    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      setUnreadMessages(snapshot.size);
    }, (err) => console.error("Msg snapshot error:", err));

      unsubNotif();
      unsubMsg();
    };
  }, [user?.uid]);


  const role = userData?.role?.toLowerCase();
  const userEmail = (user?.email || '').toLowerCase();
  const isSpecialRole = 
    (role && ['specialist', 'expert', 'case_manager', 'admin', 'management', 'manager', 'verifiedexpert', 'practitioner'].includes(role)) || 
    userEmail.includes('urkio') || 
    userEmail === 'sameralhalaki@gmail.com' ||
    userEmail === 'banason150@gmail.com';

  const navItems = [
    ...(isSpecialRole ? [
      { path: '/agenda', label: t('nav.myAgenda'), icon: 'dashboard', highlight: true },
      { path: '/clinical-workstation', label: t('nav.practice'), icon: 'clinical_notes', highlight: false }
    ] : []),
    { path: '/', label: t('nav.professionalFeed'), icon: 'dynamic_feed' },
    { path: '/homii', label: t('nav.homii'), icon: 'neurology' },
    { path: '/messenger', label: t('nav.inbox'), icon: 'chat_bubble' },
    { path: '/conference', label: t('nav.instantCall'), icon: 'videocam' },
    { path: '/expert-list', label: t('nav.expertList'), icon: 'verified_user' },
  ];

  const handleLogout = async () => {
    try {
      if (user?.uid) {
        // Attempt to update online status, but don't let failure block the logout
        updateDoc(doc(db, 'users', user.uid), {
          isOnline: false,
          lastActive: serverTimestamp()
        }).catch(err => console.error('Status update failed:', err));
      }
      
      // Clear session before redirecting
      sessionStorage.clear();
      
      // Perform sign out
      await signOut(auth);
      
      // Force hard redirect to landing to clear all states
      window.location.href = '/landing';
    } catch (error) {
      console.error('Logout error:', error);
      // Fail-safe: try to redirect even if signOut crashes
      window.location.href = '/landing';
    }
  };




  const hideHeaderPaths = ['/landing', '/messenger', '/agenda', '/clinical-workstation'];
  const hideSidebarPaths = ['/landing', '/messenger', '/announce', '/specialist-hub', '/admin', '/agenda', '/clinical-workstation'];
  const showSidebar = !hideSidebarPaths.includes(location.pathname);

  if (hideHeaderPaths.includes(location.pathname)) {
    return (
      <>
        {children}
        <SignInModal 
          isOpen={isSignInModalOpen} 
          onClose={() => { setIsSignInModalOpen(false); setAuthError(null); }} 
          onSignIn={onLogin}
          error={authError}
          isAuthenticating={isAuthenticating}
          onSwitchToSignUp={() => {
            setIsSignInModalOpen(false);
            setSignupType('user');
            setIsSignUpModalOpen(true);
          }}
        />
        <SignUpModal 
          isOpen={isSignUpModalOpen} 
          onClose={() => { setIsSignUpModalOpen(false); setAuthError(null); }} 
          onComplete={onSignUp}
          error={authError}
          isAuthenticating={isAuthenticating}
          onSwitchToSignIn={() => {
            setIsSignUpModalOpen(false);
            setIsSignInModalOpen(true);
          }}
        />
      </>
    );
  }

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'}
      className={clsx("flex flex-col min-h-screen font-body transition-colors duration-700 bg-ur-background text-ur-on-surface")}
    >
      {/* Specialist Dashboard Floating Mobile Button */}
      {isSpecialRole && (
        <button
          onClick={() => navigate('/agenda')}
          className="xl:hidden fixed bottom-6 inset-e-6 z-40 bg-ur-primary text-white p-4 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce-slow border-2 border-white/20"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-black uppercase tracking-widest">{t('nav.myAgenda')}</span>
        </button>
      )}

      {/* Top Header Navigation */}
      <header className={clsx(
        "h-16 shrink-0 border-b z-50 sticky top-0 backdrop-blur-xl transition-all duration-500",
        "bg-white/80 dark:bg-ur-background/80 glass-nav border-zinc-100 dark:border-zinc-800"
      )}>
        <div className="max-w-[1600px] mx-auto h-full px-8 flex items-center justify-between font-headline tracking-wide">
          {/* Logo & Primary Nav */}
          <div className="flex items-center gap-8 shrink-0">
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Logo showText={true} />
            </Link>
            

          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4">
              <GlobalSearch />
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <LanguageToggle />
              <button 
                onClick={toggleTheme}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400">
                  {actualTheme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>
            
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1 border-e border-zinc-100 dark:border-zinc-800 pe-4">
                  <button 
                    onClick={() => navigate('/messenger?action=video')}
                    className="p-2 text-zinc-400 hover:text-ur-primary hover:bg-ur-primary/5 rounded-xl transition-all group" 
                    title="Start Video Call"
                  >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">video_call</span>
                  </button>
                  <button 
                    onClick={() => navigate('/messenger?action=audio')}
                    className="p-2 text-zinc-400 hover:text-ur-primary hover:bg-ur-primary/5 rounded-xl transition-all group" 
                    title="Start Voice Call"
                  >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">phone</span>
                  </button>
                </div>

                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all relative group"
                  aria-label="Notifications"
                >
                  <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform">notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-2 inset-e-2 flex h-4 w-4 rounded-full bg-red-500 border-2 border-white dark:border-zinc-900 text-[10px] items-center justify-center text-white font-black animate-in zoom-in duration-300">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                <NotificationCenter 
                  userId={user.uid} 
                  isOpen={isNotificationsOpen} 
                  onClose={() => setIsNotificationsOpen(false)} 
                />

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-on-surface">{userData?.displayName || user.displayName}</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {userData?.role === 'specialist' ? t('common.expert') : (userData?.role || t('common.member'))}
                  </span>
                </div>

                <Link to={`/user/${user.uid}`} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-ur-primary/10 hover:scale-105 transition-transform">
                  <AvatarWithBadges 
                    userData={userData} 
                    src={userData?.photoURL || user.photoURL} 
                    name={userData?.displayName || user.displayName} 
                    sizeClass="w-full h-full"
                    isOnline={userData?.isOnline}
                  />
                </Link>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="hidden sm:block p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                >
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className="px-6 py-2 bg-ur-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity text-sm"
              >
                {t('common.login')}
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="xl:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-transparent active:border-ur-primary/20"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="xl:hidden absolute top-full inset-s-0 w-full bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 p-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-2 gap-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      item.highlight
                        ? "bg-amber-400 text-black font-black col-span-2 shadow-md"
                        : isActive 
                        ? "bg-ur-primary/10 text-ur-primary font-bold"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            
            {user && (
              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('common.appearance')}</span>
                    <button 
                      onClick={toggleTheme}
                      className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                    >
                       <span className="material-symbols-outlined text-sm">
                        {actualTheme === 'dark' ? 'light_mode' : 'dark_mode'}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('common.mode')}</span>
                     <LanguageToggle />
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-rose-500/10 text-rose-600 font-black uppercase text-xs tracking-widest hover:bg-rose-500/20 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  {t('nav.signOut')}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Background Ambience */}
      <div className="fixed bottom-32 -inset-s-32 size-64 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed top-1/2 -inset-e-32 size-64 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        <main className={clsx("flex-1 overflow-y-auto custom-scrollbar xl:pb-0 mobile-safe-bottom", 
          location.pathname === '/experts' || location.pathname === '/admin' || location.pathname === '/messenger' ? "" : "p-4 md:p-8"
        )}>
          <div className={clsx(
            location.pathname === '/announce' ? "w-full h-full" : "max-w-[1600px] mx-auto",
            showSidebar && "grid grid-cols-12 gap-8"
          )}>
            {showSidebar && <div className="hidden lg:block lg:col-span-3 xl:col-span-2"><Sidebar user={user} userData={userData} /></div>}
            <section className={clsx(showSidebar ? "col-span-12 lg:col-span-9 xl:col-span-10" : "w-full")}>
              {children}
            </section>
          </div>
        </main>


        {activeChatPartner && location.pathname !== '/messenger' && (
          <SideChat
            partner={activeChatPartner}
            currentUser={user}
            userData={userData}
            onClose={() => setActiveChatPartner(null)}
          />
        )}

        <SignInModal 
          isOpen={isSignInModalOpen} 
          onClose={() => { setIsSignInModalOpen(false); setAuthError(null); }} 
          onSignIn={onLogin}
          error={authError}
          isAuthenticating={isAuthenticating}
          onSwitchToSignUp={() => {
            setIsSignInModalOpen(false);
            setSignupType('user');
            setIsSignUpModalOpen(true);
          }}
        />
        <SignUpModal 
          isOpen={isSignUpModalOpen} 
          onClose={() => { setIsSignUpModalOpen(false); setAuthError(null); }} 
          onComplete={onSignUp}
          error={authError}
          isAuthenticating={isAuthenticating}
          onSwitchToSignIn={() => {
            setIsSignUpModalOpen(false);
            setIsSignInModalOpen(true);
          }}
        />


      </div>

      {/* 🛡️ PDPL 2026 Compliance Footer */}
      <footer className="h-12 shrink-0 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center px-8 relative z-40 bg-white dark:bg-ur-background">
        <Link 
          to="/privacy" 
          className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-emerald-600 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xs!">verified_user</span>
          {i18n.language === 'ar' ? 'ملخص الخصوصية (قانون حماية البيانات 2026)' : 'Privacy Summary (PDPL 2026)'}
        </Link>
      </footer>
      <BottomNav isSpecialRole={isSpecialRole} />
    </div>
  );
}
