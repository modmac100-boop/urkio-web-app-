import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Video, Plus, Keyboard, Sparkles, ArrowRight, ShieldCheck, Globe, Zap, Link as LinkIcon, Check } from 'lucide-react';
import { AgreementModal } from '../components/AgreementModal';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

export function Landing() {
  const { t } = useTranslation();
  const [roomId, setRoomId] = useState('');
  const [showAgreement, setShowAgreement] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isJoiningAction, setIsJoiningAction] = useState(false);
  
  // Pro Settings
  const [isPrivate, setIsPrivate] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [accessCode, setAccessCode] = useState('');
  
  const navigate = useNavigate();

  const handleGenerateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setAccessCode(code);
  };

  const handleStartInstantCall = () => {
    // If private, use the access code or generate a random room ID
    const finalId = isPrivate ? (accessCode || Math.random().toString(36).substring(2, 8)) : Math.random().toString(36).substring(2, 12);
    setPendingPath(`/conference/${finalId}?private=${isPrivate}&limit=${maxParticipants}`);
    setIsJoiningAction(false);
    setShowAgreement(true);
  };

  const [copied, setCopied] = useState(false);
  const handleCopyLink = () => {
    const randomId = Math.random().toString(36).substring(2, 7) + '-' + Math.random().toString(36).substring(2, 7);
    const link = `${window.location.origin}/conference/${randomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinCall = (e: React.FormEvent) => {
    e.preventDefault();
    const input = roomId.trim();
    if (!input) return;

    try {
      let inputUrl = input;
      if (!input.startsWith('http')) {
        if (input.includes('/')) {
          inputUrl = `https://${input}`;
        } else {
          inputUrl = `https://placeholder.com/${input}`;
        }
      }

      const url = new URL(inputUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      const lastSegment = parts[parts.length - 1];
      const secondLast = parts[parts.length - 2];

      let finalPath = '';
      if (secondLast === 'room' || parts.includes('room')) {
        const roomIdFromPath = parts[parts.indexOf('room') + 1] || lastSegment;
        finalPath = `/room/${roomIdFromPath}`;
      } else if (secondLast === 'conference' || parts.includes('conference')) {
        const roomIdFromPath = parts[parts.indexOf('conference') + 1] || lastSegment;
        finalPath = `/conference/${roomIdFromPath}`;
      } else {
        finalPath = `/conference/${lastSegment}`;
      }
      setPendingPath(finalPath);
      setIsJoiningAction(true);
      setShowAgreement(true);
    } catch (err) {
      setPendingPath(`/conference/${input}`);
      setIsJoiningAction(true);
      setShowAgreement(true);
    }
  };

  return (
    <div className="min-h-[92vh] bg-[#faf9f6] dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-body">
      {/* Editorial Background Elements */}
      <div className="absolute top-0 inset-s-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 inset-s-1/4 size-[600px] bg-ur-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 inset-e-1/4 size-[500px] bg-ur-secondary/10 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <div className="max-w-5xl w-full text-center space-y-16 relative z-10">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full shadow-sm">
            <Sparkles className="size-4 text-ur-primary animate-pulse" />
            <span className="text-[10px] font-black text-ur-primary uppercase tracking-[0.2em]">{t('conference.previewTag') || 'Executive Conference Preview'}</span>
          </div>

          <h1 className="text-6xl md:text-[7.5rem] font-headline font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.85]">
            Architectural <br /> <span className="text-ur-primary">Connection.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Uncompromising quality for high-performance experts. <br className="hidden md:block" />
            Secure, encrypted, and curated for the clinical-architectural workflow.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Create Instant Call Card */}
          <div
            className="group relative p-1 bg-zinc-100 dark:bg-zinc-800 rounded-[3rem] transition-all shadow-xl border border-transparent"
          >
            <div className="h-full bg-white dark:bg-zinc-900 rounded-[2.9rem] p-10 flex flex-col items-center gap-6">
              <div className="size-16 milled-gradient rounded-3xl flex items-center justify-center shadow-lg shadow-ur-primary/30">
                <Plus className="size-8 text-white" />
              </div>
              
              <div className="space-y-4 w-full">
                <h3 className="text-xl font-headline font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                  {t('nav.instantCallStudio')}
                </h3>

                {/* Privacy Toggle */}
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
                  <button 
                    onClick={() => setIsPrivate(true)}
                    className={clsx(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      isPrivate ? "bg-white dark:bg-zinc-700 text-ur-primary shadow-sm" : "text-zinc-500"
                    )}
                  >
                    {t('nav.privateSession')}
                  </button>
                  <button 
                    onClick={() => setIsPrivate(false)}
                    className={clsx(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      !isPrivate ? "bg-white dark:bg-zinc-700 text-ur-primary shadow-sm" : "text-zinc-500"
                    )}
                  >
                    {t('nav.publicRoom')}
                  </button>
                </div>

                {/* Pro Settings Panel */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('nav.maxParticipants')}</span>
                    <select 
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Number(e.target.value))}
                      className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold"
                    >
                      {[2, 5, 10, 20, 50, 100].map(v => (
                        <option key={v} value={v}>{v} Users</option>
                      ))}
                    </select>
                  </div>

                  {isPrivate && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('nav.accessCode')}</span>
                        <button 
                          onClick={handleGenerateCode}
                          className="text-ur-primary text-[10px] font-black uppercase hover:underline"
                        >
                          {accessCode ? 'Refresh' : t('nav.generateCode')}
                        </button>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
                        <span className="text-2xl font-mono font-black tracking-[0.3em] text-ur-primary">
                          {accessCode || '------'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleStartInstantCall}
                className="w-full bg-ur-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all mt-4"
              >
                Launch {isPrivate ? 'Clinical' : 'Global'} Session
              </button>
            </div>
          </div>

          {/* Join with ID Card */}
          <div className="p-12 bg-zinc-50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 rounded-[3rem] flex flex-col items-center gap-8 text-center shadow-sm">
            <div className="size-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
              <Keyboard className="size-10 text-zinc-400" />
            </div>
            <div className="space-y-4 w-full">
              <h3 className="text-2xl font-headline font-black text-zinc-900 dark:text-white uppercase tracking-tight">Join Session</h3>
              <form onSubmit={handleJoinCall} className="relative mt-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="CODE OR LINK"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-ur-primary/30 transition-all font-mono text-sm uppercase tracking-widest"
                />
                <button
                  type="submit"
                  disabled={!roomId.trim()}
                  className="absolute inset-e-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-ur-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-0"
                >
                  Join
                </button>
              </form>
            </div>
            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-loose italic underline-offset-4 decoration-ur-primary/30">Entry credentials required</p>
          </div>
        </div>

        {/* Global Encryption Badges */}
        <div className="pt-12 flex flex-wrap items-center justify-center gap-12 border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-600 transition-colors hover:text-ur-primary group">
            <ShieldCheck className="size-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">End-to-End P2P</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-600 transition-colors hover:text-ur-primary group">
            <Globe className="size-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Mesh</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-600 transition-colors hover:text-ur-primary group">
            <Zap className="size-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Real-time</span>
          </div>
        </div>
      </div>

      <Link to="/" className="absolute top-12 inset-s-12 text-zinc-400 hover:text-ur-primary transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] group">
        <ArrowRight className="size-4 rotate-180 group-hover:-translate-x-2 transition-transform" /> Back to Dashboard
      </Link>

      <AgreementModal
        isOpen={showAgreement}
        isJoining={isJoiningAction}
        onClose={() => {
          setShowAgreement(false);
          setPendingPath(null);
        }}
        onAgree={() => {
          setShowAgreement(false);
          if (pendingPath) {
            navigate(pendingPath);
          }
        }}
      />
    </div>
  );
}
