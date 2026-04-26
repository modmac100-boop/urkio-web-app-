import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as crypto from 'crypto';

/**
 * POST /api/stream-token
 * Body: { userId: string, userName: string }
 * Returns: { token: string }
 *
 * Requires STREAM_API_SECRET env variable in Vercel.
 * Get it from: https://dashboard.getstream.io → Your App → App Settings → API Credentials
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://www.urkio.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const apiSecret = process.env.STREAM_API_SECRET;
  if (!apiSecret) {
    return res.status(500).json({ error: 'STREAM_API_SECRET not configured. Add it to Vercel environment variables.' });
  }

  try {
    // Generate a Stream JWT manually (HS256)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
      user_id: userId,
      iat: now,
      exp: now + 60 * 60 * 24, // 24 hours
    })).toString('base64url');

    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const token = `${header}.${payload}.${signature}`;
    return res.status(200).json({ token });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate token', details: err.message });
  }
}
