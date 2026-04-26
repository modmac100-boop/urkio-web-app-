import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  user: any;
  userData: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, userData }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const role = (userData?.role || userData?.userType || '').toLowerCase();
  const isVerified = userData?.verificationStatus === 'verified';
  const isAdmin = ['founder', 'admin', 'management', 'manager'].includes(role) || 
                  ['urkio@urkio.com', 'sameralhalaki@gmail.com', 'banason150@gmail.com'].includes(user?.email?.toLowerCase() || '');
  
  const isSpecialRole = isAdmin || (['specialist', 'expert', 'verifiedexpert', 'practitioner'].includes(role) && isVerified);

  const navItems = [
    { label: t('nav.instantCall'), icon: 'radio_button_checked', path: '/conference', active: location.pathname === '/conference', highlight: true },
    ...(isSpecialRole ? [
      { label: t('nav.commandCenter', 'Clinical Command Center'), icon: 'shield_person', path: '/specialist-dashboard', active: location.pathname === '/specialist-dashboard', highlight: true },
      { label: t('nav.myAgenda'), icon: 'dashboard', path: '/agenda', active: location.pathname === '/agenda', highlight: false },
      { label: t('nav.practice'), icon: 'clinical_notes', path: '/clinical-workstation', active: location.pathname === '/clinical-workstation', highlight: false },
      { label: t('nav.therapyRoom'), icon: 'video_camera_front', path: '/therapy-room', active: location.pathname === '/therapy-room', highlight: false }
    ] : []),
    { label: t('nav.professionalFeed'), icon: 'dynamic_feed', path: '/', active: location.pathname === '/' },
    { label: t('nav.healingHub'), icon: 'spa', path: '/healing-center', active: location.pathname === '/healing-center' },
    { label: t('nav.courses'), icon: 'menu_book', path: '/healing-courses', active: location.pathname === '/healing-courses' },
    { label: t('nav.inbox'), icon: 'chat', path: '/messenger', active: location.pathname === '/messenger' },
    { label: t('nav.homii'), icon: 'neurology', path: '/homii', active: location.pathname === '/homii' },
    { label: t('nav.upcomingEvents'), icon: 'calendar_month', path: '/events', active: location.pathname === '/events' },
    { label: t('nav.myProfile'), icon: 'account_circle', path: user ? `/user/${user.uid}` : '/landing', active: user && location.pathname === `/user/${user.uid}` },
  ];

  const handleLogout = async () => {
    try {
      if (user?.uid) {
        updateDoc(doc(db, 'users', user.uid), {
          isOnline: false,
          lastActive: serverTimestamp()
        }).catch(err => console.error('Sidebar status update failed:', err));
      }
      
      sessionStorage.clear();
      await signOut(auth);
      window.location.href = '/landing';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="w-full h-[calc(100vh-2rem)] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden sticky top-4">
      {/* User Branding Section */}
      <div className="p-8 pb-4 text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4">
           <button 
             onClick={() => navigate('/settings')}
             className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group/settings"
           >
              <SettingsIcon className="w-4 h-4 text-zinc-400 group-hover/settings:rotate-90 transition-transform duration-500" />
           </button>
        </div>

        <div className="relative mb-4 inline-block">
          <Link to={user ? `/user/${user.uid}` : '/landing'} className="block w-20 h-20 rounded-2xl border-4 border-white dark:border-zinc-900 overflow-hidden mx-auto shadow-lg hover:scale-105 transition-transform duration-500">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-ur-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-white">account_circle</span>
              </div>
            )}
          </Link>
          <div className="absolute -bottom-1 -right-1 size-6 bg-green-500 border-4 border-white dark:border-zinc-900 rounded-full"></div>
        </div>

        <h2 className="font-headline font-black text-xl mb-1 dark:text-white truncate">
          {userData?.displayName || t('home.defaultUser')}
        </h2>
        
        <div className="flex items-center justify-center gap-1.5 mb-4">
           <span className="text-[10px] font-black uppercase tracking-widest text-ur-primary bg-ur-primary/10 px-3 py-1 rounded-full">
              {role || 'User'}
           </span>
           {isSpecialRole && (
             <span className="material-symbols-outlined text-sm text-amber-500 fill-1">verified</span>
           )}
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-100 dark:border-zinc-800">
           <div className="text-center">
              <p className="text-lg font-black dark:text-white">{userData?.followersCount || 0}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('nav.followers')}</p>
           </div>
           <div className="text-center">
              <p className="text-lg font-black dark:text-white">{userData?.followingCount || 0}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('nav.following')}</p>
           </div>
        </div>
      </div>

      {/* Navigation section */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
        <nav className="space-y-1">
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className={clsx(
                "flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all font-headline font-black text-sm group relative overflow-hidden",
                item.highlight
                  ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20 hover:bg-amber-500 animate-pulse"
                  : item.active 
                  ? "bg-ur-primary/10 text-ur-primary dark:bg-ur-primary/20 dark:text-blue-400" 
                  : "text-zinc-500 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <span className={clsx("material-symbols-outlined text-xl transition-transform group-hover:scale-110", item.active && "fill-1")}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.active && !item.highlight && <div className="w-1.5 h-6 bg-ur-primary rounded-full absolute inset-e-2"></div>}
            </Link>
          ))}
          
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-headline font-black text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 group mt-4 border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
              <span className="flex-1 text-start">{t('nav.signOut')}</span>
            </button>
          )}
        </nav>

        {/* Support section */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 px-6 italic">{t('nav.platformStandards')}</h3>
          <ul className="space-y-4 px-6">
            {[
              { icon: 'shield_heart', text: t('nav.safetyFirst'), color: 'text-rose-500' },
              { icon: 'verified', text: t('nav.verifiedExperts'), color: 'text-ur-primary' },
              { icon: 'auto_awesome', text: t('nav.aiExpertGuide'), color: 'text-blue-400' }
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                <span className={`material-symbols-outlined text-lg ${item.color}`}>{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Subscription Widget */}
        <div className="px-2 mt-4">
           {(() => {
              const getPlanDetails = (r: string | undefined) => {
                switch(r) {
                  case 'founder':
                  case 'PlatformAdmin':
                  case 'VisionaryLeader_Cohort_2024': return { name: 'Visionary Leadership', badge: 'PRO' };
                  case 'expert':
                  case 'specialist':
                  case 'AccreditedPractitioner_Active': return { name: 'Practitioner Track', badge: 'PRO' };
                  case 'PremiumUser': return { name: 'Transformation Package', badge: 'PLUS' };
                  case 'StandardUser': return { name: 'Growth Tier', badge: 'ACTIVE' };
                  default: return { name: 'The Essential Pass', badge: 'FREE' };
                }
              };
              const plan = getPlanDetails(role);
              
              return (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-4xl text-white">workspace_premium</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">My Subscription</p>
                  <h3 className="font-headline font-black text-white mb-2">{plan.name} <span className="text-[10px] bg-ur-primary text-white px-2 py-0.5 rounded-full tracking-widest ml-1 uppercase font-black">{plan.badge}</span></h3>
                  
                  <button 
                    onClick={() => {
                        window.location.href = '/landing#investment';
                    }}
                    className="w-full mt-4 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-ur-primary hover:text-white transition-all shadow-xl active:scale-95"
                  >
                    Manage Plan
                  </button>
                </div>
              );
           })()}
        </div>
      </div>
    </aside>
  );
};
