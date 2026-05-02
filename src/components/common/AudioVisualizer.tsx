import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  className?: string;
  color?: string;
  barWidth?: number;
  gap?: number;
  mode?: 'bars' | 'waveform';
}

export function AudioVisualizer({ 
  stream, 
  className = '', 
  color = '#30B0D0', 
  barWidth = 3, 
  gap = 2,
  mode = 'bars'
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize Audio Context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyzer = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    source.connect(analyzer);
    analyzer.fftSize = 256;
    
    analyzerRef.current = analyzer;
    sourceRef.current = source;
    contextRef.current = audioContext;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationRef.current = requestAnimationFrame(render);
      
      if (mode === 'bars') {
        analyzer.getByteFrequencyData(dataArray);
      } else {
        analyzer.getByteTimeDomainData(dataArray);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const totalBarWidth = barWidth + gap;
      const barsCount = Math.floor(width / totalBarWidth);

      ctx.fillStyle = color;

      if (mode === 'bars') {
        for (let i = 0; i < barsCount; i++) {
          const value = dataArray[i % bufferLength];
          const barHeight = (value / 255) * height;
          const x = i * totalBarWidth;
          const y = height - barHeight;

          // Draw rounded bar
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [barWidth / 2, barWidth / 2, 0, 0]);
          ctx.fill();
        }
      } else {
        // Waveform mode
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (contextRef.current && contextRef.current.state !== 'closed') {
        contextRef.current.close();
      }
    };
  }, [stream, color, barWidth, gap, mode]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      width={300}
      height={100}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
