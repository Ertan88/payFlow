importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Service Worker içinde genellikle config gerekmez ama boş çağrı yerine dummy init
firebase.initializeApp({
  apiKey: "AIzaSyD-YOUR-CONFIG-HERE", // Bu kısım worker'da kritik değildir ama hatasız çalışması için format gereklidir.
  projectId: "your-project-id",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Yeni Bildirim';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/logo.svg',
    badge: '/logo.svg',
    requireInteraction: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
