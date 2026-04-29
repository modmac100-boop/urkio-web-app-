import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const result = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      config: {
        systemInstruction: "You are a helpful assistant",
      }
    });
    for await (const chunk of result) {
      console.log(chunk.text);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
