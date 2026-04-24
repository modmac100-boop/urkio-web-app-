import { RtcTokenBuilder, RtcRole } from 'agora-token';

export default function handler(req: any, res: any) {
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

  const { channelName, uid, role } = req.body || {};

  const appId = process.env.VITE_AGORA_APP_ID || process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    res.status(500).json({ error: 'Agora App ID or Certificate is missing in environment variables.' });
    return;
  }

  const expirationTimeInSeconds = 3600 * 2;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName || '',
      uid || 0,
      rtcRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    res.status(200).json({ token, appId, uid });
  } catch (error: any) {
    console.error('Failed to generate token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}
