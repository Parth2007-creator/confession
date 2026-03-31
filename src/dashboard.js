import { db } from '../firebase.js'; // Tujhi path check kar
import { collection, query, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Elements select karne (Tujhya HTML IDs pramane)
const lafCountDisplay = document.getElementById('laf-count');
const lafBar = document.getElementById('laf-bar');
const recentItemsContainer = document.getElementById('recent-items');

// 1. Live Data Fatch karne (Real-time)
const q = query(collection(db, 'lostAndFound'), orderBy('storedAt', 'desc'));

onSnapshot(q, (snapshot) => {
    let availableCount = 0;
    let recentHtml = '';
    let count = 0;

    snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Fakt 'available' items count kara
        if (data.status === 'available') {
            availableCount++;
        }

        // Top 3 Recent items dakhva (UI sathi)
        if (count < 3) {
            recentHtml += `
                <div class="flex items-center gap-6 group hover:translate-x-2 transition-transform duration-300">
                    <img src="${data.itemPhotoUrl}" class="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white">
                    <div class="flex-1">
                        <h4 class="text-sm font-bold text-on-surface truncate w-48">${data.studentDetails.split('|')[0] || 'Unknown User'}</h4>
                        <p class="text-[10px] text-outline font-medium">ID: ${data.studentDetails.split('|')[1] || 'N/A'}</p>
                        <div class="mt-2 flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded-full text-[8px] font-bold ${data.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}">
                                ${data.status.toUpperCase()}
                            </span>
                            <span class="text-[8px] text-outline font-mono">${data.storedAt ? data.storedAt.toDate().toLocaleTimeString() : ''}</span>
                        </div>
                    </div>
                </div>
            `;
            count++;
        }
    });

    // UI Updates
    lafCountDisplay.innerText = availableCount + " Items";
    
    // Capacity Bar update (Logic: समजा 20 items full क्षमता आहे)
    let percentage = (availableCount / 20) * 100;
    lafBar.style.width = (percentage > 100 ? 100 : percentage) + "%";

    // Recent items inject karne
    recentItemsContainer.innerHTML = recentHtml || '<p class="text-center text-outline text-xs">No items found.</p>';
});
