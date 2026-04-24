importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "gen-lang-client-0305219649",
  appId: "1:823537006107:web:9050acad7f9df5bbea6abe",
  apiKey: "AIzaSyDq6dSzKZtNsUgD57YV4jVhRta2pCYXgwY",
  authDomain: "gen-lang-client-0305219649.firebaseapp.com",
  messagingSenderId: "823537006107",
  storageBucket: "gen-lang-client-0305219649.firebasestorage.app",
});

const messaging = firebase.messaging();

// Optional: Handle background messages right here if needed
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Urkio Update';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
