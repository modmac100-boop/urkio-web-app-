import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

dotenv.config();

const assessRiskLevel = (text: string) => {
  const highRisk = [/إنهاء حياتي/i, /أريد الموت/i, /self-harm/i, /suicide/i];
  if (highRisk.some(p => p.test(text))) return 'high';
  return 'low';
};

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

async function startServer() {
  const app = express();
  const PORT = 5174;

  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // ─── Voice Note Analysis ───────────────────────────────────────────────────
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

  // AI Chat endpoint for local development
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, userId, userContext, condition = "general" } = req.body;
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

      const lastMessage = messages[messages.length - 1]?.content || '';
      
      // --- SAFETY GUARD ---
      if (assessRiskLevel(lastMessage) === 'high') {
         res.write("I can hear how much pain you are in. Your life is valuable. Please connect with a professional specialist immediately or call an emergency helpline.");
         res.end();
         return;
      }

      const client = new GoogleGenAI({ apiKey });
      
      const history = (messages || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const moodPrompt = SYSTEM_PROMPTS[condition as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.general;
      
      const systemPrompt = `${moodPrompt}
      اسم المستخدم: ${userContext?.displayName || 'مستخدم Urkio'}.
      
      إرشادات مهنية:
      - كن متعاطفاً جداً بلمسة إنسانية دافئة.
      - إذا عبّر المستخدم عن ضيق شديد، قدم استجابة متعاطفة وانصحه بالتحدث مع أخصائي.`;

      const result = await client.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: [...history.slice(0, -1), { role: 'user', parts: [{ text: lastMessage }] }],
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

  // Mock Dyte meeting endpoint
  app.post('/api/dyte/meeting', (req, res) => {
    const meetingId = `mock-meeting-${Math.random().toString(36).substring(7)}`;
    const authToken = `mock-token-${Math.random().toString(36).substring(7)}`;
    
    // Return a mock meeting response that works with both ChatWindow and PublicProfile
    res.json({
      success: true,
      meetingId,
      authToken,
      data: {
        id: meetingId,
        roomName: `mock-room-${Math.random().toString(36).substring(7)}`,
        status: 'ACTIVE',
        recordOnStart: false,
        authToken: authToken
      }
    });
  });

  // ─── Agora Token Generation ───────────────────────────────────────────────────
  app.post('/api/agora/token', async (req, res) => {
    try {
      const appId = process.env.VITE_AGORA_APP_ID || "a5557dd007124b7aa7dfce0e3d61a7da";
      const appCertificate = process.env.AGORA_APP_CERTIFICATE || "63e7a05a48ac41e5af746e75d0dbdfac";
      const { channelName, uid, role } = req.body;

      if (!channelName) {
        return res.status(400).json({ error: "channelName is required" });
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
