import { GoogleGenAI } from "@google/genai";

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

    const client = new GoogleGenAI({ apiKey });

    let finalPrompt = prompt;

    // If we have history/context, reconstruct a rich prompt (Urkio specialized)
    if (messages && messages.length > 0) {
      const historyText = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const systemInstruction = `You are URKIO AI CONSULTANT, a highly empathetic AI for a healing and development platform. You act as a 'Social Development Expert' and 'Personal Growth Mentor'. 
      Language: ${language || 'ar'}. 
      Context: User is ${userContext?.displayName || 'Urkio User'} in a ${condition || 'general'} state. Keep responses professional, warm, and focused on Self-Mastery & Healing.`;
      
      finalPrompt = `${systemInstruction}\n\nConversation History:\n${historyText}\n\nUser: ${prompt || messages[messages.length-1].content}\nAssistant:`;
    }

    // Use zero-latency streaming logic
    const result = await client.models.generateContentStream({
      model: 'gemini-1.5-flash',
      contents: finalPrompt
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[Urkio AI] Generate Error:', error);
    return new Response(JSON.stringify({ error: "Failed to connect to AI", details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
