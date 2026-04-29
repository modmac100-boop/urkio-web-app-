/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  X, 
  User, 
  Calendar, 
  Activity, 
  Search, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Stethoscope,
  Apple,
  Users,
  Goal
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const MaterialIcon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userData: any;
}

export function NewAppointmentModal({ isOpen, onClose, user, userData }: NewAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [category, setCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Real-time Conflict Check
  useEffect(() => {
    if (!selectedDate || !user?.uid) return;
    
    const checkConflicts = async () => {
      const q = query(
        collection(db, 'appointments'),
        where('expertId', '==', user.uid),
        where('date', '>=', `${selectedDate}T00:00:00`),
        where('date', '<=', `${selectedDate}T23:59:59`)
      );
      const snap = await getDocs(q);
      const booked = snap.docs.map(d => {
        const timestamp = d.data().date;
        return timestamp ? timestamp.split('T')[1].substring(0, 5) : '';
      });
      setBookedSlots(booked);
    };
    checkConflicts();
  }, [selectedDate, user?.uid]);

  // Step 1: Search Patients
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const searchPatients = async () => {
      const q = query(
        collection(db, 'users'), 
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff'),
        limit(5)
      );
      const snap = await getDocs(q);
      setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    const timer = setTimeout(searchPatients, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleConfirmBooking = async () => {
    if (!selectedPatient || !category || !selectedDate || !selectedTime) {
      return toast.error('Please complete all steps');
    }

    setLoading(true);
    try {
      const timestamp = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      const caseCode = `UK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // 1. Create Appointment
      const apptRef = await addDoc(collection(db, 'appointments'), {
        userId: selectedPatient.id,
        clientName: selectedPatient.displayName || selectedPatient.fullName,
        expertId: user.uid,
        expertName: userData?.displayName || user.email,
        category,
        date: timestamp,
        status: 'pending',
        caseCode,
        notes,
        createdAt: serverTimestamp(),
      });

      // 2. Initialize Healing Metadata for AI Insight
      await addDoc(collection(db, 'session_metadata'), {
        appointmentId: apptRef.id,
        patientId: selectedPatient.id,
        historyBrief: selectedPatient.bio || 'New patient entry.',
        priority: 'Standard',
        age: selectedPatient.age || 'Adult',
        initialObservation: notes,
        createdAt: serverTimestamp()
      });

      toast.success('Appointment Scheduled & Vault Initialized');
      onClose();
      // Reset state
      setStep(1);
      setSelectedPatient(null);
    } catch (err: any) {
      console.error('Booking error:', err);
      toast.error('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white dark:bg-[#111418] w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 inset-s-0 inset-e-0 h-1.5 bg-slate-100 flex">
             <div className="h-full bg-msgr-primary transition-all duration-500" style={{ width: `${(step/4)*100}%` }} />
          </div>

          <div className="p-10">
            <header className="flex justify-between items-center mb-8">
               <div>
                  <h2 className="text-2xl font-black tracking-tighter italic text-slate-900 dark:text-white uppercase transition-all duration-300">
                    {step === 1 ? 'Patient Identity' : step === 2 ? 'Service Category' : step === 3 ? 'Slot Selection' : 'Intake Summary'}
                  </h2>
                  <p className="text-sm font-bold text-msgr-primary tracking-widest uppercase mt-1">Step {step} of 4</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="text-slate-400" /></button>
            </header>

            <div className="min-h-[300px]">
              {/* STEP 1: PATIENT SEARCH */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="relative mb-6">
                    <Search className="absolute inset-s-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl ps-12 ltr:pr-4 rtl:pl-4 py-4 text-sm font-medium focus:ring-2 focus:ring-msgr-primary"
                      placeholder="Search Existing Patient Record..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    {searchResults.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedPatient(p)}
                        className={clsx(
                          "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                          selectedPatient?.id === p.id ? "bg-msgr-primary/5 border-msgr-primary" : "border-slate-100 hover:border-slate-300"
                        )}
                      >
                         <div className="flex items-center gap-4">
                            <div className="size-10 rounded-full bg-slate-100 overflow-hidden">
                               <img src={p.photoURL || `https://ui-avatars.com/api/?name=${p.displayName}`} alt="" />
                            </div>
                            <div>
                               <p className="text-sm font-black">{p.displayName || p.fullName}</p>
                               <p className="text-[10px] text-slate-400 uppercase font-black">{p.role || 'Patient'}</p>
                            </div>
                         </div>
                         {selectedPatient?.id === p.id && <Check className="text-msgr-primary" size={18} />}
                      </div>
                    ))}
                    {searchQuery.length >= 2 && searchResults.length === 0 && (
                       <p className="text-center text-xs text-slate-400 py-8">No matching records found.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: CATEGORY */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-2 gap-4">
                   {[
                     { id: 'psychology', label: 'Psychology', icon: <MaterialIcon name="psychology" className="text-3xl" />, color: 'text-blue-500' },
                     { id: 'dietetics', label: 'Nutritional', icon: <MaterialIcon name="clinical_notes" className="text-3xl" />, color: 'text-green-500' },
                     { id: 'social', label: 'Social Work', icon: <MaterialIcon name="diversity_3" className="text-3xl" />, color: 'text-amber-500' },
                     { id: 'life', label: 'Life Coach', icon: <MaterialIcon name="self_improvement" className="text-3xl" />, color: 'text-purple-500' }
                   ].map((cat) => (
                     <div 
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={clsx(
                          "p-6 rounded-4xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4",
                          category === cat.id ? "bg-white border-msgr-primary shadow-inner" : "bg-white/50 border-transparent shadow-sm hover:shadow-md"
                        )}
                      >
                        <div className={cat.color}>{cat.icon}</div>
                        <span className="text-xs font-black uppercase tracking-widest">{cat.label}</span>
                     </div>
                   ))}
                </motion.div>
              )}

              {/* STEP 3: DATE & TIME */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ms-4 mb-2 block">Available Dates</label>
                      <input 
                        type="date"
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-msgr-primary"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ms-4 mb-2 block">Available Slots (Specialist Local Time)</label>
                      <div className="grid grid-cols-3 gap-2">
                         {['09:00', '10:30', '13:00', '14:30', '16:00', '17:30', '19:00'].map(t => {
                           const isBooked = bookedSlots.includes(t);
                           return (
                            <button 
                              key={t}
                              disabled={isBooked}
                              onClick={() => setSelectedTime(t)}
                              className={clsx(
                                "py-3 rounded-xl border text-[11px] font-black transition-all relative overflow-hidden",
                                selectedTime === t ? "bg-msgr-primary text-white border-msgr-primary" : 
                                isBooked ? "bg-slate-50 text-slate-300 border-slate-50 opacity-50 cursor-not-allowed" :
                                "border-slate-100 hover:border-slate-300"
                              )}
                            >
                              {t}
                              {isBooked && <div className="absolute top-0 inset-e-0 p-0.5"><X size={8} /></div>}
                            </button>
                           );
                         })}
                      </div>
                   </div>
                </motion.div>
              )}

              {/* STEP 4: NOTES */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ms-4 mb-2 block">Primary Reason for Visit</label>
                   <textarea 
                     className="w-full bg-slate-50 border-none rounded-4xl p-6 text-sm font-medium focus:ring-2 focus:ring-msgr-primary min-h-[160px] resize-none"
                     placeholder="State the core clinical challenge..."
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                   />
                </motion.div>
              )}
            </div>

            <footer className="mt-12 flex justify-between">
               {step > 1 ? (
                 <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    <ChevronLeft size={16} /> Back
                 </button>
               ) : <div />}
               
               <button 
                  onClick={step === 4 ? handleConfirmBooking : () => setStep(s => s + 1)}
                  disabled={loading || (step === 1 && !selectedPatient) || (step === 2 && !category) || (step === 3 && (!selectedDate || !selectedTime))}
                  className="bg-black text-white px-10 py-4 rounded-full font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30"
               >
                  {loading ? <Loader2 className="animate-spin" /> : step === 4 ? 'Confirm & Vault' : 'Continue'}
                  {step < 4 && !loading && <ChevronRight size={16} />}
               </button>
            </footer>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
