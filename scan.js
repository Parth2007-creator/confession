import { db } from '../firebase.js'; 
import { doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

console.log("scan.js loaded and ready!");

let scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
let currentMode = ''; 
let scannedStudentData = "";
let videoStream = null;

// १. Event Delegation: बटन्स डायनॅमिकली क्रिएट झाले तरी हे काम करेल
document.addEventListener('click', function (e) {
    
    // STORE बटण क्लिक केल्यावर
    if (e.target && (e.target.id === 'btn-store' || e.target.closest('#btn-store'))) {
        console.log("Store mode activated");
        currentMode = 'store';
        resetUI(); // जुना डेटा किंवा कॅमेरा साफ करण्यासाठी
        document.getElementById('reader').classList.remove('hidden');
        scanner.render(onScanSuccess, onScanError);
    }

    // RETRIEVE बटण क्लिक केल्यावर
    if (e.target && (e.target.id === 'btn-retrieve' || e.target.closest('#btn-retrieve'))) {
        console.log("Retrieve mode activated");
        currentMode = 'retrieve';
        resetUI();
        document.getElementById('reader').classList.remove('hidden');
        scanner.render(onScanSuccess, onScanError);
    }

    // फोटो काढण्यासाठी (TAKE PHOTO)
    if (e.target && (e.target.id === 'btn-take-photo' || e.target.closest('#btn-take-photo'))) {
        captureAndUpload();
    }
});

// २. स्कॅन यशस्वी झाल्यावर काय करायचे?
function onScanSuccess(decodedText) {
    console.log("Scanned ID Data:", decodedText);
    scannedStudentData = decodedText;
    
    // स्कॅनर बंद करा
    scanner.clear();
    document.getElementById('reader').classList.add('hidden');
    
    if (currentMode === 'store') {
        // जर स्टोअर मोड असेल तर वस्तूचा फोटो काढण्यासाठी कॅमेरा सुरू करा
        startCamera();
    } else {
        // जर रिट्रीव्ह मोड असेल तर थेट सर्च करा
        handleRetrieve(scannedStudentData);
    }
}

// ३. वस्तूचा फोटो घेण्यासाठी कॅमेरा सुरू करणे
async function startCamera() {
    const video = document.getElementById('video');
    const photoSection = document.getElementById('photo-section');
    
    if (photoSection) photoSection.classList.remove('hidden');

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = videoStream;
    } catch (err) {
        alert("Camera error: " + err.message);
    }
}

// ४. फोटो कॅप्चर करून Firebase मध्ये स्टोअर करणे
async function captureAndUpload() {
    const canvas = document.getElementById('canvas');
    const video = document.getElementById('video');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // इमेज क्वालिटी थोडी कमी ठेवली आहे जेणेकरून अपलोड फास्ट होईल
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.7);

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
        alert("Item Stored Successfully!");
        location.reload(); 
    } catch (e) {
        alert("Firebase Error: " + e.message);
    }
}

// ५. रिट्रीव्हल लॉजिक
async function handleRetrieve(qrData) {
    const q = query(collection(db, 'lostAndFound'), 
              where('studentDetails', '==', qrData), 
              where('status', '==', 'available'));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const itemDoc = querySnapshot.docs[0];
        
        // बॉक्स अनलॉक करण्यासाठी सिग्नल (Firestore मधून)
        await updateDoc(doc(db, 'stations', 'box_01'), {
            unlockBox: true,
            openCompartment: 1 
        });

        // स्टेटस अपडेट करा
        await updateDoc(doc(db, 'lostAndFound', itemDoc.id), {
            status: "claimed",
            claimedAt: serverTimestamp()
        });

        alert("Match Found! Box Opening...");
        location.reload();
    } else {
        alert("No items found for this Student ID.");
        location.reload();
    }
}

// मदतनीस फंक्शन्स (Helper Functions)
function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
}

function resetUI() {
    document.getElementById('photo-section')?.classList.add('hidden');
    stopCamera();
}

function onScanError(err) {
    // स्कॅन करताना येणारे छोटे एरर्स इग्नोर करा
}
