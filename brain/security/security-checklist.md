# Project Security Verification Checklist: smartpeindia.app

**Project:** smartpeindia.app  
**Document Type:** Formal Security Controls & Implementation Checklist  
**Assessment Mode:** Static Codebase & Configuration Verification (Read-Only)  
**Date:** October 2026  

---

## Evaluation Criteria

- **Pass:** The control is fully implemented, verified effective in the codebase, and contains no identifiable architectural bypasses.
- **Partial:** The control exists in part or provides basic protection, but contains architectural flaws, bypass vectors, or incomplete enforcement.
- **Fail:** The control is demonstrably insecure, fundamentally broken, or creates direct exploitable vulnerabilities.
- **Not implemented:** The control is absent from the codebase and architecture.
- **Not verifiable:** Current code or configuration is insufficient to evaluate the control without live production access.

---

## 1. Authentication
- **Status:** **Partial**
- **Evidence:** 
  - `components/Auth.tsx` (lines 4–10, 77, 100): Implements Firebase Email/Password (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`) and Google OAuth popup (`signInWithPopup`).
  - `api/index.ts` (lines 74–114, 139–159): `requireAuth` validates Firebase ID tokens via Google Identity Toolkit account lookup (`https://identitytoolkit.googleapis.com/v1/accounts:lookup`).
- **Finding:** Neither Firebase Auth client registration nor server-side `requireAuth` validates whether `emailVerified` is `true`. Users can create accounts with arbitrary email addresses and immediately access authenticated routes without confirming email ownership.
- **Recommended action:** Require email verification (`user.emailVerified === true`) before allowing access to school workspaces, and configure Firebase Auth settings to prevent unverified account logins.

---

## 2. Authorization / RBAC
- **Status:** **Partial**
- **Evidence:** 
  - `firestore.rules` (lines 9–74): Helper functions `isSuperAdmin()`, `isOwner()`, `isSchoolMember()`, `isSchoolAdmin()`, and `isAcademyMember()`.
  - `api/index.ts` (lines 161–179): `requireAdmin` middleware checks caller email against hardcoded list `SUPER_ADMIN_EMAILS`.
- **Finding:** 
  1. `isSuperAdmin()` relies on plaintext email string comparison (`request.auth.token.email == ...`) without checking `email_verified == true`.
  2. Academy authorization in `firestore.rules` (lines 63–74) checks if user email is present in `coachEmails` array, which also lacks verification of email ownership.
- **Recommended action:** Replace email string checks with cryptographic Firebase Custom Claims (e.g., `request.auth.token.role == 'superadmin'`) assigned strictly through the Firebase Admin SDK.

---

## 3. Tenant Isolation
- **Status:** **Partial**
- **Evidence:** 
  - `firestore.rules` (lines 96–262): Enforces `schoolId` scoping on `schools`, `schoolMembers`, `students`, `teams`, `results`, `practical_assessments`, and `interventions`.
  - `firestore.rules` (lines 264–340): Scopes `academic_athletes` and `academic_assessments` to `programId`.
- **Finding:** 
  1. In `firestore.rules` line 269, `/academic_programs/{programId}` allows universal read access to any authenticated user if `resource.data.inviteCode != null`. Because all programs auto-generate invite codes, cross-academy isolation is broken for the program catalog.
  2. In `firestore.rules` line 138, `/students/{studentId}` creation allows any user to create records if `teacherId == request.auth.uid`, without verifying that the user belongs to the target `request.resource.data.schoolId`.
- **Recommended action:** Remove the `resource.data.inviteCode != null` read condition. Require that `request.resource.data.schoolId` matches verified school membership during document creation.

---

## 4. Session / Token Security
- **Status:** **Pass**
- **Evidence:** 
  - `services/firebase.ts` & `App.tsx`: Firebase SDK manages short-lived JWT ID tokens (1-hour expiration) and handles refresh token rotation internally.
  - `api/index.ts` (lines 72, 106): Token verification cache stores validated tokens with a strict 10-minute expiration (`Date.now() + 10 * 60 * 1000`).
- **Finding:** No persistent plain session identifiers or sensitive refresh tokens are stored in unencrypted browser storage by application code.
- **Recommended action:** Consider lowering token cache TTL from 10 minutes to 5 minutes to shorten the window between token revocation in Firebase and proxy invalidation.

---

## 5. Input Validation
- **Status:** **Fail**
- **Evidence:** 
  - `api/index.ts` (lines 690, 867, 383, 416): Request bodies on `/api/ai/generate`, `/api/ai/transcribe`, `/api/email/welcome`, and `/api/email/nurture/trigger` are read directly from `req.body` without schema validation libraries (no Zod, Joi, or Yup).
  - `components/StudentManagement.tsx` (lines 118–135): CSV parsing uses raw `line.split(',')` without input escaping, type validation, or boundary sanitization.
- **Finding:** Endpoints rely on basic ad-hoc checks (e.g. `typeof targetEmail === "string"` and `.includes("@")`). Malformed JSON objects, unexpected field types, or deeply nested structures are passed directly to downstream logic.
- **Recommended action:** Implement schema validation middleware using Zod or Joi on all Express endpoints. Use standard RFC 5322 validation for email parameters.

---

## 6. Injection (SQL / NoSQL / Command)
- **Status:** **Pass**
- **Evidence:** 
  - `api/index.ts`: The backend uses no relational SQL databases or shell command execution (`child_process`, `exec`, `spawn` are absent from runtime code).
  - `services/fitnessService.ts` & `services/academicCoachingCloudService.ts`: Firestore queries utilize parameterized SDK query builders (`where('schoolId', '==', id)`), preventing NoSQL query injection.
- **Finding:** The application is architecturally resilient against SQL and command injection.
- **Recommended action:** Maintain use of parameterized SDK abstractions and avoid dynamic query building.

---

## 7. Cross-Site Scripting (XSS)
- **Status:** **Partial**
- **Evidence:** 
  - `App.tsx` & component tree: Built entirely in React 19, which automatically escapes dynamic text interpolations within JSX.
  - `lib/exportUtils.ts` (lines 82–96): `exportToWord` constructs HTML blobs for Word documents using string concatenation:
    `new Blob(['\ufeff', htmlContent], { type: 'application/msword' })`.
  - `package.json` (line 26): Dependency `jspdf` and transitive dependency `dompurify` contain known sanitization bypass vulnerabilities (GHSA-r47g-fvhr-h676, GHSA-rp9w-3fw7-7cwq).
- **Finding:** While React mitigates reflected and DOM XSS in UI rendering, HTML generation in file export utilities and outdated parsing packages create potential vectors for document-based XSS.
- **Recommended action:** Update dependencies (`npm audit fix`) to patch DOMPurify and ensure all HTML export functions sanitize input using safe serializers.

---

## 8. Cross-Site Request Forgery (CSRF)
- **Status:** **Partial**
- **Evidence:** 
  - `api/index.ts`: All state-changing POST endpoints (`/api/ai/generate`, `/api/ai/transcribe`, `/api/email/welcome`, etc.) expect JSON payloads and Bearer tokens in the `Authorization` header rather than ambient browser cookies.
  - `api/index.ts` (lines 309–372): `/api/email/test` accepts `application/json` without authentication or CSRF tokens.
- **Finding:** Because APIs use Bearer tokens rather than session cookies, traditional cross-origin cookie-based CSRF is largely mitigated. However, unauthenticated POST endpoints (`/api/email/test`) remain susceptible to cross-origin abuse via simple POST requests.
- **Recommended action:** Protect all POST endpoints with authentication or strict pre-flight CORS origin validation.

---

## 9. API Security
- **Status:** **Fail**
- **Evidence:** 
  - `api/index.ts` (lines 309–372): `/api/email/test` is an open POST endpoint that sends emails with zero authentication.
  - `api/index.ts` (lines 623–675): `/api/ai/test` is an unauthenticated GET endpoint that invokes external AI models.
  - `api/index.ts` (lines 291–306): `/api/email/brevo/status` is an unauthenticated GET endpoint that queries Brevo and exposes account data.
  - `api/index.ts` (lines 554–563): `/api/webhooks/auth-user-created` fails open if `WEBHOOK_SECRET` is unset.
- **Finding:** Multiple endpoints lack basic authentication, permit open relay operations, or leak third-party infrastructure details.
- **Recommended action:** Enforce authentication across all operational and diagnostic endpoints; remove or lock down diagnostic test routes in production.

---

## 10. Rate Limiting / Abuse Prevention
- **Status:** **Partial**
- **Evidence:** 
  - `api/index.ts` (lines 33–64): Custom in-memory rate limiter applying limits on `/api/ai/generate` (60 req/min), `/api/ai/transcribe` (20 req/min), `/api/email/welcome` (10 req/min), and `/api/email/nurture/trigger` (10 req/min).
  - `api/index.ts` (lines 30): Global JSON body size limited to 2MB; `/api/ai/transcribe` limited to 15MB.
- **Finding:** 
  1. Rate limiting is stored in an ephemeral in-memory `Map` that resets on serverless cold starts and fails to coordinate across scaled containers.
  2. Several endpoints (`/api/email/test`, `/api/ai/test`, `/api/email/nurture/evaluate`) have no rate limiting applied.
- **Recommended action:** Replace in-memory rate limiting with a persistent distributed store (Redis / Upstash) or implement rate limiting at the ingress layer (Cloudflare / Cloud Armor).

---

## 11. File Uploads
- **Status:** **Partial**
- **Evidence:** 
  - `components/StudentManagement.tsx` (lines 100–140), `components/SchoolAdmin.tsx` (lines 325–340, 480–523), `components/coaching/StudentImportModal.tsx` (lines 300–335).
  - No cloud storage buckets (Firebase Storage / S3 / GCS) are connected; all files are read client-side via browser `FileReader`.
- **Finding:** 
  1. File uploads are not stored on a server, eliminating server-side file execution risks.
  2. However, client-side validation is inconsistent: `StudentManagement.tsx` checks neither file size nor MIME type. In `SchoolAdmin.tsx`, image size is restricted to 5MB, but file extension and MIME type are unverified.
- **Recommended action:** Validate file extensions and MIME types before reading files in the browser. Enforce maximum file size limits (<2MB) across all file input components.

---

## 12. Database Security
- **Status:** **Pass**
- **Evidence:** 
  - `services/firebase.ts`: Cloud Firestore is configured with secure long-polling connectivity (`experimentalForceLongPolling: true`).
  - Access is governed entirely by server-evaluated security rules (`firestore.rules`). Direct client manipulation of Firestore database schema or metadata is impossible.
- **Finding:** Database infrastructure is fully hosted and managed by Google Cloud Platform with built-in data replication and managed encryption.
- **Recommended action:** Continue leveraging Firestore managed infrastructure; monitor daily read/write quota usage in the Google Cloud Console.

---

## 13. Firestore Security Rules
- **Status:** **Fail**
- **Evidence:** 
  - `firestore.rules` (lines 13–22, 265–270, 416–418).
- **Finding:** 
  1. **Critical:** `isSuperAdmin()` relies on unverified email addresses (`token.email == 'alsamy36@gmail.com' || ...`) and grants complete bypass (`match /{document=**} { allow read, write: if isSuperAdmin(); }`).
  2. **High:** Universal read access permitted on `/academic_programs/{programId}` via `resource.data.inviteCode != null`.
  3. **Medium:** Student document creation allows foreign `schoolId` injection because `teacherId == request.auth.uid` is evaluated with `||`.
- **Recommended action:** Refactor `firestore.rules`:
  - Require `request.auth.token.email_verified == true`.
  - Remove `inviteCode != null` read grant.
  - Require matching `schoolId` verification during document creation.

---

## 14. Secrets Management
- **Status:** **Pass**
- **Evidence:** 
  - `.env.example`: Only contains variable placeholders with no exposed credentials.
  - `api/index.ts` & `api/email.ts`: All private API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `BREVO_API_KEY`, `SMTP_PASS`) are accessed strictly server-side via `process.env`.
  - Client bundle inspection: No backend API keys or private tokens are prefixed with `VITE_` or bundled into client assets.
- **Finding:** Backend secrets are properly isolated from the browser client and stored outside source code.
- **Recommended action:** Ensure secrets in production deployment dashboards (Vercel / Cloud Run) are regularly audited and never logged.

---

## 15. Encryption (At Rest & In Transit)
- **Status:** **Pass**
- **Evidence:** 
  - **In Transit:** All external APIs (Google GenAI, Groq, Brevo, Google Identity) use enforced HTTPS (`https://...`). Production deployment runs under SSL/TLS on Google Cloud Run and Vercel domains.
  - **At Rest:** Cloud Firestore automatically encrypts all document data and indexes at rest using Google-managed AES-256 encryption.
- **Finding:** Modern transport encryption and database storage encryption are fully active.
- **Recommended action:** Ensure HSTS headers are enabled to prevent protocol downgrade attacks.

---

## 16. CORS (Cross-Origin Resource Sharing)
- **Status:** **Not implemented**
- **Evidence:** 
  - `api/index.ts`: The Express application does not import or configure the `cors` package, nor does it define custom `Access-Control-Allow-Origin` headers.
- **Finding:** In local development and monolithic deployments, Vite and Express serve the frontend from the same origin. However, if `/api` is hosted on a distinct domain or subdomain, cross-origin requests will either fail or default to browser defaults.
- **Recommended action:** Explicitly configure CORS in `api/index.ts` restricted to authorized application domains (`smartpeindia.app` and designated preview URLs).

---

## 17. Security Headers
- **Status:** **Fail**
- **Evidence:** 
  - `api/index.ts`: Neither `helmet` nor custom header middleware is mounted on Express.
  - `index.html`: Contains no Content Security Policy `<meta>` tag.
- **Finding:** Critical HTTP security headers are completely absent:
  - `Content-Security-Policy`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Strict-Transport-Security` (HSTS)
  - `Referrer-Policy`
  - `Permissions-Policy`
- **Recommended action:** Install and configure `helmet` in `api/index.ts` with strict frame protection (`X-Frame-Options: SAMEORIGIN`) and tailored CSP directives.

---

## 18. Dependency Security
- **Status:** **Fail**
- **Evidence:** 
  - Running `npm audit` identifies 21 known vulnerabilities:
    - 3 Critical (`protobufjs` <=7.6.4, `proxy-addr` 1.1.0-2.0.7, `websocket-driver` <=0.7.4)
    - 10 High (`dompurify`, `path-to-regexp`, `nanoid`, `postcss`, `vite`, `ws`, `form-data`, `lodash`, `source-map-js`, `browserslist`)
    - 5 Moderate
    - 3 Low
- **Finding:** Multiple core dependencies have unpatched security advisories for prototype pollution, ReDoS, and arbitrary code execution in parsing submodules.
- **Recommended action:** Execute `npm audit fix` and selectively override vulnerable transitive dependencies in `package.json` overrides.

---

## 19. Logging & Monitoring
- **Status:** **Partial**
- **Evidence:** 
  - `services/logService.ts`: Captures client errors and logs them to Firestore `/system_logs`.
  - `services/privacyAuditService.ts`: Records audit events (`login`, `dpa_accepted`, `student_data_exported`, `deletion_requested`) into `/privacy_audit_logs`.
  - `services/userActivityService.ts`: Records login timestamps and platforms into `/login_activity`.
- **Finding:** 
  1. The application implements proactive audit logging for security and privacy events.
  2. However, any authenticated user can write to `/system_logs` and `/privacy_audit_logs` without rate limiting, creating log pollution risks.
  3. No centralized automated alerting exists for critical authentication failures or suspicious activity.
- **Recommended action:** Restrict write permissions on log collections through backend cloud functions or enforce strict Firestore rule constraints on log payload formats.

---

## 20. Admin Security
- **Status:** **Partial**
- **Evidence:** 
  - `App.tsx` (lines 573–591): Super Admin UI elements are conditionally rendered using `isBrandSuperAdmin(user.email)`.
  - `components/SchoolAdmin.tsx`: School Admin features are scoped to verified `schoolMembers` where `role == 'admin'`.
- **Finding:** Client-side admin visibility checks are clean and modular. However, backend enforcement in `firestore.rules` and `api/index.ts` relies on email strings without verification of email ownership.
- **Recommended action:** Implement multi-factor authentication (MFA) for administrative accounts in Firebase Auth and enforce custom claim verification.

---

## 21. Deployment & Infrastructure
- **Status:** **Pass**
- **Evidence:** 
  - Deployment configuration is handled via managed PaaS/FaaS platforms (Vercel Serverless and Google Cloud Run).
  - No self-hosted Linux virtual machines, open SSH ports, unmanaged Docker daemons, or unpatched OS kernels are exposed.
- **Finding:** The serverless/containerized deployment footprint minimizes host-level infrastructure attack surfaces.
- **Recommended action:** Configure Cloud Armor or Vercel Web Application Firewall (WAF) to filter DDoS traffic and block common malicious payloads at the edge.

---

## 22. Data Privacy & Compliance (DPDP Act India / Child Data)
- **Status:** **Partial**
- **Evidence:** 
  - `services/privacyAuditService.ts` (lines 47–65): `sanitizeAuditDetails()` scrubs student names, roll numbers, DOB, medical notes, and scores before writing audit logs.
  - `services/physicalDevelopmentAiService.ts` (lines 22–28): Anonymizes student identity when constructing AI prompts (sends grade, age, gender, BMI, but strips student name).
  - `components/privacy/DataPrivacyTab.tsx`: Provides School Data Processing Agreement (DPA) acceptance, full data export (JSON/CSV), and formal school deletion request workflow.
- **Finding:** 
  1. Excellent child privacy awareness in AI prompt construction and audit log sanitization.
  2. However, student rosters are stored in unencrypted browser `localStorage` under `smartpe_offline_students` and `smartpe_sports_academy_athletes`, leaving data exposed on shared school terminals.
- **Recommended action:** Clear offline caches when teachers sign out; ensure teachers are warned against storing student rosters on public shared computers.

---

## 23. Error Handling
- **Status:** **Partial**
- **Evidence:** 
  - `api/index.ts` (lines 825–847): Maps known upstream AI errors (429, quota, 503) to sanitized user-friendly messages.
  - `services/fitnessService.ts` (lines 56–78): `handleFirestoreError()` encapsulates error details.
- **Finding:** In `api/index.ts` line 840, unmapped errors fallback to `errorMessage = lastError.message`, which can reflect upstream provider error strings back to the client.
- **Recommended action:** Use generic user-facing error messages for all 500-level errors and log detailed tracebacks strictly on the server.

---

## 24. Backup & Recovery
- **Status:** **Partial**
- **Evidence:** 
  - `components/privacy/DataPrivacyTab.tsx` (lines 99–140): Built-in full school data export tool downloading JSON and CSV formats of all students, teams, fitness results, and board assessments.
- **Finding:** 
  1. Administrators can manually export and backup their institution's data at any time.
  2. Automated scheduled disaster recovery backups for Firestore (such as Cloud Storage scheduled exports) are not configured within project codebase files.
- **Recommended action:** Configure automated daily Firestore exports to a secure Google Cloud Storage bucket via GCP Cloud Scheduler.
