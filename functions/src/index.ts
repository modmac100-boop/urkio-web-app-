import * as logger from "firebase-functions/logger";
// Removed unused V2 import
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();
const db = admin.firestore();

import * as functionsV1 from "firebase-functions/v1";

// 1. API Route for the AI Agent (Streaming Chat)
export const chat = functionsV1.runWith({ secrets: ["GOOGLE_GENERATIVE_AI_API_KEY"], memory: "512MB", timeoutSeconds: 75 }).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { messages, userId } = req.body;
    logger.info("Chat request received", { userId, messageCount: messages?.length });

    if (!userId) {
      logger.error("userId is missing in request body");
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      logger.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
      res.status(500).json({ error: 'API key not configured' });
      return;
    }

    // Fetch long-term memory
    const historyDoc = await db.collection('chat_history').doc(userId).get();
    const savedHistory: { role: string; parts: { text: string }[] }[] = historyDoc.exists
      ? (historyDoc.data()?.messages || [])
      : [];

    // Build conversation from incoming messages
    const incomingHistory = (messages as { role: string; content: string }[]).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Merge saved history with new incoming, deduplicate
    const allHistory = [...savedHistory, ...incomingHistory];
    const lastUserMsg = allHistory[allHistory.length - 1]?.parts?.[0]?.text || '';

    const systemInstruction = `You are the Urkio Guide, a professional, empathetic, and highly flexible AI assistant for the Urkio platform.
You deeply search and analyze information to provide accurate, comprehensive, and professional answers.
You are adaptable to the user's unique needs and conversational style.
Monitor user progress and be proactive: if a user is stressed, offer help; if they succeed, celebrate with them.
Use a humble, social-worker-like tone.
If a question is too complex emotionally or clinically, say: "This is deep—I'm looping in one of our specialists to look at this with you."
Always use Google Search to find the most up-to-date, accurate information when answering user questions.`;

    const genAI = new GoogleGenAI({ apiKey });

    // Google Search grounding tool
    const googleSearchTool = { googleSearch: {} };

    // Chat history (all except the last/current user message)
    const chatHistory = allHistory.slice(0, -1);

    const responseStream = await genAI.models.generateContentStream({
      model: 'gemini-1.5-flash',
      contents: [...chatHistory, { role: 'user', parts: [{ text: lastUserMsg }] }],
      config: {
        systemInstruction,
        tools: [googleSearchTool as any],
        temperature: 0.8,
        maxOutputTokens: 2048,
      }
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let fullText = '';
    for await (const chunk of responseStream) {
      const chunkText = chunk.text ?? '';
      fullText += chunkText;
      res.write(chunkText);
    }
    res.end();

    // Save updated history to Firestore (keep last 50 turns)
    const updatedHistory = [
      ...allHistory,
      { role: 'model', parts: [{ text: fullText }] }
    ].slice(-50);

    await db.collection('chat_history').doc(userId).set({
      messages: updatedHistory,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return;
  } catch (error: any) {
    logger.error("Error in chat route:", {
      message: error.message,
      stack: error.stack,
      userId: req.body.userId
    });
    res.status(500).json({ 
      error: "Failed to process chat request.", 
      details: error.message
    });
  }
});

// 1.1 Voice Note Analysis API (Production)
export const analyzeVoice = functionsV1.runWith({ secrets: ["GOOGLE_GENERATIVE_AI_API_KEY"], memory: "512MB", timeoutSeconds: 75 }).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { audioData, mimeType, userDisplayName } = req.body;
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey || !audioData) {
      res.status(400).json({ error: 'Missing API key or audio data' });
      return;
    }

    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `Analyze this voice note from ${userDisplayName || 'Urkio User'}. 
    Provide:
    1. TRANSCRIPTION SUMMARY: A concise summary of shared thoughts.
    2. EMOTIONAL ESTIMATION: Professional observation of the tone and state.
    3. HEALING TESTIMONIAL: Supportive validation and reflection.
    Tone: Empirical, professional, empathetic. Output in clear sections.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              data: audioData,
              mimeType: mimeType || 'audio/webm'
            }
          },
          { text: prompt }
        ]
      }]
    });

    res.json({ analysis: result.text ?? '' });
  } catch (error: any) {
    logger.error("Error in analyzeVoice:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Proactive Sensor (Trigger)
export const onNoteCreated = onDocumentCreated({ document: "homii_entries/{entryId}", memory: "512MiB", timeoutSeconds: 75, concurrency: 100, maxInstances: 25 }, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }
  
  const data = snapshot.data();
  const content = data.text;
  const userId = data.uid;

  if (!userId || !content) {
    return;
  }

  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return;

    const genAI = new GoogleGenAI({ apiKey });
    const result = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Analyze the following journal note from a user. If the user seems highly stressed or has achieved a significant milestone, generate a short, tailored push notification message asking a reflection question. If neither applies, return an empty string.\n\nNote: "${content}"` }] }]
    });

    const notificationMessage = result.text?.trim();

    if (notificationMessage) {
      await db.collection('notifications').add({
        userId,
        title: "Urkio Guide Reflection",
        body: notificationMessage,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      logger.info(`Proactive notification sent to user ${userId}: ${notificationMessage}`);
    }
  } catch(error) {
     logger.error("Error processing proactive sensor", error);
  }
});

// 3. Follow Notification
export const onFollowCreated = onDocumentCreated({ document: "follows/{followId}", memory: "512MiB", timeoutSeconds: 75, concurrency: 100, maxInstances: 25 }, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  
  const data = snapshot.data();
  const followerId = data.followerId;
  const followingId = data.followingId;

  if (!followerId || !followingId) return;

  try {
    const followerDoc = await db.collection('users').doc(followerId).get();
    const followerName = followerDoc.data()?.displayName || 'Someone';

    await db.collection('notifications').add({
      userId: followingId,
      type: 'follow',
      title: 'New Follower',
      body: `${followerName} started following you!`,
      read: false,
      data: { followerId },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.info(`Follow notification sent to user ${followingId}`);
  } catch (error) {
    logger.error("Error in follow notification:", error);
  }
});

// 4. Message Notification
export const onMessageCreated = onDocumentCreated({ document: "conversations/{conversationId}/messages/{messageId}", memory: "512MiB", timeoutSeconds: 75, concurrency: 100, maxInstances: 25 }, async (event) => {
  const { conversationId } = event.params;
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const senderId = data.senderId;
  const text = data.text || 'sent you a file';

  try {
    const convDoc = await db.collection('conversations').doc(conversationId).get();
    const convData = convDoc.data();
    if (!convData) return;

    const participants = convData.participants as string[];
    const recipientId = participants.find(id => id !== senderId);

    if (!recipientId) return;

    const senderDoc = await db.collection('users').doc(senderId).get();
    const senderName = senderDoc.data()?.displayName || 'Someone';

    await db.collection('notifications').add({
      userId: recipientId,
      type: 'message',
      title: `New message from ${senderName}`,
      body: text.length > 100 ? text.substring(0, 97) + '...' : text,
      read: false,
      data: { conversationId, senderId },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`Message notification sent to user ${recipientId}`);
  } catch (error) {
    logger.error("Error in message notification:", error);
  }
});

// 5. Daily Event Reminders (Scheduled)
import {onSchedule} from "firebase-functions/v2/scheduler";

export const eventReminderTask = onSchedule({ schedule: "every day 09:00", memory: "512MiB", timeoutSeconds: 75, maxInstances: 25 }, async (_event) => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  try {
    const snapshot = await db.collection('events')
      .where('date', '>=', now.toISOString())
      .where('date', '<=', tomorrow.toISOString())
      .get();

    for (const doc of snapshot.docs) {
      const eventData = doc.data();
      const attendees = eventData.attendees || [];
      const title = eventData.title;

      for (const userId of attendees) {
        await db.collection('notifications').add({
          userId,
          type: 'event_reminder',
          title: 'Upcoming Event Reminder',
          body: `Don't forget: "${title}" is happening soon!`,
          read: false,
          data: { eventId: doc.id },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    logger.info(`Scheduled event reminders sent for ${snapshot.size} events`);
  } catch (error) {
    logger.error("Error in event reminder task:", error);
  }
});

// 6. Generate Stream Video Token
export const getStreamToken = functionsV1
  .runWith({ secrets: ['STREAM_API_SECRET'], memory: "512MB", timeoutSeconds: 75 })
  .https.onCall(async (data, context) => {
  const apiKey = 'zzyb8w6me2rg';
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!context.auth) {
    throw new functionsV1.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  if (!apiSecret) {
    logger.error("STREAM_API_SECRET is not configured in Secret Manager.");
    throw new functionsV1.https.HttpsError('internal', 'Stream API secret not configured.');
  }

  try {
    const { StreamClient } = await import('@stream-io/node-sdk');
    const client = new StreamClient(apiKey, apiSecret);
    const token = client.generateUserToken({ user_id: context.auth.uid });
    return { token };
  } catch (err) {
    logger.error("Error creating Stream token", err);
    throw new functionsV1.https.HttpsError('internal', 'Failed to generate token');
  }
});

// 7. Push Notification Dispatcher (FCM)
export const onNotificationCreatedPushDispatcher = onDocumentCreated({ document: "notifications/{notificationId}", memory: "512MiB", timeoutSeconds: 75, concurrency: 100, maxInstances: 25 }, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const userId = data.userId;
  const title = data.title;
  const body = data.body;

  if (!userId || (!title && !body)) return;

  try {
    // 1. Get user profile for FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.fcmToken) {
       // User has not enabled push notifications
       return;
    }

    const fcmToken = userData.fcmToken;

    // 2. Build Web Push payload
    const message = {
      notification: {
        title: title || 'Urkio Activity',
        body: body || 'You have a new update.',
      },
      webpush: {
        fcmOptions: {
          link: 'https://urkio.com/notifications' // Standard click action
        }
      },
      token: fcmToken
    };

    // 3. Send via Firebase Admin
    const response = await admin.messaging().send(message);
    logger.info(`Successfully sent FCM push notification for user ${userId}`, { response });
  } catch (err: any) {
    logger.error("Error sending FCM notification payload:", err);
    // If token error (e.g. unregistrered), we could optionally remove it from user doc
    if (err.code === 'messaging/invalid-registration-token' || err.code === 'messaging/registration-token-not-registered') {
       logger.info(`Removing invalid FCM token for user ${userId}`);
       await db.collection('users').doc(userId).update({ fcmToken: admin.firestore.FieldValue.delete() });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. URKIO AI VOICE AGENT — Firebase-Integrated Backend
// ═══════════════════════════════════════════════════════════════════════════

import {onRequest} from "firebase-functions/v2/https";

/**
 * handleVoiceBooking
 * ------------------
 * HTTP webhook called by the Voice Agent (Vapi / Retell / Bland AI).
 * It processes intents: "book_appointment", "emergency", "escalate",
 * "check_availability", and "lookup_user".
 *
 * The voice builder sends a JSON body like:
 * {
 *   "intent": "book_appointment",
 *   "phone": "+1555...",          // or "uid"
 *   "category": "psychologist",   // specialist category
 *   "preferred_time": "2026-04-15T14:00:00Z",
 *   "user_name": "Samer",
 *   "notes": "Child difficulty topic"
 * }
 */
export const handleVoiceBooking = onRequest(
  { cors: true, secrets: ["GOOGLE_GENERATIVE_AI_API_KEY"], memory: "512MiB", timeoutSeconds: 75, concurrency: 100, maxInstances: 25 },
  async (req, res) => {
    // CORS pre-flight
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const {
      intent,
      phone,
      uid,
      category,
      preferred_time,
      user_name,
      notes,
    } = req.body;

    logger.info("Voice Agent webhook received", { intent, phone, uid, category });

    try {
      // ─── Intent Router ──────────────────────────────────────────────
      switch (intent) {
        // ────────────────────────────────────────────────────────────────
        // INTENT: lookup_user
        // Step 1 of the procedural logic — identity verification
        // ────────────────────────────────────────────────────────────────
        case "lookup_user": {
          let userDoc: FirebaseFirestore.DocumentSnapshot | null = null;

          if (uid) {
            userDoc = await db.collection("users").doc(uid).get();
          } else if (phone) {
            const snap = await db
              .collection("users")
              .where("phone", "==", phone)
              .limit(1)
              .get();
            if (!snap.empty) userDoc = snap.docs[0];
          } else if (user_name) {
            const snap = await db
              .collection("users")
              .where("displayName", "==", user_name)
              .limit(1)
              .get();
            if (!snap.empty) userDoc = snap.docs[0];
          }

          if (!userDoc || !userDoc.exists) {
            res.status(200).json({
              found: false,
              message: "No matching user found. Would you like to create a new profile?",
            });
            return;
          }

          const ud = userDoc.data()!;
          res.status(200).json({
            found: true,
            uid: userDoc.id,
            displayName: ud.displayName || ud.fullName,
            email: ud.email,
            role: ud.role,
            message: `Welcome back, ${ud.displayName || ud.fullName}! How can I help you today?`,
          });
          return;
        }

        // ────────────────────────────────────────────────────────────────
        // INTENT: check_availability
        // Step 3a — query specialist availability
        // ────────────────────────────────────────────────────────────────
        case "check_availability": {
          if (!category) {
            res.status(400).json({ error: "category is required" });
            return;
          }

          // Query specialists in the requested category who are online
          const specialistsSnap = await db
            .collection("users")
            .where("role", "==", "specialist")
            .where("isOnline", "==", true)
            .get();

          // Filter by specialty/category match (case-insensitive)
          const catLower = category.toLowerCase();
          const matchedSpecialists = specialistsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((s: any) => {
              const spec = (
                s.specialty || s.primaryRole || s.skills || ""
              ).toLowerCase();
              return spec.includes(catLower);
            });

          if (matchedSpecialists.length === 0) {
            res.status(200).json({
              available: false,
              message: `I couldn't find any available ${category} specialists right now. Would you like me to check another category or schedule for a later time?`,
              slots: [],
            });
            return;
          }

          // Generate two proposed time slots (9AM-8PM window)
          const now = new Date();
          const slot1 = new Date(now);
          slot1.setHours(
            Math.max(9, Math.min(18, now.getHours() + 1)),
            0,
            0,
            0
          );
          const slot2 = new Date(slot1);
          slot2.setHours(slot1.getHours() + 2);

          // If slot2 exceeds 8PM, push to next day 9AM
          if (slot2.getHours() >= 20) {
            slot2.setDate(slot2.getDate() + 1);
            slot2.setHours(9, 0, 0, 0);
          }

          // Check for conflicts in existing appointments
          const existingAppts = await db
            .collection("appointments")
            .where("category", "==", category)
            .where("status", "in", ["pending", "confirmed"])
            .get();

          const bookedTimes = existingAppts.docs.map(
            (d) => d.data().timestamp
          );

          const slots = [slot1.toISOString(), slot2.toISOString()].filter(
            (s) => !bookedTimes.includes(s)
          );

          const specialist = matchedSpecialists[0] as any;
          res.status(200).json({
            available: true,
            specialist: {
              uid: specialist.id,
              name: specialist.displayName || specialist.fullName,
              specialty: specialist.specialty || specialist.primaryRole,
            },
            slots,
            message: `I found ${matchedSpecialists.length} ${category} specialist(s) available. I can offer you: Slot 1 — ${slot1.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}, or Slot 2 — ${slot2.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}. Which works best for you?`,
          });
          return;
        }

        // ────────────────────────────────────────────────────────────────
        // INTENT: book_appointment
        // Step 3b — write the appointment to Firestore
        // ────────────────────────────────────────────────────────────────
        case "book_appointment": {
          if (!uid && !phone && !user_name) {
            res
              .status(400)
              .json({ error: "uid, phone, or user_name is required" });
            return;
          }
          if (!preferred_time) {
            res.status(400).json({ error: "preferred_time is required" });
            return;
          }

          // Resolve user UID
          let resolvedUid = uid;
          if (!resolvedUid && phone) {
            const snap = await db
              .collection("users")
              .where("phone", "==", phone)
              .limit(1)
              .get();
            if (!snap.empty) resolvedUid = snap.docs[0].id;
          }
          if (!resolvedUid && user_name) {
            const snap = await db
              .collection("users")
              .where("displayName", "==", user_name)
              .limit(1)
              .get();
            if (!snap.empty) resolvedUid = snap.docs[0].id;
          }

          if (!resolvedUid) {
            res.status(200).json({
              booked: false,
              message:
                "I couldn't verify your identity. Could you provide your registered phone number?",
            });
            return;
          }

          // Check for time conflicts
          const conflictSnap = await db
            .collection("appointments")
            .where("timestamp", "==", preferred_time)
            .where("category", "==", category || "general")
            .where("status", "in", ["pending", "confirmed"])
            .get();

          if (!conflictSnap.empty) {
            res.status(200).json({
              booked: false,
              conflict: true,
              message:
                "That time slot is already taken. Let me find you another available time.",
            });
            return;
          }

          // Write the appointment
          const appointmentRef = await db.collection("appointments").add({
            uid: resolvedUid,
            category: category || "general",
            timestamp: preferred_time,
            status: "pending",
            notes: notes || "",
            source: "voice_agent",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Send FCM notification
          await db.collection("notifications").add({
            userId: resolvedUid,
            type: "event_reminder",
            title: "Appointment Confirmed",
            body: `Your ${category || "specialist"} session has been reserved for ${new Date(preferred_time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}. See you then!`,
            read: false,
            data: { appointmentId: appointmentRef.id },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          res.status(200).json({
            booked: true,
            appointmentId: appointmentRef.id,
            message: `I've reserved that spot for you. You'll see the update in your Urkio app dashboard and receive a notification instantly. Your appointment ID is ${appointmentRef.id}.`,
          });
          return;
        }

        // ────────────────────────────────────────────────────────────────
        // INTENT: emergency
        // Emergency Protocol — immediate human oversight flag
        // ────────────────────────────────────────────────────────────────
        case "emergency": {
          const emergencyRef = await db.collection("tickets").add({
            type: "emergency",
            priority: "critical",
            uid: uid || null,
            phone: phone || null,
            user_name: user_name || null,
            notes: notes || "Emergency detected by Voice Agent",
            source: "voice_agent",
            status: "open",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Notify all admins
          const adminsSnap = await db
            .collection("users")
            .where("role", "==", "admin")
            .get();
          const batch = db.batch();
          adminsSnap.docs.forEach((adminDoc) => {
            const notifRef = db.collection("notifications").doc();
            batch.set(notifRef, {
              userId: adminDoc.id,
              type: "task",
              title: "🚨 EMERGENCY — Voice Agent Alert",
              body: `A user has triggered an emergency flag during a voice session. Ticket: ${emergencyRef.id}`,
              read: false,
              data: { ticketId: emergencyRef.id },
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();

          res.status(200).json({
            flagged: true,
            ticketId: emergencyRef.id,
            message:
              "I am an AI and cannot provide emergency services. Please contact your local emergency number immediately or visit the nearest crisis center. Your safety is paramount. I have flagged this for our human team to follow up with you.",
          });
          return;
        }

        // ────────────────────────────────────────────────────────────────
        // INTENT: escalate
        // Step 5 — call request for human social worker follow-up
        // ────────────────────────────────────────────────────────────────
        case "escalate": {
          const ticketRef = await db.collection("tickets").add({
            type: "call_request",
            priority: "high",
            uid: uid || null,
            phone: phone || null,
            user_name: user_name || null,
            category: category || "general",
            notes: notes || "User requested human specialist follow-up via Voice Agent",
            source: "voice_agent",
            status: "open",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Notify case managers and admins
          const staffSnap = await db
            .collection("users")
            .where("role", "in", ["admin", "case_manager"])
            .get();
          const escalateBatch = db.batch();
          staffSnap.docs.forEach((staffDoc) => {
            const notifRef = db.collection("notifications").doc();
            escalateBatch.set(notifRef, {
              userId: staffDoc.id,
              type: "task",
              title: "📞 Voice Agent Escalation",
              body: `A user has requested human follow-up for ${category || "general"} support. Ticket: ${ticketRef.id}`,
              read: false,
              data: { ticketId: ticketRef.id },
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await escalateBatch.commit();

          res.status(200).json({
            escalated: true,
            ticketId: ticketRef.id,
            message:
              "I've created a support ticket and notified our care team. A social worker will reach out to you shortly. Is there anything else I can help you with in the meantime?",
          });
          return;
        }

        // ────────────────────────────────────────────────────────────────
        // DEFAULT — unknown intent
        // ────────────────────────────────────────────────────────────────
        default:
          res.status(400).json({
            error: `Unknown intent: ${intent}`,
            supported_intents: [
              "lookup_user",
              "check_availability",
              "book_appointment",
              "emergency",
              "escalate",
            ],
          });
          return;
      }
    } catch (error: any) {
      logger.error("Voice Agent webhook error:", error);
      res.status(500).json({
        error: "Internal server error",
        message:
          "I encountered a technical issue. Please try again or contact support directly.",
        details: error.message,
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// 9. VOICE AGENT BEHAVIOR CONFIG — Seed / Update
// ═══════════════════════════════════════════════════════════════════════════

/**
 * seedAgentBehaviorConfig
 * -----------------------
 * One-time callable function to seed the `agent_behavior_config` collection
 * in Firestore with the voice agent's passive listening thresholds,
 * acknowledgment phrases, and turn-taking configuration.
 * Can be re-called to update settings without redeploying.
 */
export const seedAgentBehaviorConfig = functionsV1.runWith({ memory: "512MB", timeoutSeconds: 75 }).https.onCall(
  async (_data, context) => {
    // Only admins can seed/update this config
    if (!context.auth) {
      throw new functionsV1.https.HttpsError(
        "unauthenticated",
        "Must be authenticated."
      );
    }
    const callerDoc = await db
      .collection("users")
      .doc(context.auth.uid)
      .get();
    const callerRole = callerDoc.data()?.role;
    if (callerRole !== "admin") {
      throw new functionsV1.https.HttpsError(
        "permission-denied",
        "Only admins can configure agent behavior."
      );
    }

    const config = {
      // ── Turn-Taking ──
      end_of_turn_timeout_ms: 1500,
      interruption_threshold: 0.8, // Low sensitivity (0 = never interrupt, 1 = aggressive)
      interruption_behavior: "ignore", // During soft acknowledgments

      // ── Passive Listening ──
      soft_acknowledge_delay_ms: 2500,
      soft_acknowledge_phrases: [
        "Mm-hmm",
        "I hear you",
        "Go on",
        "I'm with you",
        "I'm listening",
        "Take your time",
      ],
      soft_acknowledge_volume_reduction: 0.2, // 20% lower than normal

      // ── Deep Pause Handling ──
      deep_pause_threshold_ms: 5000,
      deep_pause_phrases: [
        "Is there more you'd like to share about that?",
        "I'm right here with you.",
        "Take all the time you need.",
      ],

      // ── Emotional State Detection ──
      emotional_pause_multiplier: 1.5, // Increase wait time by 50% when user sounds emotional
      double_talk_apology:
        "Sorry, please continue, I didn't mean to cut you off.",

      // ── Wait Policy ──
      wait_policy:
        "If the user stops talking, do not interrupt. Wait for a clear pause. " +
        "If the user sounds emotional or is describing a difficult situation " +
        "with a child, increase your waiting time before responding. " +
        "Your priority is to let the user finish their thought completely.",

      // ── Listening Protocol ──
      listening_protocol:
        "You are a 'Deep Listener.' If the user pauses, do not interpret it " +
        "as a signal to speak immediately. Use brief, warm verbal " +
        "acknowledgments (Continuers) to show presence. If the user is crying " +
        "or silent for a long period, remain silent with them for up to 4 " +
        "seconds before offering a gentle 'I'm right here with you' or " +
        "'Take all the time you need.'",

      // ── Operating Hours ──
      operating_hours: { start: "09:00", end: "20:00", timezone: "UTC" },

      // ── Specializations ──
      specializations: [
        "Psychologist (Adult)",
        "Psychologist (Child)",
        "Dietitian",
        "Social Worker",
        "Life Coach",
      ],

      // ── Emergency Protocol ──
      emergency_response:
        "I am an AI and cannot provide emergency services. Please contact " +
        "your local emergency number immediately or visit the nearest " +
        "crisis center. Your safety is paramount.",

      // ── Meta ──
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid,
      version: "1.0.0",
    };

    await db
      .collection("agent_behavior_config")
      .doc("voice_agent_v1")
      .set(config, { merge: true });

    logger.info("Agent behavior config seeded/updated", {
      by: context.auth.uid,
    });
    return {
      success: true,
      message: "Agent behavior configuration saved to Firestore.",
    };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// 10. CLINICAL AI CO-PILOT — Orientation Generator
// ═══════════════════════════════════════════════════════════════════════════

/**
 * generateClinicalOrientation
 * ----------------------------
 * Analyzes patient metadata and history to provide a structured
 * starting point for the healing session.
 */
export const generateClinicalOrientation = functionsV1
  .runWith({ secrets: ["GOOGLE_GENERATIVE_AI_API_KEY"], memory: "512MB", timeoutSeconds: 75 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functionsV1.https.HttpsError("unauthenticated", "Auth required.");
    }

    const { history, distressLevel, previousActions, ageGroup } = data;
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      throw new functionsV1.https.HttpsError("internal", "AI Key missing.");
    }

    try {
      const genAI = new GoogleGenAI({ apiKey });
      
      const prompt = `You are a Senior Clinical Analyst at Urkio. Your goal is to transform raw patient metadata into a professional orientation summary for the attending expert.
        
        Patient Data:
        - History: ${history || 'No prior notes.'}
        - Distress Level: ${distressLevel || 'Moderate'}
        - Previous Actions: ${previousActions || 'None'}
        - Age Group: ${ageGroup || 'Adult'}
        
        Analysis Requirements:
        1. Current State: Identify the core psychological or nutritional challenge.
        2. Professional Orientation: Suggest the best therapeutic approach (e.g., CBT, Narrative).
        3. Risk Focus: Highlight sensitive topics based on age.
        
        Output Format:
        "Professional Orientation: [One sentence]. Key Insight: [Actionable advice]. Focus: [Today's target]."`;

      const result = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      return { insight: result.text || 'AI Insight could not be generated at this time.' };
    } catch (error: any) {
      logger.error("AI Insight Error:", error);
      throw new functionsV1.https.HttpsError("internal", error.message);
    }
  });

/**
 * GOOD SAMARITAN AI SAFEGUARD (PDPL 2026)
 * Real-time monitoring for crisis keywords.
 */
export const monitorSessionIntegrity = onDocumentUpdated({ document: "appointments/{appointmentId}", memory: "512MiB", timeoutSeconds: 75, concurrency: 100, maxInstances: 25 }, async (event: any) => {
  const newData = event.data?.after.data();
  const oldData = event.data?.before.data();

  if (!newData || !newData.transcript || newData.transcript === oldData?.transcript) return;

  const crisisKeywords = [
    'harm', 'suicide', 'kill', 'end it', 'انتحار', 'أذية', 'قتل', 'أنهي حياتي', 'emergency', 'طوارئ'
  ];

  const content = newData.transcript.toLowerCase();
  const hasCrisis = crisisKeywords.some(keyword => content.includes(keyword));

  if (hasCrisis) {
    logger.warn(`[SAFEGUARD] Crisis detected in session ${event.params.appointmentId}`);
    
    // 1. Bypass locks: Notify social worker hub
    await db.collection("alerts").add({
      type: "CRISIS_EVENT",
      appointmentId: event.params.appointmentId,
      patientId: newData.userId,
      expertId: newData.expertId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "critical"
    });

    // 2. Push emergency override status to the session
    await event.data?.after.ref.update({
      emergencyMode: true,
      emergencyContacts: {
        egypt: "122 (Ambulance: 123)",
        syria: "110",
        message: "STAY CALM. Clinical support is being dispatched to this perimeter."
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AGORA RTC TOKEN GENERATOR — Virtual Healing Suite
// ═══════════════════════════════════════════════════════════════════════════

export const agoraToken = onRequest(
  { cors: true, secrets: ["AGORA_APP_CERTIFICATE"], memory: "512MiB", timeoutSeconds: 75, concurrency: 100, maxInstances: 25 },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const appId = process.env.AGORA_APP_ID || "a5557dd007124b7aa7dfce0e3d61a7da";
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || "63e7a05a48ac41e5af746e75d0dbdfac";
    const { channelName, uid, role } = req.body;

    if (!channelName) {
      res.status(400).json({ error: "channelName is required" });
      return;
    }

    try {
      const { RtcTokenBuilder, RtcRole } = await import("agora-token");
      const expirationSeconds = 3600;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expirationTimestamp = currentTimestamp + expirationSeconds;

      const rtcRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid || 0,
        rtcRole,
        expirationTimestamp,
        expirationTimestamp
      );

      res.status(200).json({ token, appId, devMode: false });
    } catch (err: any) {
      logger.error("[agoraToken] Token generation failed:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// 10. Generate Clinical Synthesis (AI Orientation)
export const generateClinicalSynthesis = functionsV1.runWith({ secrets: ["GOOGLE_GENERATIVE_AI_API_KEY"], memory: "512MB", timeoutSeconds: 75 }).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functionsV1.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { clientName, category, notes, initialObservation } = data;
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new functionsV1.https.HttpsError('internal', 'AI key not configured.');
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `You are a Senior Clinical AI Advisor for the Urkio platform. 
    Analyze the following data for patient "${clientName}" (Category: ${category}).
    Initial Observation: ${initialObservation || 'None'}
    Session Notes: ${notes || 'None'}

    Provide a concise, professional clinical synthesis (2-3 sentences) that highlights:
    1. The patient's current emotional/cognitive state.
    2. Strategic insights for the next steps.
    Maintain an empirical, professional, and empathetic tone.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 512,
      }
    });

    return { synthesis: result.text ?? '' };
  } catch (error: any) {
    logger.error("Error in generateClinicalSynthesis:", error);
    throw new functionsV1.https.HttpsError('internal', error.message);
  }
});

// 11. Generate Agora Token (onCall)
export const generateAgoraToken = functionsV1
  .runWith({ 
    secrets: ["AGORA_APP_CERTIFICATE"],
    memory: "512MB",
    timeoutSeconds: 75
  })
  .https.onCall(async (data, context) => {
    // Auth Check
    if (!context.auth) {
      throw new functionsV1.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول أولاً.');
    }

    // 1. App ID remains in standard config (it's not a secret)
    const APP_ID = (functionsV1 as any).config?.()?.agora?.app_id || process.env.AGORA_APP_ID || "a5557dd007124b7aa7dfce0e3d61a7da";

    // 2. Access the Secret from process.env
    const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
    
    if (!APP_CERTIFICATE) {
      throw new functionsV1.https.HttpsError('internal', 'خطأ في إعدادات الخادم.');
    }

    const channelName = data.channelName;
    const uid = context.auth.uid;
    const expirationTimeInSeconds = 3600 * 2;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const { RtcTokenBuilder, RtcRole } = await import('agora-token');
    const role = RtcRole.PUBLISHER;

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return { token, uid };
  });

// ═══════════════════════════════════════════════════════════════════════════
// 12. AUTOMATED SECRET ROTATION (Pub/Sub Trigger)
// ═══════════════════════════════════════════════════════════════════════════

import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const secretManagerClient = new SecretManagerServiceClient();

export const rotateAgoraSecret = onMessagePublished({ topic: "secret-rotation-topic", memory: "512MiB", timeoutSeconds: 75, maxInstances: 25 }, async (event) => {
  try {
    // 1. Generate new secret value.
    // NOTE: In a real-world scenario with Agora, you'd call Agora's REST API to rotate the primary/secondary certificate.
    // Here we generate a placeholder secure string as an example of rotation logic.
    const newSecretValue = "generated-agora-secret-" + Date.now(); 

    // Use GCLOUD_PROJECT to dynamically get the project ID for Secret Manager path
    const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG as string).projectId : "gen-lang-client-0305219649";
    const secretName = `projects/${projectId}/secrets/AGORA_APP_CERTIFICATE`;

    // 2. Add the new version to Secret Manager
    const [version] = await secretManagerClient.addSecretVersion({
      parent: secretName,
      payload: { data: Buffer.from(newSecretValue, 'utf8') },
    });
    
    logger.info(`Successfully added new AGORA_APP_CERTIFICATE version: ${version.name}`);

    // 3. Cleanup: Destroy secret versions older than 30 days
    const [versions] = await secretManagerClient.listSecretVersions({
      parent: secretName,
    });

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    for (const v of versions) {
      // Only check ENABLED versions to avoid destroying already destroyed/disabled ones
      if (v.createTime && v.state === "ENABLED") {
        const createTimeMs = (Number(v.createTime.seconds) * 1000) + Math.round(Number(v.createTime.nanos) / 1000000);
        if (createTimeMs < thirtyDaysAgo) {
          await secretManagerClient.destroySecretVersion({ name: v.name });
          logger.info(`Destroyed old secret version (>30 days): ${v.name}`);
        }
      }
    }
  } catch (err) {
    logger.error("Secret rotation failed:", err);
  }
});
