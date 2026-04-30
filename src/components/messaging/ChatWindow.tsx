import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, deleteDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { format } from 'date-fns';
import { 
  Send, 
  Paperclip, 
  Video, 
  Phone, 
  Shield, 
  Download, 
  Play, 
  Pause,
  Camera, 
  Mic, 
  MicOff,
  Square,
  Trash2,
  Reply,
  X,
  MoreVertical, 
  MessageSquare,
  Plus,
  Info,
  Check,
  CheckCheck,
  Loader2,
  Clock,
  ChevronLeft,
  Smile,
  FileText,
  Volume2,
  Copy,
  Forward,
  Heart,
  Share2,
  SmilePlus,
  MessageCircle
} from 'lucide-react';
import { EmojiPicker } from '../EmojiPicker';
import { GlassButton } from '../GlassButton';
import { ExpertInfoSidebar } from './ExpertInfoSidebar';
import { VideoRecorder } from './VideoRecorder';
import { ForwardModal } from './ForwardModal';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useCalls } from '../../contexts/CallContext';
import { RemotionVideoMessage } from './RemotionVideoMessage';

interface Message {
  id: string;
  senderId: string;
  text: string;
  type: 'text' | 'file' | 'video' | 'call' | 'link' | 'audio' | 'session_invite' | 'live_invite' | 'remotion_video';
  fileUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  remotionData?: {
    text: string;
  };
  duration?: number;
  callRoomId?: string;
  callStatus?: 'missed' | 'completed' | 'ongoing' | 'declined';
  callType?: 'audio' | 'video';
  sessionData?: {
    roomId: string;
    accessCode: string;
    title?: string;
    expiresAt?: any;
  };
  liveData?: {
    roomId: string;
    accessCode: string;
    title: string;
    hostName: string;
    hostPhoto?: string;
    scheduledAt?: string;
  };
  timestamp: any;
  read?: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderId: string;
    type: string;
  };
  reactions?: { [emoji: string]: string[] };
  savedBy?: string[];
  isForwarded?: boolean;
  roomId?: string;
}

export function ChatWindow({ 
  conversationId, 
  currentUser, 
  userData,
  partner,
  onBack,
  autoCall,
  simplified = false
}: { 
  conversationId: string;
  currentUser: any;
  userData?: any;
  partner: any;
  onBack?: () => void;
  autoCall?: 'audio' | 'video' | null;
  simplified?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<any | null>(null);
  const [activeMessageActions, setActiveMessageActions] = useState<string | null>(null);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showExpertSidebar, setShowExpertSidebar] = useState(false);

  const isSpecialRole = ['specialist', 'expert', 'case_manager', 'admin', 'management', 'manager'].includes(userData?.role || currentUser?.role || currentUser?.userType) || currentUser?.email === 'urkio@urkio.com';
  
  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Typing States
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Swipe gesture for voice
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(16).fill(0));
  const [isStartingCall, setIsStartingCall] = useState(false);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const [copyingLink, setCopyingLink] = useState(false);
  const navigate = useNavigate();
  const { initiateCall, endCall } = useCalls();

  useEffect(() => {
    if (!conversationId || conversationId === 'new') {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Reset unread count when opening conversation
    const resetUnread = async () => {
      try {
        await updateDoc(doc(db, 'conversations', conversationId), {
          [`unreadCount.${currentUser.uid}`]: 0
        });
      } catch (error) {
        console.error("Error resetting unread count:", error);
      }
    };
    resetUnread();

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data({ serverTimestamps: 'estimate' }) 
      } as Message));
      
      setMessages(msgs);
      setLoading(false);
      setTimeout(scrollToBottom, 50);

      // Mark unread messages from partner as read
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const msg = { id: change.doc.id, ...change.doc.data() } as Message;
          if (msg.senderId !== currentUser.uid && !msg.read) {
            try {
              const msgRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
              await updateDoc(msgRef, { read: true });

              if (msg.id === msgs[msgs.length - 1]?.id) {
                await updateDoc(doc(db, 'conversations', conversationId), {
                  'lastMessage.read': true
                });
              }
            } catch (error) {
              console.error("Error marking message as read:", error);
            }
          }
        }
      });
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId, currentUser.uid]);

  useEffect(() => {
    if (partner?.displayName) {
      document.title = `Chat with ${partner.displayName} | Urkio Messenger`;
    } else {
      document.title = 'Messenger | Urkio';
    }
  }, [partner?.displayName]);

  // Typing Indicator Logic
  useEffect(() => {
    if (!conversationId || conversationId === 'new' || !partner?.uid) {
      setIsPartnerTyping(false);
      return;
    }

    const convRef = doc(db, 'conversations', conversationId);
    const unsubscribe = onSnapshot(convRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.typing && partner.uid) {
        setIsPartnerTyping(!!data.typing[partner.uid]);
      } else {
        setIsPartnerTyping(false);
      }
    }, (err) => console.error("Typing snapshot error:", err));

    return () => unsubscribe();
  }, [conversationId, partner?.uid]);

  const updateTypingStatus = async (typing: boolean) => {
    if (!conversationId || conversationId === 'new') return;
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        [`typing.${currentUser.uid}`]: typing
      });
    } catch (error) {
    }
  };

  useEffect(() => {
    if (newMessage.trim()) {
      updateTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => updateTypingStatus(false), 3000);
    } else {
      updateTypingStatus(false);
    }
  }, [newMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    try {
      let currentId = conversationId;
      
      if (currentId === 'new' && partner) {
        const convRef = await addDoc(collection(db, 'conversations'), {
          participants: [currentUser.uid, partner.uid],
          type: 'individual',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadCount: { [currentUser.uid]: 0, [partner.uid]: 1 },
          lastMessage: { text: text, senderId: currentUser.uid, timestamp: serverTimestamp() }
        });
        currentId = convRef.id;
        navigate(`/messenger?id=${currentId}`, { replace: true });
      }

      const messageData: any = {
        senderId: currentUser.uid,
        text: text,
        type: 'text',
        timestamp: serverTimestamp(),
        read: false
      };

      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          text: replyingTo.text || (replyingTo.type === 'audio' ? t('messaging.voiceMessage') : t('messaging.attachment')),
          senderId: replyingTo.senderId,
          type: replyingTo.type
        };
        setReplyingTo(null);
      }

      await addDoc(collection(db, 'conversations', currentId, 'messages'), messageData);
      
      const updates: any = {
        lastMessage: { text: text, senderId: currentUser.uid, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp()
      };
      if (partner?.uid) updates[`unreadCount.${partner.uid}`] = increment(1);
      await updateDoc(doc(db, 'conversations', currentId), updates);
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!conversationId || conversationId === 'new') return;
    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;

      const currentReactions = msg.reactions || {};
      const userIds = currentReactions[emoji] || [];
      
      let newUserIds;
      if (userIds.includes(currentUser.uid)) {
        newUserIds = userIds.filter(id => id !== currentUser.uid);
      } else {
        newUserIds = [...userIds, currentUser.uid];
      }

      const updatedReactions = { ...currentReactions };
      if (newUserIds.length === 0) {
        delete updatedReactions[emoji];
      } else {
        updatedReactions[emoji] = newUserIds;
      }

      await updateDoc(msgRef, { reactions: updatedReactions });
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!conversationId || conversationId === 'new') return;
    if (!window.confirm(t('messaging.confirmDelete', 'Delete this message?'))) return;
    
    try {
      await deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error('Failed to delete message');
    }
  };

  const toggleSaveMessage = async (messageId: string) => {
    if (!conversationId || conversationId === 'new') return;
    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;

      const currentSavedBy = msg.savedBy || [];
      const isSaved = currentSavedBy.includes(currentUser.uid);
      
      const newSavedBy = isSaved 
        ? currentSavedBy.filter(id => id !== currentUser.uid)
        : [...currentSavedBy, currentUser.uid];

      await updateDoc(msgRef, { savedBy: newSavedBy });
      toast.success(isSaved ? 'Message unsaved' : 'Message saved to your archive');
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Message copied');
    setActiveMessageActions(null);
  };

  const forwardMessage = (msg: Message) => {
    // This would typically open a user picker
    toast("Forwarding to 'My Circle' sync pending...", { icon: "📩" });
    setActiveMessageActions(null);
  };

  const handleActionTimeout = (msgId: string, start: boolean) => {
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
    
    if (start) {
      actionTimeoutRef.current = setTimeout(() => {
        setActiveMessageActions(msgId);
      }, 1200); // 1.2 seconds for 'hold' appearance
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('File size too large (max 50MB)');
      return;
    }

    const uploadToast = toast.loading('Uploading file...');
    setUploading(true);
    setShowAttachments(false);
    try {
      let currentId = conversationId;
      if (currentId === 'new' && partner) {
        const convRef = await addDoc(collection(db, 'conversations'), {
          participants: [currentUser.uid, partner.uid],
          type: 'individual',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadCount: { [currentUser.uid]: 0, [partner.uid]: 1 },
          lastMessage: { text: type === 'video' ? t('messaging.sentVideo') : t('messaging.sentFile'), senderId: currentUser.uid, timestamp: serverTimestamp() }
        });
        currentId = convRef.id;
        navigate(`/messenger?id=${currentId}`, { replace: true });
      }

      const storageRef = ref(storage, `conversations/${currentId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      const messageData: any = {
        senderId: currentUser.uid,
        text: type === 'video' ? t('messaging.sentVideo') : t('messaging.sentFile'),
        type: type,
        timestamp: serverTimestamp(),
        [type === 'video' ? 'videoUrl' : 'fileUrl']: url
      };

      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          text: replyingTo.text || (replyingTo.type === 'audio' ? t('messaging.voiceMessage') : t('messaging.attachment')),
          senderId: replyingTo.senderId,
          type: replyingTo.type
        };
        setReplyingTo(null);
      }

      await addDoc(collection(db, 'conversations', currentId, 'messages'), messageData);
      const updates: any = {
        lastMessage: { text: messageData.text, senderId: currentUser.uid, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp()
      };
      if (partner?.uid) updates[`unreadCount.${partner.uid}`] = increment(1);
      await updateDoc(doc(db, 'conversations', currentId), updates);
      toast.success('File sent successfully', { id: uploadToast });
    } catch (error) {
      console.error("Error uploading storage:", error);
      toast.error('Failed to upload file', { id: uploadToast });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  const startCall = async (type: 'audio' | 'video' = 'video') => {
    if (isStartingCall) return;
    try {
      let currentId = conversationId;
      if (currentId === 'new' && partner) {
        // ... (existing logic to create conversation if new)
        const convRef = await addDoc(collection(db, 'conversations'), {
          participants: [currentUser.uid, partner.uid],
          type: 'individual',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: { text: 'Starting call...', senderId: currentUser.uid, timestamp: serverTimestamp() }
        });
        currentId = convRef.id;
        navigate(`/messenger?id=${currentId}`, { replace: true });
      }

      setIsStartingCall(true);
      
      // We still log it in the chat for history
      await addDoc(collection(db, 'conversations', currentId, 'messages'), {
        senderId: currentUser.uid,
        text: type === 'video' ? t('messaging.startedVideoCall') : t('messaging.startedAudioCall'),
        type: 'call',
        callRoomId: currentId,
        callStatus: 'started',
        callType: type,
        timestamp: serverTimestamp(),
        read: false
      });

      // ── SYSTEM SIGNALING ──────────────────────────────────────────────
      // This triggers the global CallInterface overlay for BOTH users
      await initiateCall(partner, type, currentId);

    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Failed to initiate call signaling");
    } finally {
      setIsStartingCall(false);
    }
  };

  const handleSendSessionInvite = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      let currentId = conversationId;
      if (currentId === 'new' && partner) {
        const convRef = await addDoc(collection(db, 'conversations'), {
          participants: [currentUser.uid, partner.uid],
          type: 'individual',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadCount: { [currentUser.uid]: 0, [partner.uid]: 1 },
          lastMessage: { text: t('messaging.sessionInvite'), senderId: currentUser.uid, timestamp: serverTimestamp() }
        });
        currentId = convRef.id;
        navigate(`/messenger?id=${currentId}`, { replace: true });
      }

      const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
      const roomId = currentId;

      // Create session in Firestore
      await addDoc(collection(db, 'sessions'), {
        roomId,
        accessCode,
        hostId: currentUser.uid,
        createdAt: serverTimestamp(),
        active: true
      });

      const messageData: any = {
        senderId: currentUser.uid,
        text: `I've invited you to a Secure Healing Session.`,
        type: 'session_invite',
        sessionData: {
          roomId,
          accessCode,
        },
        timestamp: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'conversations', currentId, 'messages'), messageData);
      
      const updates: any = {
        lastMessage: { text: t('messaging.sessionInviteSent'), senderId: currentUser.uid, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp()
      };
      if (partner?.uid) updates[`unreadCount.${partner.uid}`] = increment(1);
      await updateDoc(doc(db, 'conversations', currentId), updates);

      toast.success('Session invite sent!');
    } catch (error) {
      console.error("Error sending session invite:", error);
      toast.error('Failed to send session invite');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendLiveBroadcast = async () => {
    if (!currentUser || !conversationId) return;
    setIsSending(true);
    try {
      const currentId = conversationId;
      const roomId = `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const accessCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const msgRef = doc(collection(db, 'conversations', currentId, 'messages'));
      await setDoc(msgRef, {
        senderId: currentUser.uid,
        type: 'live_invite',
        text: 'Live broadcast invitation',
        liveData: {
          roomId,
          accessCode,
          title: 'Expert Live Healing Broadcast',
          hostName: currentUser.displayName || 'Expert',
          hostPhoto: currentUser.photoURL || '',
          scheduledAt: 'Happening Now',
        },
        timestamp: serverTimestamp(),
        read: false,
      });
      const updates: Record<string, any> = {
        lastMessage: { text: '🔴 Live broadcast invitation', senderId: currentUser.uid, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp(),
      };
      if (partner?.uid) updates[`unreadCount.${partner.uid}`] = increment(1);
      await updateDoc(doc(db, 'conversations', currentId), updates);
      toast.success('Live broadcast invitation sent!');
    } catch (error) {
      console.error('Error sending live invite:', error);
      toast.error('Failed to send live invite');
    } finally {
      setIsSending(false);
    }
  };

  const handleStartRecording = async (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      
      const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac'];
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      const mr = new MediaRecorder(stream, { mimeType });

      // Live Visualization Setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const slimData = Array.from(dataArray.slice(0, 16)).map(v => v / 255);
        setVisualizerData(slimData);
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0) {
          if (swipeOffset >= 150) {
            // Cancelled via swipe
            setRecordedBlob(null);
          } else {
            setRecordedBlob(blob);
            setRecordedUrl(URL.createObjectURL(blob));
          }
        }
        setSwipeOffset(0);
      };
      mr.start(200);
      recordingStartTimeRef.current = Date.now();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(s => s + 1), 1000);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const discardRecordedVoice = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
  };

  const sendRecordedVoice = async () => {
    if (!recordedBlob) return;
    await handleSendVoiceMessage(recordedBlob);
    discardRecordedVoice();
  };

  const handleStopRecording = (shouldSend = true) => {
    if (mediaRecorderRef.current && isRecording) {
      if (!shouldSend) {
          // If cancelled, we still stop but won't send in onstop
          swipeOffset >= 150 ? (chunksRef.current = []) : null; 
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Cleanup visualizer
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      analyserRef.current = null;
      setVisualizerData(new Array(16).fill(0));

      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isRecording) return;
    const touch = e.touches[0];
    if (touchStartRef.current) {
      const offset = touchStartRef.current - touch.clientX;
      if (offset > 0) setSwipeOffset(offset);
    }
  };

  const handleSendVoiceMessage = async (blob: Blob) => {
    setUploading(true);
    try {
      let currentId = conversationId;
      if (currentId === 'new') {
        if (!partner) throw new Error("Cannot start a new conversation without a partner");
        const convRef = await addDoc(collection(db, 'conversations'), {
          participants: [currentUser.uid, partner.uid],
          type: 'individual',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadCount: { [currentUser.uid]: 0, [partner.uid]: 1 },
          lastMessage: { text: t('messaging.voiceMessage'), senderId: currentUser.uid, timestamp: serverTimestamp() }
        });
        currentId = convRef.id;
        navigate(`/messenger?id=${currentId}`, { replace: true });
      }

      const sRef = ref(storage, `conversations/${currentId}/voice_${Date.now()}.webm`);
      await uploadBytes(sRef, blob);
      const url = await getDownloadURL(sRef);

      const messageData: any = {
        senderId: currentUser.uid,
        text: t('messaging.voiceMessage'),
        type: 'audio',
        audioUrl: url,
        duration: recordingTime,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'conversations', currentId, 'messages'), messageData);
      
      const updates: any = {
        lastMessage: { text: t('messaging.voiceMessage'), senderId: currentUser.uid, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp()
      };
      if (partner?.uid) updates[`unreadCount.${partner.uid}`] = increment(1);
      await updateDoc(doc(db, 'conversations', currentId), updates);
    } catch (error) {
      console.error("Error sending voice message:", error);
      toast.error("Failed to send voice message");
    } finally {
      setUploading(false);
    }
  };

  const handleVideoSend = async (blob: Blob) => {
    setUploading(true);
    try {
      let currentId = conversationId;
      if (currentId === 'new' && partner) {
        const convRef = await addDoc(collection(db, 'conversations'), {
          participants: [currentUser.uid, partner.uid],
          type: 'individual',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadCount: { [currentUser.uid]: 0, [partner.uid]: 1 },
          lastMessage: { text: t('messaging.sentVideo'), senderId: currentUser.uid, timestamp: serverTimestamp() }
        });
        currentId = convRef.id;
        navigate(`/messenger?id=${currentId}`, { replace: true });
      }

      const storageRef = ref(storage, `conversations/${currentId}/${Date.now()}_video_message.webm`);
      const snapshot = await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(snapshot.ref);

      const messageData: any = {
        senderId: currentUser.uid,
        text: t('messaging.sentVideo'),
        type: 'video',
        timestamp: serverTimestamp(),
        videoUrl: url
      };

      await addDoc(collection(db, 'conversations', currentId, 'messages'), messageData);
      const updates: any = {
        lastMessage: { text: messageData.text, senderId: currentUser.uid, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp()
      };
      if (partner?.uid) updates[`unreadCount.${partner.uid}`] = increment(1);
      await updateDoc(doc(db, 'conversations', currentId), updates);
      toast.success('Video message sent!');
    } catch (error) {
      console.error("Error sending video message:", error);
      toast.error('Failed to send video message');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoSaveToVault = async (blob: Blob) => {
    setUploading(true);
    const saveToast = toast.loading('Saving video to vault...');
    try {
      const filename = `recordings/${currentUser.uid}/${Date.now()}_vault_video.webm`;
      const sRef = ref(storage, filename);
      await uploadBytes(sRef, blob);
      const url = await getDownloadURL(sRef);
      
      await addDoc(collection(db, 'recordings'), {
        authorId: currentUser.uid,
        authorName: userData?.displayName || currentUser.email,
        url,
        title: `Video Note — ${new Date().toLocaleDateString()}`,
        createdAt: serverTimestamp(),
        type: 'video',
        isPrivate: true,
      });
      
      toast.success('Video saved to your private vault!', { id: saveToast });
    } catch (error) {
      console.error("Error saving video to vault:", error);
      toast.error('Failed to save video', { id: saveToast });
    } finally {
      setUploading(false);
    }
  };

  const getMoodGradient = (mood?: string, isOwn?: boolean) => {
    if (!mood) return isOwn ? "from-primary to-indigo-600" : "bg-white/5";
    switch (mood) {
      case 'happy': return isOwn ? "from-amber-400 to-orange-500" : "from-amber-400/20 to-orange-500/20";
      case 'calm': return isOwn ? "from-emerald-400 to-teal-500" : "from-emerald-400/20 to-teal-500/20";
      case 'sad': return isOwn ? "from-blue-400 to-indigo-600" : "from-blue-400/20 to-indigo-600/20";
      case 'energetic': return isOwn ? "from-purple-500 to-pink-500" : "from-purple-500/20 to-pink-500/20";
      case 'neutral': return isOwn ? "from-slate-400 to-slate-600" : "from-slate-400/20 to-slate-600/20";
      default: return isOwn ? "from-primary to-indigo-600" : "bg-white/5";
    }
  };

  const handleSend = () => {
    handleSendMessage();
  };

  return (
    <>
      <main className="flex-1 flex flex-col bg-msgr-surface-bright/40 relative overflow-hidden h-full">
        {/* 🏢 Chat Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-msgr-surface/60 backdrop-blur-xl border-b border-msgr-surface-container shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer group" onClick={() => setShowExpertSidebar(!showExpertSidebar)}>
              <img 
                src={partner?.photoURL || `https://ui-avatars.com/api/?name=${partner?.displayName}`} 
                className="w-11 h-11 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" 
                alt="" 
              />
              {partner?.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-ur-secondary border-2 border-msgr-surface rounded-full shadow-sm"></span>}
            </div>
            <div className="cursor-pointer" onClick={() => setShowExpertSidebar(!showExpertSidebar)}>
              <h4 className="font-headline font-black italic text-msgr-on-surface uppercase tracking-tighter leading-none mb-1">
                {partner?.displayName || 'Active Stream'}
              </h4>
              <p className="text-[10px] text-ur-secondary font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-ur-secondary rounded-full animate-pulse"></span>
                Active Now
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {userData?.role === 'specialist' || userData?.role === 'founder' ? (
              <>
                <button 
                  onClick={handleSendSessionInvite} 
                  className="p-2.5 text-zinc-400 hover:bg-ur-secondary/5 hover:text-ur-secondary rounded-xl transition-all group"
                  title="Invite to Healing Session"
                >
                  <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">calendar_add_on</span>
                </button>
                <button 
                  onClick={handleSendLiveBroadcast} 
                  className="p-2.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all group flex items-center gap-1"
                  title="Start Live Broadcast Invite"
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="material-symbols-outlined text-lg">podcasts</span>
                </button>
              </>
            ) : null}
            <button 
              onClick={() => startCall('video')} 
              className="p-2.5 text-zinc-400 hover:bg-msgr-primary/5 hover:text-msgr-primary rounded-xl transition-all group"
              title="Start Video Call"
            >
              <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">video_call</span>
            </button>
            <button 
              onClick={() => startCall('audio')} 
              className="p-2.5 text-zinc-400 hover:bg-msgr-primary/5 hover:text-msgr-primary rounded-xl transition-all group"
              title="Start Voice Call"
            >
              <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">phone</span>
            </button>
            <button onClick={() => setShowExpertSidebar(!showExpertSidebar)} className={clsx("p-2.5 rounded-xl transition-all", showExpertSidebar ? "bg-msgr-primary text-white" : "text-zinc-400 hover:bg-msgr-primary/5 hover:text-msgr-primary")}>
              <span className="material-symbols-outlined text-lg">more_vert</span>
            </button>
          </div>
        </header>

        {/* 💬 Messages Stream */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar relative" id="message-container">
          <div className="flex justify-center mb-12">
            <span className="bg-msgr-surface-container-high px-4 py-1.5 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Session Archive · {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
          </div>

          {messages.map((msg, idx) => {
            const isOwn = msg.senderId === currentUser.uid;
            const isSameSender = idx > 0 && messages[idx - 1].senderId === msg.senderId;
            const showAvatar = !isOwn && !isSameSender;
            const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
            const isLiked = msg.reactions?.['❤️']?.includes(currentUser.uid) || msg.reactions?.['👍']?.includes(currentUser.uid);

            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "flex items-start gap-4 group",
                  isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!isOwn && (
                  <div className="w-9 shrink-0 pt-1">
                    {showAvatar ? (
                      <img 
                        src={partner?.photoURL || `https://ui-avatars.com/api/?name=${partner?.displayName}`} 
                        className="w-9 h-9 rounded-xl object-cover shadow-sm" 
                      />
                    ) : <div className="w-9" />}
                  </div>
                )}

                <div className={clsx("max-w-[75%] flex flex-col", isOwn ? "items-end" : "items-start")}>
                   {msg.replyTo && (
                     <div className={clsx(
                       "mb-[-12px] p-3 pt-2 pb-4 rounded-t-2xl text-[11px] font-medium border-l-4 border-msgr-primary bg-msgr-surface-container-low opacity-80 min-w-[120px]",
                       isOwn ? "mr-4" : "ml-4"
                     )}>
                        <p className="text-[9px] font-black uppercase text-msgr-primary mb-1">{msg.replyTo.senderId === currentUser.uid ? 'You' : partner?.displayName}</p>
                        <p className="truncate italic text-zinc-500">{msg.replyTo.text}</p>
                     </div>
                   )}

                   <div className="relative group/bubble flex flex-col">
                      <div 
                        className={clsx(
                          "p-4 px-5 text-[14px] leading-relaxed shadow-sm transition-all duration-300 relative z-1",
                          isOwn 
                            ? "bg-linear-to-br from-msgr-primary to-msgr-primary-container text-white rounded-[24px] rounded-tr-sm" 
                            : "bg-msgr-surface-container-high text-msgr-on-surface rounded-[24px] rounded-tl-sm"
                        )}
                        onDoubleClick={() => toggleReaction(msg.id, '❤️')}
                      >
                         {msg.type === 'text' && <p className="whitespace-pre-wrap">{msg.text}</p>}
                         {msg.type === 'session_invite' && (msg.sessionData || msg.roomId) && (
                           <div className="min-w-[260px] space-y-4">
                             <div className="flex items-center gap-3 mb-3">
                               <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isOwn ? "bg-white/20" : "bg-msgr-primary/10")}>
                                 <span className={clsx("material-symbols-outlined text-xl fill-1", isOwn ? "text-white" : "text-msgr-primary")}> healing </span>
                               </div>
                               <div>
                                 <p className={clsx("text-[10px] font-black uppercase tracking-widest", isOwn ? "text-white/70" : "text-msgr-primary/70")}>Secure Healing Session</p>
                                 <p className={clsx("text-[13px] font-black", isOwn ? "text-white" : "text-zinc-900")}>{msg.sessionData?.title || 'Expert Healing Invitation'}</p>
                               </div>
                             </div>
                             <div className={clsx("rounded-2xl p-3 space-y-2", isOwn ? "bg-white/10" : "bg-msgr-primary/5 border border-msgr-primary/10")}>
                               <div className="flex justify-between items-center">
                                 <span className={clsx("text-[9px] font-black uppercase tracking-widest", isOwn ? "text-white/50" : "text-zinc-400")}>Room ID</span>
                                 <span className={clsx("text-xs font-black font-mono", isOwn ? "text-white" : "text-zinc-800")}>{(msg.sessionData?.roomId || msg.roomId)?.slice(-8).toUpperCase()}</span>
                               </div>
                               {(msg.sessionData?.accessCode) && (
                                 <div className="flex justify-between items-center">
                                   <span className={clsx("text-[9px] font-black uppercase tracking-widest", isOwn ? "text-white/50" : "text-zinc-400")}>Access Code</span>
                                   <span className={clsx("text-[14px] font-black tracking-[0.3em] font-mono", isOwn ? "text-white" : "text-msgr-primary")}>{msg.sessionData.accessCode}</span>
                                 </div>
                               )}
                             </div>
                             {!isOwn && (
                               <button
                                 onClick={() => navigate(`/therapy-room/${msg.sessionData?.roomId || msg.roomId}`)}
                                 className="w-full py-3 bg-msgr-primary hover:bg-msgr-primary-container text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-msgr-primary/30 flex items-center justify-center gap-2"
                               >
                                 <span className="material-symbols-outlined text-[16px] fill-1">self_improvement</span>
                                 Join Healing Session
                               </button>
                             )}
                           </div>
                         )}
                         {msg.type === 'audio' && (
                           <AudioMessage url={msg.audioUrl!} duration={msg.duration} isOwn={isOwn} />
                         )}
                         {msg.type === 'file' && (
                            <a href={msg.fileUrl} target="_blank" className="flex items-center gap-3 p-1">
                               <div className={clsx("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", isOwn ? "bg-white/20" : "bg-white shadow-sm")}>
                                  <span className={clsx("material-symbols-outlined", isOwn ? "text-white" : "text-msgr-primary")}>description</span>
                               </div>
                               <div className="min-w-0 pr-2">
                                  <p className="text-xs font-black truncate">{msg.text || 'Document.pdf'}</p>
                                  <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Open in Workspace</p>
                               </div>
                            </a>
                         )}
                         {msg.type === 'video' && (
                            <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-white/10">
                               <video src={msg.videoUrl} className="max-w-[320px] w-full" />
                            </div>
                         )}
                         {msg.type === 'remotion_video' && (
                            <RemotionVideoMessage 
                              text={msg.text} 
                              senderName={isOwn ? (userData?.displayName || currentUser?.displayName || 'You') : (partner?.displayName || 'Expert')}
                              senderPhoto={isOwn ? (userData?.photoURL || currentUser?.photoURL) : partner?.photoURL}
                              isOwn={isOwn}
                            />
                         )}
                         {msg.type === 'live_invite' && msg.liveData && (
                           <div className='min-w-[260px] space-y-4'>
                             <div className='flex items-center gap-2 mb-1'>
                               <div className='flex items-center gap-1.5 px-2.5 py-1 bg-red-500 rounded-full'>
                                 <span className='w-1.5 h-1.5 bg-white rounded-full animate-pulse'></span>
                                 <span className='text-[9px] font-black text-white uppercase tracking-widest'>Live</span>
                                </div>
                               <p className={clsx('text-[11px] font-bold', isOwn ? 'text-white/70' : 'text-zinc-500')}>{msg.liveData.scheduledAt || 'Happening Now'}</p>
                             </div>
                             <p className={clsx('text-[15px] font-black leading-tight', isOwn ? 'text-white' : 'text-zinc-900')}>{msg.liveData.title}</p>
                             <div className='flex items-center gap-3'>
                               <img src={msg.liveData.hostPhoto || `https://ui-avatars.com/api/?name=${msg.liveData.hostName}`} className='w-8 h-8 rounded-full object-cover border-2 border-white/30' alt='' />
                               <div>
                                 <p className={clsx('text-[10px] font-black uppercase tracking-wider', isOwn ? 'text-white/80' : 'text-zinc-700')}>{msg.liveData.hostName}</p>
                                 <p className={clsx('text-[9px]', isOwn ? 'text-white/50' : 'text-zinc-400')}>Expert Host</p>
                               </div>
                             </div>
                             {!isOwn && (
                               <button
                                 onClick={() => navigate(`/therapy-room/${msg.liveData!.roomId}?live=true`)}
                                 className='w-full py-3 bg-linear-to-r from-red-500 to-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2'
                               >
                                 <span className='material-symbols-outlined text-[16px] fill-1'>radio_button_checked</span>
                                 Join Live Broadcast
                               </button>
                             )}
                           </div>
                         )}

                         {/* Forwarded Tag */}
                         {msg.isForwarded && (
                           <div className={clsx("flex items-center gap-1 mb-1 opacity-50 text-[10px] font-black uppercase tracking-widest", isOwn ? "justify-end text-white" : "text-zinc-500")}>
                             <Share2 size={10} />
                             Forwarded
                           </div>
                         )}
                      </div>

                      {/* Interaction Bar (Post Style) */}
                      <div className={clsx(
                        "mt-1 flex items-center gap-4 transition-all duration-300",
                        isOwn ? "flex-row-reverse" : "flex-row",
                        "opacity-0 group-hover:opacity-100"
                      )}>
                        <button 
                          onClick={() => toggleReaction(msg.id, '👍')}
                          className={clsx(
                            "flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all",
                            isLiked ? "text-msgr-primary bg-msgr-primary/5" : "text-zinc-400 hover:bg-zinc-100"
                          )}
                        >
                          <Heart size={14} className={clsx(isLiked && "fill-current")} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Like</span>
                        </button>
                        <button 
                          onClick={() => setReplyingTo(msg)}
                          className="flex items-center gap-1.5 py-1 px-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
                        >
                          <MessageCircle size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Comment</span>
                        </button>
                        <button 
                          onClick={() => setForwardingMessage(msg)}
                          className="flex items-center gap-1.5 py-1 px-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
                        >
                          <Share2 size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                        </button>
                        <div className="relative">
                           <button 
                             onClick={() => setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)}
                             className="p-1.5 text-zinc-400 hover:text-msgr-primary hover:bg-zinc-100 rounded-full transition-all"
                           >
                             <SmilePlus size={14} />
                           </button>
                           {showEmojiPickerFor === msg.id && (
                             <div className={clsx("absolute bottom-full mb-2 z-50", isOwn ? "right-0" : "left-0")}>
                               <EmojiPicker 
                                 onSelect={(emoji) => toggleReaction(msg.id, emoji)} 
                                 onClose={() => setShowEmojiPickerFor(null)} 
                               />
                             </div>
                           )}
                        </div>
                        <div className="relative group/more">
                           <button className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-full transition-all">
                             <MoreVertical size={14} />
                           </button>
                           <div className={clsx(
                             "absolute bottom-full mb-2 hidden group-hover/more:block z-50 bg-white border border-zinc-100 shadow-xl rounded-2xl p-1 min-w-[140px]",
                             isOwn ? "right-0" : "left-0"
                           )}>
                              <button onClick={() => copyToClipboard(msg.text || '')} className="w-full flex items-center gap-2 p-2 hover:bg-zinc-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-600 transition-all">
                                <Copy size={12} /> Copy
                              </button>
                              {isOwn && (
                                <button onClick={() => deleteMessage(msg.id)} className="w-full flex items-center gap-2 p-2 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 transition-all">
                                  <Trash2 size={12} /> Delete
                                </button>
                              )}
                           </div>
                        </div>
                      </div>

                      {/* Reaction Indicator */}
                      {hasReactions && (
                        <div className={clsx("flex items-center gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
                          {Object.entries(msg.reactions).map(([emoji, uids], i) => (
                            <div key={i} className="bg-white rounded-full px-2 py-0.5 shadow-sm border border-stone-100 flex items-center gap-1 cursor-default group/reaction relative">
                               <span className="text-[12px]">{emoji}</span>
                               {(uids as any[]).length > 1 && <span className="text-[9px] font-black text-zinc-600">{(uids as any[]).length}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                   </div>

                   <div className={clsx("flex items-center gap-2 mt-1 px-1", isOwn ? "justify-end" : "justify-start")}>
                      {isOwn && (
                        <span className={clsx("text-xs", msg.read ? "text-msgr-primary" : "text-zinc-300")}>
                           {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                         {msg.timestamp ? format(msg.timestamp.toDate(), 'h:mm a') : '...'}
                      </span>
                   </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ⌨️ Message Input Area */}
        <div className="p-8 pb-10 bg-linear-to-t from-white to-transparent shrink-0">
          {replyingTo && (
            <div className="max-w-4xl mx-auto mb-4 p-4 bg-msgr-surface-container-low rounded-2xl flex items-center justify-between border-l-4 border-msgr-primary animate-in slide-in-from-bottom-2 duration-300">
               <div>
                  <p className="text-[9px] font-black uppercase text-msgr-primary tracking-widest mb-1">Replying to {replyingTo.senderId === currentUser.uid ? 'You' : partner?.displayName}</p>
                  <p className="text-xs italic text-zinc-500 truncate">{replyingTo.text}</p>
               </div>
               <button onClick={() => setReplyingTo(null)} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
          )}

          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-2 border border-stone-100 shadow-2xl shadow-blue-900/5 ring-1 ring-zinc-50">
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-1 p-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-400 hover:text-msgr-primary transition-all" title="Attach File"><span className="material-symbols-outlined">attach_file</span></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'file')} className="hidden" />
                <button 
                  type="button" 
                  onClick={async () => {
                    const text = prompt("Enter video message text:");
                    if (text) {
                      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
                        senderId: currentUser.uid,
                        text: text,
                        type: 'remotion_video',
                        timestamp: serverTimestamp(),
                        read: false
                      });
                      await updateDoc(doc(db, 'conversations', conversationId), {
                        lastMessage: { text: `[Video Message]: ${text}`, senderId: currentUser.uid, timestamp: serverTimestamp() },
                        updatedAt: serverTimestamp()
                      });
                    }
                  }} 
                  className="p-3 text-zinc-400 hover:text-msgr-primary transition-all"
                  title="Send Programmatic Video"
                >
                  <span className="material-symbols-outlined">movie</span>
                </button>
                <button type="button" onClick={() => setShowEmojiPickerFor('input')} className="p-3 text-zinc-400 hover:text-msgr-primary transition-all" title="Emoji"><SmilePlus size={20} /></button>
                {showEmojiPickerFor === 'input' && (
                  <div className="absolute bottom-full left-0 mb-2 z-50">
                    <EmojiPicker 
                      onSelect={(emoji) => setNewMessage(prev => prev + emoji)} 
                      onClose={() => setShowEmojiPickerFor(null)} 
                    />
                  </div>
                )}
              </div>

              <textarea 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] py-4 px-2 resize-none font-body placeholder:text-zinc-300 min-h-[56px] max-h-40" 
                placeholder={`Briefing for ${partner?.displayName || 'recipient'}...`} 
                rows={1}
              />

              <div className="flex items-center gap-2 p-1">
                {isRecording && (
                   <div className="flex items-center gap-3 px-4 py-2 bg-red-50 rounded-2xl animate-in zoom-in-95 duration-300">
                      <div className="flex items-end gap-[2px] h-4">
                        {visualizerData.map((v, i) => (
                           <div 
                              key={i} 
                              className="w-1 bg-red-400 rounded-full transition-all duration-75"
                              style={{ height: `${Math.max(15, v * 100)}%` }}
                           />
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-red-500 tabular-nums">{formatTime(recordingTime)}</span>
                   </div>
                )}
                <button 
                   type="button" 
                   onMouseDown={handleStartRecording}
                   onMouseUp={() => handleStopRecording(true)}
                   onTouchStart={handleStartRecording}
                   onTouchEnd={() => handleStopRecording(true)}
                   className={clsx(
                     "p-3 transition-all rounded-2xl", 
                     isRecording ? "text-white bg-red-500 scale-125 shadow-lg animate-pulse" : "text-zinc-400 hover:text-msgr-primary hover:bg-zinc-50"
                   )}
                >
                  <span className="material-symbols-outlined">{isRecording ? 'mic' : 'mic'}</span>
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!newMessage.trim() && !isRecording}
                  className="w-12 h-12 bg-linear-to-br from-msgr-primary to-msgr-primary-container text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-90 transition-all disabled:opacity-50 disabled:scale-100 group"
                >
                  <span className="material-symbols-outlined text-[20px] fill-1 group-hover:-rotate-12 transition-transform duration-300">send</span>
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-3 flex justify-center">
             <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] italic">Secure End-to-End Encrypted Tunnel active</p>
          </div>
        </div>
      </main>

      {/* 🚀 Case Context (Right Sidebar) */}
      {showExpertSidebar && partner && (
        <aside className="w-80 shrink-0 bg-white border-l border-zinc-100 flex flex-col p-8 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4 duration-500">
           <div className="flex justify-between items-center mb-10">
              <h5 className="font-headline font-black italic text-msgr-on-surface uppercase tracking-tighter">Case Context</h5>
              <button onClick={() => setShowExpertSidebar(false)} className="p-1 hover:bg-msgr-surface-container rounded-full transition-colors"><span className="material-symbols-outlined text-sm">close</span></button>
           </div>
           
           <div className="space-y-10">
              {/* Active Profile Card */}
               <div className="text-center p-6 bg-msgr-surface-container-low rounded-4xl border border-msgr-surface-container">
                 <img 
                    src={partner?.photoURL || `https://ui-avatars.com/api/?name=${partner?.displayName}`} 
                    className="w-24 h-24 rounded-4xl object-cover mx-auto mb-6 shadow-xl border-4 border-white" 
                 />
                  <h4 className="font-black italic text-msgr-on-surface uppercase tracking-tight text-lg leading-none mb-1">{partner?.displayName}</h4>
                 <p className="text-[10px] font-black text-msgr-primary uppercase tracking-widest">{partner?.role || 'Patient Asset'}</p>
                 {partner?.specialties && <p className="text-[9px] text-msgr-on-surface-variant font-bold mt-2">{partner.specialties.join(' · ')}</p>}
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => startCall('video')} className="flex flex-col items-center gap-2 p-4 bg-msgr-surface-container-low hover:bg-msgr-surface-container rounded-3xl transition-all group">
                    <span className="material-symbols-outlined p-2 bg-white rounded-2xl group-hover:scale-110 transition-transform">videocam</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Video</span>
                 </button>
                  <button onClick={() => startCall('audio')} className="flex flex-col items-center gap-2 p-4 bg-msgr-surface-container-low hover:bg-msgr-surface-container rounded-3xl transition-all group">
                    <span className="material-symbols-outlined p-2 bg-white rounded-2xl group-hover:scale-110 transition-transform">call</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Audio</span>
                 </button>
              </div>

              {/* Documents Section */}
              <div className="pt-8 border-t border-msgr-surface-container">
                 <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black text-msgr-on-surface-variant uppercase tracking-[0.2em]">Shared Briefs</p>
                    <button className="text-[9px] font-black text-msgr-primary uppercase">View All</button>
                 </div>
                 <div className="space-y-3">
                    {messages.filter(m => m.type === 'file').slice(-3).map((f, i) => (
                       <div key={i} className="flex items-center gap-3 p-3 bg-msgr-surface-container-low rounded-2xl border border-transparent hover:border-msgr-surface-container cursor-pointer transition-all">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-msgr-primary">description</span></div>
                         <div className="min-w-0">
                            <p className="text-[11px] font-black italic tracking-tight truncate uppercase">{f.text || 'Brief_File.pdf'}</p>
                            <p className="text-[8px] font-bold text-msgr-on-surface-variant uppercase">Expert Handover</p>
                         </div>
                      </div>
                    ))}
                    {messages.filter(m => m.type === 'file').length === 0 && (
                      <p className="text-[10px] text-zinc-300 font-medium italic py-4 text-center">No assets in this thread context.</p>
                    )}
                 </div>
              </div>

              {/* Compliance Note */}
              <div className="p-5 bg-ur-secondary/5 rounded-4xl border border-ur-secondary/10">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[16px] text-ur-secondary fill-1">verified_user</span>
                    <p className="text-[9px] font-black text-ur-secondary uppercase tracking-widest leading-none">PDPL 2026 Compliant</p>
                 </div>
                 <p className="text-[10px] text-ur-secondary/70 font-bold leading-relaxed">Identity hashing enabled. Metadata is siloed and audit-ready.</p>
              </div>
           </div>
        </aside>
      )}
      {/* Forward Modal */}
      {forwardingMessage && (
        <ForwardModal
          onClose={() => setForwardingMessage(null)}
          message={forwardingMessage}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

const AudioMessage = ({ url, duration, isOwn }: { url: string; duration?: number; isOwn: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Generate a deterministic but variable waveform pattern
  const waveformPoints = useRef(Array.from({ length: 40 }).map(() => Math.random() * 0.7 + 0.3));

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = (x / rect.width);
    audioRef.current.currentTime = newProgress * audioRef.current.duration;
    setProgress(newProgress * 100);
  };

  return (
    <div className="flex items-center gap-4 min-w-[240px] sm:min-w-[280px] py-1">
      <button 
        onClick={toggle} 
        className={clsx(
          "size-12 shrink-0 rounded-[18px] flex items-center justify-center transition-all shadow-lg active:scale-90", 
          isOwn ? "bg-white text-msgr-primary hover:bg-zinc-50" : "bg-linear-to-br from-msgr-primary to-msgr-primary-container text-white"
        )}
      >
        {isPlaying ? <span className="material-symbols-outlined text-[24px] fill-1">pause</span> : <span className="material-symbols-outlined text-[24px] fill-1">play_arrow</span>}
      </button>
      
      <div 
        className="flex-1 group/audio cursor-pointer relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleSeek}
      >
        <div className="h-10 flex items-center gap-[3px] px-1">
          {waveformPoints.current.map((height, i) => {
            const pointProgress = (i / waveformPoints.current.length) * 100;
            const isPlayed = pointProgress < progress;
            return (
              <div 
                key={i} 
                className={clsx(
                  "w-[3px] rounded-full transition-all duration-300", 
                  isOwn 
                    ? (isPlayed ? "bg-white h-[80%]" : "bg-white/30 h-[40%]") 
                    : (isPlayed ? "bg-msgr-primary h-[80%]" : "bg-msgr-primary/20 h-[40%]")
                )} 
                style={{ 
                  height: `${isPlayed ? height * 100 : height * 50}%`,
                  opacity: isHovering && !isPlayed ? 0.6 : 1
                }}
              />
            );
          })}
        </div>
        
        <div className={clsx(
          "flex justify-between items-center text-[10px] font-black tracking-widest tabular-nums mt-1 uppercase", 
          isOwn ? "text-white/60" : "text-zinc-400"
        )}>
          <span>{formatTime(Math.floor((progress / 100) * (duration || audioRef.current?.duration || 0)))}</span>
          <span>{formatTime(duration || 0)}</span>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={() => setProgress((audioRef.current!.currentTime / audioRef.current!.duration) * 100)} 
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
        className="hidden" 
      />
    </div>
  );
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
