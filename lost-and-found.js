// =============================================
// Lost & Found — lost-and-found.js
// =============================================
import { db, isConfigured } from './firebase.js';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, serverTimestamp, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const inventoryGrid = document.getElementById('inventory-grid');
const countAvailable = document.getElementById('count-available');
const countClaimed   = document.getElementById('count-claimed');
const searchInput    = document.getElementById('search-input');
const sortSelect     = document.getElementById('sort-select');

let currentTab   = 'available';
let allItems     = [];
let unsubscribe  = null;

function formatTimeAgo(date) {
  if (!date) return 'Just now';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60)  return seconds + 's ago';
  const m = Math.floor(seconds / 60); if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);       if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function createItemCard(item, id) {
  const timeAgo   = formatTimeAgo(item.storedAt?.toDate());
  const isClaimed = item.status !== 'stored';

  const imgContent = item.itemPhotoUrl
    ? `<img alt="Lost Item" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${item.itemPhotoUrl}"/>`
    : `<div class="w-full h-full flex items-center justify-center text-4xl bg-surface-container">📦</div>`;

  const badgeClass  = isClaimed ? 'bg-green-100 text-green-700' : 'bg-white/80 backdrop-blur-md text-cyan-600';
  const badgeLabel  = isClaimed ? 'Claimed' : 'Available';

  const actionBtn = isClaimed
    ? `<button disabled class="w-full py-4 rounded-full bg-surface-container text-outline-variant font-bold flex items-center justify-center space-x-2 cursor-not-allowed text-sm">
         <span>Item Claimed</span>
         <span class="material-symbols-outlined text-lg">check_circle</span>
       </button>`
    : `<button data-id="${id}" class="claim-btn w-full py-4 rounded-full bg-gradient-to-br from-[#89F7FE] to-[#66A6FF] text-white font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 hover:opacity-90">
         <span>Claim Item</span>
         <span class="material-symbols-outlined text-lg">arrow_forward</span>
       </button>`;

  const card = document.createElement('div');
  card.className = 'neumorphic-flat p-6 rounded-xl transition-all duration-300 neumorphic-card-hover group';
  card.innerHTML = `
    <div class="relative overflow-hidden rounded-lg mb-6 aspect-square bg-surface-container">
      ${imgContent}
      <div class="absolute top-4 left-4">
        <span class="${badgeClass} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">${badgeLabel}</span>
      </div>
    </div>
    <p class="text-xs text-outline font-medium mb-1 truncate" title="${item.studentEmailId}">
      <span class="material-symbols-outlined text-xs align-middle mr-1">person</span>${item.studentEmailId || 'Unknown'}
    </p>
    <div class="flex items-center text-on-surface-variant text-sm mb-6 space-x-2">
      <span class="material-symbols-outlined text-xs">location_on</span>
      <span class="font-medium">Station ${item.stationId || 'Unknown'}</span>
      <span class="text-outline-variant">•</span>
      <span class="font-mono text-xs">${timeAgo}</span>
    </div>
    ${actionBtn}
  `;
  return card;
}

function renderItems() {
  const q = (searchInput?.value || '').toLowerCase().trim();
  const filtered = q
    ? allItems.filter(({ item }) =>
        (item.studentEmailId || '').toLowerCase().includes(q) ||
        (item.stationId || '').toLowerCase().includes(q))
    : allItems;

  inventoryGrid.innerHTML = '';

  if (filtered.length === 0) {
    inventoryGrid.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <span class="material-symbols-outlined text-6xl text-outline-variant mb-4 block">inventory_2</span>
        <p class="text-on-surface-variant tracking-wide font-medium">No items found.</p>
      </div>`;
    return;
  }

  filtered.forEach(({ item, id }) => inventoryGrid.appendChild(createItemCard(item, id)));

  inventoryGrid.querySelectorAll('.claim-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const itemId = e.currentTarget.dataset.id;
      e.currentTarget.innerHTML = `<span>Claiming…</span>`;
      e.currentTarget.disabled  = true;
      try {
        await updateDoc(doc(db, 'lostAndFound', itemId), {
          status: 'claimed',
          claimedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Claim error:', err);
        e.currentTarget.innerHTML = `<span>Claim Item</span><span class="material-symbols-outlined text-lg">arrow_forward</span>`;
        e.currentTarget.disabled  = false;
        alert('Failed to claim item. Check the console.');
      }
    });
  });
}

function subscribe(tab) {
  if (unsubscribe) unsubscribe();

  const sortDir      = sortSelect?.value === 'asc' ? 'asc' : 'desc';
  const statusFilter = tab === 'available' ? 'stored' : 'claimed';

  const q = query(
    collection(db, 'lostAndFound'),
    where('status', '==', statusFilter),
    orderBy('storedAt', sortDir)
  );

  inventoryGrid.innerHTML = `
    <div class="col-span-full flex justify-center py-12">
      <div class="flex items-center gap-3 text-outline">
        <div class="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm font-medium">Loading…</span>
      </div>
    </div>`;

  unsubscribe = onSnapshot(q, (snapshot) => {
    allItems = snapshot.docs.map(d => ({ item: d.data(), id: d.id }));
    if (tab === 'available' && countAvailable) countAvailable.textContent = allItems.length;
    if (tab === 'claimed'   && countClaimed)   countClaimed.textContent   = allItems.length;
    renderItems();
  });

  // Keep the other tab count fresh
  const otherStatus = tab === 'available' ? 'claimed' : 'stored';
  const otherEl     = tab === 'available' ? countClaimed : countAvailable;
  onSnapshot(
    query(collection(db, 'lostAndFound'), where('status', '==', otherStatus)),
    (snap) => { if (otherEl) otherEl.textContent = snap.size; }
  );
}

window.addEventListener('tabchange', (e) => {
  currentTab = e.detail.tab;
  subscribe(currentTab);
});

sortSelect?.addEventListener('change', () => subscribe(currentTab));
searchInput?.addEventListener('input', renderItems);

if (isConfigured) {
  subscribe('available');
} else {
  inventoryGrid.innerHTML = `
    <div class="col-span-full py-12 text-center">
      <span class="material-symbols-outlined text-6xl text-outline-variant mb-4 block">inventory_2</span>
      <p class="text-on-surface-variant tracking-wide font-medium">
        Firebase not configured. Add your keys to <code class="font-mono bg-surface-container px-1 rounded">src/firebase.js</code>.
      </p>
    </div>`;
  if (countAvailable) countAvailable.textContent = '0';
  if (countClaimed)   countClaimed.textContent   = '0';
}
