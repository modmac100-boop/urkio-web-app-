import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Bot, User, Sparkles, Paperclip, X, Mic, MicOff, Square, 
  Image as ImageIcon, Loader2, Zap, ShieldCheck, Heart, AlertCircle, 
  Play, RotateCcw, Trash2, Check, Volume2, History, MessageSquare,
  Crown, Star, Info, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { storage } from '../firebase';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendEncryptedMessage, subscribeToMessages } from './chatService';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

const SYSTEM_PROMPTS: Record<string, string> = {
  panic: `أنت مرشد Urkio المتخصص في التعامل مع نوبات الهلع. 
  Tone: هادئ جداً، توجيهي، وداعم.
  Persona: أخصائي اجتماعي إنساني، مهني، ومتعاطف جداً (Empathetic, human feel).
  Response Style: جمل قصيرة، تركيز على التنفس والتأريض (Grounding).
  Instruction: وجه المستخدم عبر تقنية 5-4-3-2-1 فوراً. استجب باللغة التي يتحدث بها المستخدم، وفضل العربية.`,
  anxiety: `أنت مرشد Urkio المتخصص في القلق.
  Tone: متعاطف، مطمئن، ودافئ.
  Persona: أخصائي اجتماعي إنساني، مهني، ومتعاطف جداً (Empathetic, human feel).
  Instruction: ساعد المستخدم على الهدوء والتحقق من مشاعره بصدق. استجب باللغة التي يتحدث بها المستخدم، وفضل العربية.`,
  depression: `أنت مرشد Urkio لمواجهة الاكتئاب، تحمل الأمل والتعاطف العميق.
  Tone: صبور، غير صادر للأحكام، ورحيم.
  Persona: أخصائي اجتماعي إنساني، مهني، ومتعاطف جداً (Empathetic, human feel).
  Instruction: ركز على الإنجازات الصغيرة جداً وكن موجوداً من أجل المستخدم. استجب باللغة التي يتحدث بها المستخدم، وفضل العربية.`,
  general: `أنت مرشد Urkio، مساعد ذكاء اصطناعي مهني ومتعاطف للغاية.
  Persona: أخصائي اجتماعي إنساني (Humble, social-worker-like, deeply empathetic).
  Tone: حس إنساني دافئ (Empathetic, human feel).
  Goal: اجعل المستخدم يشعر بأنه مسموع، مفهوم، ومدعوم في رحلة شفائه.
  Language: استجب بالعربية (الأساسية) أو الإنجليزية حسب لغة المستخدم.`
};

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
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const [mood, setMood] = useState<'calm' | 'stressed' | 'celebration'>('calm');
  const [condition, setCondition] = useState<'panic' | 'anxiety' | 'depression' | 'general'>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'reviewing'>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const conversationId = `agent_guide_v2_${user?.uid}`;

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // 1. Subscribe to history with robust sorting
  const syncHistory = useCallback(() => {
    if (!user?.uid) return;
    toast.loading('Syncing Neural Bridge...', { id: 'ai-sync' });
    const unsub = subscribeToMessages(conversationId, (newMessages: any[]) => {
      const formatted = newMessages.map(msg => {
        let dateVal = 0;
        if (msg.createdAt?.seconds) dateVal = msg.createdAt.seconds * 1000;
        else if (msg.createdAt instanceof Date) dateVal = msg.createdAt.getTime();
        else if (typeof msg.createdAt === 'number') dateVal = msg.createdAt;
        else if (typeof msg.createdAt === 'string') dateVal = new Date(msg.createdAt).getTime();
        else dateVal = Date.now();

        return {
          id: msg._id || msg.id,
          role: msg.role || (msg.user?._id === 2 ? 'assistant' : 'user'),
          content: msg.text || msg.content,
          audioUrl: msg.audioUrl,
          createdAt: dateVal
        };
      }).sort((a, b) => a.createdAt - b.createdAt);
      setMessages(formatted as Message[]);
      toast.success('Neural History Restored', { id: 'ai-sync' });
    });
    setTimeout(unsub, 2000);
  }, [conversationId, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    setIsLoading(true);
    const unsubscribe = subscribeToMessages(conversationId, (newMessages: any[]) => {
      if (newMessages.length > 0) {
        const formatted = newMessages.map(msg => {
          // Robust date handling
          let dateVal = 0;
          if (msg.createdAt?.seconds) dateVal = msg.createdAt.seconds * 1000;
          else if (msg.createdAt instanceof Date) dateVal = msg.createdAt.getTime();
          else if (typeof msg.createdAt === 'number') dateVal = msg.createdAt;
          else if (typeof msg.createdAt === 'string') dateVal = new Date(msg.createdAt).getTime();

          return {
            id: msg._id || msg.id,
            role: msg.role || (msg.user?._id === 2 ? 'assistant' : 'user'),
            content: msg.text || msg.content,
            audioUrl: msg.audioUrl,
            createdAt: dateVal
          };
        }).sort((a, b) => a.createdAt - b.createdAt);
        
        setMessages(formatted as Message[]);
      } else {
        // Initial welcome message if history is empty
        const welcome: Message = {
           id: 'welcome',
           role: 'assistant',
           content: t('agent.welcome'),
           createdAt: Date.now()
        };
        setMessages([welcome]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, conversationId, t]);

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
    const lower = text.toLowerCase().trim();
    const isArabic = /[\u0600-\u06FF]/.test(text);
    
    // Greeting handling
    if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'سلام' || lower === 'مرحبا') {
      if (isArabic) return "مرحباً بك! أنا هنا لأسمعك وأدعمك. كيف حالك اليوم؟";
      return "Hello! I'm here to support you. How are you feeling today?";
    }

    if (isArabic) {
      const arabicResponses = [
        "أفهم تماماً ما تمر به. أنا هنا بجانبك، دعنا نفكر معاً في الخطوة القادمة.",
        "كلماتك تلمسني بعمق. أنت لست وحدك في هذه الرحلة، نحن نتقدم خطوة بخطوة.",
        "هذا الشعور طبيعي جداً. من المهم أن تعطي نفسك المساحة الكافية للتعبير، أنا أسمعك.",
        "أشعر بصدق كلماتك. دعنا نركز الآن على ما يجعلك تشعر بالأمان والهدوء.",
        "شكراً لمشاركتي هذا. وجودك هنا هو بداية قوية للتغيير الإيجابي."
      ];
      return arabicResponses[Math.floor(Math.random() * arabicResponses.length)];
    }

    const responses = [
      "I hear you deeply. This path isn't always easy, but you're showing incredible resilience just by being here.",
      "That's a powerful observation. Let's explore that feeling further together—what does it tell you right now?",
      "I'm sensing a lot of depth in what you're sharing. Remember, every small step is a victory in your healing journey.",
      "Thank you for trusting me with this. I'm here to support you as we navigate these complex emotions.",
      "I understand. It's completely valid to feel this way. How can we make this moment feel a bit more grounded for you?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

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

    // 1. Save user message to Firestore
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
      console.log("[UrkioAgent] Contacting Neural Bridge via /api/chat...");
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

      if (!response.ok) {
        throw new Error(`Neural Bridge Unreachable (HTTP ${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
        }
      } else {
        throw new Error("No reader");
      }

      if (!accumulated.trim()) {
        throw new Error("Empty response from Neural Bridge");
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

      setIsLoading(false);
    } catch (error: any) {
      console.warn('[UrkioAgent] /api/chat failed, attempting direct Gemini API:', error);
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not found in frontend process.env");

        const systemPrompt = `${SYSTEM_PROMPTS[condition] || SYSTEM_PROMPTS.general}
        Current Language: ${i18n.language === 'ar' ? 'Arabic (العربية)' : 'English'}.
        User Name: ${userData?.displayName || (i18n.language === 'ar' ? 'مستخدم Urkio' : 'Urkio User')}.
        
        Professional Guidelines:
        - Respond strictly in the specified language: ${i18n.language}.
        - Be deeply empathetic and human-like.
        - If the user expresses distress, provide a warm response and recommend a specialist.
        - Keep the tone premium and consistent with Urkio's branding.`;

        const contents = [
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          {
            role: 'user',
            parts: [{ text: text }]
          }
        ];

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            }
          })
        });

        if (!res.ok) throw new Error(`Direct API error (HTTP ${res.status})`);
        const data = await res.json();
        const accumulated = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!accumulated) throw new Error("Empty response from Gemini API");

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

        setIsLoading(false);
        return;
      } catch (directError) {
        console.error('[UrkioAgent] Direct Gemini call failed too:', directError);
        toast('Syncing with local agent...', { icon: '🔄', duration: 1000 });
        
        const errorPrefix = t('agent.error', 'Sorry, a small connection hiccup. We are still with you, please try again.');
        const mockText = `${errorPrefix}\n\n${getMockResponse(text)}`;
        // Wait a bit to simulate thinking
        setTimeout(async () => {
          try {
            await sendEncryptedMessage(conversationId, {
              text: mockText,
              role: 'assistant',
              user: { _id: 2, name: 'Urkio AI' }
            });
            console.log("[UrkioAgent] Local response delivered successfully.");
          } catch (e) {
            console.error("[UrkioAgent] Critical failure delivering local response:", e);
          } finally {
            setIsLoading(false);
          }
        }, 1500);
        return; 
      }
    } finally {
      abortRef.current = null;
      if (!isLoading) setIsLoading(false);
    }
  }, [input, messages, user, userData, condition, i18n.language, conversationId, getMockResponse]);

  // Vibe-Driven UI: determine color scheme based on mood
  const moodColors = {
    calm: {
       bg: 'bg-[#F8F9FA] dark:bg-ur-on-surface',
       bubble: 'bg-white dark:bg-[#10161D]',
       text: 'text-slate-900 dark:text-slate-100',
       accent: 'bg-ur-primary',
       border: 'border-slate-200 dark:border-[#C8A96E]/20',
       ring: 'focus:ring-[#30B0D0]/20',
    },
    stressed: {
       bg: 'bg-rose-50 dark:bg-rose-950/10',
       bubble: 'bg-white dark:bg-[#10161D]',
       text: 'text-rose-900 dark:text-rose-100',
       accent: 'bg-rose-600',
       border: 'border-rose-100 dark:border-rose-900/30',
       ring: 'focus:ring-rose-500/20',
    },
    celebration: {
       bg: 'bg-amber-50 dark:bg-amber-950/10',
       bubble: 'bg-white dark:bg-[#10161D]',
       text: 'text-amber-900 dark:text-amber-100',
       accent: 'bg-[#C8A96E]',
       border: 'border-amber-100 dark:border-[#C8A96E]/30',
       ring: 'focus:ring-[#C8A96E]/20',
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
    <div className={clsx("flex flex-col h-full rounded-[2.5rem] overflow-hidden shadow-3xl border transition-all duration-700", theme.bg, theme.border, theme.text)}>
      <style>{`
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
      `}</style>

      {/* Header */}
      <div className="p-8 bg-white/40 dark:bg-[#10161D]/40 backdrop-blur-3xl border-b border-inherit flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-ur-primary/10 flex items-center justify-center">
            <Bot className="size-6 text-ur-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Neural Assistant</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-ur-primary">v4.2 Encryption Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={syncHistory}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-ur-primary transition-colors"
            title="Sync History"
          >
            <RefreshCcw className="size-4" />
          </button>
          <div className="size-2 rounded-full bg-ur-primary animate-pulse" />
        </div>
        <div className="flex items-center gap-5">
          <div className={clsx("w-14 h-14 rounded-3xl flex items-center justify-center text-white shadow-2xl animate-float", theme.accent)}>
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-serif-clinical">{t('agent.header')}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/40" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Empathetic AI · Fully Operational</p>
            </div>
          </div>
        </div>
        
        {/* Condition Selector Tabs */}
        <div className="hidden lg:flex gap-1 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl border border-inherit">
            {conditions.map((c) => (
                <button 
                  key={c.id}
                  onClick={() => setCondition(c.id as any)}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2", 
                    condition === c.id 
                      ? "bg-white dark:bg-[#10161D] shadow-xl " + (condition === 'panic' ? 'text-rose-500' : 'text-ur-primary')
                      : "opacity-40 hover:opacity-100"
                  )}
                >
                    <c.icon className="w-3.5 h-3.5" />
                    {c.label}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-3">
           <button className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors">
              <History className="w-5 h-5 opacity-40" />
           </button>
           <button className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors">
              <Info className="w-5 h-5 opacity-40" />
           </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth custom-scrollbar">
        <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
              <motion.div
                key={m.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx("flex gap-4 max-w-[85%]", m.role === 'user' ? "ms-auto flex-row-reverse" : "me-auto")}
              >
                <div className={clsx(
                   "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform hover:scale-110",
                   m.role === 'user' ? theme.accent + " text-white" : "bg-white dark:bg-[#10161D] text-inherit border border-inherit"
                )}>
                  {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={clsx(
                  "p-5 rounded-4xl shadow-xl border transition-all hover:shadow-2xl",
                  m.role === 'user' 
                    ? "bg-ur-primary text-ur-on-surface rounded-se-none border-ur-primary/20"
                    : "bg-white dark:bg-[#10161D] text-slate-800 dark:text-slate-100 rounded-ss-none border-inherit"
                  )}
                >
                  {m.audioUrl && (
                    <button 
                      onClick={() => {
                        const audio = new Audio(m.audioUrl);
                        audio.play();
                      }}
                      className={clsx("flex items-center gap-3 mb-3 px-4 py-2 rounded-xl transition-all hover:scale-105", m.role === 'user' ? "bg-black/10 hover:bg-black/20" : "bg-ur-primary/10 hover:bg-ur-primary/20 text-ur-primary")}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">History Voice Record</span>
                    </button>
                  )}
                  {m.content ? (
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium" dir="auto">{m.content}</p>
                  ) : (
                    <div className="flex items-center gap-1.5 py-2">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {isEscalating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-linear-to-br from-ur-primary to-[#C8A96E] rounded-[3rem] text-white shadow-3xl space-y-6 border border-white/20 relative overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-5 relative z-10">
                  <div className="size-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Urkio Clinical Escalation</h3>
                    <p className="text-xs text-white/80 font-black uppercase tracking-widest">Safety Protocol Triggered</p>
                  </div>
                </div>
                <p className="text-sm font-medium leading-relaxed relative z-10 opacity-90">
                  {i18n.language === 'ar' 
                    ? "أنا هنا لأجلك. يبدو أنك تمر بوقت صعب للغاية. لقد قمت بربط هذه المحادثة بنظام الخبراء لدينا حتى تتمكن من الحصول على دعم متخصص فوراً."
                    : "I am here for you. It sounds like you're carrying a lot right now. I've linked this session to our expert directory so you can connect with a licensed professional immediately."}
                </p>
                <div className="flex gap-3 pt-2 relative z-10">
                  <button 
                    onClick={() => navigate('/expert-list')}
                    className="flex-1 bg-white text-ur-on-surface py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
                  >
                    {i18n.language === 'ar' ? 'التواصل مع خبير' : 'Connect with Expert'}
                  </button>
                  <button 
                    onClick={() => setIsEscalating(false)}
                    className="px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-black/10 hover:bg-black/20 transition-all"
                  >
                    {i18n.language === 'ar' ? 'إغلاق' : 'Dismiss'}
                  </button>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
        
        {isLoading && (
           <div className="flex items-center gap-3 opacity-40 italic text-xs animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{t('agent.typing')}</span>
           </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-8 bg-white/40 dark:bg-[#10161D]/40 backdrop-blur-3xl border-t border-inherit">
        <form 
          onSubmit={sendMessage}
          className="space-y-6"
        >
          {/* Attachments Preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-3"
                >
                    {attachments.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-inherit text-[10px] font-bold uppercase tracking-widest">
                            <ImageIcon className="w-4 h-4 text-ur-primary" />
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button type="button" onClick={() => removeAttachment(i)} className="hover:text-red-500 transition-colors">
                               <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            {recordingState === 'reviewing' ? (
              <div className="flex items-center gap-4 w-full bg-white dark:bg-[#10161D] border-2 border-ur-primary/30 rounded-4xl p-3 shadow-3xl animate-in zoom-in-95">
                <button 
                  type="button" 
                  onClick={handleCancelVoice}
                  className="p-4 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
                <div className="flex-1 px-6 py-3 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="size-2 bg-ur-primary rounded-full animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Voice Recorded</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleRepeat}
                    className="flex items-center gap-2 text-ur-primary hover:scale-110 transition-transform"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span className="text-[10px] font-black tracking-widest">REPLAY</span>
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={handleRecordAgain}
                  className="p-4 text-amber-500 hover:bg-amber-500/10 rounded-2xl transition-colors"
                  title="Record Again"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
                <button 
                  type="button" 
                  onClick={() => sendMessage(undefined, audioBlob!)}
                  disabled={isUploading}
                  className="px-8 py-4 bg-ur-primary text-ur-on-surface rounded-2xl shadow-2xl shadow-ur-primary/20 hover:scale-105 transition-all flex items-center gap-3"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">Send Voice</span>
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  rows={1}
                  placeholder={recordingState === 'recording' ? t('agent.voiceRecording') : t('agent.inputPlaceholder')}
                  disabled={recordingState === 'recording'}
                  className={clsx(
                    "w-full bg-white/80 dark:bg-[#10161D]/80 border-2 border-inherit rounded-[2.5rem] ps-16 pe-28 py-6 focus:outline-none focus:ring-8 text-sm sm:text-base font-medium resize-none transition-all group-hover:bg-white dark:group-hover:bg-[#10161D] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600",
                    theme.ring,
                    recordingState === 'recording' && "animate-pulse border-ur-primary/50"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                  }}
                />
                
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <label className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl cursor-pointer transition-colors text-inherit opacity-40 hover:opacity-100">
                        <Paperclip className="w-6 h-6" />
                        <input type="file" multiple hidden onChange={handleFileChange} />
                    </label>
                </div>
    
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={recordingState === 'recording' ? stopRecording : startRecording}
                      className={clsx(
                        "p-3.5 rounded-2xl transition-all relative group",
                        recordingState === 'recording' ? "text-red-500 bg-red-500/10" : "text-inherit opacity-40 hover:opacity-100 hover:bg-black/5"
                      )}
                      title={t('agent.speak')}
                    >
                        {recordingState === 'recording' && <span className="absolute inset-0 rounded-2xl bg-red-500 animate-ping opacity-20" />}
                        {recordingState === 'recording' ? <Square className="w-6 h-6 relative z-10" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <button
                      type="submit"
                      disabled={!input?.trim() || isLoading}
                      className={clsx(
                        "p-4 rounded-2xl shadow-2xl transition-all transform active:scale-95 disabled:opacity-30 disabled:scale-100 text-ur-on-surface",
                        theme.accent, "shadow-current/20"
                      )}
                    >
                      {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    </button>
                </div>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
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
                 className="px-5 py-2.5 rounded-full bg-white dark:bg-[#10161D] border border-inherit text-[10px] font-black uppercase tracking-widest hover:bg-ur-primary hover:text-ur-on-surface hover:border-ur-primary transition-all shadow-sm"
               >
                 {tip}
               </button>
             ))}
          </div>
          
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-inherit opacity-40">
            <p className="text-[10px] text-center font-black uppercase tracking-widest">
               Powered by Google Search grounding · Clinical Safety Protocol Active
            </p>
            <div className="flex items-center gap-2 px-4 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
              <Star className="w-3 h-3 text-amber-500 fill-current" />
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                {t('agent.developerNotice')}
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function useUrkioChat(userId: string) {
  return { userId };
}
