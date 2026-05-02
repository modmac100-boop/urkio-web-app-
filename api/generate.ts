import { GoogleGenerativeAI } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { prompt, messages, userContext, language, condition } = await req.json();
    
    // Use the provided API key from Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured in Vercel' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-1.5-flash for better performance/speed, but naming the endpoint as requested
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let finalPrompt = prompt;

    // If we have history/context, reconstruct a rich prompt (Urkio specialized)
    if (messages && messages.length > 0) {
      const historyText = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const systemInstruction = `You are the Urkio Guide, an empathetic AI for a healing and development platform. 
      Language: ${language || 'ar'}. 
      Context: User is ${userContext?.displayName || 'Urkio User'} in a ${condition || 'general'} state.`;
      
      finalPrompt = `${systemInstruction}\n\nConversation History:\n${historyText}\n\nUser: ${prompt || messages[messages.length-1].content}\nAssistant:`;
    }

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Urkio AI] Generate Error:', error);
    return new Response(JSON.stringify({ error: "Failed to connect to AI", details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
