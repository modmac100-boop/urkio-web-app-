/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { 
  Plus,
  Terminal,
} from 'lucide-react';

// Helper for Patient Name Masking
const maskPatientName = (name: string, userCode?: string) => {
  if (userCode) return userCode;
  if (!name) return 'Clinical ID Pending';
  const parts = name.split(' ');
  return parts.map(p => p[0] + (p.length > 1 ? '*'.repeat(p.length - 1) : '')).join(' ');
};

export const Agenda: React.FC<{ user: any, userData: any }> = ({ user, userData }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clinicalNote, setClinicalNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'agenda' | 'protocols' | 'dossiers' | 'settings'>('agenda');
  const [patientHistory, setPatientHistory] = useState<any[]>([]);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({ clientName: '', category: 'Healing', message: '' });

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

  useEffect(() => {
    if (!selectedSessionId) return;
    const selected = appointments.find(a => a.id === selectedSessionId);
    if (!selected?.userId) return;
    const qHist = query(collection(db, 'events'), where('userId', '==', selected.userId), where('status', '==', 'completed'));
    getDocs(qHist).then(snap => setPatientHistory(snap.docs.map(d => d.data())));
  }, [selectedSessionId, appointments]);

  const handleAcceptSession = async (id: string) => {
    const caseCode = `#PR-${Math.floor(1000 + Math.random() * 9000)}`;
    await updateDoc(doc(db, 'events', id), { status: 'accepted', caseCode, acceptedAt: serverTimestamp() });
    toast.success('Protocol Established');
  };

  const handleSaveQuickNote = async (sendToRecipient = false) => {
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
    } catch (err) {
      toast.error('Vault Sync Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualBook = async () => {
    if (!bookingDetails.clientName) return;
    await addDoc(collection(db, 'events'), {
      ...bookingDetails,
      expertId: user.uid,
      expertName: userData.displayName || user.email,
      type: 'session',
      status: 'accepted',
      caseCode: `#PR-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
    setShowBookingModal(false);
    toast.success('Manual Protocol Logged');
  };

  const filteredAppointments = appointments.filter(a =>
    a.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.caseCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSession = appointments.find(a => a.id === selectedSessionId);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="bg-nexus-surface font-['Manrope'] text-on-surface min-h-screen flex selection:bg-nexus-primary/10">
      {/* SideNavBar */}
      <aside className={clsx(
        "fixed top-0 h-full z-40 flex flex-col w-64 border-slate-200 bg-slate-50 transition-all",
        isRTL ? "right-0 border-l" : "left-0 border-r"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="mb-8">
            <span className="text-xl font-bold text-nexus-primary font-['Newsreader']">Clinical Portal</span>
            <div className="mt-4 flex items-center gap-3">
              <img 
                alt="Professional profile" 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-nexus-primary/10" 
                src={userData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName || 'Dr')}`}
              />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-nexus-primary truncate">{userData?.displayName || 'Expert'}</p>
                <p className="text-xs text-slate-500">{userData?.role || 'Practitioner'}</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
              { id: 'agenda', label: t('agenda.clinicalAgenda'), icon: 'calendar_today' },
              { id: 'protocols', label: 'Protocols', icon: 'description' },
              { id: 'dossiers', label: 'Case Dossiers', icon: 'folder_shared' },
              { id: 'settings', label: 'Settings', icon: 'settings' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 transition-all",
                  activeSection === item.id 
                    ? "text-nexus-primary font-semibold bg-teal-50/50" 
                    : "text-slate-500 hover:text-nexus-primary hover:bg-slate-100",
                  activeSection === item.id && (isRTL ? "border-l-4 border-nexus-primary" : "border-r-4 border-nexus-primary")
                )}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <button 
            onClick={() => setShowBookingModal(true)}
            className="mt-auto bg-nexus-primary-container text-nexus-on-primary-container px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">add</span>
            New Protocol
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={clsx("flex-1 transition-all", isRTL ? "mr-64" : "ml-64")}>
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-8 sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-8 flex-1">
            <span className="text-2xl font-serif text-nexus-primary font-['Newsreader']">Clinical Nexus</span>
            <div className="relative w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border-none rounded-full text-sm focus:ring-1 focus:ring-nexus-primary font-['Manrope']" 
                placeholder="Search clinical records..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <button className="text-slate-400 hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">notifications</span></button>
            <button className="text-slate-400 hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">help_outline</span></button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button className="bg-nexus-primary text-white px-4 py-1.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">Live Terminal</button>
          </div>
        </header>

        {/* Canvas */}
        <main className="p-8 grid grid-cols-12 gap-8">
          {/* Page Header */}
          <div className="col-span-12 flex justify-between items-end mb-4">
            <div>
              <h1 className="font-['Newsreader'] text-4xl font-semibold text-nexus-primary">Clinical Agenda</h1>
              <p className="text-nexus-secondary text-sm font-medium mt-1 uppercase tracking-wide">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-nexus-surface-container text-nexus-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm fill-1">verified</span>
                Expert Verified
              </span>
            </div>
          </div>

          {/* Metrics Bento Grid */}
          <div className="col-span-12 grid grid-cols-4 gap-8">
            {[
              { label: t('agenda.activeEntities'), value: appointments.length, icon: 'group', color: 'teal', trend: '+12%' },
              { label: t('agenda.pendingAnalysis'), value: appointments.filter(a => a.status === 'pending').length || 42, icon: 'analytics', color: 'amber', trend: 'Pending' },
              { label: t('agenda.successProtocol'), value: 'Optimum', icon: 'verified_user', color: 'blue', trend: '98%' },
              { label: t('agenda.vaultDensity'), value: 'High', icon: 'database', color: 'purple', trend: '8.4 TB' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-[0px_10px_30px_rgba(27,77,75,0.05)] border border-slate-50 transition-transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={clsx("p-2 rounded-lg", 
                    stat.color === 'teal' ? "bg-teal-50 text-nexus-primary" :
                    stat.color === 'amber' ? "bg-amber-50 text-amber-700" :
                    stat.color === 'blue' ? "bg-blue-50 text-blue-700" :
                    "bg-purple-50 text-purple-700"
                  )}>
                    <span className="material-symbols-outlined">{stat.icon}</span>
                  </div>
                  <span className={clsx("text-xs font-bold px-2 py-0.5 rounded",
                    stat.trend.includes('+') ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-50"
                  )}>{stat.trend}</span>
                </div>
                <p className="text-sm text-slate-500 font-bold mb-1">{stat.label}</p>
                <p className="text-3xl font-['Newsreader'] text-nexus-primary">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Incoming Protocols */}
          <div className="col-span-8 bg-white rounded-xl shadow-[0px_10px_30px_rgba(27,77,75,0.05)] border border-slate-50 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-['Newsreader'] text-2xl text-nexus-primary">Incoming Protocols</h2>
              <button className="text-sm text-nexus-primary font-bold flex items-center gap-1 hover:underline">
                View Archive <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[600px] custom-scrollbar">
              {filteredAppointments.map((appt) => (
                <div 
                  key={appt.id} 
                  onClick={() => setSelectedSessionId(appt.id)}
                  className={clsx(
                    "p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer",
                    selectedSessionId === appt.id && "bg-teal-50/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 ring-1 ring-slate-200">
                      <img 
                        src={appt.clientPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.clientName || 'P')}&background=f1f5f9&color=0f172a`} 
                        className="w-full h-full object-cover" 
                        alt="Patient"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{appt.caseCode || '#PENDING'}</p>
                      <p className="font-['Newsreader'] text-xl text-nexus-primary">
                        {selectedSessionId === appt.id || appt.status === 'accepted' ? (appt.userCode || appt.clientName) : maskPatientName(appt.clientName, appt.userCode)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm font-bold text-nexus-primary">{appt.category || 'Clinical Trial'}</p>
                      <p className="text-xs text-slate-400">{appt.date ? format(new Date(appt.date), 'p') : 'Pending'}</p>
                    </div>
                    {appt.status === 'pending' || !appt.status ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAcceptSession(appt.id); }}
                        className="bg-nexus-primary text-white px-4 py-1.5 rounded-full text-xs font-bold hover:opacity-90 transition-all"
                      >
                        INITIATE
                      </button>
                    ) : (
                      <span className={clsx(
                        "px-4 py-1.5 rounded-full text-[10px] font-bold border",
                        appt.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-teal-50 text-nexus-primary border-teal-100"
                      )}>
                        {appt.status === 'completed' ? 'ARCHIVED' : 'ACTIVE'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredAppointments.length === 0 && (
                <div className="p-20 text-center text-slate-400 italic">No incoming protocols detected in this sector.</div>
              )}
            </div>
          </div>

          {/* Dossier Side Panel */}
          <div className="col-span-4 flex flex-col gap-8">
            {selectedSession ? (
              <div className="bg-white p-6 rounded-xl shadow-[0px_10px_30px_rgba(27,77,75,0.05)] border border-slate-50 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-['Newsreader'] text-2xl text-nexus-primary">Dossier: <span className="font-normal italic">urkio</span></h2>
                  <span className="material-symbols-outlined text-slate-300">more_vert</span>
                </div>
                <div className="space-y-6 flex-1 flex flex-col">
                  {/* Biometric Sync Status */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Biometric Sync Status</span>
                      <span className="text-[10px] font-black text-emerald-600">ONLINE</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-nexus-primary h-full w-[82%] animate-[shimmer_2s_infinite]"></div>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400 text-right">82% Signal Strength</p>
                  </div>

                  {/* Observations */}
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-bold text-nexus-primary mb-2">Clinical Observations</label>
                    <textarea 
                      className="flex-1 w-full bg-slate-50 border-slate-100 rounded-xl text-sm font-['Manrope'] focus:ring-nexus-primary focus:border-nexus-primary p-4 resize-none" 
                      placeholder={`Enter findings for ${selectedSession.clientName}...`}
                      value={clinicalNote}
                      onChange={(e) => setClinicalNote(e.target.value)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleSaveQuickNote(false)}
                        disabled={isSaving || !clinicalNote}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-nexus-primary hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">lock</span>
                        <span className="text-sm font-bold">Vault</span>
                      </button>
                      <button 
                        onClick={() => handleSaveQuickNote(true)}
                        disabled={isSaving || !clinicalNote}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-nexus-primary hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">send</span>
                        <span className="text-sm font-bold">Dispatch</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => navigate(`/room/session-${selectedSession.caseCode}`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-nexus-primary text-white rounded-lg font-bold hover:opacity-90 transition-opacity shadow-lg shadow-teal-900/10"
                    >
                      <span className="material-symbols-outlined">terminal</span>
                      Secure Terminal
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-12 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">clinical_notes</span>
                <p className="text-slate-400 text-sm font-medium">Select a protocol to view dossier details.</p>
              </div>
            )}

            {/* Context Card */}
            <div className="bg-nexus-primary text-white p-6 rounded-xl relative overflow-hidden shrink-0">
              <div className="relative z-10">
                <p className="font-['Newsreader'] text-xl mb-2">Protocol Insight</p>
                <p className="text-xs opacity-80 mb-4">Integrate the new bio-rhythmic markers for more accurate analysis of the Urkio stream.</p>
                <button className="text-xs font-bold underline underline-offset-4 text-white">Review Guidelines</button>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-9xl">psychology</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Booking Modal (Simplified) */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0" onClick={() => setShowBookingModal(false)} />
          <div className="w-full max-w-md relative bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-['Newsreader'] text-nexus-primary mb-6">Initialize New Protocol</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Entity Identifier</label>
                <input 
                  type="text" 
                  value={bookingDetails.clientName} 
                  onChange={(e) => setBookingDetails({ ...bookingDetails, clientName: e.target.value })} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-nexus-primary outline-none mt-1" 
                  placeholder="Patient Name or ID" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Classification</label>
                <select 
                  value={bookingDetails.category} 
                  onChange={(e) => setBookingDetails({ ...bookingDetails, category: e.target.value })} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-nexus-primary outline-none mt-1"
                >
                  <option value="Healing">Healing</option>
                  <option value="Consultant">Specialist</option>
                </select>
              </div>
              <button 
                onClick={handleManualBook} 
                className="w-full py-3.5 bg-nexus-primary text-white rounded-xl font-bold mt-4 shadow-lg shadow-nexus-primary/20"
              >
                Confirm Protocol Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
