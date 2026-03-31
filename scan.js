import { db } from '../firebase.js'; 
import { doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

console.log("scan.js loaded successfully!");

// Scanner setup
let scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
let currentMode = ''; 
let scannedStudentData = "";

// Event Delegation (Karan buttons dynamic create jhale ahet)
document.addEventListener('click', function (e) {
    
    // STORE BUTTON CLICK
    if (e.target && (e.target.id === 'btn-store' || e.target.closest('#btn-store'))) {
        console.log("Store clicked");
        currentMode = 'store';
        document.getElementById('reader').classList.remove('hidden');
        scanner.render(onScanSuccess, onScanError);
    }

    // RETRIEVE BUTTON CLICK
    if (e.target && (e.target.id === 'btn-retrieve' || e.target.closest('#btn-retrieve'))) {
        console.log("Retrieve clicked");
        currentMode = 'retrieve';
        document.getElementById('reader').classList.remove('hidden');
        scanner.render(onScanSuccess, onScanError);
    }

    // TAKE PHOTO CLICK
    if (e.target && (e.target.id === 'btn-take-photo' || e.target.closest('#btn-take-photo'))) {
        captureAndUpload();
    }
});

function onScanSuccess(decodedText) {
    console.log("Scan Success:", decodedText);
    scannedStudentData = decodedText;
    scanner.clear();
    document.getElementById('reader').classList.add('hidden');
    
    if (currentMode === 'store') {
        startCamera();
    } else {
        handleRetrieve(scannedStudentData);
    }
}

function onScanError(err) {
    // console.warn(err); // Garaj aslyas error baghu shakto
}

async function startCamera() {
    const video = document.getElementById('video');
    document.getElementById('photo-section').classList.remove('hidden');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
    } catch (err) {
        alert("Camera access denied: " + err);
    }
}

async function captureAndUpload() {
    const canvas = document.getElementById('canvas');
    const video = document.getElementById('video');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg');

    const docId = "ITEM_" + Date.now();
    try {
        await setDoc(doc(db, 'lostAndFound', docId), {
            studentDetails: scannedStudentData,
            itemPhotoUrl: imageDataUrl,
            status: "available",
            stationId: "box_01",
            storedAt: serverTimestamp()
        });
        alert("Item Stored! Check Dashboard.");
        location.reload(); 
    } catch (e) {
        alert("Firebase Error: " + e.message);
    }
}

async function handleRetrieve(qrData) {
    const q = query(collection(db, 'lostAndFound'), 
              where('studentDetails', '==', qrData), 
              where('status', '==', 'available'));
    
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
        alert("Match Found! Box Opening...");
        location.reload();
    } else {
        alert("No items found for this ID.");
        location.reload();
    }
}
