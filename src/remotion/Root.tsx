import React from 'react';
import { Composition } from 'remotion';
import { VideoMessage } from './VideoMessage';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoMessage"
        component={VideoMessage}
        durationInFrames={150} // 5 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          text: "Secure Case Consultation Requested",
          senderName: "Urkio Expert",
          senderPhoto: "https://ui-avatars.com/api/?name=Urkio+Expert&background=004e99&color=fff",
        }}
      />
    </>
  );
};
