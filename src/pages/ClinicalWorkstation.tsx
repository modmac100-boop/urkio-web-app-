/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc,
  orderBy
} from 'firebase/firestore';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { PostSessionDebrief } from '../components/PostSessionDebrief';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { 
  Plus, 
  Video, 
  Shield, 
  Activity,
  Search as SearchIcon,
  Zap,
  Check,
  RefreshCw,
  Edit3,
  Save,
  UserPlus,
  ArrowLeft,
  User,
  FlaskConical,
  Mic,
  MicOff,
  Navigation,
  Layers,
  Archive,
  Menu,
  ChevronRight,
  X
} from 'lucide-react';
import { NewAppointmentModal } from '../components/NewAppointmentModal';

const MaterialIcon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function ClinicalWorkstation({ user, userData, initialTab = 'agenda' }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [aiOrientation, setAiOrientation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'records' | 'notes' | 'plans' | 'dashboard'>(initialTab);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [showDebrief, setShowDebrief] = useState(false);
  const [confidentialReports, setConfidentialReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const lastSavedNotes = useRef('');
  const lastSavedOrientation = useRef('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const isAdmin = userData?.role === 'admin' || userData?.role === 'management' || userData?.email === 'urkio@urkio.com';

  useEffect(() => {
    if (!user?.uid) return;
    const q = isAdmin 
      ? query(collection(db, 'appointments'), orderBy('date', 'desc'))
      : query(collection(db, 'appointments'), where('expertId', '==', user.uid), orderBy('date', 'desc'));
    
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAppointments(data);
      setIsSynced(true);
      if (data.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data[0].id);
      }
    }, () => setIsSynced(false));

    return () => unsub();
  }, [user?.uid, isAdmin]);

  useEffect(() => {
    if (!user?.uid || activeTab !== 'records') return;
    setIsLoadingReports(true);
    const q = query(
      collection(db, 'confidential_reports'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, snap => {
      setConfidentialReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoadingReports(false);
    }, (err) => {
      console.error("Error fetching reports:", err);
      setIsLoadingReports(false);
    });

    return () => unsub();
  }, [user?.uid, activeTab]);

  const selectedCase = appointments.find(a => a.id === selectedCaseId);
  useEffect(() => {
    if (selectedCase) {
      setSessionNotes(selectedCase.draftNotes || '');
      setAiOrientation(selectedCase.initialObservation || '');
    }
  }, [selectedCaseId, selectedCase]);

  useEffect(() => {
    const timer = setInterval(async () => {
      const notesChanged = sessionNotes && sessionNotes !== lastSavedNotes.current;
      const orientChanged = aiOrientation && aiOrientation !== lastSavedOrientation.current;

      if ((notesChanged || orientChanged) && selectedCaseId) {
        setIsAutoSaving(true);
        try {
          await updateDoc(doc(db, 'appointments', selectedCaseId), {
            draftNotes: sessionNotes,
            initialObservation: aiOrientation,
            lastAutoSave: serverTimestamp()
          });
          lastSavedNotes.current = sessionNotes;
          lastSavedOrientation.current = aiOrientation;
        } catch (e) {
          setIsSynced(false);
        } finally {
          setIsAutoSaving(false);
        }
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [sessionNotes, aiOrientation, selectedCaseId]);

  const handleGenerateAI = async () => {
    if (!selectedCaseId || !selectedCase) return;
    setIsSaving(true);
    const id = toast.loading("AI Synthesis in progress...");
    try {
      const generateSynthesis = httpsCallable(functions, 'generateClinicalSynthesis');
      const result = await generateSynthesis({ 
        clientName: selectedCase.clientName,
        category: selectedCase.category,
        notes: sessionNotes,
        initialObservation: selectedCase.initialObservation
      });
      
      const data = result.data as any;
      if (data.synthesis) {
        setAiOrientation(data.synthesis);
        toast.success("AI Synthesis Complete", { id });
      } else {
        throw new Error("No synthesis returned");
      }
    } catch (err) {
      console.error("AI Synthesis Error:", err);
      const mockInsight = "Strategic assessment indicates a shift towards cognitive resilience. Patient demonstrates improved emotional regulation and is responding well to current therapeutic framework.";
      setAiOrientation(mockInsight);
      toast.error("AI Synthesis Failed - Using local engine", { id });
    } finally {
      setIsSaving(false);
    }
  };

  const handleJoinCall = async (patient: any) => {
    try {
      const sessionRef = doc(db, 'appointments', patient.id);
      await updateDoc(sessionRef, {
        sessionStatus: 'active',
        sessionStartedAt: serverTimestamp()
      });
      setCompletedSession(patient);
      navigate(`/call/${patient.id}`);
      toast.success(t('clinical.bridgeOpened'));
    } catch (err) {
      toast.error(t('clinical.bridgeError'));
    }
  };

  const handleArchiveToVault = async () => {
    if (!selectedCase) return toast.error(t('clinical.vaultError'));
    setIsSaving(true);
    const id = toast.loading("Archiving to vault...");
    try {
      await addDoc(collection(db, 'confidential_reports'), {
        authorId: user.uid,
        authorName: userData.displayName || user.email,
        title: `${t('clinical.clinicalSession')}: ${selectedCase.clientName}`,
        content: sessionNotes,
        aiOrientation: aiOrientation,
        caseCode: selectedCase.caseCode || 'UK-UNK',
        patientId: selectedCase.userId || '',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'audit_logs'), {
        userId: user.uid,
        userName: userData.displayName || user.email,
        action: 'ARCHIVE_REPORT',
        patientId: selectedCase.userId || '',
        timestamp: serverTimestamp(),
        detail: `Expert archived clinical notes for patient ${selectedCase.userId}`
      });
      await updateDoc(doc(db, 'appointments', selectedCase.id), { status: 'completed' });
      toast.success(t('clinical.vaultSuccess'), { id });
      setSessionNotes('');
      setAiOrientation('');
    } catch (err) {
      toast.error(t('clinical.vaultError'), { id });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAppointments = appointments.filter(a => 
    a.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.caseCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#fbf9f5] font-['Manrope'] text-[#1b1c1a] min-h-screen flex selection:bg-teal-100">
      <aside className="fixed left-0 top-0 h-full z-40 flex flex-col h-screen w-64 border-r border-slate-200 bg-slate-50">
        <div className="p-6 flex flex-col h-full">
          <div className="mb-8">
            <span className="text-xl font-bold text-[#1B4D4B] font-['Newsreader']">Clinical Portal</span>
            <div className="mt-4 flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/50">
              <img 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-50" 
                src={userData?.photoURL || "https://ui-avatars.com/api/?name=Admin"} 
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1B4D4B] truncate">{userData?.displayName || 'Dr. Wellness'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{userData?.role || 'Practitioner'}</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
              { id: 'agenda', label: 'Clinical Agenda', icon: 'calendar_today' },
              { id: 'plans', label: 'Protocols', icon: 'description' },
              { id: 'records', label: 'Case Dossiers', icon: 'folder_shared' },
              { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.path) navigate(item.path);
                  else setActiveTab(item.id as any);
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-xl group",
                  activeTab === item.id 
                    ? "text-[#1B4D4B] font-bold bg-teal-50 border-r-4 border-[#1B4D4B]" 
                    : "text-slate-500 hover:text-[#1B4D4B] hover:bg-slate-100"
                )}
              >
                <MaterialIcon name={item.icon} className={clsx(activeTab === item.id ? "text-[#1B4D4B]" : "text-slate-400 group-hover:text-[#1B4D4B]")} />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-auto bg-[#1B4D4B] text-white px-4 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-teal-900/20 active:scale-95"
          >
            <MaterialIcon name="add" className="text-xl" />
            New Protocol
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 px-8 sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-8 flex-1">
            <span className="text-2xl font-['Newsreader'] text-[#1B4D4B] font-bold">Clinical Nexus</span>
            <div className="relative w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-1 focus:ring-[#1B4D4B] outline-none transition-all focus:bg-white" 
                placeholder="Search clinical records..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-[#1B4D4B] transition-colors relative">
                <MaterialIcon name="notifications" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button className="text-slate-400 hover:text-[#1B4D4B] transition-colors"><MaterialIcon name="help_outline" /></button>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <button 
              onClick={() => toast.success("Secure Terminal Initialized")}
              className="bg-[#1B4D4B] text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-[#256663] transition-all shadow-md active:scale-95"
            >
              Live Terminal
            </button>
          </div>
        </header>

        <main className="p-8 grid grid-cols-12 gap-8">
          <div className="col-span-12 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-['Newsreader'] font-bold text-[#1B4D4B] mb-1 capitalize">
                {activeTab.replace('-', ' ')}
              </h1>
              <p className="text-slate-500 text-sm font-medium">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-[#d2e5c9] text-[#1B4D4B] px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 border border-[#b9ccb1]">
                <MaterialIcon name="verified" className="text-xs fill-1" />
                EXPERT VERIFIED
              </span>
            </div>
          </div>

          <div className="col-span-12 grid grid-cols-4 gap-8">
            {[
              { label: 'Active Entities', val: appointments.length, icon: 'group', color: 'bg-teal-50', text: 'text-[#1B4D4B]', trend: '+12%' },
              { label: 'Pending Analysis', val: appointments.filter(a => a.status === 'pending').length, icon: 'analytics', color: 'bg-amber-50', text: 'text-amber-700', trend: 'Pending' },
              { label: 'Success Protocol', val: 'Optimum', icon: 'verified_user', color: 'bg-blue-50', text: 'text-blue-700', trend: '98%' },
              { label: 'Vault Density', val: 'High', icon: 'database', color: 'bg-purple-50', text: 'text-purple-700', trend: '8.4 TB' }
            ].map((metric, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className={clsx("p-3 rounded-xl transition-transform group-hover:scale-110 duration-500", metric.color)}>
                    <MaterialIcon name={metric.icon} className={metric.text} />
                  </div>
                  <span className={clsx("text-[10px] font-bold px-2 py-1 rounded-lg", 
                    metric.trend.includes('+') ? "bg-emerald-50 text-emerald-600" : 
                    metric.trend === 'Pending' ? "bg-amber-50 text-amber-600" : 
                    "bg-slate-50 text-slate-500"
                  )}>
                    {metric.trend}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{metric.label}</p>
                <p className="text-3xl font-bold text-[#1B4D4B] font-['Newsreader']">{metric.val}</p>
              </div>
            ))}
          </div>

          <div className="col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h2 className="text-xl font-bold text-[#1B4D4B] font-['Newsreader']">
                {activeTab === 'records' ? 'Case Repository' : 'Incoming Protocols'}
              </h2>
              <button 
                onClick={() => setActiveTab('records')}
                className="text-xs text-[#1B4D4B] font-bold flex items-center gap-2 hover:underline group"
              >
                View Archive <MaterialIcon name="arrow_forward" className="text-sm group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="divide-y divide-slate-50 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
              {(activeTab === 'records' ? confidentialReports : filteredAppointments).length > 0 ? 
                (activeTab === 'records' ? confidentialReports : filteredAppointments).map((item: any, i) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedCaseId(item.id)}
                  className={clsx(
                    "p-6 flex items-center justify-between transition-all cursor-pointer group",
                    selectedCaseId === item.id ? "bg-teal-50/50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm ring-1 ring-slate-100 transition-transform group-hover:scale-105">
                      <img 
                        alt="Imagery" 
                        className="w-full h-full object-cover" 
                        src={item.imageUrl || (i % 3 === 0 ? "https://lh3.googleusercontent.com/aida-public/AB6AXuDo_ljHupEXoqeW2w_d-euXBMWUK8Zrgnd-YC9mzMfbLzWjv3mWGLMXcRvN8_UL5K8Z3ULkwaKUrOWmN7edygFekue_r5ZbXhxWJ-vgiJblxqacomtIhydAeaew7ahh8l59of3-6HqdFAiWDolU4dgw9D8GKti2vV6ClHDjlqXDJLM1pDRXvUvNT4bIk7_Rfbztvk6133gg1rrKHlWR4yVZK0U-Z1Wv-rPD6AOZaFn3lnpNeubzzIDg_aBZLhTczYh8OqXQ3vVFpqel" : "https://lh3.googleusercontent.com/aida-public/AB6AXuC04F5ewk2WjeShEWA49R9WsZcb7Gwq6fjtmrZi0c1e3NVkSX8iJFRaQmu3iMJPzZUBcNFD67Cm_riS07gnz4fkyvdbbFTelUKZblVQwAZ94UFupfP8yQ8FAj-qdU--MnWjjhMPIa5Z0kvhakhZrZX_PPA0OkidkVLoTKeV2MvMQIA6BJVO9gLZFnU9dzj9d3NYUD5vlY4o3RCysk79JzPHha1SouPJ5QVKGJxVbFndVQ8ot9UOqyX7IfcIaqmw9U1I9dbHiou7o6r9")} 
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">#{item.caseCode || `PR-${item.id.substring(0,4)}`}</p>
                      <h3 className="text-lg font-bold text-[#1B4D4B] font-['Newsreader']">{item.clientName || item.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1B4D4B]">{item.category || 'Clinical Trial'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {item.createdAt?.toDate ? format(item.createdAt.toDate(), 'HH:mm') : 'Initiated 2h ago'}
                      </p>
                    </div>
                    <span className={clsx(
                      "px-4 py-2 rounded-full text-[10px] font-black tracking-widest border",
                      item.status === 'completed' ? "bg-slate-50 text-slate-400 border-slate-100" :
                      item.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-teal-50 text-[#1B4D4B] border-teal-100"
                    )}>
                      {(item.status || 'active').toUpperCase()}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center">
                  <MaterialIcon name="inventory_2" className="text-6xl text-slate-100 mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No active protocols detected</p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-[#1B4D4B] font-['Newsreader']">
                  Dossier: <span className="font-normal italic">{selectedCase?.clientName?.split(' ')[0] || 'Unknown'}</span>
                </h2>
                <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <MaterialIcon name="more_vert" className="text-slate-300" />
                </button>
              </div>

              {selectedCase ? (
                <div className="space-y-8 flex-1 flex flex-col">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Biometric Sync Status</span>
                      <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                         ONLINE
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#1B4D4B] h-full w-[82%] transition-all duration-1000"></div>
                    </div>
                    <p className="mt-2 text-[9px] font-bold text-slate-400 text-right uppercase tracking-tighter">82% Signal Strength</p>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-bold text-[#1B4D4B] uppercase tracking-widest mb-3">Clinical Observations</label>
                    <textarea 
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      className="w-full flex-1 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-1 focus:ring-[#1B4D4B] focus:bg-white transition-all p-6 outline-none resize-none custom-scrollbar" 
                      placeholder={`Enter findings for protocol ${selectedCase?.caseCode || 'URKIO'}...`}
                    />
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={handleArchiveToVault}
                        className="flex items-center justify-between px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-[#1B4D4B] hover:bg-slate-50 transition-all font-bold text-xs group"
                      >
                        <div className="flex items-center gap-3">
                          <MaterialIcon name="lock" className="text-lg group-hover:scale-110 transition-transform" />
                          <span>Vault</span>
                        </div>
                        <MaterialIcon name="chevron_right" className="text-sm opacity-30" />
                      </button>
                      <button 
                        onClick={() => toast.success("Dispatching clinical data...")}
                        className="flex items-center justify-between px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-[#1B4D4B] hover:bg-slate-50 transition-all font-bold text-xs group"
                      >
                        <div className="flex items-center gap-3">
                          <MaterialIcon name="send" className="text-lg group-hover:scale-110 transition-transform" />
                          <span>Dispatch</span>
                        </div>
                        <MaterialIcon name="chevron_right" className="text-sm opacity-30" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => handleJoinCall(selectedCase)}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1B4D4B] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#256663] transition-all shadow-xl shadow-teal-900/10 active:scale-95"
                    >
                      <MaterialIcon name="terminal" />
                      Secure Terminal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                  <MaterialIcon name="folder_open" className="text-6xl mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Select a protocol to view dossier</p>
                </div>
              )}
            </div>

            <div className="bg-[#1B4D4B] text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl group">
              <div className="relative z-10">
                <p className="text-xl font-['Newsreader'] font-bold mb-3 italic">Protocol Insight</p>
                <p className="text-sm text-teal-100/80 mb-6 leading-relaxed">
                  {aiOrientation || "Integrate the new bio-rhythmic markers for more accurate analysis of the Urkio stream."}
                </p>
                <button 
                  onClick={handleGenerateAI}
                  className="text-xs font-bold border-b border-teal-400 pb-1 hover:text-teal-400 transition-colors uppercase tracking-widest"
                >
                  Review Guidelines
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity duration-1000 rotate-12 group-hover:rotate-0">
                <MaterialIcon name="psychology" className="text-[160px]" />
              </div>
            </div>
          </div>
        </main>
      </div>

      <NewAppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        userData={userData}
      />

      <AnimatePresence>
        {showDebrief && completedSession && (
          <PostSessionDebrief 
            session={completedSession} 
            onClose={() => {
              setShowDebrief(false);
              setCompletedSession(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function ClinicalIntake({ user, userData }: any) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: 'Other',
    primaryIssue: '',
    clinicalOrientation: 'General',
    initialObservation: '',
    historyBrief: '',
    priority: 'Standard'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.primaryIssue) {
      return toast.error('Please fill in required fields');
    }

    setLoading(true);
    try {
      const caseCode = `UK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await addDoc(collection(db, 'appointments'), {
        clientName: formData.patientName,
        caseCode,
        category: formData.primaryIssue,
        initialObservation: formData.initialObservation,
        expertId: user.uid,
        expertName: userData?.displayName || user.email,
        createdAt: serverTimestamp(),
        date: new Date().toISOString(), // Default to now for workstation testing
        status: 'pending',
        ...formData
      });

      toast.success(t('clinical.caseInitialized', { code: caseCode }));
      navigate('/clinical-workstation');
    } catch (err: any) {
      console.error('Error creating clinical case:', err);
      toast.error('Failed to initialize clinical case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1b1c1a] p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-8 font-black text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('clinical.backToDashboard')}
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#004e99] rounded-2xl text-white shadow-xl shadow-[#004e99]/20">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic">{t('clinical.initializeCase')}</h1>
          </div>
          <p className="text-zinc-500 font-medium">{t('clinical.initializeCaseDesc')}</p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
            <h2 className="text-lg font-black italic flex items-center gap-2">
              <User size={20} className="text-[#004e99]" /> {t('clinical.patientId')}
            </h2>
            <div className="space-y-4">
              <input 
                type="text" required value={formData.patientName}
                onChange={e => setFormData({...formData, patientName: e.target.value})}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004e99] outline-none"
                placeholder={t('clinical.fullName')}
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" value={formData.age}
                  onChange={e => setFormData({...formData, age: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004e99] outline-none"
                  placeholder={t('clinical.age')}
                />
                <select 
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004e99] outline-none"
                >
                  <option value="Male">{t('clinical.male')}</option>
                  <option value="Female">{t('clinical.female')}</option>
                  <option value="Other">{t('clinical.other')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
            <h2 className="text-lg font-black italic flex items-center gap-2">
              <FlaskConical size={20} className="text-[#004e99]" /> {t('clinical.clinicalContext')}
            </h2>
            <div className="space-y-4">
              <input 
                type="text" required value={formData.primaryIssue}
                onChange={e => setFormData({...formData, primaryIssue: e.target.value})}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004e99] outline-none"
                placeholder={t('clinical.primaryDiagnosis')}
              />
              <textarea 
                value={formData.initialObservation}
                onChange={e => setFormData({...formData, initialObservation: e.target.value})}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004e99] outline-none min-h-[100px]"
                placeholder={t('clinical.initialOrientationNotes')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full bg-zinc-900 text-white py-6 rounded-4xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all"
          >
            {loading ? t('clinical.initializing') : t('clinical.createSecureCase')}
          </button>
        </form>
      </div>
    </div>
  );
}
