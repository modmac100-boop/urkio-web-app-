import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

export const VideoMessage: React.FC<{
  text: string;
  senderName: string;
  senderPhoto?: string;
}> = ({ text, senderName, senderPhoto }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateRight: 'clamp',
  });

  const orbOpacity = interpolate(frame % 60, [0, 30, 60], [0.4, 0.8, 0.4]);
  const orbScale = interpolate(frame % 90, [0, 45, 90], [1, 1.2, 1]);

  return (
    <AbsoluteFill className="bg-[#020617] flex items-center justify-center font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(30,58,138,1) 0%, rgba(2,6,23,0) 70%)',
            filter: 'blur(100px)'
          }}
        />
        
        {/* Animated Orbs */}
        <div 
          className="absolute top-1/4 left-1/4 size-64 bg-blue-600 rounded-full mix-blend-screen transition-opacity"
          style={{
            opacity: orbOpacity * 0.3,
            transform: `scale(${orbScale})Translate(${-20 + Math.sin(frame / 20) * 10}px, 0)`,
            filter: 'blur(80px)'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 size-80 bg-indigo-600 rounded-full mix-blend-screen"
          style={{
            opacity: orbOpacity * 0.2,
            transform: `scale(${orbScale * 0.9})Translate(${20 + Math.cos(frame / 25) * 15}px, 0)`,
            filter: 'blur(100px)'
          }}
        />
      </div>

      <div 
        style={{ opacity, transform: `scale(${scale})` }}
        className="relative z-10 w-[80%] max-w-4xl"
      >
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[48px] p-16 shadow-2xl overflow-hidden relative">
          {/* Subtle Grain Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grain-y.com/grain.png')]" />

          <div className="flex flex-col items-center text-center">
            {/* Sender Avatar */}
            {senderPhoto && (
              <div className="mb-12 relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-40 animate-pulse" />
                <img 
                  src={senderPhoto} 
                  className="size-32 rounded-full border-4 border-white/20 relative z-10 object-cover shadow-2xl"
                  alt={senderName}
                />
              </div>
            )}

            <div className="mb-6">
              <span className="text-blue-400 font-bold uppercase tracking-[0.3em] text-sm">
                Message from {senderName}
              </span>
            </div>

            <h1 className="text-white text-5xl font-black tracking-tight leading-tight mb-8 drop-shadow-2xl">
              {text}
            </h1>

            <div className="flex items-center gap-4 text-white/40 font-medium tracking-widest text-xs uppercase">
              <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
              Urkio Secure Editorial
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Branding Footer */}
      <div className="absolute bottom-12 left-12 flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20">
          U
        </div>
        <div>
          <div className="text-white font-black text-sm tracking-tighter uppercase">URKIO</div>
          <div className="text-white/30 text-[10px] font-bold tracking-[0.2em] uppercase">Clinical Network</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
