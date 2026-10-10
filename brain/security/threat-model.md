# SmartPE India — Threat Model & Security Architecture Analysis

**Target Application:** `smartpeindia.app` (Smart PE India — Digital Physical Education & Sports Coaching Platform)  
**Evaluation Scope:** Complete application repository (React 18 frontend, Express/Vite backend server, Cloud Functions, Firestore Security Rules, and external integration points).  
**Assessment Mode:** Read-Only Static and Architectural Security Assessment.  
**Date of Audit:** October 2026  

---

## 1. Executive Summary & Architecture Overview

SmartPE India is a specialized educational SaaS platform designed for Indian physical education teachers, school administrators, and private sports academies. The application facilitates curriculum planning, Khelo India fitness tests, CBSE Board Class 12 practical assessments, and sports coaching management.

The system utilizes a hybrid full-stack architecture:
1. **Frontend:** React 18 SPA built with Vite, Tailwind CSS, Lucide icons, and client-side PDF generation (`jspdf`, `jspdf-autotable`).
2. **Server / API Tier:** Express.js (`api/index.ts`) serving proxy routes for AI generation (`/api/ai/generate`, `/api/ai/transcribe`), transactional email dispatch (`/api/email/*`), and automated webhooks (`/api/webhooks/*`).
3. **Identity & Storage Tier:** Firebase Authentication (Email/Password, Google OAuth), Cloud Firestore (multi-tenant document store), and Firebase Cloud Functions (`functions/src/index.ts`).
4. **Third-Party Services:** Google Gemini API (`@google/genai`), Groq SDK (`groq-sdk`), Brevo (formerly Sendinblue) REST API, Resend REST API, and Nodemailer (SMTP).

---

## 2. Sensitive Assets

| Asset ID | Asset Name | Description | Sensitivity | Primary Storage / Flow |
| :--- | :--- | :--- | :--- | :--- |
| **A-01** | Student Personal & Demographic Data | Full name, age, gender, date of birth, roll number, section, school ID. | High (Minor PII / DPDP Act 2023) | Firestore (`students`), `localStorage`, Excel/PDF reports |
| **A-02** | Student Health & Fitness Biometrics | Height, weight, BMI, Khelo India battery test metrics (endurance, speed, agility, flexibility, strength). | High (Health/Biometric Data) | Firestore (`results`, `interventions`), `localStorage` |
| **A-03** | CBSE Board Assessment Marks | Class 12 Practical Viva scores, physical efficiency test marks, examiner UID. | Critical (Academic Integrity) | Firestore (`practical_assessments`) |
| **A-04** | Sports Academy Player Records | Athlete profiles, parent contact numbers, skill evaluations, squad assignments. | High (Minor PII & Performance) | Firestore (`academic_athletes`, `academic_assessments`), `localStorage` |
| **A-05** | Educator & Coach Credentials | Email addresses, passwords (managed by Firebase Auth), display names, school affiliations. | Critical | Firebase Auth, Firestore (`users`, `schoolMembers`) |
| **A-06** | System API Keys & Provider Secrets | Google Gemini API keys, Groq API keys, Brevo API key, Resend API key, SMTP credentials, Webhook secret. | Critical | Server Environment (`process.env`) |
| **A-07** | Outbound Transactional Email Channel | Brevo/Resend/SMTP outbound mail relays configured on the server. | High (Domain Reputation & Spam Abuse) | Server API (`/api/email/*`, `/api/webhooks/*`) |

---

## 3. Trust Boundaries

```
[ Public Internet / Untrusted Anonymous Users ]
                       │
               Boundary 1 (Network / HTTP Requests)
                       ▼
         [ Express Server (api/index.ts) ]
            ├── /api/health
            ├── /api/email/test               <-- [VULNERABILITY: No Auth Boundary]
            ├── /api/webhooks/auth-user-created <-- [VULNERABILITY: Bypassable Auth Boundary]
            ├── /api/ai/generate              <-- Optional Auth
            └── /api/ai/transcribe            <-- Optional Auth
                       │
               Boundary 2 (Token Verification)
                       ▼
  [ Google Identity Toolkit accounts:lookup API ]
                       │
               Boundary 3 (Client SDK -> Firebase Cloud)
                       ▼
     [ Cloud Firestore Security Rules Engine ]
            ├── match /schools/{schoolId}
            ├── match /students/{studentId}
            ├── match /academic_programs/{programId} <-- [VULNERABILITY: Public read condition]
            └── match /{document=**}                 <-- [WEAKNESS: Unverified SuperAdmin email]
                       │
               Boundary 4 (External Provider APIs)
                       ▼
   [ Google Gemini / Groq / Brevo / Resend APIs ]
```

- **Trust Boundary 1 (Client ↔ Server):** Untrusted web browsers communicating with Express HTTP endpoints.
- **Trust Boundary 2 (Server ↔ Firebase Identity):** Server authenticating client bearer tokens using Google Identity Toolkit lookup.
- **Trust Boundary 3 (Browser ↔ Cloud Firestore):** Direct client-to-database communication governed strictly by `firestore.rules`.
- **Trust Boundary 4 (Server ↔ Third-Party APIs):** Server dispatching prompts to LLM providers (Gemini, Groq) and emails to transactional providers (Brevo, Resend).
- **Trust Boundary 5 (Tenant Isolation Boundary):** Logical separation between School A vs School B, and School Tenant vs Sports Academy Tenant.
- **Trust Boundary 6 (User ↔ Admin Boundary):** Ordinary teacher/coach accounts versus School Admin and Global Super Admin.

---

## 4. Relevant Actors & Threat Agents

1. **Anonymous Remote Attacker:** Internet user with no credentials, capable of sending arbitrary HTTP requests to public server endpoints.
2. **Authenticated Rogue User (Educator/Coach):** Legitimate user registered in the system who attempts to read or modify records belonging to other schools or academies.
3. **Malicious Student / Parent:** End-user with access to shared devices or portal links attempting to manipulate assessment marks or access classmate data.
4. **Insider / Compromised Staff Account:** Account whose credentials have been leaked or spoofed to escalate privileges to Super Admin.

---

## 5. Actual Entry Points

- **HTTP Endpoints (Express):**
  - `GET /api/health`: Public system health and provider status.
  - `GET /api/email/status`: Public email provider configuration status.
  - `GET /api/email/brevo/status`: Public Brevo account and sender verification check.
  - `POST /api/email/test`: Public unauthenticated email dispatch endpoint.
  - `POST /api/email/welcome`: Authenticated corporate welcome email dispatch (`requireAuth`).
  - `POST /api/email/nurture/trigger`: Authenticated nurture sequence email trigger (`requireAuth`).
  - `POST /api/email/nurture/evaluate`: Authenticated nurture status evaluator (`requireAuth`).
  - `GET /api/email/nurture/preview`: Public email template HTML preview.
  - `POST /api/webhooks/auth-user-created`: Ingestion webhook for new user welcome sequences.
  - `POST /api/email/announcement`: Super-admin only corporate broadcast email dispatch (`requireAdmin`).
  - `GET /api/ai/test`: Diagnostic LLM connectivity check.
  - `POST /api/ai/generate`: AI generation proxy (`optionalAuth`).
  - `POST /api/ai/transcribe`: Audio transcription proxy (`optionalAuth`).
- **Direct Database Entry Points (Firestore Client SDK):**
  - All read/write operations targeting Firestore collections from client browser.
- **File Upload Surfaces:**
  - Base64 audio payload in `POST /api/ai/transcribe`.
  - Client-side Excel `.xlsx` / `.csv` imports in `components/coaching/StudentImportModal.tsx` and `components/coaching/SchoolManagementExcelModal.tsx`.

---

## 6. Detailed Data-Flow Analysis

### Flow 1: Student & Assessment Data Management
- **Source:** Teacher/Coach browser form input or Excel file upload.
- **Processing:** Client-side parsing and BMI/Khelo India calculation (`services/fitnessService.ts`, `services/physicalDevelopmentEngine.ts`).
- **Authorization Boundary:** Client-side Firebase SDK directly invokes Firestore; checked against `firestore.rules`.
- **Storage:** Cloud Firestore (`students`, `results`, `practical_assessments`) AND duplicated to browser `localStorage` (`smartpe_offline_students`).
- **Output:** Rendered in web dashboard, downloaded as client-generated PDF/Excel (`jspdf-autotable`, `xlsx`).
- **External Services:** None directly during CRUD; metrics optionally sent to AI generation endpoint during report narrative synthesis.

### Flow 2: AI Lesson Planning & Physical Development Guidance
- **Source:** User input prompt or student metric payload.
- **Processing:** Prompt formatting in `services/geminiService.ts` or `services/physicalDevelopmentAiService.ts`.
- **Authorization Boundary:** `POST /api/ai/generate` passing optional Bearer token; rate-limited in-memory.
- **Storage:** Ephemeral on server; output persisted in client state or Firestore.
- **Output:** JSON / text response rendered in UI.
- **External Services:** Outbound HTTPS call from Express server to Google Gemini API (`generativelanguage.googleapis.com`) or Groq API (`api.groq.com`).

### Flow 3: Transactional & Nurture Email Dispatch
- **Source:** Client registration event, manual UI trigger, or automated webhook.
- **Processing:** Template construction in `api/email.ts` or `functions/src/index.ts`.
- **Authorization Boundary:** Checked via `requireAuth`, `requireAdmin`, or secret header in `api/index.ts`.
- **Storage:** Optional Firestore audit log (`mail_logs`, `login_activity`).
- **Output:** SMTP / HTTP REST dispatch to Brevo or Resend.
- **External Services:** `api.brevo.com` or `api.resend.com` or configured SMTP server.

---

## 7. Verified Findings & Realistic Attack Scenarios

### Finding TM-01: Public Unauthenticated Email Relay via `/api/email/test`

**Classification:** Confirmed vulnerability  
**Severity:** High  
**Affected location:** `/api/index.ts`, lines 309–372 (`apiRouter.post("/email/test")`)  
**Evidence:**
```typescript
// /api/index.ts lines 309-317
apiRouter.post("/email/test", async (req, res) => {
  try {
    const { toEmail } = req.body;
    const targetEmail = toEmail || "alsamy36@gmail.com";
    if (!targetEmail || typeof targetEmail !== "string" || !targetEmail.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid recipient email address is required" });
    }
    ...
    const result = await dispatchEmail(targetEmail, testSubject, testHtml, testText);
```
No `requireAuth` or `requireAdmin` middleware is attached to this route. Furthermore, no `checkRateLimit` call is made.  
**Attacker Prerequisites:** None. Accessible to any anonymous client on the public internet.  
**Risk:** An external attacker can execute an automated loop sending POST requests with arbitrary target recipient email addresses. Because `dispatchEmail()` triggers real external calls to Brevo (`api.brevo.com`), Resend, or SMTP, the attacker can:
1. Exhaust the organization's monthly Brevo/Resend API quota and balance.
2. Cause the verified sender domain (`smartpeindia.app` / `smartpeindia.com`) to be flagged for spamming arbitrary recipients.
3. Use the system as an open spam relay for promotional or phishing harassment.  
**Why it matters:** Threatens platform domain reputation, causes financial denial-of-service via API credit exhaustion, and abuses platform infrastructure.  
**Recommended fix:** Restrict `POST /api/email/test` to authenticated super administrators using `requireAdmin` middleware, or disable the route entirely in production environments (`process.env.NODE_ENV === 'production'`).

---

### Finding TM-02: Webhook Authentication Bypass When `WEBHOOK_SECRET` is Unset

**Classification:** Confirmed vulnerability  
**Severity:** High  
**Affected location:** `/api/index.ts`, lines 554–563 (`apiRouter.post("/webhooks/auth-user-created")`)  
**Evidence:**
```typescript
// /api/index.ts lines 554-563
apiRouter.post("/webhooks/auth-user-created", async (req, res) => {
  try {
    const secret = req.headers["x-webhook-secret"] || req.query.secret;
    const expectedSecret = process.env.WEBHOOK_SECRET;

    // If WEBHOOK_SECRET is configured, strictly enforce it
    if (expectedSecret && secret !== expectedSecret) {
      return res.status(403).json({ success: false, error: "Unauthorized webhook request" });
    }
    const { email, toEmail, displayName, recipientName, uid, schoolName } = req.body;
```
If `process.env.WEBHOOK_SECRET` is not set or empty, the condition `if (expectedSecret && secret !== expectedSecret)` evaluates to falsy (`undefined`). The guard is completely bypassed.  
**Attacker Prerequisites:** None if `WEBHOOK_SECRET` is omitted from server environment variables.  
**Risk:** An attacker can trigger arbitrary welcome emails to any email address, with attacker-controlled content in `displayName` and `schoolName` that is rendered directly into the HTML email template via `buildCorporateWelcomeEmail(targetName, schoolName)`.  
**Why it matters:** Enables unauthenticated spoofed email dispatch and potential email injection.  
**Recommended fix:** Fail closed: If `expectedSecret` is not configured, the endpoint must return `503 Service Unavailable` or reject the request, and header validation must use timing-safe comparison (`crypto.timingSafeEqual`).

---

### Finding TM-03: Global Cross-Tenant Leakage of Academic Programs via Firestore Rule

**Classification:** Confirmed vulnerability  
**Severity:** High  
**Affected location:** `/firestore.rules`, lines 265–270  
**Evidence:**
```javascript
// /firestore.rules lines 265-270
match /academic_programs/{programId} {
  allow read: if isAuthenticated() && (
    isSuperAdmin() ||
    isAcademyMember(programId) ||
    (resource != null && resource.data.inviteCode != null)
  );
```
**Attacker Prerequisites:** Any authenticated user account (e.g., any teacher or coach registered on the platform).  
**Risk:** The rule grants read permission if `resource.data.inviteCode != null`. In Cloud Firestore security rules, `resource.data` represents the existing document in the database. Because every academic program document created by coaches has an `inviteCode` field, the condition evaluates to `true` for all documents in the collection regardless of whether the requesting user actually knows or submitted the invite code.  
Consequently, any logged-in user can issue a query against `/academic_programs` and dump every sports academy's record in India, including `programName`, `adminEmail`, `headCoachId`, `headCoachName`, `coachEmails`, `coachUids`, and enrollment details.  
**Why it matters:** Severe multi-tenant isolation failure compromising confidentiality of academy programs and coach rosters across organizations.  
**Recommended fix:** Remove `resource.data.inviteCode != null` from the general read rule. Access via invite code should either be validated via a secured callable Cloud Function or require an exact match against a client-provided parameter (`request.query` or dedicated invite verification function).

---

### Finding TM-04: Hardcoded Super Admin Email Check Without Email Verification Verification

**Classification:** Security weakness  
**Severity:** High  
**Affected location:** `/firestore.rules`, lines 13–22 & 416–418; `/api/index.ts`, lines 161–178  
**Evidence:**
```javascript
// /firestore.rules lines 13-22
function isSuperAdmin() {
  return isAuthenticated() && (
    request.auth.token.email == 'alsamy36@gmail.com' ||
    request.auth.token.email == 'admin@smartpeindia.com' ||
    request.auth.token.email == 'admin@smartpeindia.app' ||
    request.auth.token.email == 'contact@smartpeindia.app' ||
    request.auth.token.email == 'info@smartpeindia.app' ||
    request.auth.uid == 'admin@smartpeindia.app'
  );
}

// /firestore.rules lines 416-418
match /{document=**} {
  allow read, write: if isSuperAdmin();
}
```
And in Express server `/api/index.ts`:
```typescript
const SUPER_ADMIN_EMAILS = [
  "alsamy36@gmail.com",
  "admin@smartpeindia.app",
  "contact@smartpeindia.app",
  "info@smartpeindia.app"
];
```
The rule checks only `request.auth.token.email`, but does NOT verify `request.auth.token.email_verified == true`.  
**Attacker Prerequisites:** If Firebase Auth allows unverified email signup via email/password or non-Google providers, an attacker could register an unverified account with one of these email addresses.  
**Risk:** If email verification is not strictly enforced in Firebase Authentication settings or rules, an attacker registering `admin@smartpeindia.com` or `admin@smartpeindia.app` gains full read and write access to every document in the entire Firestore database via `match /{document=**}`.  
**Why it matters:** Potential total administrative takeover of the multi-tenant database.  
**Recommended fix:** 
1. Require `request.auth.token.email_verified == true` in `isSuperAdmin()`.
2. Migrate super-admin authorization from email string matching to Firebase Custom Claims (e.g. `request.auth.token.admin == true`), set exclusively via Firebase Admin SDK.

---

### Finding TM-05: Incomplete Tenant Scoping on Student and Athlete Creation

**Classification:** Security weakness  
**Severity:** Medium  
**Affected location:** `/firestore.rules`, lines 129–141 (`students`), lines 287–299 (`academic_athletes`)  
**Evidence:**
```javascript
// /firestore.rules lines 136-141
allow create: if isAuthenticated() && (
  isSuperAdmin() ||
  request.resource.data.teacherId == request.auth.uid ||
  request.resource.data.userId == request.auth.uid ||
  isSchoolMember(request.resource.data.schoolId)
);
```
**Attacker Prerequisites:** Authenticated user.  
**Risk:** When creating a student record, the disjunction (`||`) allows the operation if `request.resource.data.teacherId == request.auth.uid`. The rule does not require that the user also be a valid member of `request.resource.data.schoolId`. An attacker can create records setting `schoolId` to another institution's tenant ID, which may subsequently appear in queries performed by that victim school.  
**Why it matters:** Cross-tenant record poisoning and potential disruption of student rosters.  
**Recommended fix:** Require that if `request.resource.data.schoolId` is supplied and is not a personal workspace, `isSchoolMember(request.resource.data.schoolId)` must be true in addition to (`&&`) verifying `teacherId`.

---

### Finding TM-06: Unauthenticated Consumption of AI API Quota (`/api/ai/generate`, `/api/ai/transcribe`)

**Classification:** Security weakness  
**Severity:** Medium  
**Affected location:** `/api/index.ts`, lines 678 (`/api/ai/generate`) and lines 855 (`/api/ai/transcribe`)  
**Evidence:**
```typescript
apiRouter.post("/ai/generate", optionalAuth, async (req: AuthenticatedRequest, res) => { ... });
apiRouter.post("/ai/transcribe", express.json({ limit: "15mb" }), optionalAuth, async (req: AuthenticatedRequest, res) => { ... });
```
Both endpoints use `optionalAuth`. When an unauthenticated request arrives, `req.user` is undefined, and rate limiting falls back to IP address:
```typescript
const userKey = req.user?.uid || req.ip || "anon";
const rl = checkRateLimit(`ai_generate_${userKey}`, 60, 60 * 1000);
```
**Attacker Prerequisites:** Anonymous public internet user.  
**Risk:** Anonymous users can consume up to 60 Gemini/Groq generations per minute and 20 transcription operations (up to 14MB audio each) per IP address. Attackers using rotating proxies or cloud runners can quickly deplete Google Gemini and Groq API quotas, incurring operational costs and creating a denial of service for legitimate teachers.  
**Why it matters:** Resource exhaustion, unexpected API billing, and service degradation.  
**Recommended fix:** Change `optionalAuth` to `requireAuth` on both endpoints so that only authenticated users with valid Firebase sessions can consume AI compute.

---

### Finding TM-07: Unencrypted PII and Health Biometrics in Browser LocalStorage

**Classification:** Security weakness  
**Severity:** Medium  
**Affected location:** `/services/fitnessService.ts` (lines 1021, 1041), `/services/academicCoachingCloudService.ts` (lines 48–51), `/services/offlineCacheService.ts` (lines 20–35), `/services/academyService.ts` (lines 1010–1040)  
**Evidence:**
Student records, fitness scores, athlete rosters, and evaluation results are persistently written to `localStorage` under keys `smartpe_offline_students`, `smartpe_academy_athletes_v2`, `smartpe_academy_evaluations_v2`.  
**Attacker Prerequisites:** Physical access to a shared device (e.g. school computer lab, PE tablet) or exploitation of a client-side Cross-Site Scripting (XSS) flaw.  
**Risk:** Unencrypted minor PII and health biometrics remain indefinitely in the browser cache, readable by any user who opens the browser profile or any third-party script executing on the origin.  
**Why it matters:** Violates data minimization and privacy expectations under the Digital Personal Data Protection (DPDP) Act 2023.  
**Recommended fix:** Encrypt sensitive cached records, use `sessionStorage` or IndexedDB with explicit session cleanup, and provide a clear "Clear Cached Data" function on logout.

---

### Finding TM-08: Missing HTTP Security Headers and Cross-Origin Protections

**Classification:** Missing control  
**Severity:** Medium  
**Affected location:** `/api/index.ts`  
**Evidence:**
The Express server does not integrate security middleware such as `helmet`. Inspected HTTP responses lack `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, and `Strict-Transport-Security`.  
**Attacker Prerequisites:** Network-positioned adversary or adversary attempting clickjacking / MIME-sniffing attacks.  
**Risk:** Increased vulnerability to framing/clickjacking attacks and MIME-sniffing.  
**Why it matters:** Baseline web application hardening is omitted.  
**Recommended fix:** Integrate `helmet()` in Express and configure explicit Content-Security-Policy headers.

---

## 8. Threat Matrix Summary

| Threat ID | Threat Name | Affected Surface | Likelihood | Impact | Severity | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TH-01** | Open Email Relay Abuse | `POST /api/email/test` | High | High | **High** | Confirmed vulnerability |
| **TH-02** | Webhook Auth Bypass | `POST /api/webhooks/auth-user-created` | High | High | **High** | Confirmed vulnerability |
| **TH-03** | Cross-Tenant Academy Leak | Firestore `/academic_programs/{id}` | High | High | **High** | Confirmed vulnerability |
| **TH-04** | Super Admin Privilege Escalation | Firestore `isSuperAdmin()` email check | Low | Critical | **High** | Security weakness |
| **TH-05** | Cross-Tenant Record Injection | Firestore `/students` create rule | Medium | Medium | **Medium** | Security weakness |
| **TH-06** | AI Compute Quota Depletion | `POST /api/ai/generate`, `/transcribe` | High | Medium | **Medium** | Security weakness |
| **TH-07** | Local Storage PII Exposure | Browser `localStorage` cache | Medium | Medium | **Medium** | Security weakness |
| **TH-08** | Missing Security Headers | Express server HTTP configuration | Medium | Low | **Medium** | Missing control |
