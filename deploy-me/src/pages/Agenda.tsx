import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { 
  Plus,
  Terminal,
  Search,
  LayoutDashboard,
  Calendar,
  Shield,
  FolderOpen,
  Settings,
  Bell,
  HelpCircle,
  MoreVertical,
  Target,
  Clock,
  Database,
  ArrowRight,
  Activity,
  User,
  CheckCircle2
} from 'lucide-react';

export const Agenda: React.FC<{ user: any, userData: any }> = ({ user, userData }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clinicalNote, setClinicalNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'agenda' | 'records' | 'vault' | 'plans'>('agenda');

  const isAdmin = userData?.role === 'admin' || userData?.role === 'management' || userData?.role === 'case_manager' || userData?.email === 'urkio@urkio.com';

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
  }, [user?.uid, isAdmin, selectedSessionId]);

  const handleAcceptSession = async (id: string) => {
    const caseCode = `#PR-${Math.floor(1000 + Math.random() * 9000)}`;
    await updateDoc(doc(db, 'events', id), { status: 'accepted', caseCode, acceptedAt: serverTimestamp() });
    toast.success('Protocol Established');
  };

  const handleSaveQuickNote = async () => {
    if (!selectedSessionId || !clinicalNote) return;
    setIsSaving(true);
    const selected = appointments.find(a => a.id === selectedSessionId);
    try {
      const reportData: any = {
        authorId: user.uid,
        authorName: userData.displayName || user.email,
        title: `Protocol Insight: ${selected.clientName}`,
        content: clinicalNote,
        apptId: selected.id,
        patientId: selected.userId || '',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'confidential_reports'), reportData);
      toast.success('Asset Vaulted');
      setClinicalNote('');
    } catch (e) {
      toast.error('Sync failed');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAppointments = appointments.filter(a => 
    a.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.caseCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSession = appointments.find(a => a.id === selectedSessionId);

  return (
    <div className="flex h-screen bg-[#0a0b10] text-slate-300 font-['Inter']" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0e14] border-inherit flex flex-col shrink-0 border-e border-white/5">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Terminal className="text-white w-5 h-5" />
          </div>
          <span className="font-black tracking-tighter text-lg text-white">URKIO<span className="text-cyan-500">CLINICAL</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {[
            { id: 'agenda', label: 'Clinical Agenda', icon: Calendar },
            { id: 'records', label: 'Patient Records', icon: User },
            { id: 'vault', label: 'Diagnostic Vault', icon: Database },
            { id: 'plans', label: 'Treatment Plans', icon: FolderOpen },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                activeSection === item.id 
                  ? "bg-white/5 text-cyan-400 font-bold" 
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={clsx("w-5 h-5", activeSection === item.id ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-300")} />
              <span className="text-sm">{item.label}</span>
              {activeSection === item.id && <div className="ms-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
            </button>
          ))}
        </nav>

        <div className="p-4 bg-cyan-500/5 m-4 rounded-2xl border border-cyan-500/10">
          <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Efficiency</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-white">0%</span>
            <div className="flex-1 bg-white/10 h-1 rounded-full mb-2 overflow-hidden">
                <div className="bg-cyan-500 h-full w-[0%]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-[#0a0b10]/80 backdrop-blur-md border-b border-white/5">
          <div className="relative w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search dossiers..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 ps-11 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:bg-white/10 transition-all"
            />
          </div>
          <div className="flex items-center gap-6">
            <LanguageToggle />
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-500 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10" />
            </div>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-10">
            {/* Title Section */}
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase tracking-widest rounded border border-cyan-500/20 flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
                    Live Terminal
                  </span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Clinical Agenda</h1>
                <p className="text-slate-500 text-sm font-bold mt-2 tracking-widest uppercase flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(), 'EEEE, MMMM do, yyyy')}
                </p>
              </div>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest border border-white/5 transition-all">
                  Manual Log
                </button>
                <button className="px-6 py-3 bg-cyan-500 text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                  <Activity className="w-4 h-4" />
                  Initiate Protocol
                </button>
              </div>
            </div>

            {/* Metrics Bento */}
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Active Entities', value: appointments.length.toString().padStart(2, '0'), icon: Target },
                { label: 'Pending Analysis', value: appointments.filter(a => a.status === 'pending').length.toString().padStart(2, '0') || '00', icon: Clock },
                { label: 'Success Protocol', value: '0%', icon: Shield },
                { label: 'Vault Density', value: '14', icon: Database },
              ].map((m, i) => (
                <div key={i} className="bg-[#0d0e14] p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-4 right-4 text-white/5 group-hover:text-cyan-500/10 transition-colors">
                    <m.icon className="w-16 h-16" />
                  </div>
                  <m.icon className="w-6 h-6 text-slate-600 mb-6" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
                  <p className="text-4xl font-black text-white italic">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Content Row */}
            <div className="grid grid-cols-12 gap-8">
              {/* Protocols List */}
              <div className="col-span-8 space-y-6">
                <div className="flex items-center gap-2 px-2">
                   <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">Incoming Protocols</h2>
                   <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Scanning...</span>
                </div>
                <div className="space-y-4">
                  {filteredAppointments.map(appt => (
                    <div 
                      key={appt.id}
                      onClick={() => setSelectedSessionId(appt.id)}
                      className={clsx(
                        "group flex items-center justify-between p-6 rounded-3xl border transition-all cursor-pointer",
                        selectedSessionId === appt.id 
                          ? "bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.05)]" 
                          : "bg-[#0d0e14] border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                          <img 
                            src={appt.clientPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.clientName || 'P')}&background=0f172a&color=22d3ee`} 
                            className="w-full h-full object-cover opacity-80" 
                            alt="" 
                          />
                          <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900 shadow-lg" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Protocol: {appt.caseCode || '#SV8F6-60'}</span>
                          </div>
                          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{appt.clientName}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-cyan-500 uppercase tracking-widest">
                          {appt.status === 'accepted' ? 'Accepted' : 'Pending'}
                        </div>
                        <button 
                          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleAcceptSession(appt.id); }}
                        >
                          <ArrowRight className="w-5 h-5 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <div className="p-20 text-center text-slate-600 italic uppercase font-black text-xs tracking-widest opacity-20">No active entities detected in this sector.</div>
                  )}
                </div>
              </div>

              {/* Right Panel: Dossier */}
              <div className="col-span-4">
                <div className="bg-[#0d0e14] rounded-3xl border border-white/5 p-8 sticky top-8">
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Dossier</h2>
                     <MoreVertical className="w-5 h-5 text-slate-700" />
                  </div>

                  {selectedSession ? (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                           <span className="text-2xl font-black uppercase tracking-tighter">{selectedSession.clientName?.substring(0, 2)}</span>
                        </div>
                        <div>
                           <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{selectedSession.clientName}</h3>
                           <div className="flex items-center gap-2 mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Biometric Sync Active</span>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Observations</p>
                        <textarea 
                          value={clinicalNote}
                          onChange={e => setClinicalNote(e.target.value)}
                          placeholder="Archiving diagnostic observations..."
                          className="w-full bg-[#0a0b10] border border-white/5 rounded-2xl p-6 text-sm text-slate-300 h-64 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none transition-all placeholder:text-slate-800"
                        />
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={handleSaveQuickNote}
                          disabled={isSaving || !clinicalNote}
                          className="flex-1 flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                           <Database className="w-4 h-4 text-cyan-500" />
                           Vault
                        </button>
                        <button 
                          onClick={() => navigate(`/room/session-${selectedSession.caseCode}`)}
                          className="flex-[2] flex items-center justify-center gap-2 p-4 bg-cyan-500 text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/10"
                        >
                           <Terminal className="w-4 h-4" />
                           Secure Terminal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-4 opacity-20">
                       <Shield className="w-16 h-16 mx-auto" />
                       <p className="text-xs font-black uppercase tracking-widest">Awaiting Entity Selection</p>
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
