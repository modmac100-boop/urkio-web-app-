import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Paperclip, X, Mic, MicOff, Square, Image as ImageIcon, Loader2, Zap, ShieldCheck, Heart, AlertCircle, Play, RotateCcw, Trash2, Check, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { storage } from '../firebase';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendEncryptedMessage, subscribeToMessages } from './chatService';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  createdAt?: any;
}

interface UrkioChatProps {
  user: any;
  userData: any;
}

export function UrkioAgentChat({ user, userData }: UrkioChatProps) {
  const { t, i18n } = useTranslation();
  const [mood, setMood] = useState<'calm' | 'stressed' | 'celebration'>('calm');
  const [condition, setCondition] = useState<'panic' | 'anxiety' | 'depression' | 'general'>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'reviewing'>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const conversationId = `agent_guide_${user?.uid}`;

  // 1. Subscribe to history
  useEffect(() => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    const unsubscribe = subscribeToMessages(conversationId, (newMessages: any[]) => {
      if (newMessages.length > 0) {
        const formatted = newMessages.map(msg => ({
          id: msg._id || msg.id,
          role: msg.role || (msg.user?._id === 2 ? 'assistant' : 'user'),
          content: msg.text || msg.content,
          audioUrl: msg.audioUrl,
          createdAt: msg.createdAt
        })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        
        setMessages(formatted as Message[]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, conversationId]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecordingState('reviewing');
        stream.getTracks().forEach(track => track.stop());
      };

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          setInput(transcript);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecordingState('recording');
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Microphone access denied.");
    }
  }, [i18n.language]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  }, [recordingState]);

  const handleRepeat = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const handleRecordAgain = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setInput('');
    setRecordingState('idle');
    startRecording();
  };

  const handleCancelVoice = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setInput('');
    setRecordingState('idle');
  };

  const getMockResponse = useCallback((text: string) => {
    const isAr = i18n.language === 'ar';
    const lower = text.toLowerCase();
    
    if (isAr) {
      if (lower.includes('قلق') || lower.includes('خوف') || lower.includes('توتر')) {
        return "أنا هنا معك. القلق شعور صعب، لكنك لست وحدك. حاول أن تأخذ نفساً عميقاً... شهيق... زفير. هل تود إخباري بالمزيد عما يقلقك؟";
      }
      if (lower.includes('حزن') || lower.includes('اكتئاب') || lower.includes('تعب')) {
        return "أسمعك جيداً وأقدر صدقك. من الطبيعي أن تشعر بالتعب أحياناً. رحلتك في أوركيو هي مساحة آمنة لك. ما هو الشيء الوحيد الذي قد يجعلك تشعر ببعض الراحة الآن؟";
      }
      if (lower.includes('مساعدة') || lower.includes('كيف')) {
        return "أنا دليلك الذكي في أوركيو. يمكنني مساعدتك في فهم مشاعرك، توجيهك في المنصة، أو ببساطة الاستماع إليك. كيف يمكنني أن أكون مفيداً لك اليوم؟";
      }
      return "شكراً لمشاركتي هذا. أنا أسمعك بكل اهتمام. استمر في التحدث، أنا هنا لدعمك في كل خطوة من رحلتك.";
    } else {
      if (lower.includes('anxious') || lower.includes('fear') || lower.includes('stress')) {
        return "I'm here with you. Anxiety is a heavy feeling, but you're not alone. Let's try to take a deep breath... inhale... exhale. Would you like to tell me more about what's on your mind?";
      }
      if (lower.includes('sad') || lower.includes('depressed') || lower.includes('tired')) {
        return "I hear you, and I value your honesty. It's okay to feel tired sometimes. Your journey in Urkio is a safe space for you. What is one small thing that might bring you a bit of comfort right now?";
      }
      if (lower.includes('help') || lower.includes('how')) {
        return "I am your Urkio Guide. I can help you process your feelings, navigate the platform, or simply be a listening ear. How can I be most helpful to you today?";
      }
      return "Thank you for sharing that with me. I'm listening closely. Please keep talking; I'm here to support you in every step of your journey.";
    }
  }, [i18n.language]);

  const sendMessage = useCallback(async (e?: React.FormEvent, voiceBlob?: Blob) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text && !voiceBlob) return;

    setIsLoading(true);
    setRecordingState('idle');
    
    let uploadedAudioUrl = '';
    if (voiceBlob) {
      setIsUploading(true);
      try {
        const path = `agent_voices/${user?.uid}/${Date.now()}.webm`;
        const storageRef = sRef(storage, path);
        await uploadBytes(storageRef, voiceBlob);
        uploadedAudioUrl = await getDownloadURL(storageRef);
      } catch (err) {
        console.error("Audio upload failed:", err);
      } finally {
        setIsUploading(false);
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      audioUrl: uploadedAudioUrl
    };

    // Save user message to Firestore
    try {
      await sendEncryptedMessage(conversationId, {
        text: text,
        role: 'user',
        audioUrl: uploadedAudioUrl,
        user: { _id: 1, name: userData?.displayName || 'User' }
      });
    } catch (err) {
      console.error("Failed to save user message:", err);
    }

    setInput('');
    setAttachments([]);
    setAudioBlob(null);
    setAudioUrl(null);

    // AI logic
    setIsEscalating(false);
    
    try {
      abortRef.current = new AbortController();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          userId: user?.uid,
          condition,
          language: i18n.language,
          userContext: {
            displayName: userData?.displayName,
            bio: userData?.bio,
            role: userData?.role
          },
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      // Save AI message to Firestore
      await sendEncryptedMessage(conversationId, {
        text: accumulated,
        role: 'assistant',
        user: { _id: 2, name: 'Urkio AI' }
      });

      // Detect mood
      const lower = accumulated.toLowerCase();
      if (lower.includes('connect with a professional') || lower.includes('emergency')) {
        setMood('stressed');
        setIsEscalating(true);
      } else if (lower.includes('stress') || lower.includes('crisis')) {
        setMood('stressed');
      } else if (lower.includes('celebrat') || lower.includes('proud')) {
        setMood('celebration');
      } else {
        setMood('calm');
      }

    } catch (error: any) {
      console.warn('AI API failed, using fallback:', error);
      const mockText = getMockResponse(text);
      await sendEncryptedMessage(conversationId, {
        text: mockText,
        role: 'assistant',
        user: { _id: 2, name: 'Urkio AI' }
      });
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, messages, user, userData, condition, i18n.language, conversationId, getMockResponse]);

  // Vibe-Driven UI: determine color scheme based on mood
  const moodColors = {
    calm: {
       bg: 'bg-slate-50 dark:bg-slate-950',
       bubble: 'bg-white dark:bg-slate-900',
       text: 'text-slate-900 dark:text-slate-100',
       accent: 'bg-cyan-600',
       border: 'border-slate-200 dark:border-slate-800',
       ring: 'focus:ring-cyan-500/20',
    },
    stressed: {
       bg: 'bg-rose-50 dark:bg-rose-950/20',
       bubble: 'bg-white dark:bg-slate-900',
       text: 'text-rose-900 dark:text-rose-100',
       accent: 'bg-rose-600',
       border: 'border-rose-100 dark:border-rose-900/30',
       ring: 'focus:ring-rose-500/20',
    },
    celebration: {
       bg: 'bg-amber-50 dark:bg-amber-950/20',
       bubble: 'bg-white dark:bg-slate-900',
       text: 'text-amber-900 dark:text-amber-100',
       accent: 'bg-amber-600',
       border: 'border-amber-100 dark:border-amber-900/30',
       ring: 'focus:ring-amber-500/20',
    }
  };

  const theme = moodColors[mood];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const conditions = [
    { id: 'general', label: t('agent.moods.general'), icon: Sparkles },
    { id: 'panic', label: t('agent.moods.panic'), icon: Zap },
    { id: 'anxiety', label: t('agent.moods.anxiety'), icon: ShieldCheck },
    { id: 'depression', label: t('agent.moods.depression'), icon: Heart }
  ];


  return (
    <div className={clsx("flex flex-col h-full rounded-3xl overflow-hidden shadow-2xl border transition-all duration-700", theme.bg, theme.border, theme.text)}>
      {/* Header */}
      <div className="p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-inherit flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl", theme.accent)}>
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t('agent.header')}</h2>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/20" />
                <p className="text-xs font-medium opacity-60">Empathetic AI · Always here</p>
            </div>
          </div>
        </div>
        
        {/* Condition Selector Tabs */}
        <div className="hidden sm:flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-inherit">
            {conditions.map((c) => (
                <button 
                  key={c.id}
                  onClick={() => setCondition(c.id as any)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5", 
                    condition === c.id 
                      ? "bg-white dark:bg-slate-800 shadow-sm " + (condition === 'panic' ? 'text-rose-600' : 'text-cyan-600')
                      : "opacity-40 hover:opacity-100"
                  )}
                >
                    <c.icon className="w-3 h-3" />
                    {c.label}
                </button>
            ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
            {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40"
                >
                    <Bot className="w-16 h-16" />
                    <p className="max-w-xs text-sm" dir="auto">{t('agent.welcome')}</p>
                </motion.div>
            )}
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={clsx("flex gap-3 max-w-[85%]", m.role === 'user' ? "ms-auto flex-row-reverse" : "me-auto")}
              >
                <div className={clsx(
                   "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                   m.role === 'user' ? theme.accent + " text-white" : "bg-white text-inherit border border-inherit"
                )}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={clsx(
                  "p-4 rounded-2xl shadow-sm border transition-colors",
                  m.role === 'user' 
                    ? "bg-primary text-white rounded-se-none shadow-lg shadow-primary/20"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-ss-none border-inherit shadow-md"
                  )}
                >
                  {m.audioUrl && (
                    <button 
                      onClick={() => {
                        const audio = new Audio(m.audioUrl);
                        audio.play();
                      }}
                      className={clsx("flex items-center gap-2 mb-2 p-2 rounded-lg transition-colors", m.role === 'user' ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 hover:bg-primary/20 text-primary")}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Play Voice</span>
                    </button>
                  )}
                  {m.content ? (
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap" dir="auto">{m.content}</p>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
            
            {isEscalating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-linear-to-br from-indigo-500 to-purple-600 rounded-5xl text-white shadow-xl space-y-4 border border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-3xl bg-linear-to-tr from-primary to-accent-300 flex items-center justify-center mb-6 animate-float shadow-xl shadow-primary/20">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">Urkio Care Escalation</h3>
                    <p className="text-xs text-white/80">Support recommendation triggered</p>
                  </div>
                </div>
                <p className="text-sm">
                  {i18n.language === 'ar' 
                    ? "يبدو أنك تمر بفترة صعبة. لقد قمت بتمييز هذه المحادثة حتى تتمكن من التواصل بسرعة مع أخصائي محترف يمكنه تقديم دعم أكثر تخصصاً."
                    : "It sounds like you're going through a lot. I've flagged this so you can quickly connect with a professional specialist who can provide more tailored support."}
                </p>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => window.location.href = '/expert-list'}
                    className="flex-1 bg-white text-indigo-600 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
                  >
                    {i18n.language === 'ar' ? 'البحث عن خبير' : 'Find a Specialist'}
                  </button>
                  <button 
                    onClick={() => setIsEscalating(false)}
                    className="px-4 py-3 rounded-2xl font-medium text-sm hover:bg-white/10 transition-colors"
                  >
                    {i18n.language === 'ar' ? 'ليس الآن' : 'Not now'}
                  </button>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/50 border-t border-inherit">
        <form 
          onSubmit={sendMessage}
          className="space-y-4"
        >
          {/* Attachments Preview */}
          {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                  {attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full border border-inherit text-xs">
                          <ImageIcon className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <button type="button" onClick={() => removeAttachment(i)} className="hover:text-red-500">
                             <X className="w-3 h-3" />
                          </button>
                      </div>
                  ))}
              </div>
          )}

          <div className="relative group">
            {recordingState === 'reviewing' ? (
              <div className="flex items-center gap-2 w-full bg-white/90 dark:bg-slate-900/90 border border-inherit rounded-2xl p-2 animate-in fade-in slide-in-from-bottom-2">
                <button 
                  type="button" 
                  onClick={handleCancelVoice}
                  className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Voice Recorded</span>
                  <button 
                    type="button" 
                    onClick={handleRepeat}
                    className="flex items-center gap-2 text-primary hover:scale-105 transition-transform"
                  >
                    <Play className="w-4 h-4" />
                    <span className="text-[10px] font-black">REPLAY</span>
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={handleRecordAgain}
                  className="p-3 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors"
                  title="Record Again"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => sendMessage(undefined, audioBlob!)}
                  disabled={isUploading}
                  className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                  <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Send Voice</span>
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  rows={1}
                  placeholder={recordingState === 'recording' ? 'Listening...' : t('agent.inputPlaceholder')}
                  disabled={recordingState === 'recording'}
                  className={clsx(
                    "w-full bg-white/80 border border-inherit rounded-2xl ps-12 pe-24 py-4 focus:outline-none focus:ring-4 text-sm resize-none transition-all group-hover:bg-white text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500",
                    theme.ring,
                    recordingState === 'recording' && "animate-pulse border-primary/50"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                  }}
                />
                
                <div className="absolute inset-s-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <label className="p-2 hover:bg-black/5 rounded-xl cursor-pointer transition-colors text-inherit/50 hover:text-inherit">
                        <Paperclip className="w-5 h-5" />
                        <input type="file" multiple hidden onChange={handleFileChange} />
                    </label>
                </div>
    
                <div className="absolute inset-e-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={recordingState === 'recording' ? stopRecording : startRecording}
                      className={clsx(
                        "p-2 rounded-xl transition-all relative group",
                        recordingState === 'recording' ? "text-red-500 bg-red-500/10" : "text-inherit/50 hover:text-inherit hover:bg-black/5"
                      )}
                      title={t('agent.speak')}
                    >
                        {recordingState === 'recording' && <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-20" />}
                        {recordingState === 'recording' ? <Square className="w-5 h-5 relative z-10" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button
                      type="submit"
                      disabled={!input?.trim() || isLoading}
                      className={clsx(
                        "p-2.5 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-30 disabled:scale-100 text-white",
                        theme.accent, "shadow-current/20"
                      )}
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
             {[
               i18n.language === 'ar' ? 'كيف أبدأ؟' : 'How do I start?',
               i18n.language === 'ar' ? 'أشعر بالقلق' : 'I feel anxious',
               i18n.language === 'ar' ? 'ما هي خدماتكم؟' : 'What are your services?',
               i18n.language === 'ar' ? 'أحتاج للحديث' : 'I need to talk'
             ].map((tip, i) => (
               <button 
                 key={i}
                 type="button"
                 onClick={() => { setInput(tip); sendMessage(); }}
                 className="px-3 py-1.5 rounded-full bg-white/40 dark:bg-slate-800/40 border border-inherit text-[10px] font-bold hover:bg-white dark:hover:bg-slate-700 transition-all"
               >
                 {tip}
               </button>
             ))}
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] text-center opacity-40">
               Powered by Google Search grounding · Important concerns are shared with specialists if you're in crisis.
            </p>
            {/* Developer Notice for Mock Mode */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-full border border-amber-200 dark:border-amber-800/30">
              <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-[9px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-tighter">
                {t('agent.developerNotice')}
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Legacy hook kept for backward compatibility if used elsewhere
export function useUrkioChat(userId: string) {
  return { userId }; // No-op stub
}
