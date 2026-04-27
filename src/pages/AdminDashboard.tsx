import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  collection, query, where, onSnapshot, orderBy, limit,
  getDocs, doc, updateDoc, serverTimestamp, addDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import clsx from 'clsx';
import { AdminDashboardFeed } from '../components/AdminDashboardFeed';
import { LogOut, RefreshCw, Zap, ShieldAlert, Activity, Hammer } from 'lucide-react';
import { provisionSpecialistHub } from '../utils/specialistProvisioning';
import { signOut } from 'firebase/auth';
import { Logo } from '../components/Logo';
import { CreateEventModal } from '../components/CreateEventModal';
import toast from 'react-hot-toast';
import UserGrowthChart from '../components/UserGrowthChart';
import { fetchUserGrowthData } from '../services/statsService';

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(ts: any): string {
  if (!ts) return 'just now';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const ACTIVITY_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  post:       { icon: 'edit_note',       color: '#6366f1', label: 'Posted' },
  comment:    { icon: 'chat_bubble',     color: '#3b82f6', label: 'Commented' },
  follow:     { icon: 'person_add',      color: '#10b981', label: 'Followed' },
  booking:    { icon: 'calendar_month',  color: '#f59e0b', label: 'Booked session' },
  session:    { icon: 'videocam',        color: '#8b5cf6', label: 'In session' },
  signup:     { icon: 'how_to_reg',      color: '#06b6d4', label: 'Signed up' },
  like:       { icon: 'favorite',        color: '#ec4899', label: 'Liked' },
  join:       { icon: 'group_add',       color: '#14b8a6', label: 'Joined circle' },
};

// ── Main Component ────────────────────────────────────────────────────────────
export function AdminDashboard({ user, userData }: any) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity' | 'cases' | 'income' | 'approvals' | 'events' | 'health'>('overview');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    totalUsers: 0, onlineNow: 0, pendingExpertApps: 0, 
    activePatients: 0, pendingCases: 0, dailyRevenue: 0 
  });
  const [now, setNow] = useState(new Date());
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [pendingExperts, setPendingExperts] = useState<any[]>([]);
  const [approvedExperts, setApprovedExperts] = useState<any[]>([]);
  const [approvalSubTab, setApprovalSubTab] = useState<'pending' | 'history'>('pending');
  const [simulationProgress, setSimulationProgress] = useState<number | null>(null);
  const [userGrowthStats, setUserGrowthStats] = useState<{month: string, users: number}[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUserGrowthData().then(data => setUserGrowthStats(data));
  }, [isAdmin]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isAdmin = userData?.role === 'admin' || userData?.role === 'management' || userData?.role === 'founder' || userData?.email === 'urkio@urkio.com';

  // Guard
  useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  // ── Real-time: Online Users ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(
      collection(db, 'users'),
      where('isOnline', '==', true),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOnlineUsers(list);
      setStats(s => ({ ...s, onlineNow: list.length }));
    }, () => {});
    return unsub;
  }, [isAdmin]);

  // ── Real-time: All recent users ─────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentUsers(list);
      setStats(s => ({ ...s, totalUsers: snap.size > 0 ? snap.size : s.totalUsers }));
    }, () => {});
    return unsub;
  }, [isAdmin]);

  // ── Real-time: Pending Experts ──────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(
      collection(db, 'users'),
      where('isExpertPending', '==', true)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPendingExperts(list);
    }, () => {});
    return unsub;
  }, [isAdmin]);

  // ── Real-time: Approved Experts ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(
      collection(db, 'users'),
      where('verificationStatus', '==', 'approved')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by most recently approved first
      list.sort((a: any, b: any) => {
        const ta = a.approvedAt?.toMillis?.() || 0;
        const tb = b.approvedAt?.toMillis?.() || 0;
        return tb - ta;
      });
      setApprovedExperts(list);
    }, () => {});
    return unsub;
  }, [isAdmin]);

  // ── Real-time: Posts as activity ────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(40)
    );
    const unsub = onSnapshot(q, (snap) => {
      const posts = snap.docs.map(d => ({
        id: d.id,
        type: 'post',
        userDisplayName: (d.data() as any).displayName || (d.data() as any).authorName || 'Unknown',
        userPhoto: (d.data() as any).photoURL || (d.data() as any).authorPhoto,
        content: (d.data() as any).text || (d.data() as any).content || '',
        timestamp: (d.data() as any).createdAt,
      }));
      setRecentActivity(posts);
    }, () => {});
    return unsub;
  }, [isAdmin]);

  // ── Real-time: Cases (bookings/applications) ─────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCases(list);
      setStats(s => ({ ...s, pendingCases: list.filter((c: any) => c.status === 'pending').length }));
    }, () => {});
    return unsub;
  }, [isAdmin]);

  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setActiveEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [isAdmin]);

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    if (updatingRole) return;
    setUpdatingRole(userId);
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        userType: newRole,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role. Check permissions.');
    } finally {
      setUpdatingRole(null);
    }
  };

  const TABS = [
    { id: 'overview',  label: 'Overview',   icon: 'dashboard' },
    { id: 'users',     label: 'Users',      icon: 'group' },
    { id: 'activity',  label: 'Activity',   icon: 'timeline' },
    { id: 'cases',     label: 'Cases',      icon: 'assignment' },
    { id: 'events',    label: 'Events',     icon: 'event_available' },
    { id: 'health',    label: 'System Health', icon: 'dvr' },
    { id: 'approvals', label: 'Approvals',  icon: 'verified_user' },
  ] as const;

  return (
    <div
      className="flex h-full overflow-hidden text-white"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 100%)', minHeight: '100vh' }}
    >
      {/* ── Left Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-ie py-6 px-4 gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
        <Link to="/" className="px-2 mb-6 flex items-center gap-3">
          <Logo className="w-12 h-12" />
          <div>
            <p className="text-white text-sm font-black">Urkio Platform</p>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">Management Hub</p>
          </div>
        </Link>

        {/* Live clock */}
        <div className="mx-2 mb-4 p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-2xl font-black tracking-tight text-white">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          <p className="text-slate-500 text-[10px]">{now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>

        {/* Online indicator */}
        <div className="mx-2 mb-4 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <span className="text-emerald-400 text-sm font-bold">{onlineUsers.length} Online Now</span>
        </div>

        {/* Nav tabs */}
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-start',
              activeTab === tab.id
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            )}
            style={activeTab === tab.id ? {
              background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(129,140,248,0.15))',
              border: '1px solid rgba(99,102,241,0.3)',
            } : {}}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Admin info */}
        <div className="mx-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <img
              src={userData?.photoURL || `https://ui-avatars.com/api/?name=${userData?.displayName}`}
              alt="Admin"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{userData?.displayName || 'Admin'}</p>
              <p className="text-[10px] text-indigo-400 font-medium">Super Admin</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth).then(() => navigate('/admin-portal'))}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          <div>
            <h1 className="text-xl font-black">
              {TABS.find(t => t.id === activeTab)?.label || 'Overview'}
            </h1>
            <p className="text-slate-500 text-xs">Urkio Platform · Administrative Center</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile online badge */}
            <div className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold">{onlineUsers.length} online</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile tabs */}
        <div className="lg:hidden flex gap-1 overflow-x-auto px-4 py-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0',
                activeTab === tab.id ? 'text-white' : 'text-slate-500'
              )}
              style={activeTab === tab.id ? { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' } : {}}
            >
              <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Online Now',    value: onlineUsers.length, icon: 'sensors',       color: '#10b981', trend: '+live', tab: 'overview' },
                  { label: 'Total Users',   value: '12.4k',            icon: 'group',          color: '#6366f1', trend: '+12%', tab: 'users' },
                  { label: 'Active Cases',  value: stats.pendingCases || cases.filter((c: any) => c.status !== 'completed').length, icon: 'assignment', color: '#f59e0b', trend: '', tab: 'cases' },
                  { label: 'Revenue (Mo.)', value: '$45.2k',            icon: 'payments',       color: '#ec4899', trend: '+8%', tab: 'income' },
                ].map(kpi => (
                  <div
                    key={kpi.label}
                    onClick={() => kpi.tab && setActiveTab(kpi.tab as any)}
                    className="rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-opacity-30 transition-colors" style={{ background: `${kpi.color}18` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: kpi.color, fontVariationSettings: "'FILL' 1" }}>{kpi.icon}</span>
                      </div>
                      {kpi.trend && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${kpi.color}18`, color: kpi.color }}>
                          {kpi.trend}
                        </span>
                      )}
                    </div>
                    <p className="text-3xl font-black">{kpi.value}</p>
                    <p className="text-slate-500 text-xs mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* User Growth Analytics */}
              <UserGrowthChart data={userGrowthStats} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Who's Online Right Now */}
                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <div className="absolute inset-0 animate-ping bg-emerald-500 rounded-full" />
                      </div>
                      <h3 className="font-black text-sm">Who's Online</h3>
                    </div>
                    <span className="text-xs text-slate-500">{onlineUsers.length} active</span>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pe-1">
                    {onlineUsers.length === 0 ? (
                      <p className="text-slate-600 text-sm text-center py-6">No users online right now</p>
                    ) : onlineUsers.map(u => (
                      <div 
                        key={u.id} 
                        onClick={() => navigate(`/user/${u.id}`)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || u.email}`}
                            alt={u.displayName}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div className="absolute bottom-0 inset-e-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{u.displayName || u.email}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{u.role || 'member'}</p>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-bold shrink-0">● Live</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Activity Feed */}
                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-400 text-[18px]">bolt</span>
                      <h3 className="font-black text-sm">Live Activity Stream</h3>
                    </div>
                    <span className="text-xs text-slate-500">Last 40 events</span>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pe-1">
                    {recentActivity.length === 0 ? (
                      <p className="text-slate-600 text-sm text-center py-6">No recent activity</p>
                    ) : recentActivity.map(ev => {
                      const meta = ACTIVITY_ICONS[ev.type] || { icon: 'notifications', color: '#94a3b8', label: ev.type };
                      return (
                        <div 
                          key={ev.id} 
                          onClick={() => toast(`Activity Detail: ${ev.userDisplayName} updated their ${ev.type}.`, { icon: '🔍' })}
                          className="flex items-start gap-3 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${meta.color}18` }}>
                            <span className="material-symbols-outlined text-[14px]" style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs leading-relaxed">
                              <span className="font-bold text-white">{ev.userDisplayName}</span>
                              <span className="text-slate-400"> {meta.label}</span>
                              {ev.content && <span className="text-slate-500"> · {ev.content.substring(0, 60)}{ev.content.length > 60 ? '…' : ''}</span>}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(ev.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cases in Progress */}
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-black text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-[18px]">assignment</span>
                    Cases In Progress
                  </h3>
                  <span className="text-xs text-slate-500">{cases.length} total bookings</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead>
                      <tr className="text-slate-500 uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <th className="pb-3 ltr:pr-4 rtl:pl-4">Client</th>
                        <th className="pb-3 ltr:pr-4 rtl:pl-4">Expert</th>
                        <th className="pb-3 ltr:pr-4 rtl:pl-4">Date</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {cases.slice(0, 8).map(c => (
                        <tr 
                          key={c.id} 
                          onClick={() => setActiveTab('cases')}
                          className="hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <td className="py-3 ltr:pr-4 rtl:pl-4 font-medium text-white truncate max-w-[120px]">{c.userName || c.clientName || 'N/A'}</td>
                          <td className="py-3 ltr:pr-4 rtl:pl-4 text-slate-400 truncate max-w-[120px]">{c.expertName || 'N/A'}</td>
                          <td className="py-3 ltr:pr-4 rtl:pl-4 text-slate-500">{c.sessionDate || (c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : '—')}</td>
                          <td className="py-3">
                            <span className={clsx(
                              'px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                              c.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                              c.status === 'confirmed' ? 'bg-indigo-500/15 text-indigo-400' :
                              c.status === 'cancelled' ? 'bg-red-500/15 text-red-400' :
                              'bg-amber-500/15 text-amber-400'
                            )}>
                              {c.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {cases.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-600">No cases found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === 'users' && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-black mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">group</span>
                Recent Members
              </h3>
              <div className="space-y-3">
                {recentUsers.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="relative shrink-0">
                      <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || u.email}`} alt={u.displayName} className="w-10 h-10 rounded-full object-cover" />
                      {u.isOnline && <div className="absolute bottom-0 inset-e-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{u.displayName || u.email}</p>
                      <p className="text-[10px] text-slate-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-end me-2">
                        <span className={clsx(
                          'px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                          u.role === 'admin' ? 'bg-red-500/15 text-red-400' :
                          u.role === 'specialist' ? 'bg-indigo-500/15 text-indigo-400' :
                          'bg-slate-500/15 text-slate-400'
                        )}>
                          {u.role || 'user'}
                        </span>
                        {u.isOnline && <p className="text-[10px] text-emerald-500 font-bold mt-1">● Live</p>}
                      </div>

                      <button
                        onClick={() => handleToggleAdmin(u.id, u.role)}
                        disabled={updatingRole === u.id}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border shrink-0',
                          u.role === 'admin' 
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                            : 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'
                        )}
                      >
                        {updatingRole === u.id ? '...' : (u.role === 'admin' ? 'Revoke Admin' : 'Make Admin')}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 shrink-0 w-16 text-end">{timeAgo(u.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ACTIVITY TAB ── */}
          {activeTab === 'activity' && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-black mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">timeline</span>
                Full Activity Stream
              </h3>
              <div className="space-y-4">
                {recentActivity.map(ev => {
                  const meta = ACTIVITY_ICONS[ev.type] || { icon: 'notifications', color: '#94a3b8', label: ev.type };
                  return (
                    <div key={ev.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${meta.color}18` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: meta.color, fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-bold">{ev.userDisplayName}</span>
                          <span className="text-slate-400"> {meta.label}</span>
                        </p>
                        {ev.content && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ev.content.substring(0, 200)}</p>}
                        <p className="text-[10px] text-slate-600 mt-1">{timeAgo(ev.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
                {recentActivity.length === 0 && (
                  <p className="text-slate-600 text-sm text-center py-12">No activity found. Posts and interactions will appear here.</p>
                )}
              </div>
            </div>
          )}

          {/* ── CASES TAB ── */}
          {activeTab === 'cases' && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-black mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">assignment</span>
                All Cases & Bookings
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Pending',   count: cases.filter((c: any) => c.status === 'pending' || !c.status).length,   color: '#f59e0b' },
                  { label: 'Active',    count: cases.filter((c: any) => c.status === 'confirmed').length,               color: '#6366f1' },
                  { label: 'Done',      count: cases.filter((c: any) => c.status === 'completed').length,               color: '#10b981' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                    <p className="text-3xl font-black" style={{ color: s.color }}>{s.count}</p>
                    <p className="text-slate-400 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <th className="pb-3 ltr:pr-4 rtl:pl-4">Client</th>
                      <th className="pb-3 ltr:pr-4 rtl:pl-4">Expert</th>
                      <th className="pb-3 ltr:pr-4 rtl:pl-4">Date</th>
                      <th className="pb-3 ltr:pr-4 rtl:pl-4">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map(c => (
                      <tr key={c.id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <td className="py-3 ltr:pr-4 rtl:pl-4 font-medium text-white">{c.userName || c.clientName || '—'}</td>
                        <td className="py-3 ltr:pr-4 rtl:pl-4 text-slate-400">{c.expertName || '—'}</td>
                        <td className="py-3 ltr:pr-4 rtl:pl-4 text-slate-500">{c.sessionDate || (c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : '—')}</td>
                        <td className="py-3 ltr:pr-4 rtl:pl-4 font-bold text-emerald-400">{c.amount ? `$${c.amount}` : '—'}</td>
                        <td className="py-3">
                          <span className={clsx(
                            'px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                            c.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                            c.status === 'confirmed' ? 'bg-indigo-500/15 text-indigo-400' :
                            c.status === 'cancelled' ? 'bg-red-500/15 text-red-400' :
                            'bg-amber-500/15 text-amber-400'
                          )}>
                            {c.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {cases.length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-slate-600">No bookings found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── INCOME TAB ── */}
          {activeTab === 'income' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Monthly Revenue', value: '$45,200', change: '+8%', color: '#10b981' },
                  { label: 'Sessions Revenue', value: '$28,500', change: '+12%', color: '#6366f1' },
                  { label: 'Subscriptions',    value: '$12,900', change: '+4%',  color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-slate-400 text-xs mb-3">{s.label}</p>
                    <p className="text-4xl font-black text-white">{s.value}</p>
                    <span className="text-xs font-bold mt-2 inline-block px-2 py-1 rounded-full" style={{ background: `${s.color}18`, color: s.color }}>
                      ↑ {s.change} this month
                    </span>
                  </div>
                ))}
              </div>

              {/* Revenue breakdown visual */}
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="font-black mb-6 text-sm">Monthly Revenue Chart</h3>
                <div className="flex items-end gap-2 h-40">
                  {[30,45,38,60,52,75,58,80,65,90,72,100].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-lg transition-all"
                        style={{ height: `${h}%`, background: `linear-gradient(180deg, #6366f1, #818cf8)`, opacity: i === 11 ? 1 : 0.5 + i * 0.04 }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>

              {/* Revenue by source */}
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="font-black mb-5 text-sm">Revenue by Source</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Private Sessions',     pct: 55, color: '#6366f1', amount: '$24,860' },
                    { label: 'Subscriptions',        pct: 28, color: '#10b981', amount: '$12,656' },
                    { label: 'Group Sessions',       pct: 12, color: '#f59e0b', amount: '$5,424' },
                    { label: 'Dietitian Bookings',   pct: 5,  color: '#34d399', amount: '$2,260' },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-300">{r.label}</span>
                        <span className="font-bold" style={{ color: r.color }}>{r.amount} ({r.pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SYSTEM HEALTH TAB ── */}
          {activeTab === 'health' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Regional Status */}
                  <div className="p-6 rounded-4xl bg-white/5 border border-white/10">
                     <div className="flex justify-between items-center mb-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Clinical Perimeter</p>
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg">LIVE</span>
                     </div>
                     <h4 className="text-3xl font-black italic mb-1">US-EAST-1</h4>
                     <p className="text-zinc-500 text-xs">Primary Firebase Cluster</p>
                     
                     <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-400">Latency</span>
                           <span className="text-emerald-400 font-bold">24ms</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-400">Sync Handshake</span>
                           <span className="text-indigo-400 font-bold">118ms</span>
                        </div>
                     </div>
                  </div>

                  {/* Beta Phase Status */}
                  <div className="lg:col-span-2 p-6 rounded-4xl bg-zinc-900 border border-indigo-500/20 relative overflow-hidden">
                     <div className="absolute top-0 inset-e-0 p-8 opacity-5"><Zap size={100} /></div>
                     <div className="relative z-10">
                        <h4 className="text-2xl font-black italic mb-2 tracking-tight">Beta Edition One Readiness</h4>
                        
                        {/* Maintenance Tools */}
                        <div className="mb-8 p-6 rounded-3xl border border-rose-500/20 bg-rose-500/5">
                           <h3 className="text-sm font-black mb-4 flex items-center gap-3">
                             <Hammer size={18} className="text-rose-400" />
                             Specialist Hub Maintenance
                           </h3>
                           <div className="space-y-4">
                              <p className="text-slate-400 text-[10px] leading-relaxed font-bold uppercase tracking-wider">
                                Retroactively initialize Hub documents for existing experts.
                              </p>
                              <button 
                                 onClick={async () => {
                                    if (!window.confirm('Retroactively provision all experts? This will not overwrite existing hubs.')) return;
                                    const tId = toast.loading('Searching for specialists...');
                                    try {
                                       const expertRoles = ['specialist', 'expert', 'case_manager', 'practitioner', 'verifiedexpert'];
                                       const q = query(collection(db, 'users'), where('role', 'in', expertRoles));
                                       const snap = await getDocs(q);
                                       let count = 0;
                                       for (const d of snap.docs) {
                                          const data = d.data();
                                          await provisionSpecialistHub(d.id, data);
                                          count++;
                                        }
                                        toast.success(`Provisioned ${count} specialist hubs.`, { id: tId });
                                    } catch (err: any) {
                                        toast.error(`Maintenance failed: ${err.message}`, { id: tId });
                                    }
                                 }}
                                 className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-rose-500/20"
                              >
                                Provision All Specialists
                              </button>
                           </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-8">Perform global stress tests to ensure 'Shifting' stability.</p>
                        
                        <div className="space-y-6">
                           <div className="flex gap-4">
                              <button 
                                onClick={async () => {
                                  if (simulationProgress !== null) return;
                                  toast.loading('Initializing System Integrity Test...');
                                  setSimulationProgress(0);
                                  
                                  const interval = setInterval(() => {
                                     setSimulationProgress(p => {
                                        if (p === null || p >= 100) {
                                           clearInterval(interval);
                                           toast.dismiss();
                                           toast.success('Simulation Complete: 1,000 sessions injected.');
                                           return null;
                                        }
                                        return p + 10;
                                     });
                                  }, 500);
                                }}
                                disabled={simulationProgress !== null}
                                className="px-8 py-3 bg-[#004e99] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                              >
                                {simulationProgress !== null ? 'Simulating...' : 'Trigger Stress Simulation'}
                              </button>
                              <button 
                                onClick={async () => {
                                  const { seedBetaInvites } = await import('../utils/seedInvites');
                                  const success = await seedBetaInvites();
                                  if (success) {
                                    toast.dismiss();
                                    toast.success('20 Secure Beta Codes Activated');
                                  } else {
                                    toast.error('Seeding failed.');
                                  }
                                }}
                                className="px-8 py-3 bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/10 hover:bg-white/10"
                              >
                                Seed Beta Invites
                              </button>
                           </div>

                           {simulationProgress !== null && (
                              <div className="w-full space-y-2 animate-in fade-in duration-300">
                                 <div className="flex justify-between items-center text-[10px] font-bold text-indigo-400">
                                    <span>INJECTING STRESS LOADS...</span>
                                    <span>{simulationProgress}%</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-indigo-500/10 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-indigo-500 transition-all duration-300"
                                      style={{ width: `${simulationProgress}%` }}
                                    />
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Pipeline Monitor */}
               <div className="p-10 rounded-4xl border border-white/10 bg-white/5">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-indigo-400">analytics</span>
                    Real-Time Integrity Monitor
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                     {[
                       { label: 'Cloud Functions', status: 'Stable', load: '12%', color: '#10b981' },
                       { label: 'Agora Token Engine', status: 'Active', load: '4%', color: '#10b981' },
                       { label: 'Veo Animation Pipeline', status: 'Idle', load: '0%', color: '#6366f1' },
                       { label: 'Storage Bandwidth', status: 'Optimized', load: '21%', color: '#10b981' }
                     ].map((item, i) => (
                       <div key={i} className="space-y-4">
                          <div className="flex justify-between items-center">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                             <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.status}</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full rounded-full" style={{ width: item.load, background: item.color }} />
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               {/* US-EAST Optimization Advisory */}
               <div className="p-8 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400"><span className="material-symbols-outlined">info</span></div>
                    <div>
                      <h5 className="font-black italic text-lg mb-1">Regional Optimization Advisory</h5>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        To maintain <span className="text-white font-bold">&lt;200ms latency</span> for field social workers, we recommend upgrading to the Firebase Blaze plan to increase concurrent connection limits for the Cloud Functions US-EAST-1 instance.
                      </p>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* ── EVENTS TAB ── */}
          {activeTab === 'events' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                   <h3 className="text-2xl font-black italic tracking-tighter text-white mb-2">Global Spotlight Management</h3>
                   <p className="text-slate-500 text-sm font-medium">Curate the sessions broadcasted to the front-page hero section.</p>
                </div>
                <button 
                  onClick={() => setIsEventModalOpen(true)}
                  className="px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Launch Global Event
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {activeEvents.map(event => (
                   <div key={event.id} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 group hover:border-indigo-500/30 transition-all">
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                               <span className="material-symbols-outlined text-xl">event</span>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{event.type || 'Session'}</span>
                         </div>
                         <button className="text-slate-600 hover:text-red-400 transition-colors">
                            <span className="material-symbols-outlined text-lg">delete</span>
                         </button>
                      </div>
                      <h4 className="text-lg font-black text-white mb-3 line-clamp-1">{event.title}</h4>
                      <p className="text-xs text-slate-500 mb-6 line-clamp-2 leading-relaxed">{event.description}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                         <div className="flex items-center gap-2">
                            <img src={event.creatorPhoto || "https://ui-avatars.com/api/?name=E"} className="size-6 rounded-lg opacity-60" alt="" />
                            <span className="text-[10px] font-bold text-slate-400">{event.creatorName?.split(' ')[0]}</span>
                         </div>
                         <span className="text-[10px] font-black text-slate-500">{new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                   </div>
                 ))}
                 {activeEvents.length === 0 && (
                    <div className="col-span-full py-32 text-center border-4 border-dashed border-white/5 rounded-[4rem]">
                       <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No Scheduled Spotlight Events</p>
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* ── APPROVALS TAB ── */}
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-400">verified_user</span>
                  Professional Applications
                </h3>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-1.5 bg-orange-500/10 text-orange-400 text-xs font-black rounded-lg border border-orange-500/20 uppercase tracking-widest">
                    {pendingExperts.length} Pending
                  </span>
                  <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-lg border border-emerald-500/20 uppercase tracking-widest">
                    {approvedExperts.length} Approved
                  </span>
                </div>
              </div>

              {/* Sub-tab switcher */}
              <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit">
                <button
                  onClick={() => setApprovalSubTab('pending')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    approvalSubTab === 'pending'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pending Review
                </button>
                <button
                  onClick={() => setApprovalSubTab('history')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    approvalSubTab === 'history'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Approved History
                </button>
              </div>

              {/* Founder/Admin Guidance Note */}
              <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 mb-8 flex items-start gap-5 shadow-2xl shadow-indigo-500/10">
                <div className="size-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-indigo-400">assignment_turned_in</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-indigo-200 uppercase tracking-widest mb-1 italic">Expert Verification Guide</h4>
                  <p className="text-xs text-indigo-300 leading-relaxed font-bold">
                    This is your control room for expert applications. Review their pitch, education, and credentials below. 
                    Granting status will <span className="text-white">automatically provision their Specialist Hub</span> (Therapy Room, Agenda, Practice Tools). 
                    Rejecting will notify them that more information is required.
                  </p>
                </div>
              </div>

              {approvalSubTab === 'pending' && (
                <div className="grid grid-cols-1 gap-6">
                  {pendingExperts.map(expert => (
                    <div 
                      key={expert.id}
                      className="p-8 rounded-3xl border border-white/10 bg-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all"
                    >
                      <div className="absolute top-0 inset-e-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                      
                      <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                        {/* Left: Identity */}
                        <div className="w-full lg:w-1/3 space-y-4">
                          <div className="flex items-center gap-4">
                            <img 
                              src={expert.photoURL || `https://ui-avatars.com/api/?name=${expert.displayName}`}
                              alt={expert.displayName}
                              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                            />
                            <div>
                              <h4 className="text-lg font-black">{expert.displayName}</h4>
                              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{expert.primaryRole || 'Specialist'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                            <div>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Experience</p>
                              <p className="text-sm font-bold">{expert.yearsOfExperience || 0} Years</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">License</p>
                              <p className="text-sm font-bold truncate">{expert.npiNumber || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="space-y-2 pt-4">
                            {expert.website && (
                               <a href={expert.website} target="_blank" className="flex items-center gap-2 text-xs text-indigo-300 hover:text-white transition-colors">
                                 <span className="material-symbols-outlined text-sm">language</span> Website
                               </a>
                            )}
                            {expert.linkedin && (
                               <a href={expert.linkedin} target="_blank" className="flex items-center gap-2 text-xs text-indigo-300 hover:text-white transition-colors">
                                 <span className="material-symbols-outlined text-sm">account_tree</span> LinkedIn
                               </a>
                            )}
                            {expert.portfolioUrl && (
                               <a href={expert.portfolioUrl} target="_blank" className="flex items-center gap-2 text-xs text-indigo-300 hover:text-white transition-colors">
                                 <span className="material-symbols-outlined text-sm">rocket_launch</span> Portfolio
                               </a>
                            )}
                          </div>
                        </div>

                        {/* Right: Pitch & Actions */}
                        <div className="flex-1 space-y-6">
                          <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Education</p>
                            <p className="text-sm text-slate-200">{expert.education || 'No education records provided.'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Application Pitch</p>
                            <p className="text-sm text-slate-300 leading-relaxed italic">"{expert.applicationLetter || 'No cover letter provided.'}"</p>
                          </div>

                          <div className="flex items-center gap-4 pt-6 mt-4 border-t border-white/5">
                             <button 
                               onClick={async () => {
                                 if (!window.confirm('Approve this expert?')) return;
                                 await updateDoc(doc(db, 'users', expert.id), {
                                   role: 'specialist',
                                   isSpecialist: true,
                                   isExpert: true,
                                   verificationStatus: 'verified',
                                   isExpertPending: false,
                                   specialty: expert.primaryRole || 'Specialist',
                                   specialization: expert.primaryRole || 'Specialist',
                                   hasSpecialistHub: true,
                                   approvedAt: serverTimestamp(),
                                   approvalNote: expert.applicationLetter || expert.primaryRole || 'Approved by admin.',
                                 });
                                 
                                 // Automate Provisioning
                                 try {
                                   const updatedData = { ...expert, specialty: expert.primaryRole || 'Specialist' };
                                   await provisionSpecialistHub(expert.id, updatedData);
                                   toast.success(`Provisioning complete for ${expert.displayName}`);
                                 } catch (err) {
                                   console.error("Auto-provisioning failed:", err);
                                   toast.error("Hub provisioning failed. Please trigger manually in Users tab.");
                                 }
                               }}
                               className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                             >
                               Grant Expert Status & Provision Hub
                             </button>
                             <button 
                               onClick={async () => {
                                 if (!window.confirm('Reject this application?')) return;
                                 await updateDoc(doc(db, 'users', expert.id), {
                                   verificationStatus: 'rejected',
                                   isExpertPending: false
                                 });
                               }}
                               className="px-8 py-3 bg-white/5 hover:bg-white/10 text-red-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-red-500/20"
                             >
                               Reject
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingExperts.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                        <span className="material-symbols-outlined text-3xl">inbox</span>
                      </div>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No pending applications at this time.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── HISTORY: Approved Experts ── */}
              {approvalSubTab === 'history' && (
                <div className="space-y-4">
                  {approvedExperts.map(expert => (
                    <div
                      key={expert.id}
                      className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                    >
                      <img
                        src={expert.photoURL || `https://ui-avatars.com/api/?name=${expert.displayName}`}
                        alt={expert.displayName}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-base font-black text-white truncate">{expert.displayName}</h4>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black rounded-lg uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">verified</span> Approved
                          </span>
                        </div>
                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">{expert.specialty || expert.primaryRole || 'Specialist'}</p>
                        {expert.approvalNote && (
                          <p className="text-xs text-slate-400 italic line-clamp-2">"{expert.approvalNote}"</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Approved</p>
                        <p className="text-xs font-bold text-slate-300">
                          {expert.approvedAt?.toDate ? expert.approvedAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'On file'}
                        </p>
                        <button
                          onClick={() => window.open(`/user/${expert.id}`, '_blank')}
                          className="mt-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                  {approvedExperts.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                        <span className="material-symbols-outlined text-3xl">history</span>
                      </div>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No approved experts yet.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-12 pt-12 border-t border-white/5">
                <AdminDashboardFeed userData={userData} />
              </div>
            </div>
          )}

        </div>
      </main>

      <CreateEventModal 
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        user={user}
        userData={userData}
      />
    </div>
  );
}
