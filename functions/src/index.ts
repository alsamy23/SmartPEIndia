import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Configuration interface for Transactional Email Providers
 */
interface EmailConfig {
  brevoApiKey?: string;
  resendApiKey?: string;
  fromEmail: string;
  appName: string;
  appUrl: string;
  supportEmail: string;
}

/**
 * Retrieve active email configuration from environment
 */
function getEmailConfig(): EmailConfig {
  return {
    brevoApiKey: process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL || "SmartPE India <admin@smartpeindia.com>",
    appName: process.env.APP_NAME || "SmartPE India",
    appUrl: process.env.APP_URL || "https://smartpeindia.app",
    supportEmail: process.env.SUPPORT_EMAIL || "admin@smartpeindia.com"
  };
}

/**
 * Parse sender name and email from "Name <email@domain.com>" or plain email string
 */
function parseSender(fromEmailString?: string): { name: string; email: string } {
  const fallbackEmail = "admin@smartpeindia.com";
  const fallbackName = "SmartPE India";
  if (!fromEmailString || !fromEmailString.trim()) {
    return { name: fallbackName, email: fallbackEmail };
  }
  const str = fromEmailString.trim().replace(/^["']|["']$/g, "");
  const match = str.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim() || fallbackName;
    const email = match[2].trim();
    return { name, email };
  }
  if (str.includes("@")) {
    return { name: fallbackName, email: str };
  }
  return { name: fallbackName, email: fallbackEmail };
}

/**
 * Generate high-converting, responsive HTML email template for newly registered educators and coaches
 */
function buildPersonalizedWelcomeEmail(
  name: string,
  email: string,
  appName: string,
  appUrl: string,
  schoolOrAcademyName?: string,
  role?: string
): { subject: string; html: string; text: string } {
  const safeName =
    name && name.trim()
      ? name.trim()
      : email
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()) || "Physical Educator";

  const institutionContext = schoolOrAcademyName ? ` for ${schoolOrAcademyName}` : "";
  const isCoach = role?.toLowerCase().includes("coach") || role?.toLowerCase().includes("academy");

  const subject = isCoach
    ? `Welcome to ${appName}, Coach ${safeName} — Your Sports Academy Workspace is Ready! 🏆`
    : `Welcome to ${appName}, ${safeName} — Your 1-Year Free Founding Pass is Active! 🏆`;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: separate; }
    a { color: #0D2B52; text-decoration: none; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 24px 0 36px 0; }
    .main { background-color: #ffffff; margin: 0 auto; max-width: 620px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0D2B52 0%, #153e75 50%, #0a203d 100%); padding: 40px 32px 32px 32px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; background-color: #D4A017; color: #0D2B52; font-weight: 800; font-size: 11px; text-transform: uppercase; padding: 5px 16px; border-radius: 9999px; letter-spacing: 1px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(212, 160, 23, 0.4); }
    .brand-title { font-size: 28px; font-weight: 900; margin: 0 0 6px 0; letter-spacing: -0.5px; text-transform: uppercase; color: #ffffff; }
    .brand-slogan { font-size: 13px; font-weight: 700; color: #D4A017; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; }
    .brand-subtitle { font-size: 14px; opacity: 0.92; margin: 0; color: #e2e8f0; line-height: 1.4; }
    .content { padding: 36px 32px; line-height: 1.7; font-size: 15px; color: #334155; }
    .greeting { font-size: 18px; font-weight: 800; color: #0D2B52; margin: 0 0 16px 0; }
    .intro-p { font-size: 15px; line-height: 1.65; color: #334155; margin: 0 0 20px 0; }
    .hero-banner { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #D4A017; border-radius: 12px; padding: 18px 20px; margin: 24px 0 28px 0; }
    .hero-banner-title { font-size: 15px; font-weight: 800; color: #0D2B52; margin: 0 0 6px 0; }
    .hero-banner-desc { font-size: 13px; color: #475569; margin: 0; line-height: 1.5; }
    .section-heading { font-size: 16px; font-weight: 800; color: #0D2B52; text-transform: uppercase; letter-spacing: 0.5px; margin: 28px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
    .benefit-card { margin-bottom: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; }
    .benefit-icon-td { width: 36px; vertical-align: top; padding-top: 2px; }
    .benefit-content-td { vertical-align: top; padding-left: 12px; }
    .benefit-name { font-size: 14px; font-weight: 800; color: #0D2B52; margin: 0 0 3px 0; }
    .benefit-desc { font-size: 13px; color: #64748b; margin: 0; line-height: 1.5; }
    .cta-container { text-align: center; margin: 36px 0 28px 0; }
    .cta-btn { background-color: #0D2B52; color: #ffffff !important; text-decoration: none; padding: 16px 36px; font-size: 15px; font-weight: 800; border-radius: 10px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(13, 43, 82, 0.35); text-transform: uppercase; }
    .checklist-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; margin: 28px 0; }
    .checklist-title { font-size: 14px; font-weight: 800; color: #166534; margin: 0 0 10px 0; }
    .checklist-item { font-size: 13px; color: #15803d; margin: 6px 0; line-height: 1.5; }
    .founder-card { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
    .founder-name { font-size: 15px; font-weight: 800; color: #0D2B52; margin: 0; }
    .founder-title { font-size: 13px; color: #64748b; margin: 2px 0 0 0; }
    .footer { background-color: #091D38; padding: 32px 24px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6; }
    .footer a { color: #D4A017; text-decoration: none; font-weight: 600; }
    .footer-links { margin: 12px 0 16px 0; }
    .footer-links a { margin: 0 8px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div class="main">
            <!-- Header Banner -->
            <div class="header">
              <div class="badge">1-Year Free Founding Pass Active</div>
              <h1 class="brand-title">${appName}</h1>
              <p class="brand-slogan">Plan Smarter. Teach Better.</p>
              <p class="brand-subtitle">India's Dedicated Digital Platform for Physical Education & Sports Departments</p>
            </div>

            <!-- Main Content Area -->
            <div class="content">
              <!-- Personalized Greeting -->
              <p class="greeting">Dear ${safeName},</p>
              
              <p class="intro-p">
                Welcome to <strong>${appName}</strong>${institutionContext}! Your account has been registered successfully. We are excited to support you with modern tools built specifically for Physical Education teachers, HODs, and sports coaches across India.
              </p>

              <!-- Highlight Pass Activation Card -->
              <div class="hero-banner">
                <div class="hero-banner-title">🌟 Your 1-Year Free Founding Educator Pass is Active!</div>
                <p class="hero-banner-desc">
                  You have full access to our AI curriculum generator, Khelo India assessment battery, CBSE theory maker, and organized reporting tools.
                </p>
              </div>

              <!-- Key Benefits Section -->
              <div class="section-heading">⚡ Key Tools in Your SmartPE Workspace:</div>

              <!-- Benefit 1: AI Lesson Planner -->
              <div class="benefit-card">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="benefit-icon-td">
                      <div style="background-color: #eff6ff; color: #0D2B52; width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">⚡</div>
                    </td>
                    <td class="benefit-content-td">
                      <div class="benefit-name">AI PE Lesson Planner & Drill Generator</div>
                      <p class="benefit-desc">Generate structured 40-minute lesson plans aligned with CBSE, ICSE & State boards with age-appropriate warm-ups and safety protocols.</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Benefit 2: Khelo India Fitness Battery -->
              <div class="benefit-card">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="benefit-icon-td">
                      <div style="background-color: #fefce8; color: #854d0e; width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">🏆</div>
                    </td>
                    <td class="benefit-content-td">
                      <div class="benefit-name">Student Fitness & Khelo India Assessments</div>
                      <p class="benefit-desc">Record fitness tests, calculate SAI percentile scores, track BMI ratings, and generate organized student health report cards.</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Benefit 3: Theory & Exam Paper Maker -->
              <div class="benefit-card">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="benefit-icon-td">
                      <div style="background-color: #f0fdf4; color: #166534; width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">📝</div>
                    </td>
                    <td class="benefit-content-td">
                      <div class="benefit-name">CBSE Theory Master & Question Paper Maker</div>
                      <p class="benefit-desc">Generate board-pattern PE question papers for Classes 9–12 with comprehensive answer keys, blueprints, and marking schemes.</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Benefit 4: Practical 30-Mark Hub -->
              <div class="benefit-card">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="benefit-icon-td">
                      <div style="background-color: #faf5ff; color: #6b21a8; width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">📊</div>
                    </td>
                    <td class="benefit-content-td">
                      <div class="benefit-name">CBSE Class 11–12 Practical Assessment Hub (048)</div>
                      <p class="benefit-desc">Record and compile 30-mark practical exams across fitness, yoga, game proficiency, record file, and viva voce with ready-to-print sheets.</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Quick Start Steps -->
              <div class="checklist-box">
                <div class="checklist-title">🚀 3 Quick Steps to Get Started:</div>
                <div class="checklist-item"><strong>1.</strong> Click the button below to launch your SmartPE workspace.</div>
                <div class="checklist-item"><strong>2.</strong> Create your first AI lesson plan or record a student fitness assessment.</div>
                <div class="checklist-item"><strong>3.</strong> Bookmark <a href="${appUrl}" style="color: #15803d; font-weight: bold;">${appUrl.replace(/^https?:\/\//, "")}</a> on your phone or computer for instant daily access.</div>
              </div>

              <!-- Primary CTA -->
              <div class="cta-container">
                <a href="${appUrl}" class="cta-btn">Launch Your SmartPE Workspace →</a>
              </div>

              <!-- Founder Signature Note -->
              <div class="founder-card">
                <p style="margin: 0 0 6px 0; font-size: 14px; color: #475569;">
                  <strong>Need assistance or have questions?</strong>
                </p>
                <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">
                  Reach out directly to us at <a href="mailto:admin@smartpeindia.com" style="color: #0D2B52; font-weight: bold;">admin@smartpeindia.com</a>. We are here to help make your physical education program run smoothly and efficiently.
                </p>
                <p class="founder-name">SmartPE India Team</p>
                <p class="founder-title">Physical Education Software for Indian Schools • ${appUrl.replace(/^https?:\/\//, "")}</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 6px 0; font-weight: 800; color: #ffffff; font-size: 14px;">${appName}</p>
              <p style="margin: 0 0 10px 0; color: #94a3b8;">
                Built for Indian Schools, Physical Education Teachers, and Sports Departments.
              </p>
              <div class="footer-links">
                <a href="${appUrl}">Portal Home</a> •
                <a href="${appUrl}/cbse-physical-education">CBSE PE</a> •
                <a href="${appUrl}/khelo-india-fitness-assessment">Khelo India</a> •
                <a href="${appUrl}/ai-pe-lesson-planner">AI Lesson Planner</a> •
                <a href="mailto:admin@smartpeindia.com">Contact Support</a>
              </div>
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                © ${new Date().getFullYear()} ${appName}. All rights reserved. You received this email because your account was registered on ${appUrl.replace(/^https?:\/\//, "")}.
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

  const text = `Dear ${safeName},

Welcome to ${appName}${institutionContext}! Your 1-Year Free Founding Educator Pass has been activated for ${email}.

⚡ Key Tools in Your SmartPE Workspace:
1. AI PE Lesson Planner & Drill Generator — Structured 40-min lesson plans aligned with CBSE, ICSE & State boards.
2. Student Fitness & Khelo India Assessments — SAI percentile scores, BMI tracking, and printable student health report cards.
3. CBSE Theory Master & Question Paper Maker — Board-pattern PE question papers with answer keys for Classes 9–12.
4. CBSE Practical 30-Mark Hub (Subject 048) — Inspection-ready practical score compiling and evaluation sheets.
5. Tournament & Sports Day Manager — Knockout brackets and round-robin league schedules.

Launch your workspace anytime at: ${appUrl}

Need assistance? Contact us directly at admin@smartpeindia.com.

Best regards,
SmartPE India Team
${appName} (${appUrl})`;

  return { subject, html, text };
}

/**
 * Dispatch transactional email via Brevo REST API (https://api.brevo.com/v3/smtp/email)
 */
async function sendViaBrevo(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  recipientName: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const sender = parseSender(fromEmail);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey.trim()
      },
      body: JSON.stringify({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: toEmail.trim(), name: recipientName }],
        subject,
        htmlContent: html,
        textContent: text
      })
    });

    const result = await response.json();
    if (response.ok) {
      return { success: true, data: result };
    }
    return { success: false, error: result?.message || JSON.stringify(result) };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reach Brevo API" };
  }
}

/**
 * Dispatch transactional email via Resend REST API (https://api.resend.com/emails)
 */
async function sendViaResend(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail.trim()],
        subject,
        html,
        text
      })
    });

    const result = await response.json();
    if (response.ok) {
      return { success: true, data: result };
    }
    return { success: false, error: result?.message || JSON.stringify(result) };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reach Resend API" };
  }
}

/**
 * Common welcome email dispatcher with deduplication and Firestore audit logging
 */
async function dispatchWelcomeEmail(params: {
  userId: string;
  email: string;
  displayName?: string;
  schoolName?: string;
  role?: string;
  sourceTrigger: string;
}): Promise<{ success: boolean; provider: string; error?: string }> {
  const { userId, email, displayName, schoolName, role, sourceTrigger } = params;

  if (!email || !email.includes("@")) {
    functions.logger.warn(`[Welcome Email] Invalid email '${email}' for user ${userId}. Skipping.`);
    return { success: false, provider: "none", error: "Invalid email" };
  }

  const db = admin.firestore();
  const mailLogRef = db.collection("mail_logs").doc(`welcome_${userId}`);

  // Deduplication check: verify if welcome email was already dispatched
  try {
    const existingLog = await mailLogRef.get();
    if (existingLog.exists && existingLog.data()?.status === "sent") {
      functions.logger.info(`[Welcome Email] Welcome email already dispatched for ${email} (UID: ${userId}). Skipping duplicate send.`);
      return { success: true, provider: "already_sent" };
    }
  } catch (checkErr) {
    functions.logger.warn("[Welcome Email] Failed to check existing mail_logs:", checkErr);
  }

  const config = getEmailConfig();
  const recipientName = displayName || email.split("@")[0];
  const { subject, html, text } = buildPersonalizedWelcomeEmail(
    recipientName,
    email,
    config.appName,
    config.appUrl,
    schoolName,
    role
  );

  let dispatchResult: { success: boolean; provider: string; data?: any; error?: string };

  // 1. Primary Provider: Brevo REST API
  if (config.brevoApiKey) {
    functions.logger.info(`[Welcome Email] Dispatching via Brevo REST API to ${email}...`);
    const brevoRes = await sendViaBrevo(
      config.brevoApiKey,
      config.fromEmail,
      email,
      recipientName,
      subject,
      html,
      text
    );
    dispatchResult = { ...brevoRes, provider: "brevo" };
  }
  // 2. Secondary Provider: Resend REST API
  else if (config.resendApiKey) {
    functions.logger.info(`[Welcome Email] Dispatching via Resend REST API to ${email}...`);
    const resendRes = await sendViaResend(
      config.resendApiKey,
      config.fromEmail,
      email,
      subject,
      html,
      text
    );
    dispatchResult = { ...resendRes, provider: "resend" };
  }
  // 3. Fallback when keys are not configured in environment
  else {
    functions.logger.warn(
      `[Welcome Email] No BREVO_API_KEY or RESEND_API_KEY found in functions environment. Welcome email simulated for ${email}.`
    );
    dispatchResult = {
      success: true,
      provider: "simulated",
      data: { message: "Simulated dispatch - set BREVO_API_KEY in Cloud Functions config" }
    };
  }

  // Audit Logging to Firestore
  try {
    await mailLogRef.set({
      uid: userId,
      email,
      recipientName,
      subject,
      provider: dispatchResult.provider,
      status: dispatchResult.success ? "sent" : "failed",
      error: dispatchResult.error || null,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      triggeredBy: sourceTrigger
    });

    // Update user document nurtureStep1 timestamp if user doc exists
    if (dispatchResult.success) {
      const userRef = db.collection("users").doc(userId);
      await userRef.set(
        {
          nurtureStep1SentAt: new Date().toISOString(),
          welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    }

    functions.logger.info(`[Welcome Email] Mail log recorded in 'mail_logs/welcome_${userId}' (Status: ${dispatchResult.success ? "sent" : "failed"})`);
  } catch (logErr) {
    functions.logger.error("[Welcome Email] Failed to record mail log in Firestore:", logErr);
  }

  return dispatchResult;
}

// =========================================================================
// CLOUD FUNCTION TRIGGERS
// =========================================================================

/**
 * 1. FIRESTORE TRIGGER: onUserDocumentCreated
 * Triggers automatically whenever a new teacher/educator profile is created in Firestore (/users/{userId}).
 * Uses the existing Brevo API configuration to deliver a professional welcome email.
 */
export const onUserDocumentCreated = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
    const userId = context.params.userId;
    const data = (snap.data() as Record<string, any>) || {};
    const email = data.email;
    const displayName = data.displayName || data.name;
    const schoolName = data.schoolName;
    const role = data.role;

    if (!email) {
      functions.logger.warn(`[Firestore Trigger] Document users/${userId} has no email field. Skipping.`);
      return;
    }

    functions.logger.info(`[Firestore Trigger] New user registration detected in Firestore: users/${userId} (${email})`);

    await dispatchWelcomeEmail({
      userId,
      email,
      displayName,
      schoolName,
      role,
      sourceTrigger: "firestore.users.onCreate"
    });
  });

/**
 * 2. FIRESTORE TRIGGER: onAcademicProgramCreated
 * Triggers automatically when a sports academy or coaching program is registered in Firestore (/academic_programs/{programId}).
 * Sends welcome email to the head coach / academy admin via Brevo.
 */
export const onAcademicProgramCreated = functions.firestore
  .document("academic_programs/{programId}")
  .onCreate(async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
    const programId = context.params.programId;
    const data = (snap.data() as Record<string, any>) || {};
    const adminEmail = data.adminEmail;
    const headCoachName = data.headCoachName;
    const programName = data.programName;
    const headCoachId = data.headCoachId || `academy_${programId}`;

    if (!adminEmail) {
      functions.logger.info(`[Firestore Trigger] Academic program ${programId} has no adminEmail. Skipping.`);
      return;
    }

    functions.logger.info(`[Firestore Trigger] New sports academy registration in Firestore: academic_programs/${programId} (${adminEmail})`);

    await dispatchWelcomeEmail({
      userId: headCoachId,
      email: adminEmail,
      displayName: headCoachName,
      schoolName: programName,
      role: "coach",
      sourceTrigger: "firestore.academic_programs.onCreate"
    });
  });

/**
 * 3. AUTH TRIGGER: onAuthUserCreated (also exported as sendPersonalizedWelcomeEmail)
 * Triggers automatically upon Firebase Authentication user creation.
 */
export const onAuthUserCreated = functions.auth
  .user()
  .onCreate(async (user: admin.auth.UserRecord) => {
    const { uid, email, displayName } = user;

    if (!email) {
      functions.logger.warn(`[Auth Trigger] User ${uid} has no email address. Skipping.`);
      return;
    }

    functions.logger.info(`[Auth Trigger] New Firebase Auth user created: ${email} (UID: ${uid})`);

    await dispatchWelcomeEmail({
      userId: uid,
      email,
      displayName: displayName || undefined,
      sourceTrigger: "auth.user.onCreate"
    });
  });

// Backward compatibility export
export const sendPersonalizedWelcomeEmail = onAuthUserCreated;
