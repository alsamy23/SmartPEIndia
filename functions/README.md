# Firebase Cloud Functions: Automated User & Academy Registration Welcome Email

This Firebase Cloud Functions package automatically triggers when a new user registers in **Firestore** (`users/{userId}`) or an academy is registered (`academic_programs/{programId}`), as well as on Firebase Authentication (`auth.user().onCreate`).

It uses the **Brevo (Sendinblue)** API configuration to send a professional, branded welcome email to the newly registered user without any front-end redirection or client-side email app interaction.

---

## 🚀 Triggers Included

1. **`onUserDocumentCreated`** (`functions.firestore.document("users/{userId}").onCreate`):
   - Triggers immediately when a teacher or educator profile document is created in Firestore.
   - Dispatches a personalized welcome email via Brevo REST API.
   - Records delivery in `mail_logs` and marks `welcomeEmailSentAt` on the user document.
   - Built-in deduplication ensures no duplicate emails are sent if multiple triggers fire.

2. **`onAcademicProgramCreated`** (`functions.firestore.document("academic_programs/{programId}").onCreate`):
   - Triggers when a new sports academy or coaching program is registered.
   - Sends the academy welcome email to the head coach / administrator.

3. **`onAuthUserCreated` / `sendPersonalizedWelcomeEmail`** (`functions.auth.user().onCreate`):
   - Listens to Firebase Auth user creation.

---

## 🛠️ Setup & Deployment Instructions

### 1. Configure Brevo API Key in Firebase Functions

Set your Brevo API key and sender email using Firebase Cloud Functions configuration or `.env`:

```bash
# Set Brevo API Key secret
firebase functions:secrets:set BREVO_API_KEY
```

Or configure in `functions/.env`:
```env
BREVO_API_KEY=your_brevo_v3_api_key_here
FROM_EMAIL="SmartPE India <admin@smartpeindia.com>"
APP_NAME="SmartPE India"
APP_URL="https://smartpeindia.app"
SUPPORT_EMAIL="admin@smartpeindia.com"
```

### 2. Verify Sender in Brevo
1. Log in to [Brevo](https://app.brevo.com/).
2. Go to **Senders, Domains & Dedicated IPs** > **Senders**.
3. Add and verify `admin@smartpeindia.com`.

### 3. Deploy Functions to Firebase
```bash
# Build TypeScript
cd functions && npm run build

# Deploy Cloud Functions
firebase deploy --only functions
```

Or deploy specific triggers:
```bash
firebase deploy --only functions:onUserDocumentCreated,functions:onAcademicProgramCreated
```

---

## 📊 Viewing Logs
To stream execution logs in real time:
```bash
firebase functions:log
```
