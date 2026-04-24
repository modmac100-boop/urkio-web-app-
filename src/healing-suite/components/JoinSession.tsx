import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import UrkioSession from './UrkioSession';

interface JoinSessionProps {
  sessionId: string;
}

const JoinSession: React.FC<JoinSessionProps> = ({ sessionId }) => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState("");
  const [uid, setUid] = useState<number | string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionDataAndToken = async () => {
      try {
        if (!auth.currentUser) {
          setError("يجب تسجيل الدخول للانضمام للجلسة.");
          return;
        }

        const currentUid = auth.currentUser.uid;
        setUid(currentUid);

        // Fetch session status
        const sessionRef = doc(db, "sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);

        let data = null;
        if (sessionSnap.exists()) {
          data = sessionSnap.data();
          setSessionData(data);
        } else {
          // If session doesn't exist in DB yet, we can still allow joining if it's a test
          console.warn("Session not found in Firestore. Proceeding for testing.");
        }

        // Fetch Token from the cloud function
        const response = await fetch("https://us-central1-gen-lang-client-0305219649.cloudfunctions.net/agoraToken", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channelName: sessionId,
            uid: currentUid,
            role: data?.expertId === currentUid ? "publisher" : "subscriber"
          }),
        });

        const tokenData = await response.json();

        if (tokenData.token) {
          setToken(tokenData.token);
        } else {
          setError(tokenData.error || "فشل في الحصول على رمز الدخول.");
        }

      } catch (err: any) {
        console.error("Error fetching token:", err);
        setError("حدث خطأ أثناء الانضمام: " + err.message);
      }
    };

    fetchSessionDataAndToken();
  }, [sessionId]);

  if (error) {
    return <div style={{ color: 'red', textAlign: 'right', padding: '20px', direction: 'rtl' }}>{error}</div>;
  }

  if (!token) {
    return <div style={{ textAlign: 'right', padding: '20px', direction: 'rtl' }}>جاري تجهيز الجلسة...</div>;
  }

  return (
    <div className="join-session-container" style={{ direction: 'rtl' }}>
      {!joined ? (
        <div style={{ textAlign: 'right', padding: '20px', background: '#f9f9f9', borderRadius: '12px', margin: '20px 0' }}>
          <h2>تأكيد الانضمام</h2>
          <p>أنت على وشك الانضمام إلى جلسة الاستشفاء: {sessionData?.title || sessionId}</p>
          <button 
            onClick={() => setJoined(true)}
            style={{ 
              padding: '12px 24px', 
              background: '#007bff', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '10px'
            }}
          >
            انضمام الآن
          </button>
        </div>
      ) : (
        <UrkioSession channelName={sessionId} token={token} uid={uid} />
      )}
    </div>
  );
};

export default JoinSession;
