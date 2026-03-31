// =============================================
// Segregator Stats — stats.js
// =============================================
import { db, isConfigured } from './firebase.js';
import {
  doc, onSnapshot, collection, getDocs, query, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const ewasteCount   = document.getElementById('ewaste-count');
const drywasteCount = document.getElementById('drywaste-count');
const wetwasteCount = document.getElementById('wetwaste-count');

function getTodayDateString() {
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Live today's counts ─────────────────────────────────────────────────────
if (isConfigured) {
  const todayDocName  = getTodayDateString();
  const todayStatsRef = doc(db, 'segregatorStats', todayDocName);

  onSnapshot(todayStatsRef, (docSnap) => {
    const data = docSnap.exists() ? docSnap.data() : {};
    if (ewasteCount)   ewasteCount.textContent   = data.eWaste   || 0;
    if (drywasteCount) drywasteCount.textContent = data.dryWaste || 0;
    if (wetwasteCount) wetwasteCount.textContent = data.wetWaste || 0;
  });
} else {
  console.warn('Using demo data — Firebase not configured.');
}

// ─── Weekly Chart ─────────────────────────────────────────────────────────────
async function renderChart() {
  const canvas = document.getElementById('wasteChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  let eData  = [0, 0, 0, 0, 0, 0, 0];
  let dryData = [0, 0, 0, 0, 0, 0, 0];
  let wetData = [0, 0, 0, 0, 0, 0, 0];

  if (isConfigured) {
    try {
      // Fetch last 7 documents from segregatorStats ordered by name (ISO date → alphabetical = chronological)
      const q = query(collection(db, 'segregatorStats'), orderBy('__name__', 'desc'), limit(7));
      const snap = await getDocs(q);
      const docs = snap.docs.reverse(); // oldest first

      docs.forEach((d, i) => {
        const data = d.data();
        eData[i]   = data.eWaste   || 0;
        dryData[i] = data.dryWaste || 0;
        wetData[i] = data.wetWaste || 0;
      });
    } catch (err) {
      console.warn('Could not fetch chart data:', err);
      // Fall through to demo data
      eData   = [4, 8, 12, 5, 10, 7, 3];
      dryData = [30, 45, 38, 52, 41, 60, 35];
      wetData = [20, 28, 22, 35, 30, 42, 25];
    }
  } else {
    // Demo data
    eData   = [4, 8, 12, 5, 10, 7, 3];
    dryData = [30, 45, 38, 52, 41, 60, 35];
    wetData = [20, 28, 22, 35, 30, 42, 25];
  }

  const gradient = ctx.createLinearGradient(0, 400, 0, 0);
  gradient.addColorStop(0, '#89F7FE');
  gradient.addColorStop(1, '#66A6FF');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DAY_LABELS,
      datasets: [
        {
          label: 'E-Waste',
          data: eData,
          backgroundColor: 'rgba(16,185,129,0.7)',
          borderRadius: 10,
          barPercentage: 0.5,
          borderSkipped: false
        },
        {
          label: 'Dry Waste',
          data: dryData,
          backgroundColor: gradient,
          borderRadius: 10,
          barPercentage: 0.5,
          borderSkipped: false
        },
        {
          label: 'Wet Waste',
          data: wetData,
          backgroundColor: 'rgba(245,158,11,0.7)',
          borderRadius: 10,
          barPercentage: 0.5,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          display: false,
          beginAtZero: true,
          stacked: false
        },
        x: {
          grid: { display: false, drawBorder: false },
          ticks: {
            font: { family: 'JetBrains Mono', size: 11 },
            color: '#A0AEC0'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { family: 'Plus Jakarta Sans', size: 11 },
            color: '#A0AEC0',
            boxWidth: 12,
            boxHeight: 12,
            borderRadius: 4
          }
        },
        tooltip: {
          backgroundColor: '#2D3748',
          padding: 12,
          cornerRadius: 8,
          titleFont: { family: 'Plus Jakarta Sans', size: 13 },
          bodyFont: { family: 'JetBrains Mono', size: 13 }
        }
      }
    }
  });
}

window.addEventListener('DOMContentLoaded', renderChart);
