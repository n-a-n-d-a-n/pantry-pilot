<div align="center">

# 🌿 PantryPilot

### AI-Powered, 100% Vegetarian Zero-Waste Kitchen Assistant

Snap a photo. Gemini handles the rest - expiry tracking, zero-waste recipes, and pantry management, entirely in Hindi or English.

</div>

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🎯 The Problem

India wastes an estimated **68 million tonnes of food annually**, and at a household level it almost always comes down to the same thing: nobody remembers what's in the fridge until it's already spoiled. Existing pantry-tracking apps require manual logging of every item - which is exactly why adoption drops off within a week.

**PantryPilot removes manual entry entirely. A photo is the only input the app needs.**

---

## ✨ Key Features

### 📸 Frictionless Image-to-Inventory
Live camera capture or drag-and-drop upload of groceries, an open fridge, or a receipt. Gemini's multimodal vision extracts item names, quantities, and shelf-life estimates via strict `responseSchema` structured JSON output - zero manual typing.

### 🧾 Receipt Scan Mode (OCR)
Photograph a receipt and line items are parsed directly into inventory with realistic home shelf-life estimates.

### 🚦 Color-Coded Urgency Dashboard
Real-time filtering by urgency, storage location, and category - backed by live Firestore sync across devices.

### 👨‍🍳 "Cook This" Zero-Waste Recipe Generator
Generates recipes engineered to rescue whichever ingredients are closest to expiry, with difficulty rating, cook time, and a one-tap "I Cooked This" action that closes the loop back into inventory and the Zero-Waste Score.

### 🇮🇳 Built for India, Not Adapted for It
- **100% vegetarian by design** - Gemini's vision and recipe pipelines hard-exclude meat, poultry, fish, and eggs at the prompt level, with skipped items surfaced transparently rather than silently dropped.
- **Native ₹ reasoning** - pricing and savings estimates are grounded in realistic Indian grocery prices, not a currency symbol applied over USD-flavored numbers.
- **Bilingual recipes** - every recipe renders in English and Hindi (हिन्दी) with natural translation and a one-tap language toggle.

### 📊 Waste & Impact Insights
7-day recipe-rescue trend chart, Zero-Waste Score, and estimated money saved - computed from real usage data.

### 🌗 Dark Mode & Glassmorphism UI
Full light/dark theming with system-preference detection, and a warm-minimalist glass aesthetic throughout.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4 |
| **Build Tool** | Vite |
| **AI / Vision** | Gemini 3.7 Flash (primary) → Gemini 2.5 Flash (fallback) |
| **Auth** | Firebase Authentication (Email/Password + Google Sign-In) |
| **Database** | Cloud Firestore (real-time listeners, owner-scoped security rules) |
| **Charts** | Recharts |
| **Server** | Node.js (tsx / esbuild) |

---

## 🏗️ Architecture

- **AI Reliability:** Three-tier model fallback chain with jittered exponential backoff retry, plus fail-safe fallback content generation across all AI endpoints - the app never shows a broken state, even during Gemini API congestion.
- **Data Isolation:** Every Firestore read/write is scoped to `users/{uid}/...` with default-deny security rules and per-field schema validation on writes.
- **Honest Failure States:** An unrecognized photo shows a clear "couldn't identify anything" message rather than fabricating placeholder inventory.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)
- A [Gemini API key](https://ai.google.dev/)
- A [Firebase project](https://console.firebase.google.com/) with Authentication and Firestore enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/n-a-n-d-a-n/pantrypilot.git
cd pantrypilot

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Run the development server
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

### Build for Production

```bash
npm run build
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

You'll also need to add your Firebase project configuration — see `firebase-applet-config.json` for the expected shape (do **not** commit real production credentials to a public repo; use environment-specific config or Firebase's recommended client-config practices for public repos).

---

## 📁 Project Structure

```
pantrypilot/
├── src/
│   ├── components/       # UI components (modals, dashboard, navbar)
│   ├── context/          # React context (Theme, Auth, Firebase Health)
│   ├── services/         # Firestore service layer
│   ├── lib/               # Utilities (currency formatting, Firebase init)
│   └── data/              # Seed/sample data
├── server.ts              # Gemini API integration & endpoints
├── firestore.rules        # Firestore security rules
└── vite.config.ts
```

---

## 🔒 Security

- Firestore security rules enforce strict per-user data isolation (`users/{uid}/...`), verified against unauthorized cross-user access paths.
- All AI-generated content passes through explicit vegetarian-exclusion guardrails at the prompt level.
- API keys are handled per Firebase's standard client-side security model, where the Firestore rules — not the API key — form the actual security boundary.

---

## 🗺️ Roadmap

- [ ] Shopping-list auto-generation from recurring waste patterns
- [ ] Push notifications for expiring items
- [ ] Expanded recipe fallback for items with no direct match

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

**Built by [Nandan Kabra](https://github.com/n-a-n-d-a-n)**  
B.Tech AI & Data Science, Vishwakarma Institute of Technology, Pune

</div>
