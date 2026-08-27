# 🎪 EventCulture — Full-Stack Event Operations Platform

<div align="center">

[![Live Backend](https://img.shields.io/badge/Live_API-eventculture--backend.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://eventculture-backend.vercel.app/)
[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_54-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend_API-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_ODM-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-443e38?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge)](LICENSE)

### **ONE SCAN. ZERO QUEUES.**
*A high-concurrency, cryptographic QR-based event operations ecosystem eliminating registration bottlenecks, paper badges, and meal voucher chaos.*

🌐 **Production API URL:** [https://eventculture-backend.vercel.app](https://eventculture-backend.vercel.app/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Application Showcase](#-application-showcase)
- [System Architecture](#-system-architecture)
- [Ecosystem Breakdown](#-ecosystem-breakdown)
  - [1. Backend API (`eventculture-backend`)](#1-backend-api-eventculture-backend)
  - [2. Organizer App (`eventculture-organizer`)](#2-organizer-app-eventculture-organizer)
  - [3. Participant App (`eventculture-user`)](#3-participant-app-eventculture-user)
  - [4. Volunteer Scanner App (`eventculture-volunteer`)](#4-volunteer-scanner-app-eventculture-volunteer)
- [Repository Structure](#-repository-structure)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Step 1: Backend Setup & Seeding](#step-1-backend-setup--seeding)
  - [Step 2: Organizer App](#step-2-organizer-app)
  - [Step 3: Participant User App](#step-3-participant-user-app)
  - [Step 4: Volunteer Scanner App](#step-4-volunteer-scanner-app)
- [Demo Credentials](#-demo-credentials-ready-after-seed)
- [Environment Configuration](#-environment-configuration)
- [API Reference](#-api-reference)
- [Concurrency & Security Model](#-concurrency--security-model)
- [Contributing & License](#-contributing--license)

---

## ⚡ Overview

**EventCulture** is an enterprise-ready event management and real-time pass validation suite. Designed for hackathons, tech conferences, college fests, and large-scale summits, EventCulture unifies the entire attendee lifecycle into three dedicated mobile applications powered by a resilient, atomic backend:

1. **Organizers** can create multi-track events, bulk import attendees from CSV (Google Forms, Devfolio, Eventbrite), define custom pass types (Entry, Food, Kit, Workshop), assign volunteer scanning privileges, and monitor live check-in telemetry.
2. **Attendees (Users)** instantly view dynamic, cryptographically signed digital QR passes on their phones with live status indicators and event schedules without needing physical printouts.
3. **Volunteers (Gate / Desk Staff)** utilize ultra-fast camera barcode scanning with sub-50ms atomic server validation, offline-tolerant visual feedback, and role-scoped permissions preventing unauthorized access or double-redemption.

---

## 📱 Application Showcase

<div align="center">

| 🏢 **Organizer App** | 🎟️ **Participant App** | 📷 **Volunteer Scanner** |
| :---: | :---: | :---: |
| <img src="./organizer.png" width="280" alt="Organizer App" /> | <img src="./user.png" width="280" alt="Participant App" /> | <img src="./volunteer.png" width="280" alt="Volunteer App" /> |
| *Event analytics, CSV import, pass creation & volunteer control* | *Digital QR passes, dynamic pass status & event details* | *Fast camera QR scanner, live audio/visual validation modal* |

</div>

---

## 🏗️ System Architecture

```text
                                 ┌───────────────────────────┐
                                 │   EventCulture Backend    │
                                 │ (Node.js / Express / JWT) │
                                 └─────────────┬─────────────┘
                                               │
                       ┌───────────────────────┼───────────────────────┐
                       │                       │                       │
                       ▼                       ▼                       ▼
            ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
            │   Organizer App     │ │  Participant App    │ │   Volunteer App     │
            │  (React Native)     │ │  (React Native)     │ │  (React Native)     │
            │                     │ │                     │ │                     │
            │ • Event Config      │ │ • Dynamic QR Passes │ │ • Camera Scanner    │
            │ • CSV Data Import   │ │ • Check-in History  │ │ • Instant Validation│
            │ • Volunteer Access  │ │ • Offline Token Gen │ │ • Scope Permission  │
            │ • Live Analytics    │ │ • Multi-pass Wallet │ │ • Multi-Org Switch  │
            └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
                       │                       │                       │
                       └───────────────────────┼───────────────────────┘
                                               │
                                 ┌─────────────┴─────────────┐
                                 │    MongoDB Atlas Cluster  │
                                 │ (Atomic $inc Transactions)│
                                 └───────────────────────────┘
```

---

## 📦 Ecosystem Breakdown

### 1. Backend API (`eventculture-backend`)
- **Technology**: Node.js, Express.js, MongoDB Atlas (Mongoose ODM).
- **Authentication**: JWT access & refresh tokens, passwordless Email OTP / SMS verification.
- **Atomic Operations**: Prevents race conditions and double-scan fraud using MongoDB atomic `$inc` updates and state locks.
- **CSV Dynamic Ingestion**: Handles raw exports from Google Forms, Devfolio, Eventbrite, or custom forms with intelligent column matching.
- **Media CDN**: Cloudinary integration for lightning-fast image delivery (event banners, organizer avatars).
- **Email Delivery**: Automated transactional pass delivery and OTP broadcasting via Nodemailer.

### 2. Organizer App (`eventculture-organizer`)
- **Event Lifecycle Hub**: Create and publish events, configure venue details, upload banner artwork, and set registration limits.
- **Pass Engine**: Issue multi-tier access tiers (`ENTRY`, `FOOD`, `GOODIE_BAG`, `WORKSHOP`, `VIP`).
- **Bulk CSV Importer**: Preview, map headers, and generate hundreds of encrypted passes in seconds.
- **Staff & Volunteer Control**: Issue access pins, revoke permissions, and monitor check-in statistics in real time.

### 3. Participant App (`eventculture-user`)
- **Mobile Ticket Wallet**: High-resolution, dynamic QR codes rendered natively with `react-native-qrcode-svg`.
- **Pass State Visualizer**: Real-time status badges (`ACTIVE`, `CHECKED_IN`, `EXPIRED`, `REVOKED`).
- **Persistent Offline Storage**: Secure token caching with Expo Secure Store ensures passes load even in venues with weak cellular signal.

### 4. Volunteer Scanner App (`eventculture-volunteer`)
- **High-Speed Scanner**: Powered by `expo-camera` (`CameraView`) with continuous multi-format barcode parsing.
- **Instant Decision Feedback**: Visual and tactile cues for successful entry, duplicate attempts, or expired passes.
- **Permission Scoping**: Restricts scanning based on volunteer duties (e.g., lunch desk staff cannot validate VIP workshop entries).
- **Multi-Organizer Workspace Switcher**: Seamlessly switch between different events and organizers on a single device.

---

## 📂 Repository Structure

```text
Event-Culture/
├── eventculture/
│   ├── eventculture-backend/       # Express.js REST API & MongoDB models
│   │   ├── api/                    # Serverless/Vercel API entrypoints
│   │   ├── src/                    # Controllers, middlewares, routes, services
│   │   ├── public/                 # Privacy policies & hosted static assets
│   │   └── package.json
│   │
│   ├── eventculture-organizer/     # React Native Expo app for Event Managers
│   │   ├── app/                    # Expo Router file-based screens
│   │   ├── components/             # Reusable UI component library
│   │   ├── hooks/ / services/      # API clients & state managers
│   │   └── package.json
│   │
│   ├── eventculture-user/          # React Native Expo app for Attendees
│   │   ├── app/                    # Participant routes (passes, profile, details)
│   │   ├── components/             # Digital pass cards, modals, buttons
│   │   └── package.json
│   │
│   └── eventculture-volunteer/     # React Native Expo app for Gate Volunteers
│       ├── app/                    # Scanner screen, history, switcher
│       ├── components/             # Scanner overlays, validation dialogs
│       └── package.json
│
├── organizer.png                   # Organizer app preview screenshot
├── user.png                        # User app preview screenshot
├── volunteer.png                   # Volunteer scanner preview screenshot
├── participants_import.csv         # Sample bulk import template
└── README.md                       # Documentation root
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **Expo Go App** (iOS / Android) or a configured Simulator / Emulator
- **MongoDB Atlas** database connection string (or local MongoDB)

---

### Step 1: Backend Setup & Seeding

```bash
# Navigate to backend directory
cd eventculture/eventculture-backend

# Install dependencies
npm install

# Setup environment variables (copy and fill in .env)
cp .env.example .env

# Populate database with demo organizers, volunteers, events, and passes
npm run seed

# Launch the development server
npm run dev
# Server running at: http://localhost:5000
```

---

### Step 2: Organizer App

```bash
# In a new terminal window
cd eventculture/eventculture-organizer

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```
*Press `a` for Android Emulator, `i` for iOS Simulator, or scan the QR code using Expo Go on your physical phone.*

---

### Step 3: Participant User App

```bash
# In a new terminal window
cd eventculture/eventculture-user

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

---

### Step 4: Volunteer Scanner App

```bash
# In a new terminal window
cd eventculture/eventculture-volunteer

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

---

## 🔑 Demo Credentials (Ready After `npm run seed`)

The database seeder automatically initializes the following accounts for instant testing:

| Application | Test Identifier | Password / OTP | Permissions & Roles |
| :--- | :--- | :--- | :--- |
| **Organizer App** | `organizer@eventculture.io` | `Password123!` *(or console OTP)* | Event Creator, CSV Importer, Pass Issuer, Analytics |
| **Participant App** | `1234567890` (or `+1234567890`) | Printed in backend console | Attendee (Jordan Smith) with Entry, Lunch, Kit & Workshop Passes |
| **Volunteer (All-Access)** | `volunteer@eventculture.io` | Printed in backend console | Scanner with All Scopes (`ENTRY`, `FOOD`, `GOODIE_BAG`, `WORKSHOP`) |
| **Volunteer (Entry-Only)** | `volunteer.entry@eventculture.io` | Printed in backend console | Gate Check-in (`ENTRY` scope only) |
| **Volunteer (Food Desk)** | `volunteer.food@eventculture.io` | Printed in backend console | Meal counter (`FOOD` & `GOODIE_BAG` scopes only) |

> [!TIP]
> When running in local development mode, all 6-digit OTP authentication codes are printed directly to the **backend terminal window** for quick copy-paste testing without needing a live email server.

---

## ⚙️ Environment Configuration

Create a `.env` file in `eventculture/eventculture-backend/` based on `.env.example`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas / local connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/eventculture` |
| `JWT_SECRET` | Secret key for signing authorization tokens | `super_secret_jwt_key_here` |
| `JWT_REFRESH_SECRET` | Secret key for long-lived refresh tokens | `super_secret_refresh_key_here` |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary cloud name for media assets | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_api_key` |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret | `your_api_secret` |
| `EMAIL_USER` / `PASS` | SMTP credentials for Nodemailer | `noreply@eventculture.io` |

---

## 📡 API Reference

### Base URLs
- **Production (Vercel):** `https://eventculture-backend.vercel.app`
- **Local Development:** `http://localhost:5000`

### Authentication
- `POST /api/auth/organizer/login` — Organizer login with email and password / OTP
- `POST /api/auth/user/login` — Participant passwordless login with phone / email
- `POST /api/auth/volunteer/login` — Volunteer authorization & permission handshake
- `POST /api/auth/verify-otp` — Verify 6-digit OTP and generate JWT

### Events & Passes
- `GET /api/events` — Fetch active event list with banners and metadata
- `POST /api/events` — Create a new event with custom pass tiers
- `POST /api/participants/import-csv` — Bulk parse and ingest CSV records
- `GET /api/passes/my-passes` — Retrieve digital wallet passes for current attendee
- `POST /api/passes/validate` — Volunteer camera validation endpoint (atomic check-in)

### Legal & Hosted Pages
- `GET /privacy-organizer.html` — [Organizer App Privacy Policy](https://eventculture-backend.vercel.app/privacy-organizer.html)
- `GET /privacy-user.html` — [Participant App Privacy Policy](https://eventculture-backend.vercel.app/privacy-user.html)
- `GET /privacy-volunteer.html` — [Volunteer Scanner App Privacy Policy](https://eventculture-backend.vercel.app/privacy-volunteer.html)

---

## 🔒 Concurrency & Security Model

- **Atomic Redemption**: QR pass validation uses MongoDB `$inc` operations and transaction locking to guarantee that two volunteers scanning the exact same pass at two different gates at the exact same millisecond will never result in double check-in.
- **Hardware-Backed Tokens**: All mobile sessions use Expo Secure Store to keep authentication tokens encrypted at rest on device hardware.
- **Dynamic QR Signatures**: QR tokens follow the `evtpass_<hash>` signature format, verifiable only through the backend API with timestamp and nonce protection.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with ❤️ for organizers, attendees, and volunteers worldwide.</sub>
</div>