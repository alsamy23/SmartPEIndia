import { auth } from './firebase';

// Client-side service to trigger corporate transactional emails via the Smart PE backend API

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    } catch (e) {
      console.warn('Could not get idToken for email service:', e);
    }
  }
  return headers;
}

export interface SendEmailPayload {
  toEmail: string;
  recipientName?: string;
  schoolName?: string;
  subject?: string;
  type?: 'welcome' | 'feature_update' | 'custom';
  customMessage?: string;
  featureTitle?: string;
}

export interface EmailServiceStatus {
  configured: boolean;
  provider: string; // 'smtp' | 'resend' | 'brevo' | 'sendgrid' | 'simulated'
  fromEmail: string;
}

export async function sendAutomatedWelcomeEmail(
  toEmail: string,
  recipientName?: string,
  schoolName?: string
): Promise<{ success: boolean; message: string; previewUrl?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/email/welcome', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        toEmail,
        recipientName: recipientName || 'Physical Education Educator',
        schoolName: schoolName || 'Smart PE Partner School'
      })
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error sending automated welcome email:', err);
    return { success: false, message: err.message || 'Failed to dispatch email' };
  }
}

export async function sendFeatureAnnouncementEmail(
  toEmails: string[],
  featureTitle: string,
  featureDescription: string,
  actionUrl?: string
): Promise<{ success: boolean; sentCount: number; message: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/email/announcement', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        toEmails,
        featureTitle,
        featureDescription,
        actionUrl: actionUrl || 'https://smartpeindia.app'
      })
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error sending feature announcement email:', err);
    return { success: false, sentCount: 0, message: err.message || 'Failed to dispatch announcement' };
  }
}

export function generateWelcomeEmailHtml(recipientName?: string, schoolName?: string): { subject: string; html: string; text: string } {
  const safeName = recipientName && recipientName.trim() ? recipientName.trim() : "Physical Education Educator";
  const safeSchool = schoolName && schoolName.trim() ? schoolName.trim() : "your school";
  const subject = `Welcome to Smart PE India, ${safeName} — Your 1-Year Free Founding Educator Pass is Active! 🏆`;

  const html = `<!DOCTYPE html>
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

              <!-- Benefit 5: Tournament & Fixtures Maker -->
              <div class="benefit-card">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="benefit-icon-td">
                      <div style="background-color: #fff1f2; color: #9f1239; width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">🏅</div>
                    </td>
                    <td class="benefit-content-td">
                      <div class="benefit-name">Tournament Fixture & Sports Day Manager</div>
                      <p class="benefit-desc">Build knockout brackets (with official bye calculations), round-robin leagues, and Sports Day point tables with exportable PDF & image sheets.</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Benefit 6: AI Biomechanics Lab -->
              <div class="benefit-card">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="benefit-icon-td">
                      <div style="background-color: #f0f9ff; color: #075985; width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">🏃</div>
                    </td>
                    <td class="benefit-content-td">
                      <div class="benefit-name">AI Sports Biomechanics & Skill Lab</div>
                      <p class="benefit-desc">Analyze athlete technique cues, common faults, and corrective drills across athletics, football, cricket, basketball, and badminton.</p>
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
</html>`;

  const text = `
Dear ${safeName},

Welcome to Smart PE India! Your 1-Year Free Founding Educator Pass has been activated for ${safeSchool}.

🌟 Key Benefits of Your Smart PE India Portal:
1. ⚡ AI PE Lesson Planner & Drill Generator — Generate CBSE/ICSE/State aligned lesson plans in under 60 seconds with diagrams and safety cues.
2. 🏆 Official Khelo India & SAI Assessment Battery — Instant SAI fitness scores, BMI percentiles, and printable student health report cards.
3. 📝 CBSE Theory Master & Exam Question Paper Maker — Board-pattern PE question papers with ready-to-use answer keys for Classes 9–12.
4. 📊 Principal & Management Inspection Dashboard — Inspection-ready physical literacy reports and workload schedules.
5. 🏅 Tournament & Sports Day Manager — Knockout brackets with bye calculations and round-robin league schedules.
6. 🏃 AI Sports Biomechanics Lab — Movement analysis and coaching cues for athletics, football, and cricket.

Launch your PE portal anytime at: https://smartpeindia.app

Need help or custom school onboarding? Contact Founder L. Samy directly at contact@smartpeindia.app.

Best regards,
Lurtha Samy (L. Samy)
Founder & Physical Education Educator
Smart PE India (https://smartpeindia.app)
  `;

  return { subject, html, text };
}

export async function triggerNurtureStep(
  toEmail: string,
  step: 1 | 2 | 3,
  recipientName?: string,
  schoolName?: string
): Promise<{ success: boolean; message: string; step: number; stepName: string; triggerDay: string; provider: string }> {
  try {
    const res = await fetch('/api/email/nurture/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail,
        step,
        recipientName: recipientName || 'Physical Education Educator',
        schoolName: schoolName || 'Smart PE Partner School'
      })
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`Error triggering nurture step ${step}:`, err);
    return { 
      success: false, 
      message: err.message || `Failed to trigger nurture step ${step}`,
      step,
      stepName: `Step ${step}`,
      triggerDay: `Day ${step === 1 ? 0 : step === 2 ? 2 : 5}`,
      provider: 'none'
    };
  }
}

export interface NurtureEvaluationResult {
  success: boolean;
  actionTaken: string;
  message: string;
  dispatchedStep?: 1 | 2 | 3;
  stepName?: string;
  triggerDay?: string;
  daysSinceRegistration?: number;
  isComplete?: boolean;
  provider?: string;
  updatedStatus?: {
    step1SentAt: string | null;
    step2SentAt: string | null;
    step3SentAt: string | null;
    lastEvaluatedAt: string;
  };
}

export async function evaluateNurtureSequence(payload: {
  toEmail: string;
  recipientName?: string;
  schoolName?: string;
  createdAt?: string;
  step1SentAt?: string | null;
  step2SentAt?: string | null;
  step3SentAt?: string | null;
}): Promise<NurtureEvaluationResult> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/email/nurture/evaluate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error evaluating nurture sequence:', err);
    return {
      success: false,
      actionTaken: 'error',
      message: err.message || 'Failed to evaluate nurture sequence'
    };
  }
}

export async function fetchNurturePreview(
  step: 1 | 2 | 3,
  name?: string,
  school?: string
): Promise<{ step: number; stepName: string; triggerDay: string; subject: string; html: string; text: string }> {
  try {
    const params = new URLSearchParams({
      step: String(step),
      name: name || 'Physical Education Educator',
      school: school || 'Smart PE Partner School'
    });
    const res = await fetch(`/api/email/nurture/preview?${params.toString()}`);
    const data = await res.json();
    return data;
  } catch {
    return {
      step,
      stepName: `Part ${step}`,
      triggerDay: step === 1 ? 'Day 0' : step === 2 ? 'Day 2' : 'Day 5',
      subject: `Smart PE India • Nurture Series Part ${step}`,
      html: `<p>Nurture Part ${step}</p>`,
      text: `Nurture Part ${step}`
    };
  }
}

export async function getEmailConfigStatus(): Promise<EmailServiceStatus> {
  try {
    const res = await fetch('/api/email/status');
    const data = await res.json();
    return data;
  } catch {
    return {
      configured: false,
      provider: 'simulated',
      fromEmail: 'alsamy36@gmail.com'
    };
  }
}

export interface BrevoLiveStatus {
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

export async function getBrevoLiveStatus(): Promise<BrevoLiveStatus> {
  try {
    const res = await fetch('/api/email/brevo/status');
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      configured: false,
      connected: false,
      apiKeyFound: false,
      fromEmail: 'alsamy36@gmail.com',
      senderVerified: false,
      error: err.message || 'Failed to connect to email status service'
    };
  }
}

export async function sendBrevoTestEmail(toEmail?: string): Promise<{
  success: boolean;
  message: string;
  provider: string;
  recipient?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toEmail: toEmail || 'alsamy36@gmail.com' })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network request failed',
      provider: 'brevo',
      error: err.message
    };
  }
}

