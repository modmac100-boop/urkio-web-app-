import React, { useEffect, useRef } from "react";

const VideoPlayer = ({ user, isLocal }: { user: any, isLocal?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Ensure the track and container exist
    if (!user?.videoTrack || !containerRef.current) return;

    // 2. Play the video track in the div
    user.videoTrack.play(containerRef.current);

    // 3. Cleanup: Stop playing when the component unmounts
    return () => {
      user.videoTrack.stop();
    };
  }, [user?.videoTrack]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* The actual video container */}
      <div 
        ref={containerRef} 
        className="video-container" 
        style={{ width: "100%", height: "100%", backgroundColor: "#000", borderRadius: "12px", aspectRatio: "16/9" }} 
      />
      
      {/* Label for identification */}
      <span style={{ position: 'absolute', bottom: 10, left: 10, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>
        {isLocal ? "You (Expert)" : `User ${user?.uid || ''}`}
      </span>
    </div>
  );
};

export default VideoPlayer;
