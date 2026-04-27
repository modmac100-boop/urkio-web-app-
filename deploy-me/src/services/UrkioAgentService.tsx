import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  X,
  Minus,
  MessageCircle,
  Zap,
  ShieldCheck,
  Heart,
  Bot,
  BrainCircuit,
  Loader2,
  Waves
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mood?: string;
}

interface UrkioAgentServiceProps {
  onClose?: () => void;
  isMinimized?: boolean;
  onMinimize?: () => void;
  initialMood?: string;
}

export const UrkioAgentService: React.FC<UrkioAgentServiceProps> = ({ 
  onClose, 
  isMinimized, 
  onMinimize,
  initialMood = 'general'
}) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('agent.welcome'),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeMood, setActiveMood] = useState(initialMood);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = i18n.language === 'ar' ? 'ar-SA' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
        
        // AUTO-SEND LOGIC: Trigger send if transcript is long enough or after a short delay
        if (transcript.length > 0) {
          setTimeout(() => handleSend(transcript), 500);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech Recognition Error', event.error);
        setIsRecording(false);
        toast.error(t('agent.micError'));
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [i18n.language]);

  const speak = (text: string) => {
    if (!isVoiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    synthRef.current.speak(utterance);
  };

  const getMockResponse = (userText: string, mood: string) => {
    const responses = t('agent.mockResponses', { returnObjects: true }) as any;
    return responses[mood] || responses['general'];
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
      mood: activeMood
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate API Call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const responseContent = getMockResponse(textToSend, activeMood);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      speak(responseContent);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('agent.error'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      speak(t('agent.error'));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsRecording(true);
      toast.success(t('agent.voiceRecording'));
    }
  };

  const themes: any = {
    general: {
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-slate-200 dark:border-slate-800',
      text: 'text-slate-900 dark:text-white',
      accent: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      chat: 'bg-blue-50 dark:bg-blue-900/20'
    },
    panic: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-900 dark:text-rose-100',
      accent: 'text-rose-600 dark:text-rose-400',
      button: 'bg-rose-600 hover:bg-rose-700 text-white',
      chat: 'bg-rose-100 dark:bg-rose-900/40'
    },
    anxiety: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      accent: 'text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      chat: 'bg-amber-100 dark:bg-amber-900/40'
    },
    depression: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/20',
      border: 'border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-900 dark:text-indigo-100',
      accent: 'text-indigo-600 dark:text-indigo-400',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      chat: 'bg-indigo-100 dark:bg-indigo-900/40'
    }
  };

  const theme = themes[activeMood] || themes.general;

  const conditions = [
    { id: 'general', label: t('agent.moods.general'), icon: Sparkles },
    { id: 'panic', label: t('agent.moods.panic'), icon: Zap },
    { id: 'anxiety', label: t('agent.moods.anxiety'), icon: ShieldCheck },
    { id: 'depression', label: t('agent.moods.depression'), icon: Heart }
  ];

  return (
    <div className={clsx("flex flex-col h-full rounded-3xl overflow-hidden shadow-2xl border transition-all duration-700", theme.bg, theme.border, theme.text)}>
      {/* Header */}
      <header className="p-4 border-b border-inherit flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center bg-current opacity-10")}>
            <Bot className={clsx("w-6 h-6", theme.accent)} />
          </div>
          <div>
            <h3 className="font-bold text-sm">{t('agent.title')}</h3>
            <p className="text-[10px] opacity-60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('agent.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-40" />}
          </button>
          {onMinimize && (
            <button onClick={onMinimize} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <Minus className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-rose-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Mood Selector */}
      <div className="px-4 py-2 border-b border-inherit bg-black/5 dark:bg-white/5 overflow-x-auto no-scrollbar">
        <div className="flex gap-1 p-1">
          {conditions.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveMood(c.id)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0",
                activeMood === c.id 
                  ? "bg-white dark:bg-slate-800 shadow-sm text-current scale-105" 
                  : "opacity-40 hover:opacity-100"
              )}
            >
              <c.icon className="w-3.5 h-3.5" />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.map((m) => (
          <div key={m.id} className={clsx("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={clsx(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
              m.role === 'user' 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : clsx("rounded-tl-none border border-inherit", theme.chat)
            )}>
              <p className="leading-relaxed">{m.content}</p>
              <span className="text-[9px] opacity-40 mt-1 block">
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className={clsx("rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center border border-inherit", theme.chat)}>
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-inherit bg-black/5 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleRecording}
            className={clsx(
              "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
              isRecording 
                ? "bg-rose-500 text-white animate-pulse" 
                : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
            )}
          >
            {isRecording ? <Waves className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <div className="flex-1 relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? t('agent.voiceRecording') : t('agent.placeholder')}
              className="w-full bg-white dark:bg-slate-800 border-inherit rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={clsx(
              "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
              input.trim() ? theme.button : "bg-black/5 dark:bg-white/5 opacity-40 cursor-not-allowed"
            )}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        {isRecording && (
          <p className="text-[10px] text-rose-500 font-medium mt-2 text-center flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            {t('agent.autoSend')}
          </p>
        )}
      </div>
    </div>
  );
};
