import nodemailer from "nodemailer";
import dotenv from "dotenv";

export function reloadEmailEnv() {
  try {
    dotenv.config({ override: true });
  } catch (e) {
    // Ignore reload error
  }
}

export function parseSender(fromEmailString?: string): { name: string; email: string } {
  const fallbackEmail = "alsamy36@gmail.com";
  const fallbackName = "Smart PE India";
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

export interface EmailSenderConfig {
  configured: boolean;
  provider: "smtp" | "gmail" | "resend" | "brevo" | "simulated";
  fromEmail: string;
}

export interface BrevoStatusResponse {
  configured: boolean;
  connected: boolean;
  apiKeyFound: boolean;
  account?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    credits?: number;
    planType?: string;
  };
  senders?: Array<{ id: number; name: string; email: string; active: boolean }>;
  fromEmail: string;
  senderVerified: boolean;
  error?: string;
}

export function getEmailConfig(): EmailSenderConfig {
  reloadEmailEnv();

  // Brevo takes priority if BREVO_API_KEY is present or explicitly chosen
  if (process.env.BREVO_API_KEY || process.env.EMAIL_PROVIDER === "brevo") {
    return {
      configured: Boolean(process.env.BREVO_API_KEY),
      provider: "brevo",
      fromEmail: process.env.FROM_EMAIL || "Smart PE India <alsamy36@gmail.com>"
    };
  }

  if (process.env.RESEND_API_KEY) {
    return {
      configured: true,
      provider: "resend",
      fromEmail: process.env.FROM_EMAIL || "Smart PE India <welcome@smartpeindia.app>"
    };
  }

  if (process.env.GMAIL_USER && (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS)) {
    return {
      configured: true,
      provider: "gmail",
      fromEmail: `Smart PE India <${process.env.GMAIL_USER}>`
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      configured: true,
      provider: "smtp",
      fromEmail: process.env.FROM_EMAIL || `Smart PE India <${process.env.SMTP_USER}>`
    };
  }

  return {
    configured: false,
    provider: "simulated",
    fromEmail: process.env.FROM_EMAIL || "Smart PE India <alsamy36@gmail.com>"
  };
}

export async function checkBrevoStatus(): Promise<BrevoStatusResponse> {
  reloadEmailEnv();
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const fromEmail = process.env.FROM_EMAIL || "Smart PE India <alsamy36@gmail.com>";
  const sender = parseSender(fromEmail);

  if (!apiKey) {
    return {
      configured: false,
      connected: false,
      apiKeyFound: false,
      fromEmail,
      senderVerified: false,
      error: "BREVO_API_KEY is not defined in your environment (.env file)."
    };
  }

  try {
    // 1. Fetch account info
    const accRes = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: {
        "api-key": apiKey,
        "accept": "application/json"
      }
    });

    if (!accRes.ok) {
      const errBody: any = await accRes.json().catch(() => null);
      const errMsg = errBody?.message || errBody?.code || `HTTP ${accRes.status} ${accRes.statusText}`;
      return {
        configured: true,
        connected: false,
        apiKeyFound: true,
        fromEmail,
        senderVerified: false,
        error: `Brevo authentication failed (${accRes.status}): ${errMsg}. Verify your BREVO_API_KEY in .env.`
      };
    }

    const accData: any = await accRes.json();

    // 2. Fetch verified senders
    let sendersList: Array<{ id: number; name: string; email: string; active: boolean }> = [];
    let senderVerified = false;

    try {
      const sendersRes = await fetch("https://api.brevo.com/v3/senders", {
        headers: {
          "api-key": apiKey,
          "accept": "application/json"
        }
      });
      if (sendersRes.ok) {
        const sendersData: any = await sendersRes.json();
        if (Array.isArray(sendersData.senders)) {
          sendersList = sendersData.senders.map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            active: s.active
          }));
          senderVerified = sendersList.some(
            s => s.email.toLowerCase() === sender.email.toLowerCase() && s.active
          );
        }
      }
    } catch (sErr) {
      console.warn("Failed to check Brevo senders list:", sErr);
    }

    // If account email matches the sender email, it is automatically authorized by Brevo
    if (!senderVerified && accData.email && accData.email.toLowerCase() === sender.email.toLowerCase()) {
      senderVerified = true;
    }

    const plan = Array.isArray(accData.plan) ? accData.plan[0] : null;

    return {
      configured: true,
      connected: true,
      apiKeyFound: true,
      account: {
        email: accData.email,
        firstName: accData.firstName,
        lastName: accData.lastName,
        companyName: accData.companyName,
        credits: plan?.credits,
        planType: plan?.type || "free"
      },
      senders: sendersList,
      fromEmail,
      senderVerified
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      apiKeyFound: true,
      fromEmail,
      senderVerified: false,
      error: `Network error connecting to Brevo: ${err.message}`
    };
  }
}

export function createTransporter() {
  const config = getEmailConfig();

  if (config.provider === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS
      }
    });
  }

  if (config.provider === "smtp") {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return null;
}

export function buildCorporateWelcomeEmail(recipientName: string, schoolName?: string): { subject: string; html: string; text: string } {
  const safeName = recipientName && recipientName.trim() ? recipientName.trim() : "Physical Education Educator";
  const safeSchool = schoolName && schoolName.trim() ? schoolName.trim() : "your school";
  const subject = `Welcome to Smart PE India, ${safeName} — Your 1-Year Free Founding Educator Pass is Active! 🏆`;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <style>
    table {border-collapse:collapse;border-spacing:0;margin:0;}
    div, td {padding:0;}
    div {margin:0 !important;}
  </style>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
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
              <h1 class="brand-title">Smart PE India</h1>
              <p class="brand-slogan">Plan Smarter. Teach Better.</p>
              <p class="brand-subtitle">India's #1 AI Platform for Physical Education Teachers & Sports Departments</p>
            </div>

            <!-- Main Content Area -->
            <div class="content">
              <!-- Personalized Greeting -->
              <p class="greeting">Dear ${safeName},</p>
              
              <p class="intro-p">
                Welcome to <strong>Smart PE India</strong>! We are thrilled to partner with you and <strong>${safeSchool}</strong> in modernizing physical education across India.
              </p>

              <!-- Highlight Pass Activation Card -->
              <div class="hero-banner">
                <div class="hero-banner-title">🌟 Your 1-Year Free Founding Educator Pass is Activated!</div>
                <p class="hero-banner-desc">
                  You have unlocked complete, unrestricted access to India's premier AI curriculum generator, assessment engine, and sports management suite.
                </p>
              </div>

              <!-- Key Benefits Section -->
              <div class="section-heading">⚡ Key Benefits of Your Smart PE India Portal:</div>

              <!-- Benefit 1: AI Lesson Planner -->
              <div class="benefit-card">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="benefit-icon-td">
                      <div style="background-color: #eff6ff; color: #0D2B52; width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">⚡</div>
                    </td>
                    <td class="benefit-content-td">
                      <div class="benefit-name">AI PE Lesson Planner & Drill Generator</div>
                      <p class="benefit-desc">Generate structured 40-minute lesson plans aligned with CBSE, ICSE & State boards in under 60 seconds with age-appropriate warm-ups and safety protocols.</p>
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
                      <div class="benefit-name">Official Khelo India & SAI Assessment Battery</div>
                      <p class="benefit-desc">Record fitness tests, calculate instant SAI percentile scores, track BMI ratings, and print inspection-ready student health report cards with 1 click.</p>
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
                      <div class="benefit-name">CBSE Theory Master & Exam Question Paper Maker</div>
                      <p class="benefit-desc">Generate complete board-pattern PE question papers for Classes 9–12 with comprehensive answer keys, marking schemes, and blueprint alignment.</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Benefit 4: Principal & Department Dashboard -->
              <div class="benefit-card">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="benefit-icon-td">
                      <div style="background-color: #faf5ff; color: #6b21a8; width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">📊</div>
                    </td>
                    <td class="benefit-content-td">
                      <div class="benefit-name">Principal & Management Inspection Dashboard</div>
                      <p class="benefit-desc">Generate executive summary reports, school-wide physical literacy metrics, and teacher workload schedules to demonstrate program excellence.</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Quick Start Steps -->
              <div class="checklist-box">
                <div class="checklist-title">🚀 3 Quick Steps to Get Started:</div>
                <div class="checklist-item"><strong>1.</strong> Click the button below to launch your digital PE portal.</div>
                <div class="checklist-item"><strong>2.</strong> Generate your first AI Lesson Plan or calculate a student's Khelo India test score.</div>
                <div class="checklist-item"><strong>3.</strong> Bookmark <a href="https://smartpeindia.app" style="color: #15803d; font-weight: bold;">smartpeindia.app</a> on your phone or laptop for daily PE class planning.</div>
              </div>

              <!-- Primary CTA -->
              <div class="cta-container">
                <a href="https://smartpeindia.app" class="cta-btn">Launch Your PE Portal Now →</a>
              </div>

              <!-- Founder Signature Note -->
              <div class="founder-card">
                <p style="margin: 0 0 6px 0; font-size: 14px; color: #475569;">
                  <strong>Need assistance or custom school onboarding?</strong>
                </p>
                <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">
                  Feel free to reply directly to this email or reach out to us at <a href="mailto:contact@smartpeindia.app" style="color: #0D2B52; font-weight: bold;">contact@smartpeindia.app</a>. We are dedicated to supporting every Physical Education teacher across India.
                </p>
                <p class="founder-name">Lurtha Samy (L. Samy)</p>
                <p class="founder-title">Founder & Physical Education Educator • Smart PE India</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 6px 0; font-weight: 800; color: #ffffff; font-size: 14px;">Smart PE India</p>
              <p style="margin: 0 0 10px 0; color: #94a3b8;">
                Empowering Physical Educators across India with AI Curriculum, Khelo India Assessments & Sports Analytics.
              </p>
              <div class="footer-links">
                <a href="https://smartpeindia.app">Portal Home</a> •
                <a href="https://smartpeindia.app/#curriculum">Curriculum</a> •
                <a href="https://smartpeindia.app/#khelo-india">Khelo India</a> •
                <a href="https://smartpeindia.app/#privacy">Privacy Policy</a> •
                <a href="mailto:contact@smartpeindia.app">Contact Support</a>
              </div>
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                © 2026 Smart PE India. All rights reserved. You are receiving this because your account was registered on smartpeindia.app.
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;

  const text = `
Dear ${safeName},

Welcome to Smart PE India! Your 1-Year Free Founding Educator Pass has been activated for ${safeSchool}.

🌟 Key Benefits of Your Smart PE India Portal:
1. ⚡ AI PE Lesson Planner & Drill Generator — Generate CBSE/ICSE/State aligned lesson plans in under 60 seconds with diagrams and safety cues.
2. 🏆 Official Khelo India & SAI Assessment Battery — Instant SAI fitness scores, BMI percentiles, and printable student health report cards.
3. 📝 CBSE Theory Master & Exam Question Paper Maker — Board-pattern PE question papers with ready-to-use answer keys for Classes 9–12.
4. 📊 Principal & Management Inspection Dashboard — Inspection-ready physical literacy reports and workload schedules.

Launch your PE portal anytime at: https://smartpeindia.app

Need help or custom school onboarding? Contact Founder L. Samy directly at contact@smartpeindia.app.

Best regards,
Lurtha Samy (L. Samy)
Founder & Physical Education Educator
Smart PE India (https://smartpeindia.app)
  `;

  return { subject, html, text };
}

// =========================================================================
// PART 2 OF NURTURE SEQUENCE: DAY 2-3 (AI PE Lesson Planner)
// =========================================================================
export function buildLessonPlannerNurtureEmail(recipientName: string, schoolName?: string): { subject: string; html: string; text: string } {
  const safeName = recipientName && recipientName.trim() ? recipientName.trim() : "Physical Education Educator";
  const safeSchool = schoolName && schoolName.trim() ? schoolName.trim() : "your school";
  const subject = `⚡ Save 3+ hours this week with AI Lesson Planning, ${safeName}`;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 24px 0 36px 0; }
    .main { background-color: #ffffff; margin: 0 auto; max-width: 620px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0D2B52 0%, #1e3a8a 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; background-color: #38bdf8; color: #0f172a; font-weight: 800; font-size: 11px; text-transform: uppercase; padding: 4px 14px; border-radius: 9999px; letter-spacing: 1px; margin-bottom: 12px; }
    .content { padding: 32px 28px; line-height: 1.7; font-size: 15px; color: #334155; }
    .highlight-card { background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0284c7; border-radius: 10px; padding: 18px 20px; margin: 20px 0; }
    .step-item { display: flex; margin-bottom: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .step-num { width: 28px; height: 28px; background: #0D2B52; color: #ffffff; font-weight: 900; font-size: 13px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 14px; flex-shrink: 0; }
    .cta-btn { background-color: #0D2B52; color: #ffffff !important; text-decoration: none; padding: 15px 32px; font-size: 15px; font-weight: 800; border-radius: 10px; display: inline-block; text-transform: uppercase; box-shadow: 0 4px 12px rgba(13,43,82,0.3); }
    .footer { background-color: #091D38; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div class="main">
            <div class="header">
              <div class="badge">Nurture Series • Part 2</div>
              <h1 style="font-size: 26px; font-weight: 900; margin: 0 0 6px 0; text-transform: uppercase; color: #ffffff;">AI PE Lesson Planning</h1>
              <p style="font-size: 14px; color: #cbd5e1; margin: 0;">Create 40-minute curriculum-aligned lesson plans in under 60 seconds</p>
            </div>

            <div class="content">
              <p style="font-size: 18px; font-weight: 800; color: #0D2B52; margin-top: 0;">Dear ${safeName},</p>
              
              <p>
                As a Physical Education teacher at <strong>${safeSchool}</strong>, writing manual lesson plans and drill progressions can take hours every weekend.
              </p>

              <div class="highlight-card">
                <h3 style="margin: 0 0 6px 0; color: #0D2B52; font-size: 16px;">⏱️ The 60-Second Lesson Plan Guarantee:</h3>
                <p style="margin: 0; font-size: 14px; color: #475569;">
                  Select your grade, choose a sport (e.g. Football, Basketball, Athletics, Kho-Kho), and our AI generates a structured 40-minute period breakdown with warm-ups, progressions, and safety protocols.
                </p>
              </div>

              <h4 style="color: #0D2B52; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px; margin: 24px 0 12px 0;">What is included in every AI Lesson Plan:</h4>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 6px 0; font-size: 14px;">✅ <strong>8-Minute Dynamic Warm-Up:</strong> Cardiovascular activation & dynamic joint mobility drills.</p>
                <p style="margin: 6px 0; font-size: 14px;">✅ <strong>12-Minute Skill Breakdown:</strong> Step-by-step coaching cues with fault corrections.</p>
                <p style="margin: 6px 0; font-size: 14px;">✅ <strong>15-Minute Lead-Up Game:</strong> Engaging modified play keeping all students active.</p>
                <p style="margin: 6px 0; font-size: 14px;">✅ <strong>5-Minute Cool-Down & Reflection:</strong> Static stretches & key learning questions.</p>
                <p style="margin: 6px 0; font-size: 14px;">✅ <strong>CBSE / ICSE / NEP 2020 Matrix:</strong> Official learning outcomes and safety guidelines.</p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="https://smartpeindia.app/#planner" class="cta-btn">Generate Your First Lesson Plan Now →</a>
              </div>

              <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                💡 <em>Tip: You can export your generated lesson plan as a PDF or copy it directly into your school diary.</em>
              </p>

              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 14px; font-weight: 800; color: #0D2B52;">Lurtha Samy (L. Samy)</p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Founder & PE Educator • Smart PE India</p>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #ffffff;">Smart PE India</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                You are receiving this value-packed guide as part of your 1-Year Free Founding Educator Pass.
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;

  const text = `
Dear ${safeName},

Save 3+ hours this week with Smart PE India's AI PE Lesson Planner!

As a Physical Education teacher at ${safeSchool}, writing manual lesson plans takes valuable time. With Smart PE India, you can generate complete 40-minute CBSE/ICSE aligned lesson plans in under 60 seconds.

Every plan includes:
- 8-Min Dynamic Warm-up
- 12-Min Skill Progression & Coaching Cues
- 15-Min Lead-up Small Sided Game
- 5-Min Cool-Down & Reflection
- Official CBSE/NEP 2020 Learning Outcomes

Try it now at: https://smartpeindia.app/#planner

Best regards,
L. Samy
Founder, Smart PE India
  `;

  return { subject, html, text };
}

// =========================================================================
// PART 3 OF NURTURE SEQUENCE: DAY 5-7 (Khelo India & Fitness Tests)
// =========================================================================
export function buildFitnessTestsNurtureEmail(recipientName: string, schoolName?: string): { subject: string; html: string; text: string } {
  const safeName = recipientName && recipientName.trim() ? recipientName.trim() : "Physical Education Educator";
  const safeSchool = schoolName && schoolName.trim() ? schoolName.trim() : "your school";
  const subject = `🏆 Calculate SAI Fitness Percentiles & Print Student Health Cards, ${safeName}`;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 24px 0 36px 0; }
    .main { background-color: #ffffff; margin: 0 auto; max-width: 620px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0D2B52 0%, #065f46 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; background-color: #34d399; color: #064e3b; font-weight: 800; font-size: 11px; text-transform: uppercase; padding: 4px 14px; border-radius: 9999px; letter-spacing: 1px; margin-bottom: 12px; }
    .content { padding: 32px 28px; line-height: 1.7; font-size: 15px; color: #334155; }
    .highlight-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 10px; padding: 18px 20px; margin: 20px 0; }
    .cta-btn { background-color: #16a34a; color: #ffffff !important; text-decoration: none; padding: 15px 32px; font-size: 15px; font-weight: 800; border-radius: 10px; display: inline-block; text-transform: uppercase; box-shadow: 0 4px 12px rgba(22,163,74,0.3); }
    .footer { background-color: #091D38; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div class="main">
            <div class="header">
              <div class="badge">Nurture Series • Part 3</div>
              <h1 style="font-size: 26px; font-weight: 900; margin: 0 0 6px 0; text-transform: uppercase; color: #ffffff;">Khelo India & Fitness Tests</h1>
              <p style="font-size: 14px; color: #a7f3d0; margin: 0;">Official SAI Assessment Battery & Instant Report Cards</p>
            </div>

            <div class="content">
              <p style="font-size: 18px; font-weight: 800; color: #0D2B52; margin-top: 0;">Dear ${safeName},</p>
              
              <p>
                Fitness assessments are the backbone of a high-performing Physical Education department at <strong>${safeSchool}</strong>.
              </p>

              <div class="highlight-card">
                <h3 style="margin: 0 0 6px 0; color: #166534; font-size: 16px;">🏆 Official Sports Authority of India (SAI) Battery Pre-Loaded:</h3>
                <p style="margin: 0; font-size: 14px; color: #15803d;">
                  Never spend hours manually matching raw scores to percentile tables. Enter your student's test results, and Smart PE India computes national percentile ranks instantly!
                </p>
              </div>

              <h4 style="color: #0D2B52; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px; margin: 24px 0 12px 0;">All 8 Official Tests Built-in:</h4>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 6px 0; font-size: 14px;">🔹 <strong>Body Composition:</strong> Height, Weight & BMI calculation with WHO/SAI rating bands.</p>
                <p style="margin: 6px 0; font-size: 14px;">🔹 <strong>Balance & Coordination:</strong> Flamingo Balance Test & Plate Tapping Test.</p>
                <p style="margin: 6px 0; font-size: 14px;">🔹 <strong>Speed & Endurance:</strong> 50m Standing Start Sprint & 600m Run/Walk.</p>
                <p style="margin: 6px 0; font-size: 14px;">🔹 <strong>Flexibility & Strength:</strong> Sit & Reach, Partial Curl-ups & Push-ups / Modified Push-ups.</p>
              </div>

              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 6px 0; color: #1e40af; font-size: 14px;">🖨️ Inspection-Ready Student Health Cards</h4>
                <p style="margin: 0; font-size: 13px; color: #1e3a8a;">
                  Print official Student Health & Fitness Report Cards for Parent-Teacher Meetings (PTMs) and CBSE annual school affiliation inspections with a single click.
                </p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="https://smartpeindia.app/#fitness" class="cta-btn">Explore Fitness Tests & Scores →</a>
              </div>

              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 14px; font-weight: 800; color: #0D2B52;">Lurtha Samy (L. Samy)</p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Founder & PE Educator • Smart PE India</p>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #ffffff;">Smart PE India</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                You are receiving this value-packed guide as part of your 1-Year Free Founding Educator Pass.
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;

  const text = `
Dear ${safeName},

Calculate instant SAI Fitness Percentiles & Print Student Health Cards for ${safeSchool}!

Smart PE India has all official Khelo India & SAI Battery tests pre-loaded:
- BMI & Body Composition
- 50m Sprint & 600m Run/Walk
- Sit & Reach Flexibility
- Flamingo Balance & Plate Tapping
- Partial Curl-Ups & Push-Ups

Generate inspection-ready Student Health Cards with 1 click:
https://smartpeindia.app/#fitness

Best regards,
L. Samy
Founder, Smart PE India
  `;

  return { subject, html, text };
}

export function getNurtureEmailTemplate(
  step: 1 | 2 | 3,
  recipientName: string,
  schoolName?: string
): { subject: string; html: string; text: string; stepName: string; triggerDay: string } {
  if (step === 2) {
    const data = buildLessonPlannerNurtureEmail(recipientName, schoolName);
    return { ...data, stepName: "AI PE Lesson Planner (Save 3h/week)", triggerDay: "Day 2" };
  }
  if (step === 3) {
    const data = buildFitnessTestsNurtureEmail(recipientName, schoolName);
    return { ...data, stepName: "Khelo India & Fitness Tests (SAI Percentiles)", triggerDay: "Day 5" };
  }
  const data = buildCorporateWelcomeEmail(recipientName, schoolName);
  return { ...data, stepName: "Welcome & 1-Year Founding Pass", triggerDay: "Day 0" };
}

export function buildCorporateFeatureEmail(featureTitle: string, featureDescription: string, actionUrl?: string): { subject: string; html: string; text: string } {
  const subject = `New on Smart PE India: ${featureTitle} 🚀`;
  const url = actionUrl || "https://smartpeindia.app";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0D2B52; padding: 28px 24px; text-align: center; color: #ffffff; }
    .content { padding: 32px 28px; line-height: 1.65; font-size: 15px; color: #334155; }
    .btn-primary { background-color: #0D2B52; color: #ffffff !important; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: 700; border-radius: 10px; display: inline-block; }
    .footer { background-color: #091D38; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://smartpeindia.app/logo.png" alt="Smart PE India Logo" width="50" height="50">
      <h2 style="margin: 10px 0 0 0; color: #ffffff;">New Feature Announcement</h2>
    </div>
    <div class="content">
      <h2 style="color: #0D2B52; margin-top: 0;">${featureTitle}</h2>
      <p style="font-size: 15px; color: #334155; line-height: 1.7;">${featureDescription}</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${url}" class="btn-primary">Try Feature on Portal →</a>
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        Warm regards,<br>
        <strong>Smart PE India Team</strong><br>
        <a href="https://smartpeindia.app" style="color: #0D2B52;">smartpeindia.app</a>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">Smart PE India • #1 AI Platform for Physical Education Teachers</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html, text: `${featureTitle}\n\n${featureDescription}\n\nAccess it at: ${url}` };
}

export async function dispatchEmail(toEmail: string, subject: string, html: string, text: string): Promise<{ success: boolean; message: string; provider: string }> {
  const config = getEmailConfig();

  // If Resend API key is available via HTTP API
  if (config.provider === "resend" && process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: config.fromEmail,
          to: [toEmail],
          subject,
          html,
          text
        })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: "Welcome email dispatched via Resend", provider: "resend" };
      }
      console.warn("Resend API error:", data);
    } catch (e: any) {
      console.error("Resend dispatch error:", e);
    }
  }

  // If Brevo API key is available via HTTP API
  if ((config.provider === "brevo" || process.env.BREVO_API_KEY) && process.env.BREVO_API_KEY) {
    const sender = parseSender(config.fromEmail);
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json",
          "api-key": process.env.BREVO_API_KEY.trim()
        },
        body: JSON.stringify({
          sender: { 
            name: sender.name, 
            email: sender.email 
          },
          to: [{ email: toEmail.trim() }],
          replyTo: {
            name: sender.name,
            email: sender.email
          },
          subject,
          htmlContent: html,
          textContent: text
        })
      });

      const data: any = await res.json().catch(() => null);

      if (res.ok) {
        console.log(`[Brevo] Email delivered to ${toEmail}. Message ID: ${data?.messageId || "OK"}`);
        return { 
          success: true, 
          message: `Email dispatched to ${toEmail} via Brevo API (Message ID: ${data?.messageId || "OK"})`, 
          provider: "brevo" 
        };
      } else {
        const errorDetail = data?.message || data?.code || `HTTP ${res.status} ${res.statusText}`;
        console.error("[Brevo] Dispatch error:", data);
        return { 
          success: false, 
          message: `Brevo API error (${res.status}): ${errorDetail}`, 
          provider: "brevo" 
        };
      }
    } catch (e: any) {
      console.error("[Brevo] Network dispatch error:", e);
      return { 
        success: false, 
        message: `Brevo connection failed: ${e.message}`, 
        provider: "brevo" 
      };
    }
  }

  // If SMTP / Gmail transporter is configured
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.fromEmail,
        to: toEmail,
        subject,
        html,
        text
      });
      return { success: true, message: `Email delivered to ${toEmail} via ${config.provider}`, provider: config.provider };
    } catch (smtpErr: any) {
      console.error("SMTP delivery error:", smtpErr);
      return { success: false, message: `SMTP error: ${smtpErr.message}`, provider: config.provider };
    }
  }

  // Simulated Corporate Dispatch (Logs full email and returns successfully)
  console.log(`[Smart PE Corporate Email Dispatcher] -> Simulated delivery to ${toEmail} | Subject: "${subject}"`);
  return {
    success: true,
    message: `Corporate welcome email generated for ${toEmail}. (Add SMTP or RESEND_API_KEY in settings for live inbox delivery).`,
    provider: "simulated"
  };
}
