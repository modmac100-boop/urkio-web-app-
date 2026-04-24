import express from 'express';
import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// ─── Agora Token Generation ───────────────────────────────────────────────────
app.post('/api/agora/token', async (req, res) => {
  try {
    const appId = process.env.VITE_AGORA_APP_ID || "a5557dd007124b7aa7dfce0e3d61a7da";
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || ""; // Default to empty to trigger fallback
    const { channelName, uid, role } = req.body;

    if (!channelName) {
      return res.status(400).json({ error: "channelName is required" });
    }

    if (!appCertificate) {
      console.warn('[agoraToken] AGORA_APP_CERTIFICATE is missing. Joining without token (Testing Mode).');
      return res.status(200).json({ token: null, appId });
    }

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

    res.status(200).json({ token, appId });
  } catch (err: any) {
    console.error('[agoraToken] Token generation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Voice Note Analysis ───────────────────────────────────────────────────────
app.post('/api/analyze-voice', async (req, res) => {
  try {
    const { audioData, mimeType, userContext } = req.body;
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    if (!audioData) {
      return res.status(400).json({ error: 'audioData is required' });
    }

    const client = new GoogleGenAI({ apiKey });
    
    const prompt = `Analyze this voice recording from ${userContext?.displayName || 'Urkio User'}. 
    Provide a highly empathetic, professional, and therapeutic response in three parts:
    1. TRANSCRIPTION SUMMARY: A concise summary of what was shared.
    2. EMOTIONAL ESTIMATION: An professional observation of the user's emotional state (tone, urgency, feeling).
    3. HEALING TESTIMONIAL: A supportive validation and a suggested next step for their healing journey.
    
    Keep the tone warm, social-worker-like, and premium. Format the response in clear sections.`;

    const result = await client.models.generateContent({
      model: 'gemini-2.0-flash',
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

    const responseText = result.text || '';
    res.json({ analysis: responseText });
  } catch (error: any) {
    console.error('Voice analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── AI Chat (Streaming) ─────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userId, userContext } = req.body;
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const client = new GoogleGenAI({ apiKey });
    
    const history = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const lastMessage = history.length > 0 ? history.pop()?.parts[0].text : '';
    
    const systemPrompt = `You are the Urkio Guide, a professional, empathetic assistant for the Urkio platform. 
    You are speaking with ${userContext?.displayName || 'Urkio User'}.
    
    Urkio is a platform for healing journeys, social connection, and professional specialist support.
    
    PROFESSIONAL GUIDELINES:
    - Tonality: Humble, social-worker-like, professional, and deeply empathetic.
    - Accuracy: Provide accurate information about the platform's features.
    - Proactivity: Monitor the conversation flow and offer helpful suggestions.
    - Escalation: If the user expresses intense distress, strongly recommend they reach out to a specialist.`;

    const result = await client.models.generateContentStream({
      model: 'gemini-2.0-flash',
      contents: [...history, { role: 'user', parts: [{ text: lastMessage }] }],
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) res.write(text);
    }
    res.end();
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
