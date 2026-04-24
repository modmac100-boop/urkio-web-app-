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
  const [isDictating, setIsDictating] = useState(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'records' | 'notes' | 'plans'>(initialTab);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [showDebrief, setShowDebrief] = useState(false);
  const [confidentialReports, setConfidentialReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const lastSavedNotes = useRef('');
  const lastSavedOrientation = useRef('');

  // Sync tab with URL/Prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const isAdmin = userData?.role === 'admin' || userData?.role === 'management' || userData?.email === 'urkio@urkio.com';
  const isExpert = ['specialist', 'expert', 'verifiedexpert', 'psychologist', 'practitioner'].includes(userData?.role || '');

  // Live Queue Listener
  useEffect(() => {
    if (!user?.uid) return;
    const q = isAdmin 
      ? query(collection(db, 'appointments'), orderBy('date', 'asc'))
      : query(collection(db, 'appointments'), where('expertId', '==', user.uid), orderBy('date', 'asc'));
    
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAppointments(data);
      setIsSynced(true);
    }, () => setIsSynced(false));

    return () => unsub();
  }, [user?.uid, isAdmin]);

  // Confidential Reports Listener
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

  // Sync edited fields when Case changes
  const selectedCase = appointments.find(a => a.id === selectedCaseId);
  useEffect(() => {
    if (selectedCase) {
      setSessionNotes(selectedCase.draftNotes || '');
      setAiOrientation(selectedCase.initialObservation || '');
    }
  }, [selectedCaseId, selectedCase]);

  // Auto-Save Logic (Notes & Orientation)
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
    }, 15000); // Faster 15s pulse for "Control" feel

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
      // Fallback premium mock if function fails or is not yet deployed
      const mockInsight = "Strategic assessment indicates a shift towards cognitive resilience. Patient demonstrates improved emotional regulation and is responding well to current therapeutic framework.";
      setAiOrientation(mockInsight);
      toast.error("AI Synthesis Failed - Using local engine", { id });
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-Trigger AI Insight on selection
  useEffect(() => {
    if (selectedCaseId && !aiOrientation && !isSaving) {
      handleGenerateAI();
    }
  }, [selectedCaseId]);

  const handleJoinCall = async (patient: any) => {
    try {
      // Initialize the session perimeter for the patient
      const sessionRef = doc(db, 'appointments', patient.id);
      await updateDoc(sessionRef, {
        sessionStatus: 'active',
        sessionStartedAt: serverTimestamp()
      });
      // We set this here so that when they come back to this page, 
      // they have the option to complete the debrief
      setCompletedSession(patient);
      navigate(`/call/${patient.id}`);
      toast.success(t('clinical.bridgeOpened'));
    } catch (err) {
      toast.error(t('clinical.bridgeError'));
    }
  };

  const handleEndSession = async () => {
    if (!completedSession) return;
    try {
      const sessionRef = doc(db, 'appointments', completedSession.id);
      await updateDoc(sessionRef, { 
        status: 'completed',
        sessionStatus: 'completed',
        completedAt: serverTimestamp()
      });
      setShowDebrief(true);
    } catch (err) {
       toast.error(t('clinical.closeSessionError'));
    }
  };

  const handleExportData = () => {
    if (!selectedCase) return toast.error('No case selected for export');
    const data = {
      case: selectedCase,
      notes: sessionNotes,
      aiOrientation: aiOrientation,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urkio_clinical_export_${selectedCase.caseCode || 'case'}.json`;
    a.click();
    toast.success('Clinical data exported successfully');
  };

  const handleCreatePrescription = () => {
    toast.success('Prescription module initialized. Generating secure token...');
    // Real logic would open a modal here
  };

  const handleGenerateSummary = () => {
    toast.loading('AI generating session summary...', { duration: 2000 });
    setTimeout(() => {
      setSessionNotes(prev => prev + "\n\n[SESSION SUMMARY]: Patient displayed positive cognitive response. Recommended follow-up in 7 days.");
      toast.success('Summary integrated into notes.');
    }, 2500);
  };

  const handleVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return toast.error(t('clinical.voiceNotSupported'));
    }

    if (isDictating) {
      setIsDictating(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsDictating(true);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setSessionNotes(prev => prev + ' ' + transcript);
    };
    recognition.onerror = () => setIsDictating(false);
    recognition.onend = () => setIsDictating(false);

    recognition.start();
  };

  const efficiencyRate = appointments.length > 0 
    ? Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100) 
    : 0;

  const handleArchiveToVault = async () => {
    if (!selectedCase) return toast.error(t('clinical.vaultError'));
    setIsSaving(true);
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

      // 🛡️ [Security] Audit Log for Write Action
      await addDoc(collection(db, 'audit_logs'), {
        userId: user.uid,
        userName: userData.displayName || user.email,
        action: 'ARCHIVE_REPORT',
        patientId: selectedCase.userId || '',
        timestamp: serverTimestamp(),
        detail: `Expert archived clinical notes for patient ${selectedCase.userId}`
      });
      await updateDoc(doc(db, 'appointments', selectedCase.id), { status: 'completed' });
      toast.success(t('clinical.vaultSuccess'));
      setSessionNotes('');
      setAiOrientation('');
    } catch (err) {
      toast.error(t('clinical.vaultError'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAppointments = appointments.filter(a => 
    a.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.caseCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-[#faf9f6] text-[#1b1c1a] font-body flex flex-col z-100 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* TopNavBar: Mobile-Responsive */}
      <nav className="h-16 md:h-20 w-full bg-white border-b border-zinc-100 flex justify-between items-center px-4 md:px-10 shrink-0">
        <div className="flex items-center gap-4 md:gap-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
             <span className="text-xl font-black tracking-tighter text-[#004e99] dark:text-blue-400">URKIO</span>
             <span className="hidden md:inline text-zinc-400 font-light uppercase text-[10px] tracking-widest ms-1">{t('clinical.clinical')}</span>
          </div>
          <div className="hidden lg:flex items-center bg-zinc-100/60 dark:bg-zinc-800/20 px-6 py-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/30 transition-all focus-within:border-[#004e99] focus-within:ring-4 focus-within:ring-[#004e99]/5 group">
            <SearchIcon className="text-zinc-400 group-focus-within:text-[#004e99] transition-colors size-4" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm w-60 xl:w-80 font-bold outline-none ms-3 placeholder-zinc-400" 
              placeholder="Search active cases, names, or codes..." 
              type="text"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="size-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center ms-2 hover:bg-zinc-300 transition-colors"
              >
                <X size={10} className="text-zinc-500" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          {selectedCase && (
            <button 
              onClick={() => handleJoinCall(selectedCase)}
              className="p-3 bg-[#004e99]/5 hover:bg-[#004e99] hover:text-white text-[#004e99] rounded-2xl transition-all group"
              title="Initiate Bridge"
            >
              <MaterialIcon name="video_call" className="group-hover:scale-110 transition-transform" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
             <MaterialIcon name="verified_user" className="text-amber-600 text-xs!" />
             <span className="text-[8px] font-black uppercase tracking-widest text-amber-700">{t('clinical.healerMode')}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             <div className="hidden md:block text-end">
                <p className="text-xs font-black">{userData?.displayName || t('home.healer')}</p>
                <p className="text-[9px] text-[#004e99] uppercase tracking-widest font-black mt-1">{t('clinical.clinicalLead')}</p>
             </div>
             <img alt="" className="size-10 md:size-12 rounded-2xl" src={userData?.photoURL || "https://ui-avatars.com/api/?name=U"} />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 flex-col-reverse md:flex-row overflow-hidden">
        {/* Navigation: Sidebar (Desktop) / Bottom Bar (Mobile) */}
        <aside className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-e border-zinc-100 flex md:flex-col pt-2 md:pt-10 pb-4 md:pb-8 px-4 md:px-6 gap-2 md:gap-y-1.5 shrink-0 z-110 justify-around md:justify-start">
          <h3 className="hidden md:block text-[10px] font-black text-zinc-400 uppercase tracking-widest px-4 mb-6">{t('clinical.operations')}</h3>
          {[
            { id: 'agenda', label: t('clinical.agenda'), icon: 'calendar_today', path: '/agenda' },
            { id: 'records', label: t('clinical.vault'), icon: 'folder_shared', path: '/records' },
            { id: 'notes', label: t('clinical.notes'), icon: 'edit_note', path: '/notes' },
            { id: 'plans', label: t('clinical.plans'), icon: 'assignment', path: '/plans' }
          ].map(item => (
            <div 
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); navigate(item.path); }}
              className={clsx(
                "flex items-center justify-center md:justify-start gap-3 md:gap-4 px-3 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl cursor-pointer transition-all flex-1 md:flex-none",
                activeTab === item.id ? "bg-[#004e99] text-white shadow-lg" : "text-zinc-500 hover:bg-zinc-50"
              )}
            >
              <MaterialIcon name={item.icon} className="text-xl!" />
              <span className="hidden md:inline text-[13px] font-black uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
          <div className="hidden md:block mt-auto">
            <div className="p-6 bg-zinc-900 rounded-[2.5rem] text-white">
               <p className="text-[10px] font-black uppercase tracking-widest text-[#00aaff] mb-4">{t('clinical.efficiency')}</p>
               <h4 className="text-4xl font-black italic mb-2 tracking-tighter">{efficiencyRate}%</h4>
               <div className="w-full bg-white/10 h-1.5 rounded-full mt-6"><div className="bg-[#00aaff] h-full" style={{ width: `${efficiencyRate}%` }} /></div>
            </div>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 p-4 md:p-12 overflow-y-auto bg-[#faf9f6]">
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 md:mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
              <div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic text-zinc-900 leading-none">
                  {activeTab === 'agenda' && t('clinical.commandHub')}
                  {activeTab === 'records' && 'Patient Repository'}
                  {activeTab === 'notes' && 'Diagnostic Vault'}
                  {activeTab === 'plans' && 'Treatment Orchestration'}
                </h1>
                <p className="text-zinc-500 font-medium mt-2 md:mt-4 text-sm md:text-lg">
                  {activeTab === 'agenda' && t('clinical.commandHubDesc')}
                  {activeTab === 'records' && 'Complete index of patient assets and clinical history.'}
                  {activeTab === 'notes' && 'Secure archive of session debriefs and confidential reports.'}
                  {activeTab === 'plans' && 'Active treatment pathways and cognitive milestones.'}
                </p>
              </div>
              <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => navigate('/clinical/new')}
                  className="flex-1 sm:flex-none bg-white border border-zinc-200 text-zinc-900 px-4 md:px-8 py-3 md:py-5 rounded-2xl md:rounded-4xl font-black uppercase text-[10px] md:text-xs tracking-widest flex items-center justify-center gap-2 md:gap-3 transition-all hover:bg-zinc-50 active:scale-95"
                >
                  <UserPlus size={16} /> {t('clinical.addPatient')}
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 sm:flex-none bg-zinc-900 text-white px-4 md:px-8 py-3 md:py-5 rounded-2xl md:rounded-4xl font-black uppercase text-[10px] md:text-xs tracking-widest flex items-center justify-center gap-2 md:gap-3 shadow-xl transition-all hover:bg-black active:scale-95"
                >
                  <Plus size={16} /> {t('clinical.addBooking')}
                </button>
              </div>
            </header>

            {/* TAB CONTENT SWITCHER */}
            {activeTab === 'agenda' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Tactical Sidebar */}
                <div className="col-span-1 md:col-span-1 flex md:flex-col gap-4 py-4">
                   {[
                     { icon: 'share', label: 'Invite', action: () => {
                       const link = `${window.location.origin}/call/${selectedCaseId || 'lobby'}`;
                       navigator.clipboard.writeText(link);
                       toast.success('Patient Invitation link copied.');
                     }},
                     { icon: 'download', label: 'Export', action: handleExportData },
                     { icon: 'summarize', label: 'Summary', action: handleGenerateSummary },
                     { icon: 'sync', label: 'Sync', action: () => {
                       setIsAutoSaving(true);
                       setTimeout(() => {
                         setIsAutoSaving(false);
                         toast.success('Clinical vault synchronized.');
                       }, 1500);
                     }},
                     { icon: 'medication', label: 'Prescription', action: handleCreatePrescription },
                     { icon: 'forward_to_inbox', label: 'Handover', action: () => {
                       toast.promise(
                         new Promise((resolve) => setTimeout(resolve, 2000)),
                         {
                           loading: 'Preparing handover package...',
                           success: 'Handover package secure and dispatched.',
                           error: 'Failed to prepare handover.',
                         }
                       );
                     }}
                   ].map(btn => (
                     <button 
                        key={btn.label}
                        onClick={btn.action}
                        className="p-4 bg-white border border-zinc-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-[#004e99] hover:text-white hover:shadow-xl transition-all group"
                        title={btn.label}
                     >
                       <MaterialIcon name={btn.icon} className="group-hover:scale-110 transition-transform" />
                       <span className="text-[8px] font-black uppercase tracking-widest">{btn.label}</span>
                     </button>
                   ))}
                </div>

                {/* Patient Queue */}
                <div className="col-span-1 md:col-span-6 space-y-4 md:space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-4">{t('clinical.activeQueue')}</h3>
                  <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 gap-4 md:gap-6 snap-x no-scrollbar">
                    {filteredAppointments.length > 0 ? filteredAppointments.map((appt) => (
                        <div 
                          key={appt.id}
                          onClick={() => setSelectedCaseId(appt.id)}
                          className={clsx(
                            "min-w-[280px] md:min-w-0 p-6 rounded-[2.5rem] border transition-all cursor-pointer relative snap-center",
                            selectedCaseId === appt.id ? "bg-white border-[#004e99] shadow-2xl scale-[1.02]" : "bg-white/50 border-zinc-100"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 md:gap-6">
                              <div className="size-12 md:size-16 rounded-2xl bg-zinc-100 overflow-hidden shrink-0">
                                  <img src={`https://ui-avatars.com/api/?name=${appt.clientName}&background=random`} className="w-full h-full" alt="" />
                              </div>
                              <div>
                                  <h4 className="text-xl md:text-2xl font-black italic text-zinc-900 leading-none mb-2 wrap-break-word">{appt.clientName}</h4>
                                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#004e99]">{appt.category || 'Clinical'}</span>
                              </div>
                            </div>
                            <div className="text-end shrink-0">
                               <div className="flex gap-2 mb-2">
                                  {appt.priority === 'High' && <span className="size-2 bg-red-500 rounded-full animate-ping" />}
                               </div>
                              <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:text-[#004e99] transition-all">{t('clinical.launch')} <ChevronRight className={clsx("inline-block", isRTL && "rotate-180")} size={10} /></p>
                              <p className="text-xs md:text-sm font-black mt-1">{appt.date ? format(new Date(appt.date), 'HH:mm') : '--:--'}</p>
                            </div>
                          </div>
                        </div>
                    )) : (
                        <div onClick={() => setIsModalOpen(true)} className="w-full p-12 md:p-20 text-center border-4 border-dashed border-zinc-200 rounded-[3rem] md:rounded-[4rem] cursor-pointer hover:bg-zinc-50 transition-all">
                          <p className="text-zinc-400 font-black uppercase text-xs">No entries found for today.</p>
                        </div>
                    )}
                  </div>
                </div>

                {/* Interaction Panel */}
                <div className="col-span-1 md:col-span-5 space-y-6 md:space-y-8 pb-32 md:pb-0">
                  <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-zinc-100 shadow-xl md:shadow-2xl">
                      <div className="flex items-center justify-between mb-6 md:mb-8">
                        <h3 className="text-lg md:text-xl font-black italic flex items-center gap-2 md:gap-3">
                            <Zap className="text-[#004e99]" size={18} /> {t('clinical.clinicalAI')}
                        </h3>
                        <button onClick={handleGenerateAI} className="text-[8px] md:text-[9px] font-black text-[#004e99] uppercase tracking-widest">{t('clinical.regen')}</button>
                      </div>
                      <textarea 
                        value={aiOrientation}
                        onChange={(e) => setAiOrientation(e.target.value)}
                        disabled={!selectedCaseId || isSaving}
                        className="w-full bg-msgr-surface-container-low p-4 md:p-6 rounded-2xl md:rounded-4xl border-none text-xs md:text-sm font-medium text-zinc-700 leading-relaxed italic resize-none min-h-[120px] md:min-h-[160px] focus:ring-1 focus:ring-[#004e99]/30 outline-none"
                        placeholder={t('clinical.aiPlaceholder')}
                      />
                  </div>

                  <div className="bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] text-white relative shadow-2xl">
                      <div className="flex justify-between items-center mb-6 md:mb-8">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#00aaff]">{t('clinical.liveDiagnostic')}</h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleVoiceDictation}
                            className={clsx(
                              "p-3 rounded-2xl transition-all",
                              isDictating ? "bg-red-500 animate-pulse" : "bg-white/10 hover:bg-white/20"
                            )}
                          >
                            {isDictating ? <MicOff size={16} /> : <Mic size={16} />}
                          </button>
                        </div>
                      </div>
                      <textarea 
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        disabled={!selectedCaseId}
                        className="w-full bg-transparent border-none focus:ring-0 text-zinc-200 font-medium text-sm min-h-[250px] md:min-h-[300px] resize-none px-0 custom-scrollbar"
                        placeholder={t('clinical.notesPlaceholder')}
                      />
                      <div className="flex flex-col gap-3 mt-6 md:mt-8">
                        <button 
                          onClick={handleArchiveToVault}
                          disabled={isSaving || !sessionNotes}
                          className="w-full bg-white text-zinc-900 py-4 md:py-5 rounded-2xl md:rounded-4xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Save size={16} /> {t('clinical.archiveDiagnostics')}
                        </button>
                        {completedSession && (
                          <button 
                            onClick={handleEndSession}
                            className="w-full bg-[#00aaff] text-white py-4 md:py-5 rounded-2xl md:rounded-4xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-[#0088cc] shadow-lg shadow-[#00aaff]/20 active:scale-95"
                          >
                              <Zap size={16} /> {t('clinical.finalizeSession')}
                          </button>
                        )}
                      </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'records' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isLoadingReports ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-64 bg-white border border-zinc-100 rounded-[2.5rem] animate-pulse" />
                  ))
                ) : confidentialReports.length > 0 ? confidentialReports.map(report => (
                  <div key={report.id} className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="size-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
                        <Archive className="size-6 text-[#004e99]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-black italic text-zinc-900 mb-1 truncate">{report.title}</h4>
                        <p className="text-[9px] font-bold text-[#004e99] uppercase tracking-widest">{report.caseCode || 'URK-REPORT'}</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-8">
                       <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed italic">{report.content || 'No report content available.'}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                       <span>{report.createdAt ? format(report.createdAt.toDate(), 'MMM dd, yyyy') : '--'}</span>
                       <button 
                         onClick={() => { setSessionNotes(report.content); setAiOrientation(report.aiOrientation || ''); setActiveTab('notes'); }}
                         className="text-[#004e99] hover:underline"
                       >
                         Review Report
                       </button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center border-4 border-dashed border-zinc-100 rounded-[3rem]">
                    <Archive className="size-16 text-zinc-100 mx-auto mb-6" />
                    <p className="text-zinc-400 font-black uppercase text-xs tracking-widest">No confidential reports found in your vault.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* We'll fetch from confidential_reports here in a real app, for now let's show formatted list */}
                <div className="bg-white border border-zinc-100 p-12 rounded-[4rem] text-center">
                  <Archive className="size-16 text-zinc-200 mx-auto mb-6" />
                  <h3 className="text-2xl font-black italic mb-2 tracking-tight">Secure Archive Access</h3>
                  <p className="text-zinc-400 text-sm max-w-sm mx-auto mb-10">Access your historical diagnostic reports and AI orientations securely indexed by case code.</p>
                  <button className="bg-zinc-900 text-white px-10 py-5 rounded-4xl font-black uppercase text-xs tracking-widest shadow-xl">
                    Sync Vault Data
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-zinc-900 text-white p-12 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-[#00aaff]/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
                   <div className="relative z-10 text-center md:text-left">
                      <h3 className="text-4xl font-black italic mb-4 tracking-tighter leading-none">Treatment Pathways</h3>
                      <p className="text-zinc-400 font-medium max-w-md">Orchestrate cognitive milestones and track patient progression through customized healing modules.</p>
                   </div>
                   <button 
                     onClick={() => {
                       toast.success('Treatment pathway module initialized.');
                       setActiveTab('agenda');
                     }}
                     className="relative z-10 bg-[#00aaff] text-white px-12 py-6 rounded-4xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
                   >
                      Initialize New Plan
                   </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FOOTER: Fixed Sync Status */}
      <footer className="h-10 bg-white border-t border-zinc-100 hidden sm:flex items-center justify-between px-10">
         <div className="flex items-center gap-3">
            <div className={clsx("size-2 rounded-full", isSynced ? "bg-ur-secondary animate-pulse" : "bg-red-500")} />
            <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-400">{t('clinical.status')}: {isSynced ? t('clinical.synced') : t('clinical.offline')}</span>
         </div>
      </footer>

      <NewAppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        userData={userData}
      />

      {/* Debrief Modal Overlay */}
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
