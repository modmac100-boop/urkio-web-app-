import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { messages, userId, userContext } = req.body || {};
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY not configured in .env' });
    }

    const client = new GoogleGenAI({ apiKey });
    
    const history = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const lastMessage = history.length > 0 ? history.pop()?.parts[0].text : '';
    
    // Build personalized context
    const userDisplayName = userContext?.displayName || 'Urkio User';
    const userBio = userContext?.bio ? ` User bio: ${userContext.bio}.` : '';
    const userRole = userContext?.role ? ` User role: ${userContext.role}.` : '';
    
    const systemPrompt = `You are the Urkio Guide, a professional, empathetic assistant for the Urkio platform. 
    You are speaking with ${userDisplayName}.${userBio}${userRole}
    
    Urkio is a platform for healing journeys, social connection, and professional specialist support.
    
    PROFESSIONAL GUIDELINES:
    - Tonality: Humble, social-worker-like, professional, and deeply empathetic.
    - Accuracy: Provide accurate information about the platform's features (Social Journey, Healing Code/Clinical Mode, Secret Vault, Specialist Hub).
    - Proactivity: Monitor the conversation flow and offer helpful suggestions.
    - Escalation: If the user expresses intense distress, crisis, or mentions self-harm, immediately provide an empathetic response and STRONGLY recommend they reach out to a verified Urkio Specialist or a local emergency service.
    - Boundaries: Do not provide medical diagnoses or legal advice. Always frame advice as "supportive guidance."`;

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
}
