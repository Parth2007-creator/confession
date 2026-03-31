// =============================================
// Firebase Configuration — firebase.js
// =============================================
// Using Firebase compat SDK via ES module CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ⚠️ PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyC5ymgsIRCkNubgOXQr6K5RnEwg2DlJ-xQ",
    authDomain: "smart-locker-924d4.firebaseapp.com",
    projectId: "smart-locker-924d4",
    storageBucket: "smart-locker-924d4.firebasestorage.app",
    messagingSenderId: "627217512653",
    appId: "1:627217512653:web:5f97e67320f04fd0f19184"
};

// Initialize Firebase only if configured 
export const isConfigured = firebaseConfig.projectId !== "YOUR_PROJECT_ID";

let app, db;
if (isConfigured) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} else {
    console.warn("Firebase is not configured! Waiting for valid API keys. Real-time updates are disabled.");
}

export { app, db };
