import { db } from './firebase.js'; 
import { doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

console.log("🚀 scan.js initialized!");

// FIX: initialize scanner ONLY when needed
let scanner = null;

let currentMode = ''; 
let scannedStudentData = "";
let videoStream = null;

// 🔥 BUTTON HANDLING FIX
document.addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    console.log("Button Clicked:", btn.id);

    if (btn.id === 'btn-store') {
        currentMode = 'store';
        startScanner();
    }

    if (btn.id === 'btn-retrieve') {
        currentMode = 'retrieve';
        startScanner();
    }

    if (btn.id === 'btn-take-photo') {
        captureAndUpload();
    }
});

// 🔥 SCANNER START FIX
function startScanner() {
    const readerDiv = document.getElementById('reader');

    if (!readerDiv) {
        console.error("reader div missing");
        return;
    }

    readerDiv.classList.remove('hidden');

    // recreate scanner every time (IMPORTANT FIX)
    scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: 250
    });

    scanner.render(onScanSuccess, onScanError);
}

// 🔥 SCAN SUCCESS
function onScanSuccess(decodedText) {
    console.log("✅ Scan Success:", decodedText);
    scannedStudentData = decodedText;

    scanner.clear().then(() => {
        document.getElementById('reader').classList.add('hidden');

        if (currentMode === 'store') {
            startCamera();
        } else {
            handleRetrieve(scannedStudentData);
        }
    });
}

// 🔥 CAMERA START
async function startCamera() {
    const video = document.getElementById('video');
    const photoSection = document.getElementById('photo-section');
    
    photoSection.classList.remove('hidden');

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        video.srcObject = videoStream;
        console.log("🎥 Camera Started");
    } catch (err) {
        alert("Camera Error: " + err.message);
    }
}

// 🔥 CAPTURE + UPLOAD
async function captureAndUpload() {
    const canvas = document.getElementById('canvas');
    const video = document.getElementById('video');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext('2d').drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.6);

    const docId = "ITEM_" + Date.now();

    try {
        await setDoc(doc(db, 'lostAndFound', docId), {
            studentDetails: scannedStudentData,
            itemPhotoUrl: imageDataUrl,
            status: "available",
            stationId: "box_01",
            storedAt: serverTimestamp()
        });

        stopCamera();
        alert("✅ Item stored!");
        location.reload();

    } catch (e) {
        console.error(e);
        alert("Upload failed");
    }
}

// 🔥 RETRIEVE
async function handleRetrieve(qrData) {
    console.log("🔍 Searching:", qrData);

    const q = query(
        collection(db, 'lostAndFound'), 
        where('studentDetails', '==', qrData), 
        where('status', '==', 'available')
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {

        const itemDoc = querySnapshot.docs[0];

        await updateDoc(doc(db, 'stations', 'box_01'), {
            unlockBox: true,
            openCompartment: 1
        });

        await updateDoc(doc(db, 'lostAndFound', itemDoc.id), {
            status: "claimed",
            claimedAt: serverTimestamp()
        });

        alert("🎉 Box Opening!");
        location.reload();

    } else {
        alert("❌ No item found");
    }
}

// 🔥 STOP CAMERA
function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
}

function onScanError(err) {}
