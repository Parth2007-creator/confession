import { db, isConfigured } from './firebase.js';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let stationId = null;
let currentMode = null; // 'store' or 'retrieve'
let scannedStudentId = null;
let html5QrCode = null;

const protectionModal = document.getElementById('protection-overlay');
const btnStore = document.getElementById('btn-store');
const btnRetrieve = document.getElementById('btn-retrieve');
const scannerModal = document.getElementById('scanner-modal');
const scannerPlaceholder = document.getElementById('scanner-placeholder');
const scanningLine = document.getElementById('scanning-line');
const btnCloseScanner = document.getElementById('btn-close-scanner');
const scannerStatus = document.getElementById('scanner-status');
const scannerSubtitle = document.getElementById('scanner-subtitle');

const photoModal = document.getElementById('photo-capture-modal');
const photoVideo = document.getElementById('photo-video');
const photoCanvas = document.getElementById('photo-canvas');
const btnTakePhoto = document.getElementById('btn-take-photo');
const btnCancelPhoto = document.getElementById('btn-cancel-photo');

const actionOverlay = document.getElementById('action-overlay');
const actionIcon = document.getElementById('action-icon');
const actionTitle = document.getElementById('action-title');

let cameraStream = null;

// Enforce Physical QR Scan Rule
function checkStationId() {
    const urlParams = new URLSearchParams(window.location.search);
    stationId = urlParams.get('station');
    if (!stationId) {
        protectionModal.classList.remove('hidden');
    } else {
        protectionModal.classList.add('hidden');
    }
}

function showAction(title, icon, animate = true) {
    actionTitle.textContent = title;
    actionIcon.textContent = icon;
    if (animate) {
        actionIcon.classList.add('animate-bounce');
    } else {
        actionIcon.classList.remove('animate-bounce');
    }
    actionOverlay.classList.remove('hidden');
}

function hideAction() {
    actionOverlay.classList.add('hidden');
}

async function unlockHardwareBox() {
    if (!isConfigured) {
        console.warn("Simulating box unlock (Firebase inactive)");
        return;
    }
    try {
        const stationRef = doc(db, 'stations', stationId);
        await setDoc(stationRef, {
            unlockBox: true,
            lastActivity: serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.error("Error unlocking box:", err);
    }
}

// Store & Retrieve Scanner Logic
btnStore.addEventListener('click', () => {
    currentMode = 'store';
    startScanner();
});

btnRetrieve.addEventListener('click', () => {
    currentMode = 'retrieve';
    startScanner();
});

btnCloseScanner.addEventListener('click', () => {
    stopScanner();
});

function startScanner() {
    scannerModal.style.transform = 'translateY(0)';
    scannerPlaceholder.classList.add('hidden');
    scanningLine.classList.remove('hidden');
    btnCloseScanner.classList.remove('hidden');
    
    scannerStatus.textContent = currentMode === 'store' ? 'Scan ID to Store' : 'Scan ID to Retrieve';
    scannerSubtitle.textContent = 'Align your student ID QR code in the frame.';

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText, decodedResult) => {
            handleScanSuccess(decodedText);
        },
        (errorMessage) => {
            // parse errors silently
        }
    ).catch((err) => {
        console.error("Camera access failed", err);
        alert("Camera access failed. Please ensure you are using HTTPS and have granted permissions.");
        stopScanner();
    });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            scannerModal.style.transform = 'translateY(100%)';
            scannerPlaceholder.classList.remove('hidden');
            scanningLine.classList.add('hidden');
        }).catch(err => console.error(err));
    } else {
        scannerModal.style.transform = 'translateY(100%)';
    }
}

async function handleScanSuccess(studentId) {
    stopScanner();
    scannedStudentId = studentId;

    if (currentMode === 'store') {
        openPhotoCapture();
    } else if (currentMode === 'retrieve') {
        await processRetrieveFlow();
    }
}

// Store Flow: Photo Capture
async function openPhotoCapture() {
    photoModal.classList.remove('hidden');
    photoCanvas.classList.add('hidden');
    photoVideo.classList.remove('hidden');
    btnTakePhoto.classList.remove('hidden');
    
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        photoVideo.srcObject = cameraStream;
    } catch (err) {
        console.error("Failed to get camera stream", err);
        alert("Camera access failed.");
        closePhotoCapture();
    }
}

function closePhotoCapture() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    photoModal.classList.add('hidden');
}

btnCancelPhoto.addEventListener('click', closePhotoCapture);

btnTakePhoto.addEventListener('click', async () => {
    // Resize image drastically to fit inside Firestore limit (1MB max, usually we want ~30kb)
    const MAX_SIZE = 300;
    let width = photoVideo.videoWidth;
    let height = photoVideo.videoHeight;
    
    if (width > height) {
        if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
        }
    } else {
        if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
        }
    }
    
    photoCanvas.width = width;
    photoCanvas.height = height;
    const ctx = photoCanvas.getContext('2d');
    ctx.drawImage(photoVideo, 0, 0, width, height);
    
    photoVideo.classList.add('hidden');
    photoCanvas.classList.remove('hidden');
    btnTakePhoto.classList.add('hidden');
    btnCancelPhoto.textContent = "Processing...";
    
    showAction('Storing Item...', 'cloud_upload');
    
    // Convert to heavily compressed base64 JPEG
    const imageDataUrl = photoCanvas.toDataURL('image/jpeg', 0.6);
    closePhotoCapture();
    
    try {
        if (isConfigured) {
            const docId = crypto.randomUUID();
            // Save image DIRECTLY to Firestore as a base64 string (No Storage bucket needed!)
            await setDoc(doc(db, 'lostAndFound', docId), {
                studentEmailId: scannedStudentId,
                itemPhotoUrl: imageDataUrl,
                storedAt: serverTimestamp(),
                retrievedAt: null,
                claimedAt: null,
                status: "stored",
                stationId: stationId
            });
        }
        
        await unlockHardwareBox();
        
        showAction('Item Stored! Box Unlocked.', 'lock_open_right', false);
        setTimeout(hideAction, 3000);
        
    } catch (err) {
        console.error("Storage error:", err);
        showAction('Error Storing Item', 'error', false);
        setTimeout(hideAction, 3000);
    }
});

// Retrieve Flow
async function processRetrieveFlow() {
    showAction('Checking Items...', 'search');
    try {
        if (!isConfigured) {
            // Mock simulation
            showAction('Mock: Box Unlocked.', 'lock_open_right', false);
            setTimeout(hideAction, 3000);
            return;
        }

        const q = query(
            collection(db, 'lostAndFound'), 
            where('studentEmailId', '==', scannedStudentId),
            where('status', '==', 'stored')
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            showAction('No Items Found', 'sentiment_dissatisfied', false);
            setTimeout(hideAction, 3000);
            return;
        }
        
        showAction('Unlocking Box...', 'lock_open_right');
        
        // Mark items as retrieved
        for (const document of querySnapshot.docs) {
            await updateDoc(doc(db, 'lostAndFound', document.id), {
                status: 'retrieved',
                retrievedAt: serverTimestamp()
            });
        }
        
        await unlockHardwareBox();
        
        showAction('Item Retrieved! Box Unlocked.', 'check_circle', false);
        setTimeout(hideAction, 3000);
        
    } catch (err) {
        console.error("Retrieve error:", err);
        showAction('Error Retrieving', 'error', false);
        setTimeout(hideAction, 3000);
    }
}

// Initial check
checkStationId();
