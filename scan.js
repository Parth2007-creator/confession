import { db } from './firebase.js';
import { 
    doc, setDoc, updateDoc, serverTimestamp, collection, 
    query, where, getDocs 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// 1. Scanner Initialize (UI madhla 'reader' div vaprun)
let scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
let currentMode = ''; 
let scannedStudentData = "";

// 2. STORE BUTTON LOGIC
document.getElementById('btn-store').onclick = () => {
    currentMode = 'store';
    document.getElementById('reader').classList.remove('hidden');
    scanner.render(onScanSuccess);
};

// 3. RETRIEVE BUTTON LOGIC
document.getElementById('btn-retrieve').onclick = () => {
    currentMode = 'retrieve';
    document.getElementById('reader').classList.remove('hidden');
    scanner.render(onScanSuccess);
};

// 4. SCAN SUCCESS (Fakt QR vachne)
function onScanSuccess(decodedText) {
    scannedStudentData = decodedText; // QR madhla data ithe ala
    scanner.clear();
    document.getElementById('reader').classList.add('hidden');
    
    if (currentMode === 'store') {
        // QR nantra photo section dakhva
        document.getElementById('photo-section').classList.remove('hidden');
    } else {
        // Direct database check kara
        handleRetrieve(scannedStudentData);
    }
}

// 5. PHOTO LOGIC (Submit dablyavar)
document.getElementById('btn-take-photo').onclick = async () => {
    const canvas = document.getElementById('canvas');
    const video = document.getElementById('video');
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg');

    // Firebase madhe 'available' status sobat save kara
    const docId = "ITEM_" + Date.now();
    await setDoc(doc(db, 'lostAndFound', docId), {
        studentDetails: scannedStudentData,
        itemPhotoUrl: imageDataUrl,
        status: "available",
        stationId: "box_01",
        storedAt: serverTimestamp()
    });
    
    alert("Item Stored! Check Available section.");
    location.reload(); // Page refresh kara
};

// 6. RETRIEVE LOGIC (Matching ID shodha)
async function handleRetrieve(qrData) {
    const q = query(collection(db, 'lostAndFound'), 
              where('studentDetails', '==', qrData), 
              where('status', '==', 'available'));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const itemDoc = querySnapshot.docs[0];
        
        // 1. ESP32 la signal dya
        await updateDoc(doc(db, 'stations', 'box_01'), {
            unlockBox: true,
            openCompartment: 1 
        });
        
        // 2. Status 'claimed' kara (Mhanje to 'Claimed' section madhe disel)
        await updateDoc(doc(db, 'lostAndFound', itemDoc.id), {
            status: "claimed",
            claimedAt: serverTimestamp()
        });
        
        alert("ID Matched! Box Opening...");
    } else {
        alert("No available items found for this ID.");
    }
}
