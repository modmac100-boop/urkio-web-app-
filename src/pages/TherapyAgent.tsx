import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, AlertTriangle, ArrowLeft, Mic, Square, Loader2, Volume2, VolumeX } from 'lucide-react';
import { sendEncryptedMessage, subscribeToMessages } from '../services/chatService';
import { containsSelfHarmKeywords, generateSafetyResponse } from '../security/safetyGuard';
import { SafetyAlertModal } from '../components/messaging/SafetyAlertModal';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

interface Message {
  _id: string;
  text: string;
  createdAt: Date | any;
  user: {
    _id: string | number;
    name?: string;
  };
  audio?: string;
  condition?: string;
}

export const TherapyAgent = ({ user, userData }: { user: any; userData: any }) => {
  const { condition = 'general' } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use a predictable conversation ID based on user and condition
  const conversationId = `therapy_${user?.uid}_${condition}`;

  useEffect(() => {
    if (!user) return;
    let unsubscribe = () => {};

    setLoading(true);
    try {
      unsubscribe = subscribeToMessages(conversationId, (newMessages: any[]) => {
        // Convert to our Message interface if necessary
        const formattedMessages = newMessages.map(msg => ({
          ...msg,
          _id: msg._id || msg.id,
          createdAt: msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt)
        }));
        
        setMessages(formattedMessages);
        setConnectionError(null);
        setLoading(false);
        setTimeout(scrollToBottom, 50);

        // Voice feedback simulation (In a real app, use Web Speech API)
        if (isVoiceEnabled && formattedMessages.length > 0) {
          const lastMsg = formattedMessages[formattedMessages.length - 1]; // Assuming order is asc
          if (lastMsg.user._id === 2 && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(lastMsg.text);
            utterance.lang = isRTL ? 'ar-SA' : 'en-US';
            utterance.pitch = 0.95;
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
          }
        }
      });
    } catch (err: any) {
      console.error("Subscription error:", err);
      setConnectionError(err.message || "Failed to connect to chat service.");
      setLoading(false);
    }

    // Initial greeting if no messages
    if (messages.length === 0) {
      const initialMessage: Message = {
        _id: '1',
        text: isRTL 
          ? `مرحباً، أنا هنا لمساعدتك في التعامل مع ${condition}. كيف يمكنني دعمك اليوم؟`
          : `Hello, I'm here to help you navigate ${condition}. How can I support you today?`,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Urkio AI',
        },
      };
      setMessages([initialMessage]);
    }

    return () => {
      unsubscribe();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [condition, conversationId, user, isRTL]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const text = newMessage;
    setNewMessage('');
    setIsSending(true);

    const message: Message = {
      _id: Math.random().toString(),
      text: text,
      createdAt: new Date(),
      user: {
        _id: 1,
        name: userData?.displayName || user?.email || 'User'
      }
    };

    // 1. Safety Guard check locally first for immediate feedback
    if (containsSelfHarmKeywords(text)) {
      setShowSafetyAlert(true);
      const safetyResponse: Message = {
        _id: Math.random().toString(),
        text: generateSafetyResponse(),
        createdAt: new Date(),
        user: { _id: 2, name: 'Urkio Safety' },
      };
      setMessages(prev => [...prev, message, safetyResponse]);
      setIsSending(false);
      setTimeout(scrollToBottom, 50);
      return; // Stop here if safety triggered, or we can still send to backend for logging
    }

    // 2. Send encrypted to Firebase
    try {
      const messageWithCondition = {
        ...message,
        condition: condition
      };
      await sendEncryptedMessage(conversationId, messageWithCondition);
      setConnectionError(null);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      setConnectionError(`Error: ${error.code || 'unknown'} - ${error.message}`);
      toast.error(`We couldn't send your message: ${error.message}`);
      setNewMessage(text); // Restore message
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  // Mock voice recording for web since we just need UI parity for now
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.error("Voice recording is not fully supported on the web version yet.");
    } else {
      setIsRecording(true);
      setTimeout(() => {
        if (isRecording) setIsRecording(false);
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-navy text-ivory">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-sage/20 bg-navy/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-sage/10 transition-colors"
          >
            <ArrowLeft className={`w-6 h-6 text-ivory ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-xl font-bold capitalize text-ivory flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ur-primary animate-pulse"></span>
              {condition.replace('-', ' ')} Support
            </h1>
            <p className="text-sm text-sage/70">Urkio AI Therapist</p>
          </div>
        </div>
        <button 
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} 
          className="p-2 rounded-full hover:bg-sage/10 transition-colors"
          title={isVoiceEnabled ? "Disable Voice Feedback" : "Enable Voice Feedback"}
        >
          {isVoiceEnabled ? (
            <Volume2 className="w-6 h-6 text-ur-primary" />
          ) : (
            <VolumeX className="w-6 h-6 text-sage" />
          )}
        </button>
      </div>

      {/* Error Bar */}
      {connectionError && (
        <div className="bg-rose-500/20 px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <p className="text-rose-400 text-sm flex-1">{connectionError}</p>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 text-ur-primary animate-spin" />
          </div>
        ) : (
          messages.map((msg, index) => {
            const isAI = msg.user._id === 2;
            return (
              <div 
                key={msg._id || index} 
                className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isAI 
                      ? 'bg-[#1E293B] text-ur-background rounded-tl-sm' 
                      : 'bg-ur-primary text-ur-on-surface rounded-tr-sm'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <span className={`text-[10px] mt-1 block opacity-60 ${isAI ? 'text-left' : 'text-right'}`}>
                    {msg.createdAt instanceof Date 
                      ? msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                      : 'Just now'}
                  </span>
                </div>
              </div>
            );
          })
        )}
        {isSending && (
           <div className="flex justify-end">
             <div className="bg-ur-primary/50 rounded-2xl px-4 py-3 rounded-tr-sm">
               <Loader2 className="w-4 h-4 text-ur-on-surface animate-spin" />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-navy/95 border-t border-sage/20 backdrop-blur-sm">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-end gap-2 max-w-4xl mx-auto relative"
        >
          {isRecording && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-rose-500 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span className="text-white text-xs font-bold tracking-wider">RECORDING...</span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleRecording}
            className={`p-3 rounded-full flex-shrink-0 transition-colors ${
              isRecording ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30' : 'bg-sage/10 text-ur-primary hover:bg-sage/20'
            }`}
          >
            {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isRTL ? "اكتب رسالة..." : "Type your message here..."}
            className={`flex-1 bg-sage/5 text-ivory rounded-2xl px-4 py-3 min-h-[50px] max-h-32 resize-none focus:outline-none focus:ring-1 focus:ring-ur-primary border border-sage/20 ${isRTL ? 'text-right' : 'text-left'}`}
            rows={1}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-3 bg-ur-primary text-navy rounded-full flex-shrink-0 hover:bg-ur-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </form>
      </div>

      <SafetyAlertModal 
        visible={showSafetyAlert} 
        onClose={() => setShowSafetyAlert(false)} 
      />
    </div>
  );
};
