import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { encryptMessage, decryptMessage } from '../security/cryptoHelper';

/**
 * Send encrypted message to Firestore
 */
export const sendEncryptedMessage = async (conversationId: string, messageData: any) => {
  console.log(`[ChatService] Attempting to send message to: conversations/${conversationId}/messages`);
  
  if (!db) {
    const errorMsg = "Firestore database (db) is not initialized. Check firebase.ts";
    console.error(`[ChatService] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    // 1. Encrypt message text
    const encryptedContent = encryptMessage(messageData.text);

    // 2. Prepare final message object
    const finalMessage = {
      ...messageData,
      text: encryptedContent, 
      createdAt: serverTimestamp(),
    };

    // 3. Save to Firestore
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const docRef = await addDoc(messagesRef, finalMessage);
    console.log(`[ChatService] Message sent successfully! Doc ID: ${docRef.id}`);
  } catch (error: any) {
    console.error("[ChatService] CRITICAL ERROR sending message:", {
      code: error.code,
      message: error.message,
      conversationId
    });
    throw error;
  }
};

/**
 * Retrieve messages and decrypt them in real-time
 */
export const subscribeToMessages = (conversationId: string, callback: (messages: any[]) => void) => {
  console.log(`[ChatService] Subscribing to: conversations/${conversationId}/messages`);

  if (!db) {
    console.error("[ChatService] Cannot subscribe: db is not initialized.");
    throw new Error("Firestore not initialized.");
  }

  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'));

  // Listen to real-time changes
  return onSnapshot(q, {
    next: (snapshot) => {
      console.log(`[ChatService] Received snapshot update. Count: ${snapshot.docs.length}`);
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          _id: doc.id,
          ...data,
          // Decrypt text, fallback to plaintext if decryption fails
          text: decryptMessage(data.text) || data.text, 
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      callback(messages);
    },
    error: (error) => {
      console.error("[ChatService] Subscription listener failed:", error);
    }
  });
};
