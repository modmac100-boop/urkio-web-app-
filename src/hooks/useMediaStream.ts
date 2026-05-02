import { useState, useCallback, useRef, useEffect } from 'react';

interface MediaDevice {
  deviceId: string;
  label: string;
}

export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDevice[]>([]);
  const [microphones, setMicrophones] = useState<MediaDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      setIsSecureContext(false);
      setError('Media access requires a secure connection (HTTPS). Please check your domain settings.');
    }
  }, []);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}` }));
      const audioDevices = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 5)}` }));
      
      setCameras(videoDevices);
      setMicrophones(audioDevices);
      
      if (videoDevices.length > 0 && !selectedCamera) setSelectedCamera(videoDevices[0].deviceId);
      if (audioDevices.length > 0 && !selectedMic) setSelectedMic(audioDevices[0].deviceId);
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  }, [selectedCamera, selectedMic]);

  const startStream = useCallback(async (constraints?: MediaStreamConstraints) => {
    setIsInitializing(true);
    setError(null);
    stopStream();

    try {
      const defaultConstraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints || defaultConstraints);
      setStream(newStream);
      
      // Refresh devices to get labels (labels are often empty until permission is granted)
      await getDevices();
      
      return newStream;
    } catch (err: any) {
      console.error('Error starting media stream:', err);
      let message = 'Could not access camera or microphone.';
      if (err.name === 'NotAllowedError') message = 'Permission denied. Please allow camera/microphone access.';
      if (err.name === 'NotFoundError') message = 'No camera or microphone found.';
      setError(message);
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [selectedCamera, selectedMic, stopStream, getDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return {
    stream,
    error,
    cameras,
    microphones,
    selectedCamera,
    selectedMic,
    isInitializing,
    isSecureContext,
    setSelectedCamera,
    setSelectedMic,
    startStream,
    stopStream,
    refreshDevices: getDevices
  };
}
