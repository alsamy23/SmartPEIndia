# Secrets & Sensitive Credential Management Analysis

**Project:** `smartpeindia.app` (Smart PE India)  
**Document Type:** Secrets Audit, Key Handling & Exposure Analysis  
**Assessment Mode:** Static Codebase & Configuration Inspection (Read-Only)  
**Date:** October 2026  

---

## 1. Secrets Inventory & Expected Locations

The SmartPE platform integrates third-party AI, transactional messaging, and database backends. The table below documents every secret required by the system, its intended execution context, and storage mechanism:

| Secret Identifier | Intended Context | Purpose | Expected Storage Mechanism |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | Server-side only | Google GenAI API for lesson planning, sports coaching AI, voice transcription | Server environment variable (`process.env`) |
| `GEMINI_KEY_1` .. `GEMINI_KEY_20` | Server-side only | Multi-key failover and quota distribution for Gemini | Server environment variable (`process.env`) |
| `GROQ_API_KEY` | Server-side only | Fallback LLM inference (Llama/Qwen models) via Groq SDK | Server environment variable (`process.env`) |
| `OPENROUTER_API_KEY` | Server-side only | Multi-model routing fallback | Server environment variable (`process.env`) |
| `BREVO_API_KEY` / `SENDINBLUE_API_KEY` | Server-side & Cloud Functions | Brevo v3 Transactional Email API for welcome & notices | Server environment variable (`process.env`) |
| `RESEND_API_KEY` | Server-side & Cloud Functions | Resend API for transactional email delivery | Server environment variable (`process.env`) |
| `SMTP_PASS` / `SMTP_USER` | Server-side only | Custom domain SMTP credentials for Nodemailer | Server environment variable (`process.env`) |
| `GMAIL_APP_PASSWORD` / `GMAIL_PASS` | Server-side only | Google Workspace App Password for Nodemailer | Server environment variable (`process.env`) |
| `WEBHOOK_SECRET` | Server-side only | Shared secret signature for `/api/webhooks/auth-user-created` | Server environment variable (`process.env`) |
| Firebase Client Config (`apiKey`, `appId`, etc.) | Client-side (Public) | Firebase Web SDK connection configuration | `firebase-applet-config.json` |

---

## 2. Environment and Configuration Handling

### Server Environment (`api/index.ts` and `api/email.ts`)
- The server loads environment variables using `dotenv/config` and dynamic override loading via `dotenv.config({ override: true })` in `api/email.ts`.
- Secret access in `api/index.ts` is encapsulated in server-side functions:
  - `getGeminiKeys()`: Reads `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `API_KEY`, and `GEMINI_KEY_1` through `GEMINI_KEY_20`. It sanitizes values and validates that they do not resemble third-party provider keys.
  - `getGroqKey()`: Reads `GROQ_API_KEY`.
  - `getOpenRouterKeys()`: Reads `OPENROUTER_API_KEY` and keys matching provider prefixes.
  - `getEmailConfig()`: Reads `BREVO_API_KEY`, `RESEND_API_KEY`, `GMAIL_APP_PASSWORD`, and `SMTP_PASS`.
- **Verified Control:** The server-side code does not rely on `VITE_` prefixes for backend secrets. This prevents Vite from packaging backend secrets into the client-side browser JavaScript bundle.

### Cloud Functions Environment (`functions/src/index.ts`)
- In Cloud Functions, secrets are expected via `process.env.BREVO_API_KEY`, `process.env.SENDINBLUE_API_KEY`, and `process.env.RESEND_API_KEY` via `getEmailConfig()`.
- If keys are missing, the Cloud Function logs a warning and marks dispatch as "simulated" without throwing runtime exceptions.

### Client-Side Environment (`.env.example` vs Vite Build)
- `.env.example` includes a strict security advisory:
  - Advises developers that variables with the `VITE_` prefix are compiled into the client bundle and exposed to the public.
  - Only `VITE_GA_MEASUREMENT_ID` is prefixed with `VITE_`, intended for Google Analytics 4 public client tracking.

---

## 3. Hardcoded Secret Risks

1. **Static Analysis of Source Code:**
   - A comprehensive automated search across all project files (`.ts`, `.tsx`, `.json`, `.html`, `.js`) revealed **NO hardcoded backend API keys** for Gemini, Groq, OpenAI, Resend, Brevo, or SMTP.
   - The string in `.env.example` for Brevo is an inert dummy placeholder (`your_brevo_v3_api_key_here`).
   - In `components/BrevoSetupHub.tsx`, provider key prefix mentions appear strictly within educational UI instructions describing what an API key looks like.

2. **Firebase Web Client API Key in `firebase-applet-config.json`:**
   - Located at `/firebase-applet-config.json`.
   - **Classification:** Correctly handled secret (Standard public client credential).
   - In Google Firebase architecture, the Web API Key is designed to be shipped in client bundles to identify the project to Google Identity Toolkit and Firestore. It does not provide administrative access on its own; authorization relies on Firestore Security Rules and HTTP Referrer restrictions configured in the Google Cloud Console.

---

## 4. Client-Side Exposure Risks

### Risk Area 1: Diagnostic and Health Endpoints
- **Location:** `/api/health` (`api/index.ts` lines 263–277).
- **Behavior:** Returns `hasGemini`, `hasGroq`, `geminiCount`, `emailConfigured`, and `emailProvider`.
- **Classification:** Correctly handled secret. The endpoint returns boolean flags and key counts, never returning raw key strings or masked key fragments.

### Risk Area 2: Brevo Live Account Diagnostics
- **Location:** `/api/email/brevo/status` (`api/index.ts` lines 291–306 and `api/email.ts` lines 98–165).
- **Behavior:** The endpoint calls `https://api.brevo.com/v3/account` and `https://api.brevo.com/v3/senders` using the server-side API key. It returns:
  - Account email address
  - Account owner full name
  - Company name
  - Credit balance
  - List of active verified sender email addresses
- **Classification:** Potential exposure requiring verification (Sensitive infrastructure metadata leakage).
- **Risk:** While the raw API key is not returned, the endpoint is completely unauthenticated. Any external party can inspect organizational infrastructure details and administrator contact addresses.

### Risk Area 3: Google Identity Toolkit Proxy Call
- **Location:** `api/index.ts` lines 84–91 (`verifyFirebaseIdToken`).
- **Behavior:** The server calls Google Identity Toolkit using the public client API key imported from `firebase-applet-config.json`.
- **Classification:** Correctly handled secret. This uses the public client API key to validate user ID tokens server-side without requiring a service account key file.

---

## 5. Git and History Exposure Risks

- **Git Repository Status:**
  - Running `git status` in the root workspace returned: `fatal: not a git repository`.
  - The working directory is an exported filesystem snapshot and does not contain a local `.git` history directory.
- **Tracked Environment Files:**
  - File `.gitignore` is present in the root directory.
  - The only `.env*` file present in the repository root is `.env.example`.
  - No active `.env`, `.env.local`, or `.env.production` file containing live secrets was committed into the file tree.

---

## 6. Logging and Error Exposure Risks

### Risk Area 1: AI Service Error Messages
- **Location:** `api/index.ts` lines 825–847.
- **Behavior:** When Gemini or Groq calls fail, `lastError?.message` is checked. The code sanitizes known messages:
  ```typescript
  if (errorStr.includes("quota") || errorStr.includes("429")) {
    errorMessage = "AI generation quota is temporarily saturated...";
  } else if (lastError?.message) {
    errorMessage = lastError.message;
  }
  ```
- **Classification:** Potential exposure requiring verification.
- **Risk:** If an external SDK returns an error message containing the API key in the URL (e.g. key reflected in query parameter errors), `lastError.message` could reflect key fragments back in the HTTP response JSON to the client.

### Risk Area 2: Mail Logs in Firestore
- **Location:** `functions/src/index.ts` lines 463–475.
- **Behavior:** Error messages from transactional email delivery are recorded into `/mail_logs/{logId}`.
- **Access Control:** `firestore.rules` lines 403–406 restrict `/mail_logs` read and write strictly to `isSuperAdmin()`.
- **Classification:** Correctly handled secret. Access to error logs is protected at the database rules layer.

---

## 7. Secret Rotation Requirements

If a credential rotation is performed, the following dependencies and services must be updated:

1. **Gemini / Google AI Keys (`GEMINI_API_KEY`):**
   - Update in hosting environment variables (Vercel / Cloud Run).
   - If using rotation keys (`GEMINI_KEY_1`..`20`), update all corresponding variables simultaneously.
   - No client-side rebuild required (server reads dynamically via `process.env`).

2. **Brevo API Key (`BREVO_API_KEY`):**
   - Rotate in Brevo Dashboard.
   - Update environment variables in both the Express backend and Firebase Cloud Functions environment.

3. **Webhook Secret (`WEBHOOK_SECRET`):**
   - Update in server environment variables.
   - Update any external webhook callers (such as Firebase Auth trigger or external sync service) passing `x-webhook-secret`.

4. **Firebase Web API Key (`apiKey` in `firebase-applet-config.json`):**
   - Rotate in Google Cloud Console > APIs & Services > Credentials.
   - Update `firebase-applet-config.json` and trigger a full client bundle rebuild (`npm run build`).
   - Ensure Cloud Console API Restrictions limit the key strictly to:
     - Identity Toolkit API
     - Token Service API
     - Cloud Firestore API

---

## 8. Summary of Findings by Classification

### Confirmed Exposed Secret
- **None.** No live production backend secrets or private keys were found committed to the repository files or embedded in client assets.

### Correctly Handled Secret
1. **Gemini & Groq Backend Keys:** Stored in `process.env`, queried strictly server-side in `api/index.ts`, never passed to client bundle.
2. **Brevo & SMTP Credentials:** Loaded server-side in `api/email.ts` without client `VITE_` prefixes.
3. **Firebase Client Web API Key:** Stored in `firebase-applet-config.json`, matches Google standard architecture for public client credentials.

### Potential Exposure Requiring Verification
1. **Raw Error Message Reflection in AI Proxy:**
   - **Location:** `api/index.ts` line 840 (`errorMessage = lastError.message`).
   - **Risk:** Certain upstream SDK errors may echo query parameters containing key fragments.
2. **Brevo Account Metadata Exposure:**
   - **Location:** `api/index.ts` lines 291–306 (`/api/email/brevo/status`).
   - **Risk:** Publicly readable without authentication, exposing administrator email, organization name, and verified senders list.

### Secret Reference Only
1. `.env.example`: Contains empty configuration variable names and dummy placeholder strings.
2. `components/BrevoSetupHub.tsx`: Contains instructional reference strings explaining API key format to educators.
