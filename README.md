# CampusHub 🏫♻️

A smart campus management web app with:
- **Lost & Found Gallery** — real-time item tracking with photo upload
- **Waste Segregator Stats** — live E-Waste / Dry / Wet counts + weekly chart
- **Smart Scan Station** — QR scan to store or retrieve items, with camera capture
- **Dashboard** — overview of all bins, recent submissions, station health

---

## 🚀 Quick Setup

### 1 — Add Your Firebase Config

Open `src/firebase.js` and replace the placeholder values with your project's config from the [Firebase Console](https://console.firebase.google.com):

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

### 2 — Enable Firebase Services

In the Firebase Console for your project:

| Service | Instructions |
|---------|-------------|
| **Firestore Database** | Build → Firestore → Create database (start in test mode) |
| **Authentication** *(optional)* | Build → Authentication → Enable Email/Google |
| **Hosting** *(optional)* | Build → Hosting → Get started |

### 3 — Firestore Collections

The app uses these collections automatically:

| Collection | Fields | Description |
|------------|--------|-------------|
| `lostAndFound` | `studentEmailId`, `itemPhotoUrl` (base64), `storedAt`, `status` (`stored`/`retrieved`/`claimed`), `stationId` | Lost items |
| `segregatorStats` | Document ID = `YYYY-MM-DD`, fields: `eWaste`, `dryWaste`, `wetWaste` (numbers) | Daily waste counts |
| `stations` | `unlockBox` (boolean), `lastActivity` | Hardware control |

### 4 — Run Locally

Since the app uses ES modules, serve it with any local server:

```bash
# Option A: Python (built-in)
python3 -m http.server 3000

# Option B: Node.js (npx)
npx serve .

# Option C: VS Code — install "Live Server" extension and click "Go Live"
```

Then open: **http://localhost:3000**

### 5 — Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting      # set public dir to "." or your folder
firebase deploy
```

---

## 📁 File Structure

```
campushub/
├── index.html              ← Dashboard
├── lost-and-found.html     ← Lost & Found gallery
├── scan.html               ← Smart station QR scanner (mobile)
├── stats.html              ← Waste segregation analytics
├── favicon.svg
├── src/
│   ├── firebase.js         ← ⚠️ ADD YOUR CONFIG HERE
│   ├── dashboard.js        ← Dashboard Firebase logic
│   ├── lost-and-found.js   ← L&F gallery + claim logic
│   ├── scan.js             ← QR scan + photo capture + Firestore write
│   └── stats.js            ← Live waste counts + Chart.js
└── css/
    ├── index.css           ← Design tokens (dark theme variant)
    ├── components.css      ← Reusable component styles
    └── pages.css           ← Page-level styles
```

## 🔒 Scan Station Security

The `scan.html` page requires a `?station=<ID>` URL parameter. Without it, access is denied. Physical QR codes at each station should link to:

```
https://your-domain.com/scan.html?station=station_01
```

---

## 🛠 Tech Stack

- **HTML / CSS / JavaScript** — no build step needed
- **Tailwind CSS** — via CDN
- **Firebase Firestore** — real-time database (ES module SDK v10)
- **Chart.js** — weekly analytics chart
- **html5-qrcode** — QR code scanning
- **Google Fonts** — Plus Jakarta Sans, Inter, JetBrains Mono
- **Material Symbols** — icons
