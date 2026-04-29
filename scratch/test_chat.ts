import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key:', apiKey ? 'Found (starts with ' + apiKey.substring(0, 7) + ')' : 'Not Found');

if (!apiKey) {
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey });

async function test() {
  try {
    console.log('Calling gemini-2.5-flash...');
    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello, how are you?',
    });
    console.log('Response:', result.text);
  } catch (error) {
    console.error('Error with gemini-2.5-flash:', error);
    
    try {
      console.log('Calling gemini-1.5-flash as fallback...');
      const result = await client.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: 'Hello, how are you?',
      });
      console.log('Response from gemini-1.5-flash:', result.text);
    } catch (innerError) {
      console.error('Error with gemini-1.5-flash:', innerError);
    }
  }
}

test();
