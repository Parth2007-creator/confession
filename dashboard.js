// =============================================
// Dashboard Firebase Logic — dashboard.js
// =============================================
import { db, isConfigured } from './firebase.js';
import {
  collection, query, where, orderBy, limit,
  onSnapshot, getCountFromServer
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const recentItemsContainer = document.getElementById('recent-items');
const lafCount = document.getElementById('laf-count');
const lafBar = document.getElementById('laf-bar');

function formatTimeAgo(date) {
  if (!date) return 'Just now';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return seconds + 's ago';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
}

function renderItem(item, id) {
  const timeAgo = formatTimeAgo(item.storedAt?.toDate());
  const img = item.itemPhotoUrl
    ? `<img src="${item.itemPhotoUrl}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Lost item"/>`
    : `<div class="w-full h-full flex items-center justify-center bg-surface-container text-4xl">📦</div>`;

  return `
    <div class="flex items-center gap-6 group">
      <div class="w-20 h-20 rounded-2xl overflow-hidden shadow-inner bg-surface flex-shrink-0">
        ${img}
      </div>
      <div class="flex-1 min-w-0">
        <h5 class="font-bold text-on-surface truncate">${item.studentEmailId || 'Unknown'}</h5>
        <p class="text-xs text-outline mb-3">Station ${item.stationId || '—'} • ${timeAgo}</p>
        <div class="flex gap-2">
          <span class="px-3 py-1 bg-surface-container-low text-[10px] font-bold text-primary rounded-full">Lost Item</span>
          <span class="px-3 py-1 bg-surface-container-low text-[10px] font-bold text-secondary rounded-full capitalize">${item.status}</span>
        </div>
      </div>
      <a href="lost-and-found.html" class="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex-shrink-0">View</a>
    </div>
  `;
}

if (isConfigured) {
  // Live recent items
  const recentQ = query(
    collection(db, 'lostAndFound'),
    where('status', '==', 'stored'),
    orderBy('storedAt', 'desc'),
    limit(3)
  );

  onSnapshot(recentQ, (snapshot) => {
    if (snapshot.empty) {
      recentItemsContainer.innerHTML = `
        <div class="text-center py-8 text-outline">
          <span class="text-4xl block mb-2">📭</span>
          <p class="text-sm font-medium">No items stored currently.</p>
        </div>`;
      return;
    }
    recentItemsContainer.innerHTML = snapshot.docs.map(doc => renderItem(doc.data(), doc.id)).join('');
  });

  // Live count for Lost & Found box
  const storedQ = query(collection(db, 'lostAndFound'), where('status', '==', 'stored'));
  onSnapshot(storedQ, (snapshot) => {
    const count = snapshot.size;
    const MAX = 25;
    const pct = Math.min(Math.round((count / MAX) * 100), 100);
    if (lafCount) lafCount.textContent = `${count}/${MAX}`;
    if (lafBar) lafBar.style.width = `${pct}%`;
  });

} else {
  // Mock data for demo
  recentItemsContainer.innerHTML = `
    <div class="text-center py-8 text-outline">
      <span class="text-4xl block mb-2">🔧</span>
      <p class="text-sm font-medium">Add Firebase config in <code class="font-mono bg-surface-container px-1 rounded">src/firebase.js</code> to load live data.</p>
    </div>`;
  if (lafCount) lafCount.textContent = '—';
}
