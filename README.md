# 🚀 PrepMatrix — AI-Powered Placement Prep Engine

> **Autonomous technical placement preparation platform designed to parse resumes, analyze company job descriptions, compute semantic skill-gaps, and generate adaptive preparation insights using Node.js and Google Gemini.**

---

## 🌟 Key Engineering Highlights

* 🔐 **Enterprise-Grade Dual-Token Authentication:** 
  - 15-minute Access Token + 7-day Rotating Refresh Token in `httpOnly`, `SameSite` secure cookies.
  - Automated token-theft detection with a **15-second grace window** to safely handle concurrent frontend requests while instantly revoking compromised sessions on token replay.
* 🛡️ **Cryptographic & Production Hardening:**
  - Mitigated bcrypt's **72-byte silent truncation trap** by pre-hashing long refresh tokens using native Node.js `crypto` SHA-256.
  - Zero-dependency **sliding-window rate limiter** to protect auth endpoints and email dispatch from brute-force and quota drainage.
* 📄 **Zero-Disk-Write Ingestion Pipeline:**
  - High-throughput PDF upload and parsing via in-memory `multer` buffer validation and `pdf-parse` (zero local disk persistence).
* 🤖 **AI-Driven Skill Gap Analysis:**
  - Uses **Google Gemini API** for structured schema extraction and semantic alignment between candidate profile and target company job descriptions.

---

## 🛠️ Tech Stack

- **Runtime & Server:** Node.js, Express.js
- **Database & ODM:** MongoDB Atlas, Mongoose 9
- **Authentication & Security:** JWT (HS256 Locked), Bcrypt, Node.js Native Crypto
- **AI & Evaluation:** Google Gemini API
- **File Ingestion:** Multer (RAM Storage), PDF-Parse
- **Communications:** Resend API (Transactional OTP verification)

---

## 📂 Project Architecture

```text
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Auth, User, and Resume controllers
│   ├── middleware/      # verifyToken, Multer, Rate-limiters
│   ├── models/          # User & Resume schemas
│   ├── routes/          # Express REST API routes
│   ├── utils/           # Email templates, helpers
│   ├── .env.example     # Environment variable template
│   ├── index.js         # Server entrypoint
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/Garvit1908/PrepMatrix.git
cd PrepMatrix/backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file inside the `backend` directory based on `.env.example`:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_uri
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d
RESEND_API_KEY=your_resend_api_key
```

### 4. Run Development Server
```bash
npm start
```
Server will start on `http://localhost:3000`.
