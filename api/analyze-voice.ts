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
    const { audioData, mimeType, userContext } = req.body || {};
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
    res.status(200).json({ analysis: responseText });
  } catch (error: any) {
    console.error('Voice analysis error:', error);
    res.status(500).json({ error: error.message });
  }
}
