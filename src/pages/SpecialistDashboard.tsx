import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FileText, Users, Tag, Plus, Video, Calendar, Phone, Trash2, Clock, Link as LinkIcon, X, UploadCloud, Loader2, ShieldCheck, Copy, Check, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { UrkioMockData } from '../mockData';
import clsx from 'clsx';

function UploadAnnounceModal({ user, userData, onClose }: any) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast.success("Announce uploaded successfully! (Mocked)");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-4xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 scale-in-center">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold bg-linear-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">{t('specialistDashboard.uploadAnnounce')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center hover:border-pink-500/50 transition-colors cursor-pointer group">
            <div className="size-16 bg-pink-100 dark:bg-pink-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-pink-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-1">{t('specialistDashboard.clickToUploadVideo') || 'Click to upload video'}</p>
            <p className="text-xs text-slate-500 font-medium">MP4, MOV or WebM (Max 50MB)</p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('specialistDashboard.startUpload')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SpecialistDashboard({ user, userData }: any) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'cases' | 'agenda' | 'reports' | 'courses'>('cases');
  const [isUploadingAnnounce, setIsUploadingAnnounce] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [isWritingReport, setIsWritingReport] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCase, setNewCase] = useState({ title: '', description: '', tags: '' });
  const [newAppointment, setNewAppointment] = useState({
    clientName: '', clientPhone: '', clientAge: '', date: '', time: '', notes: '',
    estimation: '', caseCode: '', tier: '1', category: 'General Anxiety', assignedExpert: '',
    symptoms: '', medicalHistory: ''
  });
  const [newCourseItem, setNewCourseItem] = useState({ title: '', description: '', date: '', sessionType: 'Healing Course' });
  const [searchTerm, setSearchTerm] = useState('');
  const [newReport, setNewReport] = useState({ title: '', content: '', patientId: '', apptId: '' });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [accessCodes, setAccessCodes] = useState<string[]>(userData?.clinicalKeys || []);

  useEffect(() => {
    if (userData?.clinicalKeys) {
      setAccessCodes(userData.clinicalKeys);
    }
  }, [userData?.clinicalKeys]);

  const navigate = useNavigate();
  const isAdmin = userData?.role === 'admin' || userData?.role === 'management' || userData?.role === 'founder' || ['urkio@urkio.com', 'sameralhalaki@gmail.com'].includes(userData?.email?.toLowerCase()) || ['urkio@urkio.com', 'sameralhalaki@gmail.com'].includes(user?.email?.toLowerCase());

  useEffect(() => {
    const role = (userData?.role || userData?.userType || '').toLowerCase();
    const isVerified = userData?.verificationStatus === 'verified' || userData?.verificationStatus === 'approved';
    const isMasterAdmin = ['founder', 'admin', 'management', 'manager'].includes(role) || 
                          ['urkio@urkio.com', 'sameralhalaki@gmail.com', 'banason150@gmail.com'].includes(user?.email?.toLowerCase() || '');
    
    const isSpecial = isMasterAdmin || (['specialist', 'expert', 'verifiedexpert', 'practitioner'].includes(role) && isVerified);

    if (!isSpecial) {
      navigate('/');
      return;
    }

    const qCases = isAdmin
      ? query(collection(db, 'cases'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'cases'), where('authorId', '==', user.uid), orderBy('createdAt', 'desc'));
    
    const unsubCases = onSnapshot(qCases, snap => setCases(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => {
      console.error("Cases listener error:", err);
      if (err.message.includes('requires an index')) {
        setError("Database indexing in progress. Please wait a few minutes.");
      } else {
        setError("Failed to sync cases. Please refresh.");
      }
    });

    const qAppts = isAdmin
      ? query(collection(db, 'appointments'))
      : query(collection(db, 'appointments'), where('expertId', '==', user.uid));
    
    const unsubAppts = onSnapshot(qAppts, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setAppointments(data);
    }, err => {
      console.error("Appointments listener error:", err);
      setError("Failed to sync appointments.");
    });

    const qReps = isAdmin
      ? query(collection(db, 'confidential_reports'))
      : query(collection(db, 'confidential_reports'), where('authorId', '==', user.uid));
    
    const unsubReps = onSnapshot(qReps, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setReports(data);
    }, err => {
      console.error("Reports listener error:", err);
      setError("Failed to sync clinical reports.");
    });

    const qCourses = isAdmin
      ? query(collection(db, 'events'), where('type', '==', 'course'))
      : query(collection(db, 'events'), where('type', '==', 'course'), where('expertId', '==', user.uid));
    
    const unsubCourses = onSnapshot(qCourses, snap => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.error("Courses listener error:", err);
      setError("Failed to sync courses.");
    });

    return () => { unsubCases(); unsubAppts(); unsubReps(); unsubCourses(); };
  }, [userData, user.uid, navigate, isAdmin]);

  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'cases'), {
        authorId: user.uid,
        authorName: userData.displayName || user.email,
        title: newCase.title,
        description: newCase.description,
        tags: newCase.tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: serverTimestamp()
      });
      setIsAddingCase(false);
      setNewCase({ title: '', description: '', tags: '' });
    } catch (err) { setError('Failed to add case'); }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateObj = new Date(`${newAppointment.date}T${newAppointment.time}:00`);
      await addDoc(collection(db, 'appointments'), {
        expertId: user.uid,
        ...newAppointment,
        date: dateObj.toISOString(),
        createdAt: new Date().toISOString()
      });
      setIsAddingAppointment(false);
      setNewAppointment({
        clientName: '', clientPhone: '', clientAge: '', date: '', time: '', notes: '',
        estimation: '', caseCode: '', tier: '1', category: 'General Anxiety', assignedExpert: '',
        symptoms: '', medicalHistory: ''
      });
      toast.success(t('specialistDashboard.appointmentSaved'));
    } catch (err) { setError('Failed to add appointment'); }
  };

  const handleAddReport = async (e: React.FormEvent, escalate: boolean = false) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'confidential_reports'), {
        authorId: user.uid,
        authorName: userData.displayName || user.email,
        title: newReport.title,
        content: newReport.content,
        apptId: newReport.apptId || '',
        patientId: newReport.patientId || '',
        escalated: escalate,
        status: escalate ? 'escalated' : 'saved',
        createdAt: new Date().toISOString()
      });
      setIsWritingReport(false);
      setNewReport({ title: '', content: '', patientId: '', apptId: '' });
      toast.success(escalate ? 'Escalated to management' : 'Report saved');
    } catch (err) { setError('Failed to save report'); }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'events'), {
        ...newCourseItem,
        type: 'course',
        expertId: user.uid,
        expertName: userData.displayName || user.email,
        createdAt: serverTimestamp()
      });
      setIsAddingCourse(false);
      setNewCourseItem({ title: '', description: '', date: '', sessionType: 'Healing Course' });
      toast.success('Course published successfully');
    } catch (err) { setError('Failed to add course'); }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Delete this course?')) await deleteDoc(doc(db, 'events', id));
  };

  const handleDeleteAppointment = async (id: string) => {
    if (window.confirm('Delete this case?')) await deleteDoc(doc(db, 'appointments', id));
  };

  const startVideoCall = () => {
    const roomId = `urkio-session-${Math.random().toString(36).substring(7)}`;
    navigate(`/therapy-room/${roomId}?type=video`);
  };

  const copySessionLink = (type: 'video' | 'audio') => {
    const roomId = `urkio-session-${Math.random().toString(36).substring(7)}`;
    const link = `${window.location.origin}/therapy-room/${roomId}?type=${type}`;
    navigator.clipboard.writeText(link);
    toast.success(`${type} link copied!`);
  };

  const handleGenerateKey = async () => {
    const newCode = `URK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const updatedCodes = [...accessCodes, newCode];
    setAccessCodes(updatedCodes);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        clinicalKeys: updatedCodes
      });
      toast.success("New clinical key generated");
    } catch (err) {
      console.error("Failed to persist clinical key:", err);
      toast.error("Generated locally but failed to save to cloud");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success('Copied');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-12 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-headline font-black text-zinc-900 dark:text-zinc-100 tracking-tighter mb-2">{t('specialistDashboard.title', 'Gold Clinical Command Center')}</h1>
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest truncate">{t('specialistDashboard.manageSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button onClick={() => setIsUploadingAnnounce(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-pink-600/10 text-pink-600 px-4 py-3 rounded-xl font-headline font-black text-[10px] uppercase tracking-widest border border-pink-100">
            <Video className="w-4 h-4" /> <span>{t('specialistDashboard.uploadAnnounce')}</span>
          </button>
          <button onClick={() => navigate(`/expert/${user.uid}`)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-ur-primary/10 text-ur-primary px-4 py-3 rounded-xl font-headline font-black text-[10px] uppercase tracking-widest border border-ur-primary/20 hover:bg-ur-primary/20 transition-all">
            <Sparkles className="w-4 h-4" /> My Practice Page
          </button>
          <button onClick={startVideoCall} className="flex-1 sm:flex-none bg-ur-primary text-white px-4 py-3 rounded-xl font-headline font-black text-[10px] uppercase tracking-widest shadow-lg">
            <Video className="w-4 h-4 inline me-2" /> {t('specialistDashboard.videoSession')}
          </button>
          <button
            onClick={() => {
              if (activeTab === 'cases') setIsAddingCase(!isAddingCase);
              else if (activeTab === 'agenda') setIsAddingAppointment(!isAddingAppointment);
              else if (activeTab === 'courses') setIsAddingCourse(!isAddingCourse);
              else setIsWritingReport(!isWritingReport);
            }}
            className="flex-1 sm:flex-none bg-ur-primary/10 text-ur-primary px-4 py-3 rounded-xl font-headline font-black text-[10px] uppercase tracking-widest border border-ur-primary/20"
          >
            <Plus className="w-4 h-4 inline me-2" /> New {activeTab.slice(0, -1)}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-8">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Virtual Healing Suite Quick Access */}
        <div className="bg-linear-to-br from-ur-primary to-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Video className="w-40 h-40" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80">Virtual Healing Suite</span>
            </div>
            <h2 className="text-3xl font-headline font-black mb-4 leading-tight">Launch Your <br />Private Sanctuary</h2>
            <p className="text-sm font-medium opacity-70 mb-8 max-w-xs leading-relaxed">Start an HD-encrypted healing session with your client in a premium, distraction-free environment.</p>

            <div className="mt-auto flex flex-wrap gap-4">
              <button
                onClick={() => {
                  navigate(`/therapy-room`);
                }}
                className="px-8 py-4 bg-white text-ur-primary rounded-2xl font-headline font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
              >
                Start Session
              </button>
              <button
                onClick={() => {
                  const id = Math.floor(1000 + Math.random() * 9000);
                  const link = `${window.location.origin}/therapy-room/XRQ-${id}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Invite link copied!");
                }}
                className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-headline font-black text-sm transition-all flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy Invite
              </button>
            </div>
          </div>
        </div>

        {/* Access Codes Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-ur-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-ur-primary">key</span>
              </div>
              <div>
                <h2 className="text-xl font-headline font-black text-on-surface dark:text-zinc-100 uppercase tracking-widest">{t('specialistDashboard.accessCodes')}</h2>
              </div>
            </div>
            <button 
              onClick={handleGenerateKey}
              className="px-6 py-3 bg-ur-primary text-white rounded-2xl font-headline font-black text-[10px] uppercase tracking-widest hover:bg-ur-primary/90 transition-all shadow-lg shadow-ur-primary/20"
            >
              Generate New Code
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {accessCodes.length > 0 ? (
              accessCodes.map(code => (
                <div key={code} onClick={() => copyToClipboard(code)} className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 rounded-4xl cursor-pointer hover:shadow-xl transition-all">
                  <span className="font-headline font-black text-lg text-ur-primary tracking-widest">{code}</span>
                  {copiedCode === code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-10 text-zinc-400 font-headline font-black text-[10px] uppercase tracking-widest">
                No active codes. Click generate to create one.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-4xl w-fit mb-12 border border-zinc-100 dark:border-zinc-800">
        {[
          { id: 'cases', label: t('specialistDashboard.caseStudies'), icon: 'folder_open' },
          { id: 'agenda', label: 'Clinical Agenda', icon: 'event' },
          { id: 'courses', label: 'My Courses', icon: 'school' },
          { id: 'reports', label: 'Confidential', icon: 'lock' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={clsx("flex items-center gap-3 px-8 py-3.5 rounded-3xl font-headline font-black text-[10px] uppercase tracking-widest transition-all", activeTab === tab.id ? "bg-white dark:bg-zinc-800 text-ur-primary shadow-lg border border-zinc-100" : "text-zinc-400")}>
            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'cases' && (
        <div className="grid gap-6">
          {isAddingCase && (
            <form onSubmit={handleAddCase} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <input type="text" placeholder="Case Title" className="w-full bg-slate-50 border rounded-xl px-4 py-2" value={newCase.title} onChange={e => setNewCase({ ...newCase, title: e.target.value })} />
              <textarea placeholder="Description" className="w-full bg-slate-50 border rounded-xl px-4 py-2 h-32" value={newCase.description} onChange={e => setNewCase({ ...newCase, description: e.target.value })} />
              <input type="text" placeholder="Tags (comma separated)" className="w-full bg-slate-50 border rounded-xl px-4 py-2" value={newCase.tags} onChange={e => setNewCase({ ...newCase, tags: e.target.value })} />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddingCase(false)} className="px-4 py-2 text-zinc-500">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-zinc-900 text-white rounded-xl">Publish Case</button>
              </div>
            </form>
          )}
          {cases.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm">
              <h3 className="text-lg font-bold mb-2">{c.title}</h3>
              <p className="text-sm text-zinc-600 mb-4">{c.description}</p>
              <div className="flex gap-2">{c.tags?.map((t: any) => <span key={t} className="px-2 py-1 bg-zinc-100 text-[10px] rounded-lg">#{t}</span>)}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'agenda' && (
        <div className="grid gap-6">
          {isAddingAppointment && (
            <form onSubmit={handleAddAppointment} className="bg-white rounded-2xl p-8 border border-zinc-200 shadow-xl space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Client Name" className="w-full bg-zinc-50 border rounded-xl px-4 py-3" value={newAppointment.clientName} onChange={e => setNewAppointment({ ...newAppointment, clientName: e.target.value })} />
                <input type="tel" placeholder="Phone" className="w-full bg-zinc-50 border rounded-xl px-4 py-3" value={newAppointment.clientPhone} onChange={e => setNewAppointment({ ...newAppointment, clientPhone: e.target.value })} />
                <input type="date" className="w-full bg-zinc-50 border rounded-xl px-4 py-3" value={newAppointment.date} onChange={e => setNewAppointment({ ...newAppointment, date: e.target.value })} />
                <input type="time" className="w-full bg-zinc-50 border rounded-xl px-4 py-3" value={newAppointment.time} onChange={e => setNewAppointment({ ...newAppointment, time: e.target.value })} />
                <input type="text" placeholder="Case Code (e.g. UK-99)" className="w-full bg-zinc-50 border rounded-xl px-4 py-3" value={newAppointment.caseCode} onChange={e => setNewAppointment({ ...newAppointment, caseCode: e.target.value })} />
                <select className="w-full bg-zinc-50 border rounded-xl px-4 py-3" value={newAppointment.category} onChange={e => setNewAppointment({ ...newAppointment, category: e.target.value })}>
                  {['General Anxiety', 'Depression', 'PTSD', 'ADHD', 'Relationships'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <textarea placeholder="Key Symptoms" className="w-full bg-zinc-50 border rounded-xl px-4 py-3 h-24" value={newAppointment.symptoms} onChange={e => setNewAppointment({ ...newAppointment, symptoms: e.target.value })} />
              <textarea placeholder="Medical History" className="w-full bg-zinc-50 border rounded-xl px-4 py-3 h-24" value={newAppointment.medicalHistory} onChange={e => setNewAppointment({ ...newAppointment, medicalHistory: e.target.value })} />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddingAppointment(false)} className="px-6 py-2">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-zinc-900 text-white rounded-2xl font-bold">Save Clinical Entry</button>
              </div>
            </form>
          )}

          <div className="grid gap-4">
            {appointments.map(appt => (
              <div key={appt.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-black uppercase text-zinc-400">Case #{appt.caseCode || 'UNCODED'}</span>
                    <h3 className="text-xl font-bold">{appt.clientName}</h3>
                    <p className="text-zinc-500 text-sm font-semibold">{appt.category} • {format(new Date(appt.date), 'MMM d, h:mm a')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setActiveTab('reports'); setIsWritingReport(true); setNewReport({ ...newReport, title: `Clinical Report: ${appt.clientName}`, apptId: appt.id }); }} className="p-2 bg-ur-primary/10 text-ur-primary rounded-xl"><FileText className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteAppointment(appt.id)} className="p-2 text-zinc-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
                {(appt.symptoms || appt.medicalHistory) && (
                  <div className="grid grid-cols-2 gap-4 mt-4 bg-zinc-50 p-4 rounded-2xl">
                    {appt.symptoms && <div><p className="text-[10px] font-black uppercase text-zinc-400">Symptoms</p><p className="text-xs">{appt.symptoms}</p></div>}
                    {appt.medicalHistory && <div><p className="text-[10px] font-black uppercase text-zinc-400">History</p><p className="text-xs">{appt.medicalHistory}</p></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'courses' && (
        <div className="grid gap-6">
          {isAddingCourse && (
            <form onSubmit={handleAddCourse} className="bg-white rounded-4xl p-8 border border-zinc-200 shadow-xl space-y-6">
              <h2 className="text-xl font-headline font-black uppercase tracking-widest text-ur-primary">Create Healing Course</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Course Title" className="w-full bg-zinc-50 border rounded-xl px-4 py-3" value={newCourseItem.title} onChange={e => setNewCourseItem({ ...newCourseItem, title: e.target.value })} required />
                <input type="date" className="w-full bg-zinc-50 border rounded-xl px-4 py-3" value={newCourseItem.date} onChange={e => setNewCourseItem({ ...newCourseItem, date: e.target.value })} required />
                <select className="w-full bg-zinc-50 border rounded-xl px-4 py-3" value={newCourseItem.sessionType} onChange={e => setNewCourseItem({ ...newCourseItem, sessionType: e.target.value })}>
                  <option>Healing Course</option>
                  <option>Workshop</option>
                  <option>Masterclass</option>
                  <option>Group Therapy</option>
                </select>
              </div>
              <textarea placeholder="Course Description & Learning Outcomes" className="w-full bg-zinc-50 border rounded-xl px-4 py-3 h-32" value={newCourseItem.description} onChange={e => setNewCourseItem({ ...newCourseItem, description: e.target.value })} required />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddingCourse(false)} className="px-6 py-2">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-ur-primary text-white rounded-2xl font-bold">Publish to My Place</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id} className="bg-white p-8 rounded-4xl border border-zinc-100 shadow-sm group hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ur-primary bg-ur-primary/10 px-3 py-1.5 rounded-full">{course.sessionType}</span>
                  <button onClick={() => handleDeleteCourse(course.id)} className="text-zinc-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <h3 className="text-xl font-headline font-black mb-3">{course.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 mb-6">{course.description}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest pt-6 border-t border-zinc-50">
                  <Calendar className="w-3 h-3" /> {course.date ? format(new Date(course.date), 'MMM d, yyyy') : 'Flexible Start'}
                </div>
              </div>
            ))}
            {courses.length === 0 && !isAddingCourse && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
                <p className="text-zinc-400 font-black text-xs uppercase tracking-widest">You haven't published any courses yet.</p>
                <button onClick={() => setIsAddingCourse(true)} className="mt-4 text-ur-primary font-black text-xs uppercase tracking-widest hover:underline">Create your first course</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid gap-6">
          {isWritingReport && (
            <form onSubmit={(e) => handleAddReport(e, false)} className="bg-white p-8 rounded-3xl border-t-4 border-t-red-500 shadow-xl space-y-4">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2"><ShieldCheck className="text-red-500" /> Clinical Report</h2>
              <input type="text" placeholder="Title" className="w-full border rounded-xl px-4 py-3" value={newReport.title} onChange={e => setNewReport({ ...newReport, title: e.target.value })} />
              <textarea placeholder="Confidential clinical notes..." className="w-full border rounded-xl px-4 py-3 h-64 shadow-inner" value={newReport.content} onChange={e => setNewReport({ ...newReport, content: e.target.value })} />
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsWritingReport(false)} className="px-4">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-zinc-900 text-white rounded-xl">Save Secretly</button>
                <button type="button" onClick={(e) => handleAddReport(e as any, true)} className="px-6 py-2 bg-red-600 text-white rounded-xl">Escalate</button>
              </div>
            </form>
          )}
          {reports.map(rep => (
            <div key={rep.id} className={clsx("p-6 rounded-3xl border", rep.escalated ? "bg-red-50/50 border-red-100" : "bg-white border-zinc-100")}>
              <h4 className="font-bold flex items-center gap-2">{rep.escalated && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">Escalated</span>} {rep.title}</h4>
              <p className="text-xs text-zinc-500 my-2">{rep.authorName} • {formatDistanceToNow(new Date(rep.createdAt), { addSuffix: true })}</p>
              <div className="bg-zinc-50/50 p-4 rounded-2xl text-sm whitespace-pre-wrap mt-4">{rep.content}</div>
            </div>
          ))}
        </div>
      )}

      {isUploadingAnnounce && <UploadAnnounceModal user={user} userData={userData} onClose={() => setIsUploadingAnnounce(false)} />}
    </div>
  );
}
