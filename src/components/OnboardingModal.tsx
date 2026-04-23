import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import clsx from 'clsx';

// ─── Data ──────────────────────────────────────────────────────────────────────

const HOBBIES = [
  { label: 'Reading', icon: 'menu_book' },
  { label: 'Yoga', icon: 'self_improvement' },
  { label: 'Cooking', icon: 'restaurant' },
  { label: 'Hiking', icon: 'hiking' },
  { label: 'Music', icon: 'music_note' },
  { label: 'Photography', icon: 'photo_camera' },
  { label: 'Painting', icon: 'palette' },
  { label: 'Gaming', icon: 'sports_esports' },
  { label: 'Fitness', icon: 'fitness_center' },
  { label: 'Travel', icon: 'flight' },
  { label: 'Meditation', icon: 'spa' },
  { label: 'Writing', icon: 'edit_note' },
  { label: 'Dancing', icon: 'nightlife' },
  { label: 'Gardening', icon: 'local_florist' },
  { label: 'Cycling', icon: 'directions_bike' },
  { label: 'Swimming', icon: 'pool' },
  { label: 'Art', icon: 'brush' },
  { label: 'Volunteering', icon: 'volunteer_activism' },
  { label: 'Podcasts', icon: 'podcasts' },
  { label: 'Board Games', icon: 'casino' },
  { label: 'Running', icon: 'directions_run' },
  { label: 'Movies', icon: 'movie' },
  { label: 'Journaling', icon: 'book' },
  { label: 'Nature Walks', icon: 'park' },
];

const EXPERT_SKILLS = [
  { label: 'Trauma Therapy', icon: 'healing' },
  { label: 'Cognitive Behavioral Therapy', icon: 'psychology' },
  { label: 'Mindfulness & Meditation', icon: 'self_improvement' },
  { label: 'Grief Counseling', icon: 'sentiment_very_dissatisfied' },
  { label: 'Stress Management', icon: 'mood' },
  { label: 'Relationship Counseling', icon: 'favorite' },
  { label: 'Child Development', icon: 'child_care' },
  { label: 'Addiction Recovery', icon: 'sports_soccer' },
  { label: 'Anxiety & Depression', icon: 'psychiatry' },
  { label: 'Nutrition Planning', icon: 'local_dining' },
  { label: 'Life Coaching', icon: 'track_changes' },
  { label: 'Family Therapy', icon: 'group' },
  { label: 'Career Counseling', icon: 'work' },
  { label: 'PTSD Treatment', icon: 'shield' },
  { label: 'Sleep Disorders', icon: 'bedtime' },
  { label: 'Anger Management', icon: 'mood_bad' },
  { label: 'Body Positivity', icon: 'accessibility_new' },
  { label: 'Eating Disorders', icon: 'restaurant' },
  { label: 'ADHD Support', icon: 'interests' },
  { label: 'Autism Support', icon: 'diversity_1' },
  { label: 'Couples Therapy', icon: 'handshake' },
  { label: 'Teen Counseling', icon: 'school' },
  { label: 'Group Therapy', icon: 'groups' },
  { label: 'Crisis Intervention', icon: 'emergency' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  isOpen: boolean;
  user: any;
  userData: any;
  onComplete: () => void;
}

// How many steps there are based on user type
function getTotalSteps(isExpert: boolean) {
  return isExpert ? 3 : 2; // welcome, hobbies, (skills for experts)
}

export function OnboardingModal({ isOpen, user, userData, onComplete }: OnboardingModalProps) {
  const isExpert = ['specialist', 'admin', 'practitioner', 'expert', 'verifiedExpert'].includes(
    userData?.role?.toLowerCase() || ''
  ) || userData?.userType === 'expert';

  const totalSteps = getTotalSteps(isExpert);
  const [step, setStep] = useState(1);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const MIN_HOBBIES = 3;
  const MIN_SKILLS = 3;
  const MAX_SKILLS = 4;

  const toggleHobby = (label: string) => {
    setSelectedHobbies(prev =>
      prev.includes(label) ? prev.filter(h => h !== label) : [...prev, label]
    );
  };

  const toggleSkill = (label: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(label)) return prev.filter(s => s !== label);
      if (prev.length >= MAX_SKILLS) return prev; // max 4
      return [...prev, label];
    });
  };

  const saveAndFinish = async () => {
    if (!user?.uid) { onComplete(); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        hobbies: selectedHobbies,
        ...(isExpert ? { expertSkills: selectedSkills } : {}),
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Error saving onboarding data:', e);
    } finally {
      setSaving(false);
      onComplete();
    }
  };

  const canProceedStep2 = selectedHobbies.length >= MIN_HOBBIES;
  const canFinish = isExpert ? selectedSkills.length >= MIN_SKILLS : canProceedStep2;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header bar gradient */}
        <div
          className="h-1.5 w-full shrink-0"
          style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)' }}
        />

        {/* Step progress */}
        <div className="px-8 pt-6 pb-2 shrink-0">
          <div className="flex gap-2 mb-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{
                  background:
                    i < step
                      ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                      : 'rgba(100,116,139,0.2)',
                }}
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-2">
          {/* ── Step 1: Welcome ──────────────────────────────────────────── */}
          {step === 1 && (
            <div className="py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div
                className="size-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <span className="material-symbols-outlined text-white text-5xl">waving_hand</span>
              </div>
              <h2 className="text-3xl font-black mb-3">
                Welcome{userData?.displayName ? `, ${userData.displayName.split(' ')[0]}` : ''}! 🎉
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-md mx-auto mb-2">
                Before you start your healing journey on Urkio, let's personalize your experience.
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mx-auto">
                {isExpert
                  ? "You'll choose your hobbies and the skills you bring as an expert. These appear on your profile and help users find you."
                  : "You'll select your hobbies so we can connect you with like-minded people and relevant communities."}
              </p>

              {isExpert && (
                <div
                  className="mt-8 p-4 rounded-2xl text-start mx-auto max-w-sm"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-indigo-500">verified</span>
                    <p className="font-bold text-sm text-indigo-700 dark:text-indigo-400">Expert Profile Setup</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Your selected skills (3–4) will appear as badges on your expert card and profile page, helping clients quickly understand your specialties.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Hobbies ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <h2 className="text-2xl font-black mb-1">Pick Your Hobbies</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                  Choose at least <strong>{MIN_HOBBIES}</strong> hobbies that interest you. 
                  <span className={clsx(
                    "px-2 py-0.5 rounded-full text-xs font-bold transition-all",
                    selectedHobbies.length >= MIN_HOBBIES ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600 animate-pulse"
                  )}>
                    {selectedHobbies.length}/{MIN_HOBBIES} selected
                  </span>
                </p>
                {selectedHobbies.length < MIN_HOBBIES && (
                  <p className="text-[11px] text-red-500 mt-2 font-bold animate-bounce">
                    * Please select {MIN_HOBBIES - selectedHobbies.length} more to continue
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {HOBBIES.map(h => {
                  const sel = selectedHobbies.includes(h.label);
                  return (
                    <button
                      key={h.label}
                      onClick={() => toggleHobby(h.label)}
                      className={clsx(
                        'flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 text-center group',
                        sel
                          ? 'border-indigo-500 shadow-lg'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800'
                      )}
                      style={sel ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' } : {}}
                    >
                      <span
                        className="material-symbols-outlined text-2xl transition-transform group-hover:scale-110"
                        style={sel ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {h.icon}
                      </span>
                      <span className="text-[11px] font-bold leading-tight">{h.label}</span>
                      {sel && (
                        <span
                          className="absolute top-1 inset-e-1 size-4 rounded-full bg-white flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[12px] text-indigo-600">check</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Expert Skills ────────────────────────────────────── */}
          {step === 3 && isExpert && (
            <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <h2 className="text-2xl font-black mb-1">Your Expert Skills</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                  Select <strong>3 to 4</strong> skills representing your expertise.
                  <span className={clsx(
                    "px-2 py-0.5 rounded-full text-xs font-bold transition-all",
                    selectedSkills.length >= MIN_SKILLS ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600 animate-pulse"
                  )}>
                    {selectedSkills.length}/{MIN_SKILLS} required
                  </span>
                </p>
                {selectedSkills.length < MIN_SKILLS && (
                  <p className="text-[11px] text-red-500 mt-2 font-bold animate-bounce">
                    * Please select {MIN_SKILLS - selectedSkills.length} more to continue
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {EXPERT_SKILLS.map(s => {
                  const sel = selectedSkills.includes(s.label);
                  const maxReached = !sel && selectedSkills.length >= MAX_SKILLS;
                  return (
                    <button
                      key={s.label}
                      onClick={() => toggleSkill(s.label)}
                      disabled={maxReached}
                      className={clsx(
                        'flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 text-start group',
                        sel
                          ? 'border-violet-500 shadow-lg'
                          : maxReached
                          ? 'border-slate-100 dark:border-slate-800 opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-900'
                          : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-slate-800'
                      )}
                      style={sel ? { background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white' } : {}}
                    >
                      <span
                        className="material-symbols-outlined text-xl shrink-0 transition-transform group-hover:scale-110"
                        style={sel ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {s.icon}
                      </span>
                      <span className="text-[12px] font-bold leading-tight">{s.label}</span>
                      {sel && (
                        <span className="ms-auto">
                          <span className="material-symbols-outlined text-[16px] text-white/80">check_circle</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedSkills.length >= MAX_SKILLS && (
                <p className="text-center text-xs text-violet-600 dark:text-violet-400 font-semibold mt-4 animate-pulse">
                  ✓ Maximum 4 skills selected. Deselect one to change.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
              >
                Back
              </button>
            )}

            {step < totalSteps ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 2 && !canProceedStep2}
                className={clsx(
                  'flex-1 py-4 rounded-2xl font-black text-white text-sm transition-all hover:opacity-90',
                  step === 2 && !canProceedStep2 ? 'opacity-40 cursor-not-allowed bg-slate-400' : 'shadow-lg hover:scale-[1.01]'
                )}
                style={step === 2 && !canProceedStep2 ? {} : { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {step === 1 ? "Let's Go →" : (
                  selectedHobbies.length >= MIN_HOBBIES 
                    ? "Continue" 
                    : `Select ${MIN_HOBBIES} Hobbies to Continue (${selectedHobbies.length}/${MIN_HOBBIES})`
                )}
              </button>
            ) : (
              <button
                onClick={saveAndFinish}
                disabled={saving || !canFinish}
                className={clsx(
                  'flex-1 py-4 rounded-2xl font-black text-white text-sm transition-all',
                  !canFinish ? 'opacity-40 cursor-not-allowed bg-slate-400' : 'shadow-xl hover:opacity-90 hover:scale-[1.01]'
                )}
                style={!canFinish ? {} : { background: isExpert ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  isExpert 
                    ? (canFinish ? "Complete & Start Verification →" : `Select ${MIN_SKILLS} Skills to Continue`)
                    : "Complete Setup"
                )}
              </button>
            )}
          </div>

          {step === 2 && !canProceedStep2 && (
            <p className="text-center text-xs text-red-500 font-semibold mt-2">
              Please select at least {MIN_HOBBIES} hobbies to continue
            </p>
          )}
          {step === totalSteps && isExpert && selectedSkills.length < MIN_SKILLS && (
            <p className="text-center text-xs text-red-500 font-semibold mt-2">
              Please select at least {MIN_SKILLS} skills to complete setup
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
