import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface BookSessionModalProps {
  expert: any;
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  userData?: any;
}

export function BookSessionModal({ expert, isOpen, onClose, user, userData }: BookSessionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && selectedDate) {
      setStep(2);
    } else if (step === 2 && selectedTime) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    if (!user || !expert) {
        setBookingError("You must be logged in to book a session.");
        return;
    }
    
    setIsBooking(true);
    setBookingError(null);
    
    try {
      await addDoc(collection(db, 'events'), {
        type: 'session',
        expertId: expert.id,
        expertName: expert.displayName || 'Expert',
        expertPhoto: expert.photoURL || '',
        userId: user.uid,
        userName: userData?.displayName || user.displayName || 'User',
        userPhoto: userData?.photoURL || user.photoURL || '',
        date: `2024-06-${selectedDate?.toString().padStart(2, '0')}`,
        time: selectedTime,
        message: message,
        status: 'scheduled',
        caseManagerId: userData?.role === 'case_manager' ? user.uid : null,
        caseManagerName: userData?.role === 'case_manager' ? (userData?.displayName || user.displayName) : null,
        clientName: userData?.role === 'case_manager' ? `Assign: ${user.displayName || 'Client'}` : (userData?.displayName || user.displayName),
        price: expert.hourlyRate || 85,
        createdAt: serverTimestamp()
      });
      setStep(4);
    } catch (error: any) {
      console.error("Booking error:", error);
      setBookingError(error.message || "Failed to book session. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!expert || !selectedDate || !selectedTime) return;
    
    const eventTitle = `Clinical Session with ${expert.displayName || 'Expert'}`;
    const dateStr = `2024-06-${selectedDate.toString().padStart(2, '0')}`;
    
    // Parse time to 24h for Google Calendar format
    let [time, modifier] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') hours = String(Number(hours) + 12);
    if (modifier === 'AM' && hours === '12') hours = '00';
    
    // YYYYMMDDTHHMMSS format
    const startTimestamp = dateStr.replace(/-/g, '') + 'T' + hours.padStart(2, '0') + minutes.padStart(2, '0') + '00';
    // End time (1 hour later)
    const endHours = String((Number(hours) + 1) % 24).padStart(2, '0');
    const endTimestamp = dateStr.replace(/-/g, '') + 'T' + endHours + minutes.padStart(2, '0') + '00';
    
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startTimestamp}/${endTimestamp}&details=${encodeURIComponent('Session booked via Urkio Platform.')}&location=${encodeURIComponent('Urkio Secure Link')}&sf=true&output=xml`;
    
    window.open(calendarUrl, '_blank');
  };

  const handleClose = () => {
    onClose();
    // Reset state after closing
    setTimeout(() => {
      setStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setMessage('');
      setBookingError(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === 4 ? handleClose : onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={clsx(
            "relative flex w-full flex-col rounded-xl bg-white dark:bg-[#111418] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh]",
            step === 4 ? "max-w-[520px]" : "max-w-[540px]"
          )}
        >
          {/* Header */}
          {step !== 4 && (
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "flex items-center justify-center size-8 rounded-lg text-white",
                  step === 1 ? "bg-transparent text-primary" : "bg-primary"
                )}>
                  <span className="material-symbols-outlined text-xl">
                    {step === 1 ? 'event_available' : step === 2 ? 'calendar_today' : 'verified_user'}
                  </span>
                </div>
                <div>
                  <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
                    {step === 1 ? 'Book Session' : step === 2 ? 'Select Time' : 'Confirm Booking'}
                  </h2>
                  {step === 3 && (
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Step 3 of 3</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center rounded-full h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col overflow-hidden"
            >
              {/* Expert Summary */}
              <div className="flex p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex w-full items-center gap-4">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-16 w-16 border-2 border-primary/20"
                    style={{ backgroundImage: `url("${expert?.photoURL || `https://ui-avatars.com/api/?name=${expert?.displayName || expert?.email}`}")` }}
                  />
                  <div className="flex flex-col justify-center">
                    <p className="text-slate-900 dark:text-white text-xl font-bold leading-tight">{expert?.displayName || 'Expert'}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{expert?.specialty || 'Specialist'}</p>
                    <p className="text-primary text-sm font-bold mt-1">${expert?.hourlyRate || '85'}/hr</p>
                  </div>
                </div>
              </div>

              {/* Calendar Section */}
              <div className="flex flex-col p-6 overflow-y-auto custom-scrollbar">
                <h3 className="text-slate-900 dark:text-white text-md font-bold mb-4">Select a Date</h3>
                <div className="flex flex-col gap-2">
                  {/* Calendar Navigation */}
                  <div className="flex items-center justify-between mb-2">
                    <button className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <p className="text-slate-900 dark:text-white font-bold">June 2024</p>
                    <button className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Days Header */}
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <p key={i} className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase text-center py-2">{day}</p>
                    ))}

                    {/* Empty Slots */}
                    <div className="h-10 col-start-1"></div>
                    <div className="h-10"></div>
                    <div className="h-10"></div>
                    <div className="h-10"></div>

                    {/* Past Days */}
                    {[1, 2, 3].map(day => (
                      <button key={day} className="h-10 w-full flex items-center justify-center rounded-lg text-sm text-slate-400 dark:text-slate-600 cursor-not-allowed">
                        {day}
                      </button>
                    ))}

                    {/* Available Days */}
                    {Array.from({ length: 27 }, (_, i) => i + 4).map(day => (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={clsx(
                          "h-10 w-full flex items-center justify-center rounded-lg text-sm transition-colors",
                          selectedDate === day
                            ? "bg-primary text-white font-bold shadow-lg shadow-primary/30"
                            : "text-slate-900 dark:text-slate-100 hover:bg-primary/10"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div className="px-6 pb-8 pt-2 shrink-0">
                <button
                  onClick={handleNext}
                  disabled={!selectedDate}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl h-14 bg-primary text-white text-lg font-bold transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                >
                  <span>Next: Select Time</span>
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
                <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-4">
                  Step 1 of 3: Choose your preferred date
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col overflow-hidden h-full"
            >
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Date Indicator & Title */}
                <div className="space-y-1">
                  <p className="text-primary font-semibold text-sm tracking-wider uppercase">Step 2 of 3</p>
                  <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold">Choose a time slot</h1>
                  <div className="flex items-center gap-2 mt-2 text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-sm">event</span>
                    <p className="text-sm font-medium">Monday, June {selectedDate}, 2024</p>
                  </div>
                </div>

                {/* Period Quick Filters */}
                <div className="flex gap-2 p-1 bg-slate-200 dark:bg-slate-800/50 rounded-lg overflow-x-auto no-scrollbar">
                  <button className="flex-1 min-w-[100px] py-2 px-4 rounded-md bg-white dark:bg-slate-700 shadow-sm text-sm font-semibold text-primary">Morning</button>
                  <button className="flex-1 min-w-[100px] py-2 px-4 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Afternoon</button>
                  <button className="flex-1 min-w-[100px] py-2 px-4 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Evening</button>
                </div>

                {/* Slots Sections */}
                <div className="space-y-6">
                  {/* Morning */}
                  <section>
                    <h3 className="text-slate-900 dark:text-slate-100 text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-500 text-lg">light_mode</span>
                      Morning
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['09:00 AM', '10:30 AM', '11:00 AM'].map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={clsx(
                            "group flex items-center justify-center gap-3 p-4 rounded-lg transition-all",
                            selectedTime === time
                              ? "border border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary"
                              : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-primary dark:hover:border-primary"
                          )}
                        >
                          <span className={clsx(
                            "material-symbols-outlined text-xl transition-colors",
                            selectedTime === time ? "text-primary" : "text-slate-400 dark:text-slate-500 group-hover:text-primary"
                          )}>schedule</span>
                          <span className={clsx(
                            "font-bold transition-colors",
                            selectedTime === time ? "text-primary" : "text-slate-900 dark:text-slate-100 group-hover:text-primary"
                          )}>{time}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Afternoon */}
                  <section>
                    <h3 className="text-slate-900 dark:text-slate-100 text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-yellow-500 text-lg">wb_sunny</span>
                      Afternoon
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['01:30 PM', '02:00 PM', '04:30 PM'].map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={clsx(
                            "group flex items-center justify-center gap-3 p-4 rounded-lg transition-all",
                            selectedTime === time
                              ? "border border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary"
                              : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-primary dark:hover:border-primary"
                          )}
                        >
                          <span className={clsx(
                            "material-symbols-outlined text-xl transition-colors",
                            selectedTime === time ? "text-primary" : "text-slate-400 dark:text-slate-500 group-hover:text-primary"
                          )}>schedule</span>
                          <span className={clsx(
                            "font-bold transition-colors",
                            selectedTime === time ? "text-primary" : "text-slate-900 dark:text-slate-100 group-hover:text-primary"
                          )}>{time}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Evening */}
                  <section>
                    <h3 className="text-slate-900 dark:text-slate-100 text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-400 text-lg">dark_mode</span>
                      Evening
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['06:00 PM', '07:30 PM'].map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={clsx(
                            "group flex items-center justify-center gap-3 p-4 rounded-lg transition-all",
                            selectedTime === time
                              ? "border border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary"
                              : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-primary dark:hover:border-primary"
                          )}
                        >
                          <span className={clsx(
                            "material-symbols-outlined text-xl transition-colors",
                            selectedTime === time ? "text-primary" : "text-slate-400 dark:text-slate-500 group-hover:text-primary"
                          )}>schedule</span>
                          <span className={clsx(
                            "font-bold transition-colors",
                            selectedTime === time ? "text-primary" : "text-slate-900 dark:text-slate-100 group-hover:text-primary"
                          )}>{time}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Footer / Action Area */}
              <footer className="border-t border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-900/80 shrink-0">
                <button
                  onClick={handleBack}
                  className="flex-1 px-6 py-3 rounded-lg font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Back to Calendar
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedTime}
                  className="flex-2 px-6 py-3 rounded-lg font-bold bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
                >
                  Confirm {selectedTime || 'Time'}
                </button>
              </footer>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col overflow-hidden h-full"
            >
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Summary Card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-slate-900 dark:text-slate-100 text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">event_note</span>
                    Booking Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 dark:text-slate-400 text-sm">Expert</span>
                      <div className="flex items-center gap-2">
                        <img 
                          alt={expert?.displayName || 'Expert'} 
                          className="size-6 rounded-full object-cover" 
                          src={expert?.photoURL || `https://ui-avatars.com/api/?name=${expert?.displayName || expert?.email}`}
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-slate-900 dark:text-slate-100 text-sm font-medium">{expert?.displayName || 'Expert'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-200 dark:border-slate-800/50 pt-3">
                      <span className="text-slate-500 dark:text-slate-400 text-sm">Date</span>
                      <span className="text-slate-900 dark:text-slate-100 text-sm font-medium">Monday, June {selectedDate}, 2024</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-200 dark:border-slate-800/50 pt-3">
                      <span className="text-slate-500 dark:text-slate-400 text-sm">Time</span>
                      <span className="text-slate-900 dark:text-slate-100 text-sm font-medium">{selectedTime} (1h)</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t border-slate-200 dark:border-slate-800/50 mt-3 bg-primary/5 -mx-5 px-5 rounded-b-xl">
                      <span className="text-slate-900 dark:text-slate-100 font-bold">Total Price</span>
                      <span className="text-primary text-xl font-bold">${expert?.hourlyRate || '85'}.00</span>
                    </div>
                  </div>
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-2">
                    Message to Expert
                  </label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[120px] transition-all text-sm leading-relaxed outline-none" 
                    placeholder="Briefly describe what you'd like to discuss or any specific questions you have..."
                  />
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">This helps {expert?.displayName?.split(' ')[0] || 'the expert'} prepare for your session.</p>
                </div>

                {/* Payment Notice */}
                <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="material-symbols-outlined text-primary">info</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                    Your payment will be securely processed. You can cancel or reschedule up to 24 hours before the session for a full refund.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <footer className="p-6 pt-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                {bookingError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800/50">
                    {bookingError}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleBack}
                    className="flex-1 order-2 sm:order-1 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Back to Selection
                  </button>
                  <button 
                    onClick={handleConfirm}
                    disabled={isBooking}
                    className="flex-2 order-1 sm:order-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isBooking ? (
                      <div className="size-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Confirm & Pay ${expert?.hourlyRate || '85'}.00</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 grayscale opacity-60">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Secure Payment</span>
                  </div>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                  <div className="flex gap-2">
                    <div className="w-8 h-5 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
                    <div className="w-8 h-5 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
                    <div className="w-8 h-5 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col overflow-hidden"
            >
              {/* Success Header Illustration */}
              <div className="relative flex h-48 w-full items-center justify-center bg-linear-to-br from-primary/20 via-primary/5 to-transparent overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="relative flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_30px_rgba(19,109,236,0.5)]">
                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex flex-col gap-8 px-8 pb-10 pt-6 overflow-y-auto custom-scrollbar">
                {/* Heading */}
                <div className="flex flex-col items-center text-center gap-2">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Booking Request Sent</h1>
                  <p className="text-slate-600 dark:text-slate-400 max-w-[340px]">Your session request has been sent to {expert?.displayName || 'the expert'} and is <span className="font-bold text-amber-500">waiting for confirmation</span>.</p>
                </div>

                {/* Session Details Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 p-6 shadow-sm">
                  <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 border border-primary/20">
                      <img 
                        alt={expert?.displayName || 'Expert'} 
                        className="h-full w-full object-cover" 
                        src={expert?.photoURL || `https://ui-avatars.com/api/?name=${expert?.displayName || expert?.email}`}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">Expert</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{expert?.displayName || 'Expert'}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                        <span className="text-sm font-medium">Date</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">June {selectedDate}, 2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-lg">schedule</span>
                        <span className="text-sm font-medium">Time</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedTime}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleClose}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary h-12 px-6 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-lg">dashboard</span>
                    Back to Dashboard
                  </button>
                  <button 
                    onClick={handleAddToCalendar}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-12 px-6 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-lg">event</span>
                    Add to Calendar
                  </button>
                </div>

                {/* Footer Info */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-500">
                  A confirmation email has been sent to your registered address. 
                  <br/>Need help? <a className="text-primary hover:underline" href="mailto:support@urkio.com">Contact Support</a>
                </p>
              </div>

              {/* Decorative background elements */}
              <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-hidden">
                <div className="absolute -top-[10%] -inset-s-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
                <div className="absolute -bottom-[10%] -inset-e-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
