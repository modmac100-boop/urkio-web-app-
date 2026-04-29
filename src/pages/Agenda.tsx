import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { 
  Terminal,
  Search,
  Calendar,
  Shield,
  Database,
  ArrowRight,
  Activity,
  User,
  Clock,
  LayoutDashboard,
  MoreVertical,
  Bell,
  Target,
  FileText,
  Activity as ActivityIcon
} from 'lucide-react';

export const Agenda: React.FC<{ user: any, userData: any }> = ({ user, userData }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  const isAdmin = userData?.role === 'admin' || userData?.role === 'management' || userData?.email === 'urkio@urkio.com';

  useEffect(() => {
    if (!user?.uid) return;
    const qAppts = isAdmin
      ? query(collection(db, 'events'), where('type', '==', 'session'))
      : query(collection(db, 'events'), where('expertId', '==', user.uid), where('type', '==', 'session'));

    return onSnapshot(qAppts, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setAppointments(data);
      if (data.length > 0 && !selectedSessionId) setSelectedSessionId(data[0].id);
    });
  }, [user?.uid, isAdmin]);

  const handleAcceptSession = async (id: string) => {
    try {
      const caseCode = `#PR-${Math.floor(1000 + Math.random() * 9000)}`;
      await updateDoc(doc(db, 'events', id), { status: 'accepted', caseCode });
      toast.success('Protocol Established');
    } catch (e) {
      toast.error('Sync failed');
    }
  };

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = a.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.caseCode?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && a.status !== 'accepted';
    if (activeTab === 'completed') return matchesSearch && a.status === 'accepted';
    return matchesSearch;
  });

  const selectedSession = appointments.find(a => a.id === selectedSessionId);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 font-['Manrope'] overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar - Sleek Glassmorphism */}
      <aside className="w-72 bg-[#020617] border-e border-white/5 flex flex-col shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-tr from-cyan-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Terminal className="text-white w-5 h-5" />
            </div>
            <span className="font-black tracking-tight text-xl text-white uppercase">Urkio<span className="text-cyan-500">Nexus</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'agenda', label: 'Clinical Agenda', icon: Calendar, active: true },
            { id: 'records', label: 'Patient Vault', icon: Database, active: false },
            { id: 'analytics', label: 'Bio Analytics', icon: ActivityIcon, active: false },
            { id: 'settings', label: 'System Settings', icon: User, active: false },
          ].map(item => (
            <button
              key={item.id}
              className={clsx(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group",
                item.active 
                  ? "bg-white/5 text-white ring-1 ring-white/10 shadow-xl" 
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={clsx("w-5 h-5 transition-transform group-hover:scale-110", item.active ? "text-cyan-400" : "text-slate-600")} />
              <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
              {item.active && <div className="ms-auto w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-linear-to-br from-indigo-600/20 to-cyan-600/20 p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
               <Shield className="w-24 h-24 text-white" />
            </div>
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-2">Protocol Health</p>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-black text-white leading-none">94%</span>
              <div className="flex-1 bg-white/10 h-1.5 rounded-full mb-1.5 overflow-hidden">
                <div className="bg-linear-to-r from-cyan-500 to-indigo-500 h-full w-[94%]" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Header */}
        <header className="h-24 flex items-center justify-between px-10 bg-[#020617]/50 backdrop-blur-xl border-b border-white/5 z-10">
          <div className="relative w-[400px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Query biometric records..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 ps-12 pe-6 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/10 transition-all duration-300 placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-8">
            <LanguageToggle />
            <div className="flex items-center gap-4 border-s border-white/10 ps-8">
              <button className="relative w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/5 transition-colors group">
                <Bell className="w-5 h-5 text-slate-400 group-hover:text-white" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#020617]" />
              </button>
              <div className="flex items-center gap-3">
                <div className="text-end">
                  <p className="text-xs font-black text-white uppercase tracking-tighter">{userData?.displayName || 'Expert'}</p>
                  <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Authorized</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center font-bold text-white shadow-lg">
                   {userData?.displayName?.charAt(0) || 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar z-10">
          <div className="max-w-7xl mx-auto space-y-12">
            {/* Title & Actions */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                   <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-cyan-500/20">
                     Clinical Pulse Active
                   </span>
                   <span className="text-slate-600 text-xs font-medium">Synced: 0.04ms</span>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Clinical<br/><span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-indigo-500">Agenda</span></h1>
              </div>
              <div className="flex gap-4">
                <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-white/10 transition-all duration-300">
                  Bulk Analysis
                </button>
                <button className="px-8 py-4 bg-linear-to-r from-cyan-500 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                  Start New Session
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Active Protocols', value: appointments.length.toString().padStart(2, '0'), icon: Target, color: 'text-cyan-500' },
                { label: 'Pending Intake', value: appointments.filter(a => a.status !== 'accepted').length.toString().padStart(2, '0'), icon: Clock, color: 'text-amber-500' },
                { label: 'Success Velocity', value: '88%', icon: Activity, color: 'text-emerald-500' },
                { label: 'Security Level', value: 'High', icon: Shield, color: 'text-indigo-500' },
              ].map((m, i) => (
                <div key={i} className="bg-[#0f172a]/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-white/20 transition-all duration-500">
                  <div className={clsx("absolute top-8 right-8 transition-colors", m.color, "opacity-20")}>
                    <m.icon className="w-12 h-12" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{m.label}</p>
                  <p className="text-5xl font-black text-white italic tracking-tighter">{m.value}</p>
                </div>
              ))}
            </div>

            {/* List and Details Layout */}
            <div className="flex gap-10">
              {/* Protocols List */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-6">
                     {['all', 'pending', 'completed'].map(tab => (
                       <button 
                         key={tab}
                         onClick={() => setActiveTab(tab as any)}
                         className={clsx(
                           "text-xs font-black uppercase tracking-widest transition-all",
                           activeTab === tab ? "text-cyan-400 border-b-2 border-cyan-400 pb-2" : "text-slate-600 hover:text-slate-400"
                         )}
                       >
                         {tab}
                       </button>
                     ))}
                   </div>
                   <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Sort: By Time</span>
                </div>

                <div className="space-y-4">
                  {filteredAppointments.map(appt => (
                    <div 
                      key={appt.id}
                      onClick={() => setSelectedSessionId(appt.id)}
                      className={clsx(
                        "group flex items-center justify-between p-8 rounded-4xl border transition-all duration-500 cursor-pointer relative overflow-hidden",
                        selectedSessionId === appt.id 
                          ? "bg-linear-to-r from-cyan-500/10 to-indigo-500/10 border-cyan-500/30 shadow-2xl" 
                          : "bg-[#0f172a]/30 border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-8 z-10">
                        <div className="relative w-20 h-20">
                          <div className={clsx(
                            "absolute inset-0 rounded-3xl rotate-6 transition-transform duration-500 group-hover:rotate-0",
                            selectedSessionId === appt.id ? "bg-cyan-500/20" : "bg-white/5"
                          )} />
                          <img 
                            src={appt.clientPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.clientName || 'P')}&background=020617&color=22d3ee&bold=true`} 
                            className="w-full h-full object-cover rounded-3xl relative z-10 ring-1 ring-white/10" 
                            alt="" 
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-1">Dossier: {appt.caseCode || 'UNASSIGNED'}</p>
                          <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{appt.clientName}</h3>
                          <div className="flex items-center gap-4 mt-3">
                             <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                               <Clock className="w-3 h-3" />
                               {format(new Date(appt.date), 'hh:mm a')}
                             </span>
                             <span className={clsx(
                               "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                               appt.status === 'accepted' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                             )}>
                               {appt.status === 'accepted' ? 'Authorized' : 'Intake'}
                             </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 z-10">
                        <button 
                          className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-300 group/btn"
                          onClick={(e) => { e.stopPropagation(); handleAcceptSession(appt.id); }}
                        >
                          <ArrowRight className="w-6 h-6 text-slate-400 group-hover/btn:translate-x-1 group-hover/btn:text-white transition-all" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dossier Detail Panel */}
              <div className="w-[450px]">
                <div className="bg-[#0f172a]/50 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-10 sticky top-10 shadow-3xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-600/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                  
                  <div className="flex items-center justify-between mb-12 relative z-10">
                     <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Profile Dossier</h2>
                     <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                       <MoreVertical className="w-5 h-5 text-slate-600" />
                     </button>
                  </div>

                  {selectedSession ? (
                    <div className="space-y-10 relative z-10">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-linear-to-br from-slate-800 to-black p-1 mb-6 ring-1 ring-white/10">
                           <div className="w-full h-full rounded-[2.2rem] bg-[#020617] flex items-center justify-center text-5xl font-black text-white uppercase italic tracking-tighter">
                             {selectedSession.clientName?.substring(0, 2)}
                           </div>
                        </div>
                        <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">{selectedSession.clientName}</h3>
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Biometric Stream</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Age</p>
                            <p className="text-xl font-bold text-white">28 Years</p>
                         </div>
                         <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Stability</p>
                            <p className="text-xl font-bold text-cyan-400">Stable</p>
                         </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Insight</p>
                           <FileText className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="w-full bg-[#020617] border border-white/5 rounded-3xl p-8 text-sm text-slate-400 min-h-[160px] italic leading-relaxed">
                          Intake data suggests moderate anxiety related to professional transitions. Biometric sensors indicating slightly elevated resting heart rate.
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button 
                          onClick={() => navigate(`/room/session-${selectedSession.caseCode}`)}
                          className="flex-1 flex items-center justify-center gap-3 p-5 bg-white text-black rounded-3xl text-xs font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-300 shadow-xl"
                        >
                           <Terminal className="w-4 h-4" />
                           Enter Secure Room
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-32 text-center space-y-6 opacity-30 relative z-10">
                       <LayoutDashboard className="w-20 h-20 mx-auto text-slate-700" />
                       <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Awaiting Signal Select</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
