/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { 
  Search, 
  Shield, 
  Zap, 
  Target, 
  Clock, 
  Settings, 
  Bell, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Activity, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  LayoutGrid,
  Calendar,
  Globe,
  Database,
  History,
  ClipboardList,
  PlusCircle,
  Scan,
  Cpu
} from 'lucide-react';

// Helper for Patient Name Masking
const maskPatientName = (name: string, userCode?: string) => {
  if (userCode) return userCode;
  if (!name) return 'Clinical ID Pending';
  const parts = name.split(' ');
  return parts.map(p => p[0] + (p.length > 1 ? '*'.repeat(p.length - 1) : '')).join(' ');
};

// Guardian Verified Badge component
const GuardianStatusBadge = ({ isVerified, age, guardianVerifiedLabel, guardianPendingLabel }: { isVerified: boolean, age: number, guardianVerifiedLabel: string, guardianPendingLabel: string }) => {
  if (!age || age >= 15) return null;
  return (
    <div className={clsx(
      "flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.3em] leading-none transition-all",
      isVerified 
        ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]" 
        : "bg-white/5 border-white/10 text-white/40"
    )}>
      <span className={clsx("size-1 rounded-full", isVerified ? "bg-emerald-400 animate-pulse" : "bg-white/20")}></span>
      {isVerified ? guardianVerifiedLabel : guardianPendingLabel}
    </div>
  );
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
  const [activeSection, setActiveSection] = useState<'agenda' | 'records' | 'vault' | 'plans'>('agenda');
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
  }, [user?.uid, isAdmin]);

  useEffect(() => {
    if (!selectedSessionId) return;
    const selected = appointments.find(a => a.id === selectedSessionId);
    if (!selected?.userId) return;
    const qHist = query(collection(db, 'events'), where('userId', '==', selected.userId), where('status', '==', 'completed'));
    getDocs(qHist).then(snap => setPatientHistory(snap.docs.map(d => d.data())));
  }, [selectedSessionId, appointments]);



  const handleAcceptSession = async (id: string) => {
    const caseCode = `#${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.floor(Math.random() * 100)}`;
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

  const completionRate = appointments.length > 0 ? Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100) : 94;

  const selectedSession = appointments.find(a => a.id === selectedSessionId);



  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={clsx("flex h-screen bg-[#080a0f] text-white/90 font-['Manrope'] overflow-hidden selection:bg-[#a8c8ff]/30")}>
      <aside className="w-80 border-e border-white/5 bg-[#0d1017]/80 backdrop-blur-3xl hidden lg:flex flex-col relative z-20">
        <div className="p-10 flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
          <div className="relative size-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[#a8c8ff]">
            <Cpu className="size-6 animate-pulse" />
          </div>
          <h1 className="font-black text-xl tracking-tighter text-white uppercase italic">Urkio<span className="text-[#a8c8ff]/60">{t('clinical.clinical')}</span></h1>
        </div>
        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
          {[
                      { id: 'agenda', label: t('agenda.clinicalAgenda'), icon: Calendar },
            { id: 'records', label: t('agenda.patientRecords'), icon: Users },
            { id: 'vault', label: t('agenda.diagnosticVault'), icon: Database },
            { id: 'plans', label: t('agenda.treatmentPlans'), icon: ClipboardList }
          ].map(item => (
            <div
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={clsx(
                "group flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all relative overflow-hidden",
                activeSection === item.id ? "bg-white/5 text-[#a8c8ff]" : "text-white/40 hover:text-white/70"
              )}
            >
              <item.icon className="size-5" />
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="p-8">
          <div className="bg-white/5 border border-white/10 p-6 rounded-4xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-white/30 uppercase">{t('agenda.efficiency')}</span>
              <span className="text-[10px] font-black text-[#a8c8ff]">{completionRate}%</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div className="bg-[#a8c8ff] h-full rounded-full" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <header className="h-24 flex items-center justify-between px-12 bg-[#080a0f]/40 backdrop-blur-2xl border-b border-white/5">
          <div className="flex items-center gap-8 w-1/2">
            <div className="relative w-full max-w-lg group">
              <Search className="absolute inset-s-5 top-1/2 -translate-y-1/2 text-white/20 size-5" />
              <input
                className="w-full ps-14 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-sm text-white focus:bg-white/8 outline-none placeholder:text-white/20"
                placeholder={t('agenda.searching')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <LanguageToggle />
            <button className="p-3 text-white/40 hover:bg-white/5 rounded-xl group relative">
              <Bell className="size-5 group-hover:text-[#a8c8ff]" />
              <span className="absolute top-3 right-3 size-2 bg-[#a8c8ff] rounded-full" />
            </button>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-2xl grayscale hover:grayscale-0 transition-all cursor-pointer">
              <img src={userData?.photoURL || "https://ui-avatars.com/api/?name=" + (userData?.displayName || 'D')} className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-[#a8c8ff]/10 border border-[#a8c8ff]/20 rounded-lg text-[10px] font-black text-[#a8c8ff] uppercase tracking-widest">Live Terminal</div>
                <div className="size-1.5 rounded-full bg-[#a8c8ff] animate-pulse" />
              </div>
              <h2 className="text-6xl font-black tracking-tighter text-white italic uppercase">{t('agenda.clinicalAgenda')}</h2>
              <div className="flex items-center gap-3 text-white/30 font-bold text-[11px] uppercase tracking-widest">
                <Calendar className="size-3.5 text-[#a8c8ff]" />
                <p>{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowBookingModal(true)} className="px-8 py-4 bg-white/5 border border-white/10 text-white/70 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em]">{t('agenda.manualLog')}</button>
              <button 
                onClick={() => toast.success(t('clinical.initializeCase'))}
                className="px-8 py-4 bg-[#a8c8ff] text-[#003062] rounded-2xl font-black flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-[#a8c8ff]/10"
              >
                <PlusCircle className="size-4" /> {t('agenda.initiateProtocol')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
                            { label: t('agenda.activeEntities'), value: appointments.length, icon: Target, color: "#a8c8ff" },
              { label: t('agenda.pendingAnalysis'), value: "07", icon: History, color: "#facc15" },
              { label: t('agenda.successProtocol'), value: `${completionRate}%`, icon: ShieldCheck, color: "#4ade80" },
              { label: t('agenda.vaultDensity'), value: "14", icon: Database, color: "#c084fc" }
            ].map((stat, i) => (
              <div key={i} className="bg-white/3 border border-white/5 p-8 rounded-4xl relative overflow-hidden group hover:bg-white/5 transition-all">
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10"><stat.icon className="size-16" /></div>
                <div className="relative z-10">
                  <div className="size-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-white/50"><stat.icon className="size-5" /></div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                  <h3 className="text-4xl font-black text-white tracking-tighter italic">{stat.value.toString().padStart(2, '0')}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
            <div className="xl:col-span-8 space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white/90">{t('agenda.upcomingQueue')}</h2>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-white/40 uppercase tracking-[0.2em] animate-pulse">{t('agenda.scanning')}</div>
                </div>
              </div>
              <div className="space-y-6">
                {filteredAppointments.length > 0 ? filteredAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    onClick={() => setSelectedSessionId(appt.id)}
                    className={clsx(
                      "p-10 rounded-[3.5rem] border transition-all cursor-pointer relative overflow-hidden group",
                      selectedSessionId === appt.id ? "bg-white/[0.07] border-[#a8c8ff]/30 shadow-2xl" : "bg-[#11141b]/40 border-transparent hover:border-white/10"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                      <div className="flex items-center gap-10">
                        <div className="relative shrink-0">
                          <img src={appt.clientPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.clientName || 'P')}&background=11141b&color=fff&size=200`} className="size-24 rounded-4xl object-cover border border-white/10 grayscale group-hover:grayscale-0 transition-all" />
                          <div className={clsx("absolute -bottom-1 -right-1 size-8 rounded-2xl border-4 border-[#11141b] flex items-center justify-center", appt.status === 'completed' ? "bg-emerald-500" : "bg-amber-500")}>
                            {appt.status === 'completed' ? <ShieldCheck className="size-4 text-white" /> : <Clock className="size-4 text-white" />}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-[#a8c8ff] uppercase tracking-[0.3em] bg-[#a8c8ff]/10 px-3 py-1 rounded-lg border border-[#a8c8ff]/10">{t('agenda.protocol')}: {appt.caseCode || 'UNC-7'}</span>
                                                        <GuardianStatusBadge 
                              isVerified={appt.isGuardianVerified} 
                              age={appt.clientAge || appt.age} 
                              guardianVerifiedLabel={t('agenda.guardianVerified')}
                              guardianPendingLabel={t('agenda.guardianPending')}
                            />
                          </div>
                          <h4 className={clsx("text-3xl font-black tracking-tighter italic uppercase", selectedSessionId === appt.id ? "text-white" : "text-white/40 group-hover:text-white/70")}>
                            {selectedSessionId === appt.id || appt.status === 'accepted' ? (appt.userCode || appt.clientName) : maskPatientName(appt.clientName, appt.userCode)}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {appt.status === 'pending' || !appt.status ? (
                          <button onClick={(e) => { e.stopPropagation(); handleAcceptSession(appt.id); }} className="px-8 py-4 bg-[#a8c8ff] text-[#003062] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">{t('agenda.accept')}</button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[10px] font-black uppercase">{t('agenda.accepted')}</div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/20 group-hover:text-[#a8c8ff]"><ChevronRight className="size-6" /></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                                  <div className="py-32 text-center bg-white/2 border border-white/5 rounded-[4rem] text-white/20 font-black uppercase tracking-[0.3em] text-xs">{t('agenda.perimeterClear')}</div>
                )}
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="sticky top-12 space-y-10">
                {selectedSession ? (
                  <div className="bg-[#11141b]/60 backdrop-blur-3xl border border-white/5 rounded-[4rem] p-12 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 text-[#a8c8ff]/5"><Cpu className="size-32" /></div>
                    <div className="relative z-10 space-y-12">
                      <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">{t('agenda.dossier')}</h3>
                      <div className="space-y-10">
                        <div className="flex gap-8">
                          <img src={selectedSession.clientPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSession.clientName || 'P')}&background=a8c8ff&color=003062&size=200`} className="size-32 rounded-4xl border border-[#a8c8ff]/20 p-1 shadow-2xl" />
                          <div className="space-y-4 pt-4">
                            <p className="text-white text-3xl font-black tracking-tight">{selectedSession.userCode || selectedSession.clientName || 'Anonymous'}</p>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2"><Scan className="size-4 text-[#a8c8ff]" /> {t('agenda.biometricSync')}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">{t('agenda.observations')}</p>
                          <textarea
                            value={clinicalNote}
                            onChange={(e) => setClinicalNote(e.target.value)}
                            placeholder={t('agenda.observationsPlaceholder')}
                            className="w-full h-48 bg-white/5 border border-white/10 rounded-4xl p-8 text-white/80 text-sm outline-none transition-all placeholder:text-white/10 resize-none font-medium italic"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => handleSaveQuickNote(false)} disabled={isSaving || !clinicalNote} className="py-6 bg-white/5 border border-white/10 rounded-4xl text-white/40 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] group">
                            <Database className="size-4 mx-auto mb-2 opacity-50 group-hover:opacity-100" /> {t('agenda.vault')}
                          </button>
                          <button onClick={() => handleSaveQuickNote(true)} disabled={isSaving || !clinicalNote} className="py-6 bg-[#a8c8ff] text-[#003062] rounded-4xl shadow-xl hover:scale-105 active:scale-95 transition-all text-[9px] font-black uppercase tracking-[0.2em]">
                            <ArrowRight className="size-4 mx-auto mb-2" /> {t('agenda.dispatch')}
                          </button>
                        </div>
                        <button onClick={() => navigate(`/room/session-${selectedSession.caseCode}`)} className="w-full py-8 bg-linear-to-r from-msgr-primary-container to-[#004e99] text-white rounded-4xl font-black text-[13px] uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group">
                          <Zap className="size-5 animate-pulse text-[#a8c8ff]" /> {t('agenda.secureTerminal')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[600px] flex items-center justify-center border border-dashed border-white/10 rounded-[4rem]">
                    <div className="text-center space-y-4">
                      <Scan className="size-16 text-white/5 mx-auto" />
                                            <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">{t('agenda.selectionRequired')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showBookingModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-300 flex items-center justify-center p-6 font-['Manrope']">
            <div className="absolute inset-0 bg-[#080a0f]/90 backdrop-blur-xl" onClick={() => setShowBookingModal(false)} />
            <div className="w-full max-w-2xl relative bg-[#11141b] border border-white/10 rounded-[3.5rem] p-16 shadow-2xl overflow-hidden">
              <div className="mb-12 flex items-center gap-6">
                <div className="size-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-[#a8c8ff]"><PlusCircle className="size-8" /></div>
                <div>
                  <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">{t('agenda.manualLog')}</h3>
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-1">{t('agenda.manualProtocol')}</p>
                </div>
              </div>
              <div className="space-y-8">
                                <input type="text" value={bookingDetails.clientName} onChange={(e) => setBookingDetails({ ...bookingDetails, clientName: e.target.value })} className="w-full px-10 py-6 bg-white/5 border border-white/10 rounded-4xl text-white outline-none" placeholder={t('agenda.entityIdentifier')} />
                <select value={bookingDetails.category} onChange={(e) => setBookingDetails({ ...bookingDetails, category: e.target.value })} className="w-full px-10 py-6 bg-white/5 border border-white/10 rounded-4xl text-white outline-none appearance-none cursor-pointer">
                  <option value="Healing">{t('agenda.protocolHealing')}</option>
                  <option value="Consultant">{t('agenda.protocolSpecialist')}</option>
                </select>
                <button onClick={handleManualBook} className="w-full py-8 bg-[#a8c8ff] text-[#003062] rounded-4xl font-black text-[13px] uppercase tracking-[0.4em] shadow-2xl">{t('agenda.confirmEntry')}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
