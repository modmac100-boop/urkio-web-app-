import { useEffect, useState, useCallback } from 'react';
import {
  StreamVideoClient,
  Call,
  User,
} from '@stream-io/video-react-sdk';
import { getFunctions, httpsCallable } from 'firebase/functions';

export function useConference(userId: string, userName: string, userImage?: string) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initClient = useCallback(async () => {
    if (client) return client;

    try {
      const apiKey = import.meta.env.VITE_STREAM_API_KEY || 'zzyb8w6me2rg';
      const user: User = {
        id: userId,
        name: userName || 'Guest',
        image: userImage || `https://ui-avatars.com/api/?name=${userId}`,
      };

      try {
        console.log('[useConference] Fetching token explicitly...');
        const functions = getFunctions();
        const getStreamToken = httpsCallable(functions, 'getStreamToken');
        const result = await getStreamToken();
        const token = (result.data as any).token;

        if (!token) {
           throw new Error('No token returned from server.');
        }

        const newClient = new StreamVideoClient({
          apiKey,
          user,
          token, // provide string directly
        });

        setClient(newClient);
        return newClient;
      } catch (err: any) {
        console.error('[useConference] Token fetching error:', err);
        throw new Error('Could not fetch secure connection token. The streaming secret might not be configured on the server. ' + err.message);
      }
    } catch (err: any) {
      console.error('Failed to initialize Stream client:', err);
      // Wait, we need to set the error here but the error from tokenProvider might happen during connect
      // StreamVideoClient resolves later. Let's just set error.
      setError(err.message);
      return null;
    }
  }, [userId, userName, userImage, client]);

  const joinCall = useCallback(async (callType: string, callId: string) => {
    setIsConnecting(true);
    setError(null);
    console.log(`[useConference] Attempting to join call: ${callType}/${callId}`);

    try {
      const activeClient = await initClient();
      if (!activeClient) {
        throw new Error('Stream client not initialized');
      }
      console.log('[useConference] Client initialized. Creating call object...');

      const newCall = activeClient.call(callType, callId);
      console.log('[useConference] Call object created. Joining...');
      
      await newCall.join({ create: true });
      console.log('[useConference] Join successful!');
      
      setCall(newCall);
    } catch (err: any) {
      console.error('[useConference] Failed to join call:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, [initClient]);

  const leaveCall = useCallback(async () => {
    if (call) {
      await call.leave();
      setCall(null);
    }
  }, [call]);

  useEffect(() => {
    return () => {
      if (call) call.leave().catch(console.error);
      if (client) client.disconnectUser().catch(console.error);
    };
  }, [call, client]);

  return {
    client,
    call,
    isConnecting,
    error,
    joinCall,
    leaveCall,
  };
}
