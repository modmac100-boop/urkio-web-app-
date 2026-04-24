import { useState, useRef, useCallback, useEffect } from 'react';
import { functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalVideoTrack,
  ILocalAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';

export type SessionMode = 'private' | 'group' | 'broadcast';
export type SessionRole = 'host' | 'audience';

export interface RemoteUser {
  uid: string | number;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
  handRaised?: boolean;
}

export interface HealingSessionState {
  connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'FAILED';
  remoteUsers: RemoteUser[];
  localVideoTrack: ILocalVideoTrack | null;
  localAudioTrack: ILocalAudioTrack | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isZenMode: boolean;
  handRaisedUids: Set<string | number>;
  networkQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  error: string | null;
  isRecording: boolean;
}

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

// HD Video Profiles per session mode
const VIDEO_PROFILES = {
  private: { width: 1280, height: 720, frameRate: 30, bitrateMin: 600, bitrateMax: 2000 },
  group:   { width: 960,  height: 540, frameRate: 24, bitrateMin: 400, bitrateMax: 1200 },
  broadcast: { width: 1920, height: 1080, frameRate: 30, bitrateMin: 1000, bitrateMax: 4000 },
};

export function useHealingSession(
  sessionId: string,
  mode: SessionMode,
  userUid: number,
  role: SessionRole = 'host'
) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const screenClientRef = useRef<IAgoraRTCClient | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isLeavingRef = useRef(false);

  const [state, setState] = useState<HealingSessionState>({
    connectionState: 'DISCONNECTED',
    remoteUsers: [],
    localVideoTrack: null,
    localAudioTrack: null,
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    isZenMode: false,
    handRaisedUids: new Set(),
    networkQuality: 'unknown',
    error: null,
    isRecording: false,
  });

  const updateState = (patch: Partial<HealingSessionState>) =>
    setState(prev => ({ ...prev, ...patch }));

  // ── Token Fetch ─────────────────────────────────────────────────────────────
  const fetchToken = async (channelName: string, uid: number, publisherRole: boolean): Promise<{ token: string | null; appId: string }> => {
    try {
      const generateToken = httpsCallable(functions, 'generateAgoraToken');
      const result = await generateToken({ channelName, role: publisherRole ? 'publisher' : 'subscriber' });
      const data = result.data as any;
      return { token: data.token, appId: APP_ID };
    } catch (err) {
      console.error('[HealingSuite] Failed to fetch Agora token via Cloud Function:', err);
      return { token: null, appId: APP_ID };
    }
  };

  // ── Join Session ─────────────────────────────────────────────────────────────
  const join = useCallback(async () => {
    if (clientRef.current) return;
    isLeavingRef.current = false;

    updateState({ connectionState: 'CONNECTING', error: null });

    try {
      // Client mode: rtc for 1-on-1/group, live for broadcast
      const clientMode = mode === 'broadcast' ? 'live' : 'rtc';
      const client = AgoraRTC.createClient({ mode: clientMode, codec: 'vp8' });
      clientRef.current = client;

      // ── Event Listeners ───────────────────────────────────────────────────
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setState(prev => ({
            ...prev,
            remoteUsers: prev.remoteUsers.some(u => u.uid === user.uid)
              ? prev.remoteUsers.map(u => u.uid === user.uid ? { ...u, videoTrack: user.videoTrack } : u)
              : [...prev.remoteUsers, { uid: user.uid, videoTrack: user.videoTrack }],
          }));
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
          setState(prev => ({
            ...prev,
            remoteUsers: prev.remoteUsers.some(u => u.uid === user.uid)
              ? prev.remoteUsers.map(u => u.uid === user.uid ? { ...u, audioTrack: user.audioTrack } : u)
              : [...prev.remoteUsers, { uid: user.uid, audioTrack: user.audioTrack }],
          }));
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        setState(prev => ({
          ...prev,
          remoteUsers: prev.remoteUsers.map(u =>
            u.uid === user.uid
              ? { ...u, videoTrack: mediaType === 'video' ? undefined : u.videoTrack, audioTrack: mediaType === 'audio' ? undefined : u.audioTrack }
              : u
          ),
        }));
      });

      client.on('user-left', (user) => {
        setState(prev => ({ ...prev, remoteUsers: prev.remoteUsers.filter(u => u.uid !== user.uid) }));
      });

      // ── Network Quality Monitoring ─────────────────────────────────────────
      client.on('network-quality', (stats) => {
        const uplinkLevel = stats.uplinkNetworkQuality;
        const quality = uplinkLevel <= 2 ? 'excellent' : uplinkLevel <= 4 ? 'good' : 'poor';
        updateState({ networkQuality: quality });
      });

      // ── Seamless Auto-Reconnect ────────────────────────────────────────────
      client.on('connection-state-change', (curState) => {
        if (curState === 'RECONNECTING') {
          updateState({ connectionState: 'RECONNECTING' });
        } else if (curState === 'CONNECTED') {
          updateState({ connectionState: 'CONNECTED' });
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        } else if (curState === 'DISCONNECTED') {
          // Only auto-rejoin if we're not intentionally leaving
          if (!isLeavingRef.current) {
            reconnectTimerRef.current = setTimeout(() => join(), 3000);
          }
        }
      });

      // ── Fetch Token & Connect ─────────────────────────────────────────────
      const isPublisher = role === 'host';
      const { token, appId } = await fetchToken(sessionId, userUid, isPublisher);
      const activeAppId = appId || APP_ID;

      if (!activeAppId) {
        throw new Error('Agora App ID is not configured. Add VITE_AGORA_APP_ID to your .env file.');
      }

      await client.join(activeAppId, sessionId, token, userUid);

      // In broadcast mode, set client role before publishing
      if (mode === 'broadcast') {
        await client.setClientRole(isPublisher ? 'host' : 'audience');
      }

      // ── Create Local Tracks ───────────────────────────────────────────────
      if (isPublisher || mode !== 'broadcast') {
        const profile = VIDEO_PROFILES[mode];

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          {
            // Studio-Grade Audio settings for healing sessions
            AEC: true,   // Acoustic Echo Cancellation
            ANS: true,   // Adaptive Noise Suppression
            AGC: true,   // Automatic Gain Control
            encoderConfig: { sampleRate: 48000, stereo: true, bitrate: 128 },
          },
          {
            encoderConfig: {
              width: profile.width,
              height: profile.height,
              frameRate: profile.frameRate,
              bitrateMin: profile.bitrateMin,
              bitrateMax: profile.bitrateMax,
            },
            optimizationMode: 'motion',
          }
        ) as [IMicrophoneAudioTrack, ICameraVideoTrack];

        await client.publish([audioTrack, videoTrack]);

        updateState({
          connectionState: 'CONNECTED',
          localAudioTrack: audioTrack,
          localVideoTrack: videoTrack,
        });
      } else {
        // Pure audience in broadcast
        updateState({ connectionState: 'CONNECTED' });
      }
    } catch (err: any) {
      console.error('[HealingSuite] Join failed:', err);
      updateState({ connectionState: 'FAILED', error: err.message });
    }
  }, [sessionId, mode, userUid, role]);

  // ── Leave Session ─────────────────────────────────────────────────────────
  const leave = useCallback(async () => {
    isLeavingRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

    const client = clientRef.current;
    if (client) {
      state.localVideoTrack?.stop();
      state.localVideoTrack?.close();
      state.localAudioTrack?.stop();
      state.localAudioTrack?.close();
      await client.leave();
      clientRef.current = null;
    }

    updateState({
      connectionState: 'DISCONNECTED',
      remoteUsers: [],
      localVideoTrack: null,
      localAudioTrack: null,
      isMuted: false,
      isCameraOff: false,
    });
  }, [state.localVideoTrack, state.localAudioTrack]);

  // ── Toggle Mute ───────────────────────────────────────────────────────────
  const toggleMute = useCallback(async () => {
    const track = state.localAudioTrack as IMicrophoneAudioTrack | null;
    if (!track) return;
    await track.setMuted(!state.isMuted);
    updateState({ isMuted: !state.isMuted });
  }, [state.localAudioTrack, state.isMuted]);

  // ── Toggle Camera ─────────────────────────────────────────────────────────
  const toggleCamera = useCallback(async () => {
    const track = state.localVideoTrack as ICameraVideoTrack | null;
    if (!track) return;
    await track.setMuted(!state.isCameraOff);
    updateState({ isCameraOff: !state.isCameraOff });
  }, [state.localVideoTrack, state.isCameraOff]);

  // ── Zen Mode ──────────────────────────────────────────────────────────────
  const toggleZenMode = useCallback(() => {
    updateState({ isZenMode: !state.isZenMode });
  }, [state.isZenMode]);

  // ── Hand Raise ────────────────────────────────────────────────────────────
  const toggleHandRaise = useCallback(() => {
    setState(prev => {
      const next = new Set(prev.handRaisedUids);
      if (next.has(userUid)) next.delete(userUid);
      else next.add(userUid);
      return { ...prev, handRaisedUids: next };
    });
  }, [userUid]);

  // ── Screen Share ──────────────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    if (state.isScreenSharing) {
      const screenClient = screenClientRef.current;
      if (screenClient) {
        await screenClient.leave();
        screenClientRef.current = null;
      }
      updateState({ isScreenSharing: false });
    } else {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({ encoderConfig: '1080p_1' }, 'disable');
        // Publish screen track on the main client (replace video)
        if (state.localVideoTrack) await client.unpublish(state.localVideoTrack as ILocalVideoTrack);
        await client.publish(Array.isArray(screenTrack) ? screenTrack : [screenTrack]);
        updateState({ isScreenSharing: true });
      } catch (err: any) {
        console.error('[HealingSuite] Screen share failed:', err);
      }
    }
  }, [state.isScreenSharing, state.localVideoTrack]);

  // ── Recording Logic ───────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!state.localVideoTrack || state.isRecording) return;

    try {
      const videoTrack = state.localVideoTrack.getMediaStreamTrack();
      const tracks = [videoTrack];
      
      if (state.localAudioTrack) {
        tracks.push(state.localAudioTrack.getMediaStreamTrack());
      }

      const stream = new MediaStream(tracks);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Urkio-Session-${sessionId}-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      };

      recorder.start();
      recorderRef.current = recorder;
      updateState({ isRecording: true });
    } catch (err) {
      console.error('[HealingSuite] Recording failed to start:', err);
    }
  }, [state.localVideoTrack, state.localAudioTrack, state.isRecording, sessionId]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && state.isRecording) {
      recorderRef.current.stop();
      recorderRef.current = null;
      updateState({ isRecording: false });
    }
  }, [state.isRecording]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      leave();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    join,
    leave,
    toggleMute,
    toggleCamera,
    toggleZenMode,
    toggleHandRaise,
    toggleScreenShare,
    startRecording,
    stopRecording,
    updateState,
  };
}
