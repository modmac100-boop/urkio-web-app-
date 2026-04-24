import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CallInterface } from '../components/messaging/CallInterface';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CallData {
  id: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto?: string;
  status: 'calling' | 'accepted' | 'declined' | 'ended' | 'missed';
  type: 'audio' | 'video';
  roomId: string;
  createdAt: any;
}

interface CallContextType {
  activeIncomingCall: CallData | null;
  activeOutgoingCall: CallData | null;
  initiateCall: (receiver: any, type: 'audio' | 'video', roomId: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [activeIncomingCall, setActiveIncomingCall] = useState<CallData | null>(null);
  const [activeOutgoingCall, setActiveOutgoingCall] = useState<CallData | null>(null);
  const navigate = useNavigate();
  const ringingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Ringing Sound
  useEffect(() => {
    ringingAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3'); // Professional subtle ring
    ringingAudioRef.current.loop = true;
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // ── Listen for Incoming Calls ──
    const qIncoming = query(
      collection(db, 'calls'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'calling')
    );

    const unsubIncoming = onSnapshot(qIncoming, (snapshot) => {
      if (!snapshot.empty) {
        const callData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CallData;
        setActiveIncomingCall(callData);
        ringingAudioRef.current?.play().catch(() => {});
      } else {
        setActiveIncomingCall(null);
        ringingAudioRef.current?.pause();
        if (ringingAudioRef.current) ringingAudioRef.current.currentTime = 0;
      }
    });

    // ── Listen for Outgoing Call Status Changes ──
    // If I am caller, I want to know if they accepted/declined
    const qOutgoing = query(
      collection(db, 'calls'),
      where('callerId', '==', user.uid),
      where('status', 'in', ['accepted', 'declined', 'ended'])
    );

    const unsubOutgoing = onSnapshot(qOutgoing, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = { id: change.doc.id, ...change.doc.data() } as CallData;
        if (change.type === 'modified') {
          if (data.status === 'accepted') {
            toast.success('Call accepted');
            navigate(`/room/${data.roomId}?type=${data.type}`);
            setActiveOutgoingCall(null);
          } else if (data.status === 'declined') {
            toast.error('Call declined');
            setActiveOutgoingCall(null);
          } else if (data.status === 'ended') {
            setActiveOutgoingCall(null);
          }
        }
      });
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
      ringingAudioRef.current?.pause();
    };
  }, [navigate]);

  const initiateCall = async (receiver: any, type: 'audio' | 'video', roomId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const callId = `${user.uid}_${Date.now()}`;
    const callData: Partial<CallData> = {
      callerId: user.uid,
      callerName: user.displayName || 'Urkio User',
      callerPhoto: user.photoURL || '',
      receiverId: receiver.uid,
      receiverName: receiver.displayName,
      receiverPhoto: receiver.photoURL || '',
      status: 'calling',
      type,
      roomId,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'calls', callId), callData);
    setActiveOutgoingCall({ id: callId, ...callData } as CallData);
  };

  const acceptCall = async () => {
    if (!activeIncomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', activeIncomingCall.id), {
        status: 'accepted'
      });
      navigate(`/room/${activeIncomingCall.roomId}?type=${activeIncomingCall.type}`);
      setActiveIncomingCall(null);
      ringingAudioRef.current?.pause();
    } catch (err) {
      console.error("Accept call error:", err);
    }
  };

  const declineCall = async () => {
    if (!activeIncomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', activeIncomingCall.id), {
        status: 'declined'
      });
      setActiveIncomingCall(null);
      ringingAudioRef.current?.pause();
    } catch (err) {
      console.error("Decline call error:", err);
    }
  };

  const endCall = async () => {
    const call = activeIncomingCall || activeOutgoingCall;
    setActiveIncomingCall(null);
    setActiveOutgoingCall(null);
    ringingAudioRef.current?.pause();
    if (ringingAudioRef.current) ringingAudioRef.current.currentTime = 0;

    if (call) {
      try {
        await updateDoc(doc(db, 'calls', call.id), { 
          status: 'ended',
          endedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("End call error:", err);
      }
    }
  };

  return (
    <CallContext.Provider value={{
      activeIncomingCall,
      activeOutgoingCall,
      initiateCall,
      acceptCall,
      declineCall,
      endCall
    }}>
      {children}
      {/* Overlay for Incoming Call */}
      {activeIncomingCall && (
        <CallInterface 
          status="ringing"
          type={activeIncomingCall.type}
          partner={{
            uid: activeIncomingCall.callerId,
            displayName: activeIncomingCall.callerName,
            photoURL: activeIncomingCall.callerPhoto
          }}
          onAccept={acceptCall}
          onDecline={declineCall}
          onEnd={endCall}
        />
      )}
      {/* Overlay for Outgoing Call */}
      {activeOutgoingCall && (
        <CallInterface 
          status="calling"
          type={activeOutgoingCall.type}
          partner={{
            uid: activeOutgoingCall.receiverId,
            displayName: activeOutgoingCall.receiverName,
            photoURL: activeOutgoingCall.receiverPhoto
          }}
          onAccept={() => {}}
          onDecline={() => {}}
          onEnd={endCall}
        />
      )}
    </CallContext.Provider>
  );
}

export function useCalls() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCalls must be used within a CallProvider');
  }
  return context;
}
