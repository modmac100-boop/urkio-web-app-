import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, X, Mic, Loader2, Phone, Calendar, AlertTriangle, VolumeX, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useMediaStream } from '../hooks/useMediaStream';
import { AudioVisualizer } from './common/AudioVisualizer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UrkioAiConsultantProps {
  user: any;
  userData: any;
}

// Integration: Fetching AGORA credentials directly to ensure voice commands and downstream processes work without errors
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';
const AGORA_APP_CERTIFICATE = import.meta.env.VITE_AGORA_APP_CERTIFICATE || '';

export function UrkioAiConsultant({ user, userData }: UrkioAiConsultantProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLanguage, setAudioLanguage] = useState<'ar' | 'en'>(i18n.language === 'ar' ? 'ar' : 'en');
  
  const { stream, startStream, stopStream, error: mediaError } = useMediaStream();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setAudioLanguage(i18n.language === 'ar' ? 'ar' : 'en');
  }, [i18n.language]);

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
      const timeoutId = setTimeout(() => abortRef.current?.abort(), 45000);

      // Using zero-latency stream-based fetching logic
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          prompt: msgText,
          userId: user?.uid,
          language: i18n.language,
          userContext: {
            displayName: userData?.displayName,
          },
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      if (!response.body) throw new Error('No readable stream available');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        
        // Real-time update of the assistant message (zero-latency logic)
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, content: accumulated } : m))
        );
      }
    } catch (error: any) {
      console.error('Consultant API failed:', error);
      const errorMsg = 'نعتذر، حدث اضطراب بسيط في الاتصال. نحن معك، يرجى المحاولة مرة أخرى.';
      
      setMessages(prev =>
        prev.map(m => (m.id === assistantId ? { ...m, content: errorMsg } : m))
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, messages, user, userData, stopSpeaking, i18n.language]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      stopStream();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recording is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    startStream({ audio: true, video: false });

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
      stopStream();
      if (inputRef.current?.value.trim()) {
        setTimeout(() => sendMessage(), 500);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isRecording, sendMessage, audioLanguage, startStream, stopStream]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 inset-e-6 z-9999 group"
        >
          <span className="absolute inset-0 rounded-full bg-linear-to-br from-hmoii-primary to-[#00f2fe] animate-ping opacity-30" />
          <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-ur-primary via-[#00f2fe] to-[#000080] flex items-center justify-center shadow-2xl shadow-ur-primary/40 hover:scale-110 active:scale-95 transition-transform duration-300">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -top-10 inset-e-0 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            URKIO AI CONSULTANT ✨
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-20 inset-e-4 z-9999 w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)] flex flex-col rounded-4xl overflow-hidden shadow-2xl shadow-black/40 border border-slate-200/50 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300 bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-ur-primary to-[#000080] flex items-center justify-center shadow-lg shadow-ur-primary/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider">URKIO AI CONSULTANT</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">Social Development Expert</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  stopSpeaking();
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
                <div className="w-20 h-20 rounded-4xl bg-linear-to-br from-ur-primary/10 to-[#000080]/10 border border-ur-primary/20 flex items-center justify-center">
                  <Bot className="w-10 h-10 text-ur-primary" />
                </div>
                 <div>
                    <p className="text-slate-900 dark:text-white font-bold text-base mb-2">
                      أهلاً بك 👋
                    </p>
                   <p className="text-slate-600 dark:text-slate-400 text-sm max-w-[260px] leading-relaxed">
                     أنا مستشار أور كيو للنمو الشخصي والتطوير الاجتماعي. كيف يمكنني مساعدتك في رحلتك اليوم؟
                   </p>
                </div>

                <div className="w-full space-y-2 px-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.intent)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-ur-primary/10 hover:border-ur-primary/30 text-start transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-ur-primary/10 flex items-center justify-center shrink-0 group-hover:bg-ur-primary/20 transition-colors">
                        <action.icon className="w-4 h-4 text-ur-primary" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</span>
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
                    m.role === 'user' ? 'bg-ur-primary text-white' : 'bg-slate-200 dark:bg-white/10 text-ur-primary border border-slate-300 dark:border-white/10'
                  )}
                >
                  {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                 <div
                  className={clsx(
                    'px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium shadow-sm',
                    m.role === 'user' ? 'bg-ur-primary text-white rounded-ee-md shadow-ur-primary/20' : 'bg-white text-slate-900 dark:bg-[#1a2130] dark:text-slate-100 rounded-es-md border border-slate-200 dark:border-white/10'
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

          <div className="px-4 py-3 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder={isRecording ? "جاري الاستماع..." : "اكتب رسالتك أو استخدم الأمر الصوتي..."}
                className={clsx(
                  "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl ps-4 pe-32 py-3.5 text-slate-900 dark:text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ur-primary/40 focus:border-ur-primary/30 resize-none transition-all",
                  isRecording && "border-ur-primary/50 ring-2 ring-ur-primary/20 text-end"
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
                  onClick={toggleRecording}
                  className={clsx(
                    "p-2 rounded-xl transition-all relative group",
                    isRecording ? "text-red-500 bg-red-500/10" : "text-slate-500 hover:text-ur-primary hover:bg-slate-200 dark:hover:bg-white/10"
                  )}
                >
                  {isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-40">
                      <div className="w-12 h-12">
                        <AudioVisualizer stream={stream} mode="bars" color="#00f2fe" barWidth={2} gap={1} />
                      </div>
                    </div>
                  )}
                  {isRecording && <span className="absolute inset-0 rounded-xl bg-ur-primary animate-pulse opacity-20" />}
                  <Mic className={clsx("w-4 h-4", isRecording && "relative z-10 text-rose-500")} />
                </button>
                <button
                  type="submit"
                  disabled={!input?.trim() || isLoading}
                  className="p-2 rounded-xl bg-ur-primary text-white shadow-lg shadow-ur-primary/30 hover:opacity-90 disabled:opacity-30 disabled:shadow-none transition-all active:scale-90"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
            <div className="mt-2 flex justify-center">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-ur-primary/10 rounded-full border border-ur-primary/20">
                <AlertCircle className="w-3 h-3 text-ur-primary" />
                <span className="text-[10px] font-bold text-ur-primary">
                  مستشار أور كيو نشط • بروتوكول التوجيه المهني مفعل
                </span>
              </div>
            </div>

            {mediaError && (
              <div className="mt-2 px-4">
                <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-xl border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[10px] font-bold text-red-500 leading-tight">
                    {mediaError}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
