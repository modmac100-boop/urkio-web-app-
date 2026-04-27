import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Paperclip, X, Mic, Image as ImageIcon, Loader2, Zap, ShieldCheck, Heart, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
    recognition.lang = i18n.language === 'ar' ? 'ar-SA' : 'en-US';

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
      // Auto-send if there is content after a short delay to let state catch up
      setTimeout(() => {
        const currentInput = (document.querySelector('textarea') as HTMLTextAreaElement)?.value;
        if (currentInput?.trim()) {
          sendMessage();
        }
      }, 500);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isRecording, i18n.language]);

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

  const sendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);
    setIsEscalating(false);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    let accumulated = '';
    let isMock = false;

    try {
      abortRef.current = new AbortController();
      const timeoutId = setTimeout(() => abortRef.current?.abort(), 15000); // 15s timeout for snappier feel

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

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
        );
      }

    } catch (error: any) {
      console.warn('AI API failed, using empathetic fallback:', error);
      isMock = true;
      const mockText = getMockResponse(text);
      
      // Simulate typing for mock response
      const words = mockText.split(' ');
      for (let i = 0; i < words.length; i++) {
        accumulated += (i === 0 ? '' : ' ') + words[i];
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
        );
        await new Promise(r => setTimeout(r, 40));
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;

      // Detect mood and escalation from whatever response we got
      const lower = accumulated.toLowerCase();
      if (lower.includes('connect with a professional') || lower.includes('emergency helpline') || lower.includes('أخصائي محترف') || lower.includes('خط الطوارئ')) {
        setMood('stressed');
        setIsEscalating(true);
      } else if (lower.includes('stress') || lower.includes('crisis') || lower.includes('overwhelm') || lower.includes('ضغط') || lower.includes('أزمة')) {
        setMood('stressed');
      } else if (lower.includes('celebrat') || lower.includes('amazing') || lower.includes('congrat') || lower.includes('proud') || lower.includes('فخور') || lower.includes('رائع')) {
        setMood('celebration');
      } else {
        setMood('calm');
      }
    }
  }, [input, isLoading, messages, user, userData, condition, i18n.language, t, getMockResponse]);

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
    { id: 'general', label: t('agent.moods.calm'), icon: Sparkles },
    { id: 'panic', label: t('agent.moods.stressed'), icon: Zap },
    { id: 'anxiety', label: t('agent.moods.stressed'), icon: ShieldCheck },
    { id: 'depression', label: t('agent.moods.calm'), icon: Heart }
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
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={1}
              placeholder={t('agent.inputPlaceholder')}
              className={clsx(
                "w-full bg-white/80 border border-inherit rounded-2xl ps-12 pe-24 py-4 focus:outline-none focus:ring-4 text-sm resize-none transition-all group-hover:bg-white text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500",
                theme.ring
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
                  onClick={toggleRecording}
                  className={clsx(
                    "p-2 rounded-xl transition-all relative group",
                    isRecording ? "text-red-500 bg-red-500/10" : "text-inherit/50 hover:text-inherit hover:bg-black/5"
                  )}
                  title={t('agent.speak')}
                >
                    {isRecording && <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-20" />}
                    <Mic className={clsx("w-5 h-5", isRecording && "relative z-10")} />
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
