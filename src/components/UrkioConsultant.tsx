import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Mic, Loader2, Play, Square, X, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import { sendEncryptedMessage, subscribeToMessages } from '../services/chatService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: any;
}

interface UrkioConsultantProps {
  user: any;
  userData: any;
  conversationId?: string;
  compact?: boolean;
}

// Ensure voice environments are strictly integrated to prevent credential errors.
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';
const AGORA_APP_CERTIFICATE = import.meta.env.VITE_AGORA_APP_CERTIFICATE || '';

export function UrkioConsultant({ user, userData, conversationId: propConversationId, compact }: UrkioConsultantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const conversationId = propConversationId || (user?.uid 
    ? `consultant_v1_${user.uid}`
    : `consultant_guest_${Math.random().toString(36).substring(7)}`);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Subscribe to real-time AES-256 encrypted messages via Firestore
  useEffect(() => {
    if (!user?.uid) return;

    setIsLoading(true);
    const unsubscribe = subscribeToMessages(conversationId, (newMessages: any[]) => {
      if (newMessages.length > 0) {
        const formatted = newMessages.map(msg => {
          let dateVal = 0;
          if (msg.createdAt?.seconds) dateVal = msg.createdAt.seconds * 1000;
          else if (msg.createdAt instanceof Date) dateVal = msg.createdAt.getTime();
          else if (typeof msg.createdAt === 'number') dateVal = msg.createdAt;
          else if (typeof msg.createdAt === 'string') dateVal = new Date(msg.createdAt).getTime();

          return {
            id: msg._id || msg.id || crypto.randomUUID(),
            role: msg.role || (msg.user?._id === 2 ? 'assistant' : 'user'),
            content: msg.text || msg.content,
            createdAt: dateVal
          };
        }).sort((a, b) => a.createdAt - b.createdAt);
        
        setMessages(formatted as Message[]);
      } else {
        const welcome: Message = {
           id: 'welcome',
           role: 'assistant',
           content: 'أهلاً بك. أنا مستشار أور كيو الذكي. كيف يمكنني مساعدتك اليوم؟ نحن نؤمن بأن كل خطوة، حتى وإن تعثرت، هي البداية نحو النجاح.',
           createdAt: Date.now()
        };
        setMessages([welcome]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, conversationId]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("متصفحك لا يدعم تسجيل الصوت.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ar-SA'; // 100% Arabic interface requirement

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
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isRecording]);

  const sendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setIsLoading(true);
    if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
    }
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: Date.now()
    };

    // Speculative UI update
    if (!user?.uid) {
      setMessages(prev => [...prev, userMessage]);
    }

    try {
      if (user?.uid) {
        // Send AES encrypted message
        await sendEncryptedMessage(conversationId, {
          text: text,
          role: 'user',
          user: { _id: 1, name: userData?.displayName || 'User' }
        });
      }
    } catch (err) {
      console.error("Failed to encrypt/save user message:", err);
      toast.error("فشل في تشفير الرسالة");
    }

    setInput('');
    const assistantId = crypto.randomUUID();

    // Prepare streaming architecture
    try {
      abortRef.current = new AbortController();
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          prompt: text,
          userId: user?.uid,
          language: 'ar', // Force Arabic
          condition: 'general',
          userContext: {
            displayName: userData?.displayName,
          },
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Consultant Bridge Unreachable (HTTP ${response.status})`);
      }

      if (!response.body) throw new Error('No readable stream available');

      // Speculative update for the stream
      if (!user?.uid) {
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() }]);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        
        // Zero-latency chunk-by-chunk visual update
        if (!user?.uid) {
           setMessages(prev =>
             prev.map(m => (m.id === assistantId ? { ...m, content: accumulated } : m))
           );
        }
      }

      // Once the stream is completely done, save the AES encrypted payload to Firestore
      if (user?.uid && accumulated.trim()) {
        await sendEncryptedMessage(conversationId, {
          text: accumulated,
          role: 'assistant',
          user: { _id: 2, name: 'Urkio Consultant' }
        });
      }

    } catch (error: any) {
      console.error('[UrkioConsultant] API failed:', error);
      toast.error('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.');
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  }, [input, messages, user, userData, conversationId, isRecording]);

  return (
    <div className={clsx("flex flex-col rounded-5xl overflow-hidden shadow-3xl border border-slate-200 dark:border-slate-800 bg-[#F8F9FA] dark:bg-[#10161D]", compact ? "h-full" : "h-[calc(100vh-8rem)]")}>
      
      {/* Arabic Header */}
      <div className="p-6 md:p-8 bg-white/40 dark:bg-white/5 backdrop-blur-3xl border-b border-inherit flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-5 rtl:flex-row-reverse" dir="rtl">
          <div className="w-14 h-14 rounded-3xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-serif-clinical text-slate-900 dark:text-slate-100">
              مستشار أور كيو الذكي
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  نشط الآن
                </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">AES-256 Encrypted</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scroll-smooth custom-scrollbar" dir="rtl">
          {messages.map((m, idx) => (
            <div
              key={m.id || idx}
              className={clsx("flex gap-4 max-w-[85%]", m.role === 'user' ? "ms-auto flex-row-reverse" : "me-auto")}
            >
              <div className={clsx(
                 "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                 m.role === 'user' ? "bg-amber-500 text-white" : "bg-white dark:bg-slate-800 text-amber-500 border border-amber-200 dark:border-amber-900/30"
              )}>
                {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={clsx(
                "p-5 rounded-4xl shadow-md border",
                m.role === 'user' 
                  ? "bg-amber-500 text-white rounded-se-none border-amber-600"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-ss-none border-slate-200 dark:border-slate-700"
                )}
              >
                {m.content ? (
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
                ) : (
                  <div className="flex items-center gap-1.5 py-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && !messages.find(m => m.content === '') && (
             <div className="flex items-center gap-3 opacity-40 italic text-xs animate-pulse text-amber-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>يتم كتابة الرد...</span>
             </div>
          )}
      </div>

      {/* Input Area */}
      <div className="p-6 md:p-8 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl border-t border-inherit" dir="rtl">
        <form onSubmit={sendMessage} className="space-y-4">
          <div className="relative group">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                rows={1}
                placeholder="تحدث مع مستشارك، نحن نصغي إليك..."
                disabled={isRecording}
                className={clsx(
                  "w-full bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-800 rounded-5xl pe-28 ps-6 py-5 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 text-sm sm:text-base font-medium resize-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400",
                  isRecording && "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                  }
                }}
              />
  
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={toggleRecording}
                    className={clsx(
                      "p-3 rounded-2xl transition-all relative",
                      isRecording ? "text-white bg-amber-500 shadow-lg shadow-amber-500/30 animate-pulse" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    )}
                  >
                      {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    type="submit"
                    disabled={!input?.trim() || isLoading}
                    className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:rotate-180" />}
                  </button>
              </div>
          </div>
          
          <div className="flex justify-center pt-2">
            <div className="flex items-center gap-2 px-6 py-2 bg-amber-500/10 rounded-full border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-[11px] font-black tracking-widest text-amber-600 dark:text-amber-400">
                بروتوكول التوجيه المهني مفعل • ذكاء أور كيو
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
