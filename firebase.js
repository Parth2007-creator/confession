// =============================================
// Firebase Configuration — firebase.js
// =============================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyC5ymgsIRCkNubgOXQr6K5RnEwg2DlJ-xQ",
    authDomain: "smart-locker-924d4.firebaseapp.com",
    projectId: "smart-locker-924d4",
    storageBucket: "smart-locker-924d4.firebasestorage.app",
    messagingSenderId: "627217512653",
    appId: "1:627217512653:web:5f97e67320f04fd0f19184"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exporting properly for scan.js
export { app, db };
