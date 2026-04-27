import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, X, Mic, Loader2, Phone, Calendar, AlertTriangle, VolumeX, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceAgentWidgetProps {
  user: any;
  userData: any;
}

export function VoiceAgentWidget({ user, userData }: VoiceAgentWidgetProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLanguage, setAudioLanguage] = useState<'ar' | 'en'>(i18n.language === 'ar' ? 'ar' : 'en');
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setAudioLanguage(i18n.language === 'ar' ? 'ar' : 'en');
  }, [i18n.language]);

  useEffect(() => {
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
      setVoicesLoaded(true);
    };
    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    handleVoicesChanged();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-urkio-agent', handleOpen);
    return () => window.removeEventListener('open-urkio-agent', handleOpen);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speakResponse = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    stopSpeaking();
    
    const isArabicText = /[\u0600-\u06FF]/.test(text);
    const voices = window.speechSynthesis.getVoices();
    
    let voice = null;
    if (isArabicText) {
      voice = voices.find(v => v.name.includes('Neural') && v.lang.startsWith('ar')) ||
              voices.find(v => v.name.includes('Natural') && v.lang.startsWith('ar')) ||
              voices.find(v => v.name.includes('Hoda') || v.name.includes('Naayf')) ||
              voices.find(v => v.lang.startsWith('ar'));
    } else {
      voice = voices.find(v => v.name.includes('Neural') && v.lang.startsWith('en')) ||
              voices.find(v => v.name.includes('Natural') && v.lang.startsWith('en')) ||
              voices.find(v => v.name.includes('Aria') || v.name.includes('Guy')) ||
              voices.find(v => (v.name.includes('Female') || v.name.includes('Google')) && v.lang.startsWith('en')) ||
              voices.find(v => v.lang.startsWith('en-US'));
    }

    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    let spokenCount = 0;

    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      utterance.rate = isArabicText ? 0.85 : 0.82; 
      utterance.pitch = isArabicText ? 1.05 : 1.1; 
      utterance.volume = 0.9;
      utterance.lang = isArabicText ? 'ar-SA' : 'en-US';
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        spokenCount++;
        if (spokenCount >= sentences.length) {
          setTimeout(() => setIsSpeaking(false), 200);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);
      
      // Delay each sentence slightly for lifelike cadence
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, index * 200);
    });
  }, [stopSpeaking]);

  const getMockResponse = useCallback((text: string) => {
    const isAr = audioLanguage === 'ar';
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
  }, [audioLanguage]);

  const quickActions = [
    { label: i18n.language === 'ar' ? 'حجز جلسة' : 'Book a Session', icon: Calendar, intent: 'I want to book a session with a specialist' },
    { label: i18n.language === 'ar' ? 'التحدث مع شخص ما' : 'Talk to Someone', icon: Phone, intent: 'I need to talk to a professional about something personal' },
    { label: i18n.language === 'ar' ? 'مساعدة طارئة' : 'Emergency Help', icon: AlertTriangle, intent: 'I am in crisis and need help immediately' },
  ];

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading) return;

    stopSpeaking();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: msgText,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      abortRef.current = new AbortController();
      const timeoutId = setTimeout(() => abortRef.current?.abort(), 30000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          userId: user?.uid,
          language: i18n.language,
          userContext: {
            displayName: userData?.displayName,
            bio: userData?.bio,
            role: userData?.role,
          },
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, content: accumulated } : m))
        );
      }

      speakResponse(accumulated);

    } catch (error: any) {
      console.warn('Voice API failed, using empathetic fallback:', error);
      const mockText = getMockResponse(msgText);
      
      // Simulate typing/streaming for assistant
      let currentAccumulated = '';
      const words = mockText.split(' ');
      for (let i = 0; i < words.length; i++) {
        currentAccumulated += (i === 0 ? '' : ' ') + words[i];
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, content: currentAccumulated } : m))
        );
        await new Promise(r => setTimeout(r, 40));
      }
      
      speakResponse(mockText);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, messages, user, userData, speakResponse, stopSpeaking, i18n.language, t]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recording is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = audioLanguage === 'ar' ? 'ar-SA' : 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setInput(transcript);
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
      if (inputRef.current?.value.trim()) {
        setTimeout(() => sendMessage(), 500);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isRecording, sendMessage, audioLanguage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // Widget is visible to everyone — logged-in users get personalized context, guests get the public experience

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 inset-e-6 z-9999 group"
        >
          <span className="absolute inset-0 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 animate-ping opacity-30" />
          <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/40 hover:scale-110 active:scale-95 transition-transform duration-300">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -top-10 inset-e-0 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {t('agent.header')} ✨
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-20 inset-e-4 z-9999 w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)] flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-sm">{t('agent.header')}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-slate-400 text-[10px] font-semibold">Always here for you</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold flex items-center gap-1.5 hover:bg-red-500/30 transition-all animate-in fade-in zoom-in"
                >
                  <VolumeX className="w-3 h-3" />
                  {t('agent.stop')}
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  stopSpeaking();
                }}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
                <div className="w-20 h-20 rounded-4xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Bot className="w-10 h-10 text-indigo-400" />
                </div>
                <div>
                   <p className="text-white font-bold text-base mb-2">
                     {i18n.language === 'ar' ? 'مرحباً' : 'Hi'} {userData?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || (i18n.language === 'ar' ? 'بك' : 'there')} 👋
                   </p>
                   <p className="text-slate-400 text-sm max-w-[260px] leading-relaxed">
                     {t('agent.welcome')}
                   </p>
                </div>

                <div className="w-full space-y-2 px-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.intent)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-start transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                        <action.icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-slate-300 text-sm font-semibold group-hover:text-white transition-colors">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={clsx(
                  "flex gap-3 max-w-[85%]",
                  m.role === 'user' ? 'mis-auto flex-row-reverse' : 'mie-auto'
                )}
              >
                <div
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1',
                    m.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-indigo-400 border border-white/10'
                  )}
                >
                  {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div
                  className={clsx(
                    'px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    m.role === 'user' ? 'bg-indigo-500 text-white rounded-ee-md shadow-lg shadow-indigo-500/20' : 'bg-white/10 text-slate-200 rounded-es-md border border-white/5'
                  )}
                >
                  {m.content ? (
                    <p className={clsx("whitespace-pre-wrap", /[\u0600-\u06FF]/.test(m.content) && "text-end")}>
                      {m.content}
                    </p>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-white/10 bg-white/5 backdrop-blur-sm shrink-0">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder={isRecording ? t('agent.listening') : t('agent.inputPlaceholder')}
                className={clsx(
                  "w-full bg-white/10 border border-white/10 rounded-2xl ps-4 pe-32 py-3.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 resize-none transition-all",
                  isRecording && "border-red-500/50 ring-2 ring-red-500/20",
                  audioLanguage === 'ar' && "text-end"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <div className="absolute inset-e-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAudioLanguage(prev => prev === 'ar' ? 'en' : 'ar')}
                  className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
                >
                  {audioLanguage === 'ar' ? 'AR' : 'EN'}
                </button>

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={clsx(
                    "p-2 rounded-xl transition-all relative group",
                    isRecording ? "text-red-500 bg-red-500/10" : "text-slate-500 hover:text-indigo-400 hover:bg-white/10"
                  )}
                  title={t('agent.speak')}
                >
                  {isRecording && <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-20" />}
                  <Mic className={clsx("w-4 h-4", isRecording && "relative z-10")} />
                </button>
                <button
                  type="submit"
                  disabled={!input?.trim() || isLoading}
                  className="p-2 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 disabled:opacity-30 disabled:shadow-none transition-all active:scale-90"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
            <div className="mt-2 flex justify-center">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span className="text-[9px] font-medium text-amber-500 uppercase tracking-tighter">
                    {t('agent.developerNotice')}
                  </span>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
