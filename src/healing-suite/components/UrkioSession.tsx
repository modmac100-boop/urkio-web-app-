import React, { useState, useEffect } from "react";
import AgoraRTC, { ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import VideoPlayer from "./VideoPlayer";

// Using the provided App ID
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || "a5557dd007124b7aa7dfce0e3d61a7da";

// Create the Agora Client
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

interface UrkioSessionProps {
  channelName: string;
  token: string;
  uid: number | string;
}

const UrkioSession: React.FC<UrkioSessionProps> = ({ channelName, token, uid }) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    let isUnmounted = false;

    const initAgora = async () => {
      try {
        // 1. Initialize Local Tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (isUnmounted) {
          audioTrack.close();
          videoTrack.close();
          return;
        }
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        // 2. Set up Remote Event Listeners BEFORE joining
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          console.log("Subscribed to user:", user.uid);

          if (mediaType === "video") {
            setRemoteUsers((prevUsers) => {
              // Ensure we don't have duplicate users
              if (prevUsers.find((u) => u.uid === user.uid)) return prevUsers;
              return [...prevUsers, user];
            });
          }

          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "audio") {
            user.audioTrack?.stop();
          }
        });

        client.on("user-left", (user) => {
          setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
        });

        // 3. Join the Channel
        await client.join(APP_ID, channelName, token, uid);
        
        // 4. Publish Local Tracks
        await client.publish([audioTrack, videoTrack]);
        setJoined(true);
      } catch (error) {
        console.error("Error joining Urkio Session:", error);
      }
    };

    initAgora();

    return () => {
      isUnmounted = true;
      // Cleanup
      localAudioTrack?.close();
      localVideoTrack?.close();
      client.removeAllListeners();
      client.leave();
    };
  }, [channelName, token, uid]);

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2>Urkio Healing Session: {channelName}</h2>
      
      {!joined ? (
        <p>Connecting to session...</p>
      ) : (
        <div 
          className="session-gallery"
          style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: "16px",
            // RTL Support for Arab media and social development sectors
            flexDirection: "row-reverse", 
            justifyContent: "flex-end"
          }}
        >
          {/* Local User Video */}
          <div style={{ width: "400px", height: "300px" }}>
            <VideoPlayer user={{ videoTrack: localVideoTrack, uid }} isLocal={true} />
          </div>

          {/* Remote Users Video */}
          {remoteUsers.map((user) => (
            <div key={user.uid} style={{ width: "400px", height: "300px" }}>
              <VideoPlayer user={user} isLocal={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UrkioSession;
