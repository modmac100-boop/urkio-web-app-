import React from 'react';
import { Player } from '@remotion/player';
import { VideoMessage } from '../../remotion/VideoMessage';

interface RemotionVideoMessageProps {
  text: string;
  senderName: string;
  senderPhoto?: string;
  isOwn?: boolean;
}

export const RemotionVideoMessage: React.FC<RemotionVideoMessageProps> = ({ 
  text, 
  senderName, 
  senderPhoto,
  isOwn 
}) => {
  return (
    <div className={`relative rounded-4xl overflow-hidden shadow-2xl border-2 ${isOwn ? 'border-white/20' : 'border-msgr-primary/10'} bg-black aspect-9/16 w-full max-w-[280px]`}>
      <Player
        component={VideoMessage}
        inputProps={{
          text,
          senderName,
          senderPhoto,
        }}
        durationInFrames={150}
        fps={30}
        compositionWidth={1080}
        compositionHeight={1920}
        style={{
          width: '100%',
          height: '100%',
        }}
        controls
        autoPlay
        loop
      />
      
      {/* Dynamic Overlay Label */}
      <div className="absolute top-4 left-4 z-10">
        <div className="px-3 py-1 bg-msgr-primary/80 backdrop-blur-md rounded-lg flex items-center gap-2 border border-white/20">
          <div className="size-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-[8px] font-black uppercase text-white tracking-widest">Programmatic Render</span>
        </div>
      </div>
    </div>
  );
};
