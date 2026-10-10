# Attack Surface Analysis: smartpeindia.app

**Project:** smartpeindia.app  
**Document Type:** Attack Surface & Exposure Mapping  
**Assessment Mode:** Static Codebase & Infrastructure Inspection (Read-Only)  
**Date:** October 2026  

---

## 1. Network & Deployment Exposure

- **Primary Web Server & Ingress:** Node.js Express 5.2.1 application serving both API routes under `/api/*` and compiled Vite SPA static assets under `dist/` (`api/index.ts`).
- **Deployment Platform:** Multi-target support configured for Vercel Serverless (`vercel.json` rewriting `/api/(.*)` to `api/index.ts` and `/(.*)` to `index.html`) and Cloud Run container runtime on port 3000 (`HOST=0.0.0.0`).
- **Cloud Functions:** Firebase Cloud Functions v5 (`functions/src/index.ts`) triggered on Firestore document events and Firebase Auth user creation.
- **Client Origin:** Single-page React 19 application running in the browser, communicating with the Express backend proxy and Firebase services.

---

## 2. HTTP API Endpoints (`api/index.ts`)

### Surface 2.1: Health & System Diagnostics (`GET /api/health`)
- **Entry point:** `GET /api/health`
- **Authentication requirement:** None (Public)
- **Authorization requirement:** None
- **Input:** None
- **Data accessed:** Environment status flags (`hasGemini`, `hasGroq`, `geminiCount`, `emailConfigured`, `emailProvider`, `NODE_ENV`).
- **External dependencies:** None
- **Existing controls:** Only returns boolean configuration flags and counts.
- **Known weakness:** Exposes operational stack metadata (which AI and email providers are active) to anonymous scanners.

---

### Surface 2.2: Live AI Model Test (`GET /api/ai/test`)
- **Entry point:** `GET /api/ai/test`
- **Authentication requirement:** None (Public)
- **Authorization requirement:** None
- **Input:** None
- **Data accessed:** None
- **External dependencies:** Google GenAI API (`gemini-3.8-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`) or Groq API (`openai/gpt-oss-120b`).
- **Existing controls:** None
- **Known weakness:** **Confirmed Vulnerability.** Completely unauthenticated and unrated GET endpoint that directly calls external billable AI APIs on every hit. Can be abused to trigger financial exhaustion and deplete API quotas.

---

### Surface 2.3: Live Brevo Account Status (`GET /api/email/brevo/status`)
- **Entry point:** `GET /api/email/brevo/status`
- **Authentication requirement:** None (Public)
- **Authorization requirement:** None
- **Input:** None
- **Data accessed:** Brevo v3 Account profile (Account owner email, company name, credits balance, and verified sender email addresses).
- **External dependencies:** Brevo v3 API (`https://api.brevo.com/v3/account`, `/v3/senders`).
- **Existing controls:** None
- **Known weakness:** **Security Weakness.** Publicly accessible without authentication, leaking administrator email addresses, organization identity, and transactional credit balance to anonymous clients.

---

### Surface 2.4: General Email Configuration Status (`GET /api/email/status`)
- **Entry point:** `GET /api/email/status`
- **Authentication requirement:** None (Public)
- **Authorization requirement:** None
- **Input:** None
- **Data accessed:** Configured provider type (`brevo`, `resend`, `gmail`, `smtp`, or `simulated`) and default sender email.
- **External dependencies:** None
- **Existing controls:** Reads local environment flags only.
- **Known weakness:** Leaks sender email address and provider name.

---

### Surface 2.5: Email Dispatch Test (`POST /api/email/test`)
- **Entry point:** `POST /api/email/test`
- **Authentication requirement:** None (Public)
- **Authorization requirement:** None
- **Input:** JSON body `{ "toEmail": string }`
- **Data accessed:** Active email provider credentials in environment.
- **External dependencies:** Brevo API, Resend API, or Nodemailer SMTP.
- **Existing controls:** Basic email format check (`targetEmail.includes("@")`).
- **Known weakness:** **Confirmed Vulnerability (Open Mail Relay).** Any unauthenticated attacker can POST arbitrary recipient email addresses, triggering server-signed transactional emails to external victims.

---

### Surface 2.6: Corporate Welcome Email Dispatcher (`POST /api/email/welcome`)
- **Entry point:** `POST /api/email/welcome`
- **Authentication requirement:** Firebase ID Token (`requireAuth` middleware).
- **Authorization requirement:** Any valid authenticated Firebase user.
- **Input:** JSON body `{ "toEmail": string, "recipientName": string, "schoolName": string }`
- **Data accessed:** Active email provider credentials.
- **External dependencies:** Brevo API, Resend API, or Nodemailer SMTP.
- **Existing controls:** `requireAuth` validates token via Google Identity Toolkit; in-memory rate limiting allows max 10 requests per minute.
- **Known weakness:** In-memory rate limiting does not persist in serverless environments; caller can supply arbitrary `toEmail` different from their own authenticated email.

---

### Surface 2.7: Nurture Sequence Trigger (`POST /api/email/nurture/trigger`)
- **Entry point:** `POST /api/email/nurture/trigger`
- **Authentication requirement:** Firebase ID Token (`requireAuth` middleware).
- **Authorization requirement:** Any valid authenticated Firebase user.
- **Input:** JSON body `{ "toEmail": string, "step": 1 | 2 | 3, "recipientName": string, "schoolName": string }`
- **Data accessed:** Active email provider credentials.
- **External dependencies:** Brevo, Resend, or SMTP.
- **Existing controls:** `requireAuth` middleware; in-memory rate limiting allows max 10 requests per minute.
- **Known weakness:** Arbitrary recipient email address accepted from client.

---

### Surface 2.8: Nurture Date Evaluation (`POST /api/email/nurture/evaluate`)
- **Entry point:** `POST /api/email/nurture/evaluate`
- **Authentication requirement:** Firebase ID Token (`requireAuth` middleware).
- **Authorization requirement:** Any valid authenticated Firebase user.
- **Input:** JSON body `{ "toEmail": string, "createdAt": string, "step1SentAt": string, ... }`
- **Data accessed:** Active email provider credentials.
- **External dependencies:** Brevo, Resend, or SMTP.
- **Existing controls:** `requireAuth` middleware.
- **Known weakness:** No rate limiting applied to this specific route.

---

### Surface 2.9: Nurture HTML Template Preview (`GET /api/email/nurture/preview`)
- **Entry point:** `GET /api/email/nurture/preview`
- **Authentication requirement:** None (Public)
- **Authorization requirement:** None
- **Input:** Query parameters `?step=1&name=...&school=...`
- **Data accessed:** Static HTML templates.
- **External dependencies:** None
- **Existing controls:** Input coercion with default fallbacks.
- **Known weakness:** Minor reflected input in generated HTML preview (mitigated by React client preview rendering).

---

### Surface 2.10: Auth User Creation Webhook (`POST /api/webhooks/auth-user-created`)
- **Entry point:** `POST /api/webhooks/auth-user-created`
- **Authentication requirement:** Secret signature (`x-webhook-secret` header or `?secret=` query param).
- **Authorization requirement:** Matching `process.env.WEBHOOK_SECRET`.
- **Input:** JSON body `{ "email": string, "displayName": string, "schoolName": string, "uid": string }`
- **Data accessed:** Email provider configuration.
- **External dependencies:** Brevo / Resend / SMTP.
- **Existing controls:** Secret comparison check.
- **Known weakness:** **Security Weakness.** In `api/index.ts` lines 559–562:
  ```ts
  if (expectedSecret && secret !== expectedSecret) {
    return res.status(403).json(...);
  }
  ```
  If `WEBHOOK_SECRET` is not set in the hosting environment, the condition fails open and allows unauthenticated execution.

---

### Surface 2.11: Mass Feature Announcement (`POST /api/email/announcement`)
- **Entry point:** `POST /api/email/announcement`
- **Authentication requirement:** Firebase ID Token (`requireAdmin` middleware).
- **Authorization requirement:** Caller email must match `SUPER_ADMIN_EMAILS` (`alsamy36@gmail.com`, `admin@smartpeindia.app`, `contact@smartpeindia.app`, `info@smartpeindia.app`).
- **Input:** JSON body `{ "toEmails": string[], "featureTitle": string, "featureDescription": string, "actionUrl": string }`
- **Data accessed:** Email provider configuration.
- **External dependencies:** Brevo / Resend / SMTP.
- **Existing controls:** `requireAdmin` checks authenticated user email against hardcoded superadmin list.
- **Known weakness:** Does not verify `emailVerified: true` on caller's Firebase token.

---

### Surface 2.12: AI Text & Plan Generation Proxy (`POST /api/ai/generate`)
- **Entry point:** `POST /api/ai/generate`
- **Authentication requirement:** Optional Firebase Auth (`optionalAuth` middleware).
- **Authorization requirement:** None. Unauthenticated visitors are permitted.
- **Input:** JSON body `{ "model": string, "contents": any, "config": any }` (2MB limit).
- **Data accessed:** Server-side `GEMINI_API_KEY` / `GROQ_API_KEY`.
- **External dependencies:** Google GenAI API (`gemini-3.8-flash`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`) and Groq API (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`).
- **Existing controls:** In-memory rate limiting of 60 requests/min per IP/UID; model name validation mapping; structured error handling.
- **Known weakness:** Anonymous users can consume quota without authentication; in-memory rate limiting resets on serverless cold starts.

---

### Surface 2.13: Voice Audio Transcription Proxy (`POST /api/ai/transcribe`)
- **Entry point:** `POST /api/ai/transcribe`
- **Authentication requirement:** Optional Firebase Auth (`optionalAuth` middleware).
- **Authorization requirement:** None. Unauthenticated visitors are permitted.
- **Input:** JSON body `{ "audioBase64": string, "mimeType": string, "prompt": string }` (15MB limit).
- **Data accessed:** Server-side `GEMINI_API_KEY`.
- **External dependencies:** Google GenAI API (`gemini-3.5-transcribe`, `gemini-3.8-flash`).
- **Existing controls:** Body limit enforced at 15MB; length guard (`audioBase64.length > 14 * 1024 * 1024`); in-memory rate limiting of 20 requests/min.
- **Known weakness:** Large payload processing (15MB base64 decode and external transmission) can be abused for bandwidth and memory exhaustion.

---

## 3. Database Access Surfaces (Cloud Firestore)

All Firestore interactions occur directly between the client browser and Google Cloud Firestore endpoints, mediated by security rules defined in `firestore.rules`.

### High-Risk Database Rules:

1. **Academic Coaching Programs (`/academic_programs/{programId}`):**
   - **Rule:** `allow read: if isAuthenticated() && (isSuperAdmin() || isAcademyMember(programId) || (resource != null && resource.data.inviteCode != null));`
   - **Weakness:** Every registered program has an `inviteCode`, enabling all authenticated users to read all academy records across the entire platform.

2. **Super Admin Global Wildcard (`/{document=**}`):**
   - **Rule:** `allow read, write: if isSuperAdmin();`
   - **Weakness:** Relies on `request.auth.token.email` matching hardcoded strings without verifying `request.auth.token.email_verified == true`.

3. **Student Record Creation (`/students/{studentId}`):**
   - **Rule:** `allow create: if isAuthenticated() && (isSuperAdmin() || request.resource.data.teacherId == request.auth.uid || ...);`
   - **Weakness:** A teacher can specify any `schoolId` value when creating students because the condition is an `OR` check against `teacherId`.

4. **System Logs & Privacy Audit Logs (`/system_logs/{logId}`, `/privacy_audit_logs/{logId}`):**
   - **Rule:** `allow create: if isAuthenticated();`
   - **Weakness:** Any authenticated user can flood log collections without rate limiting or payload schema validation.

---

## 4. File Upload & Media Capture Surfaces

| Component | File Types | Processing Flow | Destination | Controls & Weaknesses |
|---|---|---|---|---|
| `StudentManagement.tsx` | `.csv`, `.xlsx`, `.xls` | Browser `FileReader` → naive comma split or SheetJS parser | Converted to `Student[]` → Firestore `students` batch write | No MIME check; no file size limit check; potential CSV/Excel injection. |
| `SchoolAdmin.tsx` | Image files | Browser `FileReader.readAsDataURL` → canvas compression | Base64 string saved in Firestore `schools/{schoolId}.logoUrl` | File size checked (<5MB); MIME type not validated; base64 stored in database. |
| `SchoolAdmin.tsx` | `.csv`, `.xlsx`, `.txt` | `FileReader.readAsText` / `readAsArrayBuffer` | Sent in prompt to Gemini `/api/ai/generate` for OCR parsing | File size not checked; untrusted file text fed directly into LLM prompt. |
| `coaching/StudentImportModal.tsx` | `.csv`, `.xlsx` | `FileReader` → SheetJS `XLSX.read` | Local state → Firestore `academic_athletes` | SheetJS 0.18.5 parsed client-side; no file size validation. |
| `transcriptionService.ts` | Audio stream / Blob | `MediaRecorder` → `FileReader.readAsDataURL` | Base64 string POSTed to `/api/ai/transcribe` | Verified 15MB body limit; browser permission prompt required. |
| `SchoolAdmin.tsx` (Camera) | Live video feed | `navigator.mediaDevices.getUserMedia` | Canvas capture to base64 string | User must grant browser camera permission explicitly. |

---

## 5. Third-Party Integrations & External Data Flows

1. **Google Identity Platform / Firebase Auth:**
   - Client sends credentials (email/password or Google OAuth popup token) to `identitytoolkit.googleapis.com`.
   - Server validates tokens via Google Identity Toolkit account lookup endpoint.
2. **Google GenAI (Gemini API):**
   - Outbound HTTPS requests from Express server to `generativelanguage.googleapis.com`.
   - Data transmitted: Lesson topics, curriculum frameworks, student grade/age/gender/BMI/weight/height (in physical development summaries), coach observations, and timetable OCR text.
3. **Groq API:**
   - Fallback LLM inference over HTTPS to `api.groq.com`.
   - Data transmitted: Lesson planning and coaching prompts when Gemini quota is exhausted.
4. **Brevo (Sendinblue) API v3:**
   - Outbound HTTPS calls to `api.brevo.com/v3/smtp/email`, `/v3/account`, `/v3/senders`.
   - Data transmitted: Recipient email address, teacher name, school name, welcome pass details.
5. **Google Analytics 4 (GA4):**
   - Script tags loaded in `index.html` from `googletagmanager.com`.
   - Transmits page location, titles, and custom event names (`hero_cta_click`, `signup_complete`, `tool_used`).
6. **Google Fonts:**
   - CDN stylesheets loaded from `fonts.googleapis.com` and `fonts.gstatic.com`.

---

## 6. Admin Surfaces

1. **Super Admin Dashboard (`components/SchoolAdmin.tsx` & `App.tsx`):**
   - UI gate: `isBrandSuperAdmin(user.email)`.
   - Features: View all registered users across India, live login activity monitor, school directory, system logs.
   - Weakness: Client-side gate is visual only; actual enforcement relies on Firestore rules and API middleware.
2. **School Administrator Portal (`components/SchoolAdmin.tsx`):**
   - Scoped to `isSchoolAdmin(schoolId)`.
   - Features: Custom school branding, teacher invitations, roster deletion requests, DPA acceptance.
3. **Academy Head Coach Portal (`components/coaching/CoachingAcademyHub.tsx`):**
   - Scoped to `isAcademyMember(programId)`.
   - Features: Add/remove colleague coaches, generate 6-character invite codes, export player rosters.

---

## 7. Dependencies & Externally Reachable Components

The application relies on 25 production npm packages and 6 dev dependencies. Several packages contain publicly documented vulnerabilities identified by npm audit:

1. **`protobufjs` (<=7.6.4):** Critical severity. Arbitrary code execution and prototype pollution in generated code. (Transitive dependency via Google GenAI / Firebase).
2. **`dompurify` (<=3.2.4):** Moderate to High severity. Multiple sanitization bypasses and shadow DOM template expression survival.
3. **`path-to-regexp` (8.0.0–8.3.0):** High severity. Regular expression denial of service via multiple wildcards.
4. **`xlsx` (0.18.5):** Known prototype pollution and ReDoS risks in untrusted spreadsheet parsing.
5. **`nanoid` (<=3.3.17):** High severity. Integer overflow and infinite loop on negative sizes.
6. **`vite` (<=6.1.1):** High severity dev-server vulnerabilities (path traversal and arbitrary file read).
