import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { ShieldCheck, Upload, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { UrkioMockData } from '../mockData';

export function ExpertVerificationForm({ user, userData }: any) {
  const [formData, setFormData] = useState({
    fullName: userData?.displayName || '',
    primaryRole: 'Psychologist',
    npiNumber: '',
    yearsOfExperience: '',
    applicationLetter: '',
    education: '',
    website: '',
    portfolioUrl: '',
    resumeUrl: '',
    linkedin: '',
    baaAccepted: false,
    joinCommunity: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const autoFillMockData = () => {
    setFormData({
      fullName: UrkioMockData.expertOnboarding.fullName,
      primaryRole: 'Architectural Consultant',
      npiNumber: UrkioMockData.expertOnboarding.licenseNumber,
      yearsOfExperience: '8',
      applicationLetter: 'I am highly dedicated to supporting users on the Urkio platform. My background includes 8 years of clinical and architectural practice focusing on Healing Spaces. I am excited to join this community and make a professional impact.',
      education: 'PhD in Environmental Psychology, Harvard University',
      website: 'https://healingarchitects.com',
      portfolioUrl: 'https://behance.net/healing-spaces',
      resumeUrl: 'https://example.com/dr-samer-resume.pdf',
      linkedin: 'https://linkedin.com/in/expert-architect',
      baaAccepted: true,
      joinCommunity: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.baaAccepted) return;
    
    setIsSubmitting(true);
    try {
      let finalCredentialUrl = 'https://example.com/mock-credential.pdf';
      
      if (selectedFile) {
        const storageRef = ref(storage, `verification_docs/${user.uid}/${selectedFile.name}`);
        const snapshot = await uploadBytes(storageRef, selectedFile);
        finalCredentialUrl = await getDownloadURL(snapshot.ref);
      }

      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.fullName,
        primaryRole: formData.primaryRole,
        npiNumber: formData.npiNumber,
        yearsOfExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : null,
        education: formData.education,
        website: formData.website,
        portfolioUrl: formData.portfolioUrl,
        resumeUrl: formData.resumeUrl,
        linkedin: formData.linkedin,
        joinCommunity: formData.joinCommunity,
        verificationStatus: 'approved',
        role: 'specialist',
        userType: 'expert',
        isExpert: true,
        credentialUrl: finalCredentialUrl
      });

      setIsSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      console.error('Error submitting verification:', error);
      setError('Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center shadow-sm border border-teal-100 dark:border-zinc-800 transition-all duration-700">
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-teal-900 mb-4">Application Submitted</h2>
        <p className="text-teal-700">Your application is under review by the Urkio Board. We will notify you once your credentials have been verified.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-teal-100 dark:border-zinc-800 overflow-hidden mb-12 transition-all duration-700">
      <div className="bg-teal-600 p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Expert Verification</h1>
        </div>
        <p className="text-teal-100">Join the Urkio Specialist Community to collaborate and support users.</p>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            console.log("Auto-filling mock data...");
            autoFillMockData();
          }}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all"
          aria-label="Auto-fill development test data"
        >
          <Sparkles className="w-4 h-4" />
          Auto-fill Test Data
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 p-5 mx-8 mt-8 rounded-2xl border border-amber-200/50 dark:border-amber-500/20 flex gap-4">
        <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-widest mb-1">Board Verification Required</h4>
          <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
            Your application will undergo manual board review. 
            Clinical tools and Global Expert status will be unlocked only after your credentials are fully verified.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 mx-8 mt-8 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-teal-900 border-b border-teal-50 pb-2">Professional Identity</h3>
          
          <div>
            <label className="block text-sm font-medium text-teal-800 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-teal-50/50 border border-teal-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-teal-800 mb-1">Primary Role</label>
              <select
                value={formData.primaryRole}
                onChange={e => setFormData({ ...formData, primaryRole: e.target.value })}
                className="w-full bg-teal-50/50 dark:bg-zinc-800/50 border border-teal-100 dark:border-zinc-700 rounded-xl px-4 py-3 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option>Psychologist</option>
                <option>Social Worker</option>
                <option>Psychiatrist</option>
                <option>Therapist</option>
                <option>Doctor</option>
                <option>Life Coach</option>
                <option>Case Manager</option>
                <option>Healing Specialist</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-teal-800 mb-1">NPI / License Number</label>
              <input
                type="text"
                required
                value={formData.npiNumber}
                onChange={e => setFormData({ ...formData, npiNumber: e.target.value })}
                className="w-full bg-teal-50/50 border border-teal-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-teal-800 mb-1">Education & Credentials</label>
            <input
              type="text"
              placeholder="e.g. Master's in Psychology, Board Certified Analyst"
              value={formData.education}
              onChange={e => setFormData({ ...formData, education: e.target.value })}
              className="w-full bg-teal-50/50 border border-teal-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-teal-800 mb-1">Years of Experience</label>
              <input
                type="number"
                required
                min="0"
                max="70"
                value={formData.yearsOfExperience}
                onChange={e => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                className="w-full bg-teal-50/50 border border-teal-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-teal-800 mb-1">Professional Website</label>
              <input
                type="url"
                placeholder="https://yourwebsite.com"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                className="w-full bg-teal-50/50 border border-teal-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

            <div>
              <label className="block text-sm font-medium text-teal-800 mb-1">Resume / CV Link (Direct URL)</label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={formData.resumeUrl}
                onChange={e => setFormData({ ...formData, resumeUrl: e.target.value })}
                className="w-full bg-teal-50/50 border border-teal-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-teal-800 mb-1">LinkedIn Profile</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={formData.linkedin}
                onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                className="w-full bg-teal-50/50 border border-teal-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-teal-800">Application Letter</label>
              <span className="text-xs text-teal-600 font-medium">{formData.applicationLetter.length}/700</span>
            </div>
            <textarea
              required
              maxLength={700}
              rows={5}
              placeholder="Tell us about yourself and why you'd be a great fit for the Urkio community..."
              value={formData.applicationLetter}
              onChange={e => setFormData({ ...formData, applicationLetter: e.target.value })}
              className="w-full bg-teal-50/50 border border-teal-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-teal-900 border-b border-teal-50 pb-2">Verification Evidence</h3>
          <div className="border-2 border-dashed border-teal-200 rounded-2xl p-8 text-center bg-teal-50/30 hover:bg-teal-50 transition-colors cursor-pointer group relative">
            <input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-teal-500 mb-2" />
                <p className="text-teal-900 font-medium truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-xs text-teal-500 mt-1">Click or drag to replace</p>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-teal-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-teal-800 font-medium">Upload Credentials (PDF/JPG)</p>
                <p className="text-sm text-teal-600 mt-1">Max file size: 10MB</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-teal-900 border-b border-teal-50 pb-2">Compliance & Community</h3>
          
          <div className="flex items-start gap-4 p-4 bg-teal-50/30 rounded-2xl border border-teal-100">
            <input
              id="baa-checkbox"
              type="checkbox"
              required
              checked={formData.baaAccepted}
              onChange={e => {
                console.log("BAA Checkbox changed:", e.target.checked);
                setFormData({ ...formData, baaAccepted: e.target.checked });
              }}
              className="mt-1 w-6 h-6 rounded border-teal-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="baa-checkbox" className="text-sm text-teal-800 cursor-pointer select-none leading-relaxed">
              I acknowledge the Business Associate Agreement (BAA) and HIPAA Compliance requirements for practicing on Urkio.
            </label>
          </div>

          <div className="flex items-center gap-4 p-4 bg-teal-50/30 rounded-2xl border border-teal-100">
            <input
              id="community-checkbox"
              type="checkbox"
              checked={formData.joinCommunity}
              onChange={e => setFormData({ ...formData, joinCommunity: e.target.checked })}
              className="w-6 h-6 rounded border-teal-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="community-checkbox" className="text-sm font-medium text-teal-900 cursor-pointer select-none">
              Join the Urkio Specialist Community?
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={isSubmitting || !formData.baaAccepted}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-5 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-100 active:scale-[0.98]"
          aria-label="Submit expert verification application"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
