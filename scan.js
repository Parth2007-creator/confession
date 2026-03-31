// १. Firebase Imports (Module CDN वापरून)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// २. Firebase Config (तुझा डेटा)
const firebaseConfig = {
    apiKey: "AIzaSyC5ymgsIRCkNubgOXQr6K5RnEwg2DlJ-xQ",
    authDomain: "smart-locker-924d4.firebaseapp.com",
    projectId: "smart-locker-924d4",
    storageBucket: "smart-locker-924d4.firebasestorage.app",
    messagingSenderId: "627217512653",
    appId: "1:627217512653:web:5f97e67320f04fd0f19184"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let mode = "";
let scannedID = ""; // फक्त ID स्टोअर करण्यासाठी
let streamReference = null;

// ३. START SCANNER (बटन क्लिक झाल्यावर)
window.start = function(type) {
    mode = type;
    document.body.innerHTML = '<h2>Scanning ID...</h2><div id="reader" style="width:100%"></div><button class="btn" onclick="location.reload()">Cancel</button>';

    const html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, (text) => {
        scannedID = text;
        html5QrCode.stop().then(() => {
            processID(text);
        });
    });
}

// ४. PROCESS ID
function processID(text) {
    alert("ID Scanned: " + text);
    if (mode === "submit") openCamera();
    else retrieveFlow();
}

// ५. CAMERA FOR PHOTO (Submit Mode)
function openCamera() {
    document.body.innerHTML = `
        <h3>Take Item Photo</h3>
        <video id="video" autoplay playsinline style="width:90%; border-radius:10px;"></video>
        <canvas id="canvas" style="display:none;"></canvas>
        <br>
        <button class="btn" id="captureBtn">📸 Capture & Next</button>
    `;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            streamReference = stream;
            document.getElementById("video").srcObject = stream;
            document.getElementById("captureBtn").onclick = capture;
        })
        .catch(err => alert("Camera error: " + err));
}

// ६. CAPTURE & SHOW INPUT
function capture() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const photoData = canvas.toDataURL('image/jpeg', 0.5); // फोटो डेटा

    // कॅमेरा बंद करा
    if(streamReference) streamReference.getTracks().forEach(t => t.stop());

    document.body.innerHTML = `
        <h3>Enter Item Name</h3>
        <input id="itemName" placeholder="e.g. Wallet, Keys" style="padding:15px; width:80%; border-radius:10px; border:none;">
        <br><br>
        <button class="btn" id="finalSubmit">✅ Final Submit</button>
    `;

    document.getElementById("finalSubmit").onclick = () => submitToFirebase(photoData);
}

// ७. FIREBASE SUBMIT
async function submitToFirebase(photo) {
    const name = document.getElementById("itemName").value;
    if(!name) return alert("Please enter item name");

    try {
        const docId = "ITEM_" + Date.now();
        await setDoc(doc(db, 'lostAndFound', docId), {
            studentID: scannedID,
            itemName: name,
            itemPhoto: photo,
            status: "available",
            stationId: "box_01",
            timestamp: serverTimestamp()
        });

        alert("Item Stored Successfully! Box 01 is Open.");
        location.reload();
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// ८. RETRIEVE FLOW (Search in Firebase)
async function retrieveFlow() {
    document.body.innerHTML = "<h3>Searching for your items...</h3>";
    
    const q = query(collection(db, 'lostAndFound'), 
              where('studentID', '==', scannedID), 
              where('status', '==', 'available'));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        alert("No items found for this ID.");
        location.reload();
    } else {
        const item = querySnapshot.docs[0];
        document.body.innerHTML = `
            <h3>Item Found: ${item.data().itemName}</h3>
            <img src="${item.data().itemPhoto}" style="width:70%; border-radius:10px;">
            <button class="btn" id="openBtn">🔓 Open Locker</button>
        `;

        document.getElementById("openBtn").onclick = async () => {
            // ESP32 साठी कमांड पाठवणे
            await updateDoc(doc(db, 'stations', 'box_01'), {
                unlockBox: true,
                openCompartment: 1
            });
            // स्टेटस बदलणे
            await updateDoc(doc(db, 'lostAndFound', item.id), { status: "claimed" });
            
            alert("Locker Opening...");
            location.reload();
        };
    }
}
