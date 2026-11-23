import express from "express";
import { GoogleGenAI } from "@google/genai";
import * as genAiPackage from "@google/genai";
const ThinkingLevel = (genAiPackage as any).ThinkingLevel;
import Groq from "groq-sdk";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };
import { 
  getEmailConfig, 
  checkBrevoStatus,
  buildCorporateWelcomeEmail, 
  buildCorporateFeatureEmail, 
  buildLessonPlannerNurtureEmail,
  buildFitnessTestsNurtureEmail,
  buildTeacherInviteEmail,
  buildBillingInvoiceRequestEmail,
  getNurtureEmailTemplate,
  dispatchEmail,
  buildAdminIncidentAlertEmail,
  type IncidentEmailData
} from "./email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Respect X-Forwarded-For from Vercel / Cloud Run reverse proxies for accurate per-IP rate limiting
app.set("trust proxy", 1);

// Global lightweight security headers (non-framing so dev AI Studio iframe continues working; framing blocked on /api/* and production hosting configs)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

// Controlled Request Limits (Anti-DOS):
// General JSON body: 2MB max
// Raw/Audio transcribe body: 15MB max (applied directly on /api/ai/transcribe)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === "string"
      ? forwarded.split(",")[0]
      : req.ip || req.socket?.remoteAddress || "unknown";
  return String(rawIp || "unknown").trim().replace(/^::ffff:/, "");
}

// Rate Limiting Storage (In-memory, clean interval every 5 mins)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitBucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimits.entries()) {
    if (bucket.resetAt <= now) {
      rateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let bucket = rateLimits.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 1, resetAt: now + windowMs };
    rateLimits.set(key, bucket);
    return { allowed: true };
  }

  bucket.count++;
  if (bucket.count > maxRequests) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

// Token Verification Cache
interface VerifiedTokenPayload {
  uid: string;
  email?: string;
  expiresAt: number;
}
const tokenCache = new Map<string, VerifiedTokenPayload>();

async function verifyFirebaseIdToken(token: string): Promise<VerifiedTokenPayload | null> {
  if (!token || typeof token !== "string") return null;

  // Check in-memory cache
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  try {
    // Validate via Google Identity Toolkit
    const apiKey = firebaseConfig.apiKey;
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const user = data.users?.[0];
    if (!user || !user.localId) {
      return null;
    }

    const payload: VerifiedTokenPayload = {
      uid: user.localId,
      email: user.email,
      expiresAt: Date.now() + 10 * 60 * 1000 // Cache for 10 minutes
    };
    tokenCache.set(token, payload);
    return payload;
  } catch (err) {
    console.error("Token verification error:", err);
    return null;
  }
}

// Authentication Middleware
interface AuthenticatedRequest extends express.Request {
  user?: VerifiedTokenPayload;
}

const optionalAuth = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1]?.trim();
    if (token) {
      try {
        const verified = await verifyFirebaseIdToken(token);
        if (verified) {
          req.user = verified;
        }
      } catch (err) {
        // Non-blocking for AI generation proxy
      }
    }
  }
  next();
};

const requireAuth = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      error: "Authentication required", 
      message: "Please sign in to access this SmartPE service." 
    });
  }

  const token = authHeader.split("Bearer ")[1]?.trim();
  const verified = await verifyFirebaseIdToken(token);
  if (!verified) {
    return res.status(401).json({ 
      error: "Invalid or expired session", 
      message: "Your session has expired. Please refresh the page and sign in again." 
    });
  }

  req.user = verified;
  next();
};

const SUPER_ADMIN_EMAILS = [
  "alsamy36@gmail.com",
  "admin@smartpeindia.app",
  "contact@smartpeindia.app",
  "info@smartpeindia.app"
];

const requireAdmin = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  await requireAuth(req, res, () => {
    const userEmail = req.user?.email?.toLowerCase();
    if (!userEmail || !SUPER_ADMIN_EMAILS.includes(userEmail)) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: "You do not have administrative privileges to execute this operation." 
      });
    }
    next();
  });
};

// Secure AI Secret Lookup (Strict Server-Side Only; Never use VITE_* fallbacks)
const isGoogleApiKey = (key: string): boolean => {
  if (!key || typeof key !== "string") return false;
  const clean = key.trim().replace(/^["']|["']$/g, '');
  if (clean.length < 20) return false;
  if (clean.startsWith("sk-") || clean.startsWith("sk_") || clean.startsWith("gsk_") || clean.startsWith("xkeysib-") || clean.startsWith("re_")) return false;
  return clean.startsWith("AIza");
};

const getGeminiKeys = (): string[] => {
  const keys: string[] = [];
  const primaryNames = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "API_KEY"];
  for (const name of primaryNames) {
    const val = process.env[name];
    if (val && val.trim() !== "" && val !== "undefined" && val !== "null") {
      const clean = val.trim().replace(/^["']|["']$/g, '');
      if (isGoogleApiKey(clean) && !keys.includes(clean)) {
        keys.push(clean);
      }
    }
  }

  for (let i = 1; i <= 20; i++) {
    const val = process.env[`GEMINI_KEY_${i}`];
    if (val && val.trim() !== "" && val !== "undefined" && val !== "null") {
      const clean = val.trim().replace(/^["']|["']$/g, '');
      if (isGoogleApiKey(clean) && !keys.includes(clean)) {
        keys.push(clean);
      }
    }
  }

  return keys;
};

const getOpenRouterKeys = (): string[] => {
  const keys: string[] = [];
  const primaryNames = ["OPENROUTER_API_KEY"];
  for (const name of primaryNames) {
    const val = process.env[name];
    if (val && val.trim() !== "" && val !== "undefined" && val !== "null") {
      const clean = val.trim().replace(/^["']|["']$/g, '');
      if (!keys.includes(clean)) keys.push(clean);
    }
  }
  const maybeSkOrNames = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "API_KEY"];
  for (const name of maybeSkOrNames) {
    const val = process.env[name];
    if (val && val.trim().replace(/^["']|["']$/g, '').startsWith("sk-or-")) {
      const clean = val.trim().replace(/^["']|["']$/g, '');
      if (!keys.includes(clean)) keys.push(clean);
    }
  }
  for (let i = 1; i <= 20; i++) {
    const val = process.env[`GEMINI_KEY_${i}`];
    if (val && val.trim().replace(/^["']|["']$/g, '').startsWith("sk-or-")) {
      const clean = val.trim().replace(/^["']|["']$/g, '');
      if (!keys.includes(clean)) keys.push(clean);
    }
  }
  return keys;
};

const getGroqKey = () => {
  const directKey = process.env.GROQ_API_KEY;
  if (directKey && directKey.trim() !== "" && directKey !== "undefined" && directKey !== "null") {
    return directKey.trim().replace(/^["']|["']$/g, '');
  }
  for (let i = 1; i <= 20; i++) {
    const val = process.env[`GEMINI_KEY_${i}`];
    if (val && val.trim().replace(/^["']|["']$/g, '').startsWith("gsk_")) {
      return val.trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
};

const getAI = () => {
  const geminiKeys = getGeminiKeys();
  const groqKey = getGroqKey();
  const openRouterKeys = getOpenRouterKeys();
  
  return { 
    hasGemini: geminiKeys.length > 0,
    hasGroq: !!groqKey,
    hasOpenRouter: openRouterKeys.length > 0,
    geminiCount: geminiKeys.length,
    groqConfigured: !!groqKey,
    openRouterCount: openRouterKeys.length,
    env: process.env.NODE_ENV
  };
};

// API Router
const apiRouter = express.Router();

// Enforce strict security headers on all API endpoints
apiRouter.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Cache-Control", "no-store");
  next();
});

apiRouter.get("/health", (req, res) => {
  try {
    const status = getAI();
    const emailStatus = getEmailConfig();
    res.json({ 
      status: (status.hasGemini || status.hasGroq || status.hasOpenRouter) ? "ok" : "missing",
      emailConfigured: emailStatus.configured,
      emailProvider: emailStatus.provider,
      ...status
    });
  } catch (err: any) {
    console.error("Health check error:", err);
    res.status(500).json({ status: "error", message: "Health check failed" });
  }
});

// Check transactional email service configuration
apiRouter.get("/email/status", (req, res) => {
  try {
    const config = getEmailConfig();
    res.json(config);
  } catch (err: any) {
    console.error("Email status error:", err);
    res.status(500).json({ configured: false, error: "Failed to read email status" });
  }
});

// Check Brevo specific live account & sender verification status
apiRouter.get("/email/brevo/status", async (req, res) => {
  try {
    const status = await checkBrevoStatus();
    res.json(status);
  } catch (err: any) {
    console.warn("Brevo status inspection warning:", err.message);
    res.status(500).json({ 
      configured: false, 
      connected: false, 
      apiKeyFound: false, 
      fromEmail: "noreply@smartpeindia.app",
      senderVerified: false, 
      error: err.message || "Failed to inspect Brevo status" 
    });
  }
});

// Send a test email via active provider (Brevo / SMTP / Resend)
apiRouter.post("/email/test", async (req, res) => {
  try {
    const { toEmail } = req.body;
    const targetEmail = toEmail || process.env.ADMIN_ALERT_EMAIL || "contact@smartpeindia.app";

    if (!targetEmail || typeof targetEmail !== "string" || !targetEmail.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid recipient email address is required" });
    }

    const config = getEmailConfig();
    const testSubject = `Smart PE India - Brevo Email Configuration Test 🚀`;
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 32px 16px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #0D2B52; padding: 28px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">Smart PE India</h1>
            <p style="margin: 4px 0 0 0; color: #D4A017; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Email Service Verification</p>
          </div>
          <div style="padding: 28px 24px; color: #334155; line-height: 1.6;">
            <div style="display: inline-block; background-color: #dcfce7; color: #15803d; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px;">
              ✓ Brevo Connection Successful
            </div>
            <h2 style="color: #0D2B52; font-size: 18px; margin: 0 0 12px 0;">Your Brevo Transactional Email is Active!</h2>
            <p style="margin: 0 0 16px 0; font-size: 14px;">
              Congratulations! Your Smart PE India portal is now integrated with Brevo. Transactional emails, 1-Year Free Founding Educator passes, and automated nurture sequences will be delivered seamlessly.
            </p>
            <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px 16px; margin: 20px 0; font-size: 13px;">
              <p style="margin: 3px 0;"><strong>Active Provider:</strong> ${config.provider.toUpperCase()}</p>
              <p style="margin: 3px 0;"><strong>Sender Address:</strong> ${config.fromEmail}</p>
              <p style="margin: 3px 0;"><strong>Delivered To:</strong> ${targetEmail}</p>
              <p style="margin: 3px 0;"><strong>Sent At:</strong> ${new Date().toUTCString()}</p>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              Best regards,<br>
              <strong>Lurtha Samy (L. Samy)</strong><br>
              Founder • Smart PE India (<a href="https://smartpeindia.app" style="color: #0D2B52;">smartpeindia.app</a>)
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    const testText = `Smart PE India - Brevo Email Configuration Test\n\nYour Brevo transactional email integration is operational!\n\nProvider: ${config.provider}\nSender: ${config.fromEmail}\nRecipient: ${targetEmail}\nTimestamp: ${new Date().toISOString()}`;

    const result = await dispatchEmail(targetEmail, testSubject, testHtml, testText);

    res.json({
      success: result.success,
      message: result.message,
      provider: result.provider,
      recipient: targetEmail,
      config: {
        configured: config.configured,
        provider: config.provider,
        fromEmail: config.fromEmail
      }
    });
  } catch (error: any) {
    console.warn("Test email dispatch warning:", error.message);
    res.status(500).json({ success: false, error: error.message || "Failed to dispatch test email" });
  }
});

// =========================================================================
// Real-time System Telemetry, Incident Logging & WhatsApp / Email Alerts
// =========================================================================
interface TelemetryConfig {
  adminAlertEmail: string;
  adminWhatsAppNumber: string;
  emailAlertsEnabled: boolean;
}

const telemetryConfig: TelemetryConfig = {
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL || "contact@smartpeindia.app",
  adminWhatsAppNumber: process.env.ADMIN_WHATSAPP_NUMBER || "919443389025",
  emailAlertsEnabled: true
};

const storedIncidents: IncidentEmailData[] = [];
const recentAlertTimestamps = new Map<string, number>();

// POST /api/telemetry/incident - Ingest error from visitor/user, alert via Email & generate WhatsApp link
apiRouter.post("/telemetry/incident", async (req, res) => {
  try {
    const ip = req.ip || "unknown";
    const rl = checkRateLimit(`telemetry_${ip}`, 50, 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ error: "Rate limit exceeded for telemetry" });
    }

    const {
      category = "SYSTEM_INCIDENT",
      title = "Unexpected Error",
      message = "No message provided",
      module = "General",
      details,
      userContext = {},
      userContact,
      userNote
    } = req.body;

    const incidentId = "inc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const timestamp = new Date().toISOString();

    // Filter out benign / transient dev environment noise (e.g. Vite HMR WebSocket disconnects in iframe/proxy)
    const combinedErrorText = `${category} ${title} ${message} ${typeof details === 'object' ? JSON.stringify(details) : String(details || '')}`.toLowerCase();
    const isBenign = [
      'websocket',
      '@vite/client',
      'vite',
      'hmr',
      'resizeobserver',
      'aborterror',
      'canceled',
      'cancelled'
    ].some(pat => combinedErrorText.includes(pat));

    if (isBenign) {
      return res.json({
        success: true,
        ignored: true,
        incidentId,
        message: "Benign environment event ignored"
      });
    }

    const incidentData: IncidentEmailData = {
      incidentId,
      category,
      title,
      message,
      module,
      details,
      userContext,
      userContact,
      userNote,
      timestamp
    };

    // Store in-memory (max 100)
    storedIncidents.unshift(incidentData);
    if (storedIncidents.length > 100) {
      storedIncidents.pop();
    }

    // Build WhatsApp Intimation Link
    const cleanPhone = telemetryConfig.adminWhatsAppNumber.replace(/[^0-9]/g, "");
    const waText = `🚨 *SmartPE Alert: ${category}*\n\n` +
      `*Module:* ${module}\n` +
      `*Issue:* ${title}\n` +
      `*Error:* ${message ? String(message).slice(0, 140) : "Unknown error"}\n` +
      `*Reporter:* ${userContext?.email || userContact || "Guest Visitor"}\n` +
      `*Time:* ${new Date().toLocaleTimeString()} IST\n\n` +
      `*AI Studio Prompt:* "In SmartPE India, fix error: ${category} in ${module}: ${message ? String(message).slice(0, 90) : ""}"`;
    const whatsappAlertUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waText)}`;

    // Email alert with 2-minute deduplication throttle to prevent email flood
    let emailDispatched = false;
    let emailMessage = "Email alerts disabled";

    if (telemetryConfig.emailAlertsEnabled && telemetryConfig.adminAlertEmail) {
      const dedupKey = `${category}:${module}:${message ? String(message).slice(0, 60) : ""}`;
      const lastAlertTime = recentAlertTimestamps.get(dedupKey) || 0;
      const now = Date.now();

      if (now - lastAlertTime > 2 * 60 * 1000) {
        recentAlertTimestamps.set(dedupKey, now);
        try {
          const emailTpl = buildAdminIncidentAlertEmail(incidentData);
          const dispatchRes = await dispatchEmail(
            telemetryConfig.adminAlertEmail,
            emailTpl.subject,
            emailTpl.html,
            emailTpl.text
          );
          emailDispatched = dispatchRes.success;
          emailMessage = dispatchRes.message;
        } catch (emailErr: any) {
          console.warn("Failed to dispatch incident email alert:", emailErr);
          emailMessage = emailErr.message;
        }
      } else {
        emailMessage = "Throttled (similar alert sent within last 2 minutes)";
      }
    }

    res.json({
      success: true,
      incidentId,
      whatsappAlertUrl,
      emailDispatched,
      emailMessage,
      timestamp
    });
  } catch (err: any) {
    console.error("Telemetry ingestion error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to ingest telemetry" });
  }
});

// GET /api/telemetry/incidents - Retrieve captured incidents for System Health dashboard
apiRouter.get("/telemetry/incidents", (req, res) => {
  try {
    const stats = {
      total: storedIncidents.length,
      aiQuota: storedIncidents.filter(i => i.category === 'AI_GENERATION_FAILED').length,
      auth: storedIncidents.filter(i => i.category === 'AUTH_LOGIN_FAILED').length,
      fitness: storedIncidents.filter(i => i.category === 'FITNESS_TEST_FAILED').length,
      tournament: storedIncidents.filter(i => i.category === 'TOURNAMENT_CHECKIN_FAILED').length,
      userReports: storedIncidents.filter(i => !!i.userNote || !!i.userContact).length
    };
    res.json({ success: true, incidents: storedIncidents, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to retrieve incidents" });
  }
});

// DELETE /api/telemetry/incidents - Clear captured incident logs
apiRouter.delete("/telemetry/incidents", (req, res) => {
  try {
    storedIncidents.length = 0;
    res.json({ success: true, message: "Incident logs cleared" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to clear incidents" });
  }
});

// GET /api/telemetry/config - Read alert config
apiRouter.get("/telemetry/config", (req, res) => {
  res.json({
    success: true,
    config: telemetryConfig
  });
});

// POST /api/telemetry/config - Update alert config
apiRouter.post("/telemetry/config", (req, res) => {
  try {
    const { adminAlertEmail, adminWhatsAppNumber, emailAlertsEnabled } = req.body;
    if (adminAlertEmail && typeof adminAlertEmail === 'string') {
      telemetryConfig.adminAlertEmail = adminAlertEmail.trim();
    }
    if (adminWhatsAppNumber && typeof adminWhatsAppNumber === 'string') {
      telemetryConfig.adminWhatsAppNumber = adminWhatsAppNumber.replace(/[^0-9]/g, "");
    }
    if (typeof emailAlertsEnabled === 'boolean') {
      telemetryConfig.emailAlertsEnabled = emailAlertsEnabled;
    }
    res.json({ success: true, config: telemetryConfig });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to update telemetry config" });
  }
});

// POST /api/telemetry/test-alert - Trigger verification test alert
apiRouter.post("/telemetry/test-alert", async (req, res) => {
  try {
    const { targetEmail, targetPhone } = req.body;
    const emailToUse = targetEmail || telemetryConfig.adminAlertEmail;
    const phoneToUse = (targetPhone || telemetryConfig.adminWhatsAppNumber).replace(/[^0-9]/g, "");

    const testIncident: IncidentEmailData = {
      incidentId: "test_" + Date.now().toString(36),
      category: "AI_GENERATION_FAILED",
      title: "Test Alert: API Quota / Model Verification",
      message: "This is a simulated verification alert to ensure your email & WhatsApp notifications are functioning properly.",
      module: "AI PE Lesson Planner & Telemetry Hub",
      details: {
        testMode: true,
        testedBy: "Admin Health Dashboard",
        serverTime: new Date().toISOString()
      },
      userContext: {
        email: emailToUse,
        role: "System Administrator",
        isGuest: false,
        pageUrl: "https://smartpeindia.app/#logs"
      },
      timestamp: new Date().toISOString()
    };

    const emailTpl = buildAdminIncidentAlertEmail(testIncident);
    const emailRes = await dispatchEmail(emailToUse, emailTpl.subject, emailTpl.html, emailTpl.text);

    const waText = `🚨 *SmartPE Test Alert: Notifications Working!*\n\n` +
      `*System Status:* Active & Ready\n` +
      `*Alert Email:* ${emailToUse}\n` +
      `*Time:* ${new Date().toLocaleTimeString()} IST\n\n` +
      `If you received this message, your SmartPE incident intimation is configured correctly!`;
    const whatsappAlertUrl = `https://api.whatsapp.com/send?phone=${phoneToUse}&text=${encodeURIComponent(waText)}`;

    res.json({
      success: true,
      emailResult: emailRes,
      whatsappAlertUrl,
      recipientEmail: emailToUse,
      recipientPhone: phoneToUse
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to trigger test alert" });
  }
});

// Automated Corporate Welcome Email endpoint (Protected with rate-limiting & auth)
apiRouter.post("/email/welcome", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userKey = req.user?.uid || req.ip || "anon";
    const rl = checkRateLimit(`email_welcome_${userKey}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ success: false, error: "Too many email requests. Please try again in a minute." });
    }

    const { toEmail, email, recipientName, displayName, name, schoolName, uid } = req.body;
    const targetEmail = toEmail || email;
    const targetName = recipientName || displayName || name || "";

    if (!targetEmail || typeof targetEmail !== "string" || !targetEmail.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid recipient email address is required" });
    }

    const { subject, html, text } = buildCorporateWelcomeEmail(targetName, schoolName);
    const result = await dispatchEmail(targetEmail, subject, html, text);

    res.json({
      success: result.success,
      message: result.message,
      provider: result.provider,
      recipient: targetEmail,
      uid: uid || null
    });
  } catch (error: any) {
    console.error("Welcome email error:", error);
    res.status(500).json({ success: false, error: "Failed to dispatch welcome email" });
  }
});

// Trigger a specific step of the 3-part nurture sequence (Step 1, 2, or 3)
apiRouter.post("/email/nurture/trigger", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userKey = req.user?.uid || req.ip || "anon";
    const rl = checkRateLimit(`email_nurture_${userKey}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ success: false, error: "Rate limit exceeded. Please wait a moment." });
    }

    const { toEmail, email, step = 1, recipientName, displayName, name, schoolName } = req.body;
    const targetEmail = toEmail || email;
    const targetName = recipientName || displayName || name || "Physical Education Educator";
    const stepNum = Number(step) as (1 | 2 | 3);

    if (!targetEmail || typeof targetEmail !== "string" || !targetEmail.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid recipient email address is required" });
    }

    if (![1, 2, 3].includes(stepNum)) {
      return res.status(400).json({ success: false, error: "Step must be 1 (Welcome), 2 (Lesson Planner), or 3 (Fitness Tests)" });
    }

    const template = getNurtureEmailTemplate(stepNum, targetName, schoolName);
    const result = await dispatchEmail(targetEmail, template.subject, template.html, template.text);

    res.json({
      success: result.success,
      message: `Nurture Part ${stepNum} (${template.stepName}) sent: ${result.message}`,
      step: stepNum,
      stepName: template.stepName,
      triggerDay: template.triggerDay,
      provider: result.provider,
      recipient: targetEmail
    });
  } catch (error: any) {
    console.error("Nurture trigger error:", error);
    res.status(500).json({ success: false, error: "Failed to trigger nurture email" });
  }
});

// Automated Teacher Invite Email endpoint
apiRouter.post("/email/invite", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userKey = req.user?.uid || req.ip || "anon";
    const rl = checkRateLimit(`email_invite_${userKey}`, 20, 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ success: false, error: "Too many invite requests. Please wait a minute." });
    }

    const { toEmail, recipientName, schoolName, inviterName, role } = req.body;
    if (!toEmail || typeof toEmail !== "string" || !toEmail.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid teacher email address is required" });
    }

    const { subject, html, text } = buildTeacherInviteEmail(
      recipientName || "Physical Education Educator",
      schoolName || "SmartPE Partner School",
      inviterName || req.user?.email || "School Administrator",
      role || "teacher"
    );
    const result = await dispatchEmail(toEmail.trim(), subject, html, text);

    res.json({
      success: result.success,
      message: result.message,
      provider: result.provider,
      recipient: toEmail.trim()
    });
  } catch (error: any) {
    console.error("Teacher invite email error:", error);
    res.status(500).json({ success: false, error: "Failed to dispatch teacher invite email" });
  }
});

// School Plan & Invoice Request endpoint
apiRouter.post("/billing/invoice-request", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const ipKey = req.user?.uid || req.ip || "anon";
    const rl = checkRateLimit(`billing_invoice_${ipKey}`, 10, 5 * 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ success: false, error: "Too many invoice requests. Please try again shortly." });
    }

    const { planName, billingCycle, schoolName, phone, contactEmail } = req.body;
    if (!planName || !schoolName || !phone) {
      return res.status(400).json({ success: false, error: "Plan name, school name, and contact phone are required." });
    }

    const adminEmail = process.env.ADMIN_ALERT_EMAIL || "contact@smartpeindia.app";
    const tpl = buildBillingInvoiceRequestEmail({
      planName: String(planName).trim(),
      billingCycle: String(billingCycle || "annual").trim(),
      schoolName: String(schoolName).trim(),
      phone: String(phone).trim(),
      contactEmail: contactEmail ? String(contactEmail).trim() : req.user?.email
    });

    const result = await dispatchEmail(adminEmail, tpl.subject, tpl.html, tpl.text);
    res.json({
      success: result.success,
      message: result.success
        ? "Invoice & onboarding request received. Our team will reach out shortly."
        : result.message,
      provider: result.provider
    });
  } catch (error: any) {
    console.error("Invoice request error:", error);
    res.status(500).json({ success: false, error: "Failed to process invoice request." });
  }
});

// Automated Registration Date Evaluator (supports Firebase Bearer auth OR scheduled x-cron-secret)
apiRouter.post("/email/nurture/evaluate", async (req: AuthenticatedRequest, res, next) => {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const headerSecret = String(req.headers["x-cron-secret"] || "").trim();
  if (cronSecret && headerSecret && cronSecret === headerSecret) {
    return next();
  }
  return requireAuth(req, res, next);
}, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      toEmail, 
      email, 
      recipientName, 
      displayName, 
      name, 
      schoolName, 
      createdAt, 
      step1SentAt, 
      step2SentAt, 
      step3SentAt,
      emailOptOut
    } = req.body;

    if (emailOptOut === true) {
      return res.json({
        success: true,
        actionTaken: "opted_out",
        message: "Educator has opted out of onboarding sequence emails."
      });
    }

    const targetEmail = toEmail || email;
    const targetName = recipientName || displayName || name || "Physical Education Educator";

    if (!targetEmail || typeof targetEmail !== "string" || !targetEmail.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid email address is required" });
    }

    const now = new Date();
    const regDate = createdAt ? new Date(createdAt) : new Date();
    const daysSinceRegistration = Math.max(0, Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24)));

    let dueStep: 1 | 2 | 3 | null = null;

    if (!step1SentAt) {
      dueStep = 1;
    } else if (daysSinceRegistration >= 2 && !step2SentAt) {
      dueStep = 2;
    } else if (daysSinceRegistration >= 5 && !step3SentAt) {
      dueStep = 3;
    }

    if (!dueStep) {
      const isComplete = Boolean(step1SentAt && step2SentAt && step3SentAt);
      return res.json({
        success: true,
        actionTaken: "none_due",
        message: isComplete 
          ? "All 3 nurture sequence emails have been completed." 
          : `No pending nurture email due today (Days registered: ${daysSinceRegistration}).`,
        daysSinceRegistration,
        isComplete,
        currentStatus: {
          step1SentAt: step1SentAt || null,
          step2SentAt: step2SentAt || null,
          step3SentAt: step3SentAt || null
        }
      });
    }

    const template = getNurtureEmailTemplate(dueStep, targetName, schoolName);
    const result = await dispatchEmail(targetEmail, template.subject, template.html, template.text);

    const nowIso = new Date().toISOString();
    const updatedStatus = {
      step1SentAt: dueStep === 1 ? nowIso : (step1SentAt || null),
      step2SentAt: dueStep === 2 ? nowIso : (step2SentAt || null),
      step3SentAt: dueStep === 3 ? nowIso : (step3SentAt || null),
      lastEvaluatedAt: nowIso
    };

    res.json({
      success: result.success,
      actionTaken: result.success ? `sent_step_${dueStep}` : "delivery_failed",
      dispatchedStep: dueStep,
      stepName: template.stepName,
      triggerDay: template.triggerDay,
      daysSinceRegistration,
      provider: result.provider,
      recipient: targetEmail,
      message: result.success
        ? `Triggered Part ${dueStep} (${template.stepName}) based on registration date.`
        : result.message,
      updatedStatus: result.success ? updatedStatus : undefined
    });
  } catch (error: any) {
    console.error("Nurture evaluation error:", error);
    res.status(500).json({ success: false, error: "Failed to evaluate nurture sequence" });
  }
});

// Preview HTML for nurture steps
apiRouter.get("/email/nurture/preview", (req, res) => {
  try {
    const step = Number(req.query.step || 1) as (1 | 2 | 3);
    const name = String(req.query.name || "Physical Education Educator");
    const school = String(req.query.school || "Smart PE Partner School");

    const template = getNurtureEmailTemplate([1, 2, 3].includes(step) ? step : 1, name, school);
    res.json({
      step,
      stepName: template.stepName,
      triggerDay: template.triggerDay,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  } catch (err: any) {
    console.error("Nurture preview error:", err);
    res.status(500).json({ error: "Failed to generate preview" });
  }
});

// Dedicated Auth User Created Webhook (Protected by secret signature)
apiRouter.post("/webhooks/auth-user-created", async (req, res) => {
  try {
    const secret = req.headers["x-webhook-secret"] || req.query.secret;
    const expectedSecret = process.env.WEBHOOK_SECRET;

    // If WEBHOOK_SECRET is configured, strictly enforce it
    if (expectedSecret && secret !== expectedSecret) {
      return res.status(403).json({ success: false, error: "Unauthorized webhook request" });
    }

    const { email, toEmail, displayName, recipientName, uid, schoolName } = req.body;
    const targetEmail = email || toEmail;
    const targetName = displayName || recipientName || "";

    if (!targetEmail) {
      return res.status(400).json({ success: false, error: "User email is required" });
    }

    const { subject, html, text } = buildCorporateWelcomeEmail(targetName, schoolName);
    const result = await dispatchEmail(targetEmail, subject, html, text);

    res.json({
      success: result.success,
      message: `Auth user creation welcome email handled: ${result.message}`,
      provider: result.provider,
      uid
    });
  } catch (error: any) {
    console.error("Auth webhook error:", error);
    res.status(500).json({ success: false, error: "Webhook processing failed" });
  }
});

// Corporate Feature Update & Announcement email endpoint (Admin Only)
apiRouter.post("/email/announcement", requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { toEmails, featureTitle, featureDescription, actionUrl } = req.body;

    if (!Array.isArray(toEmails) || toEmails.length === 0) {
      return res.status(400).json({ success: false, error: "Recipient emails list is required" });
    }

    if (!featureTitle || !featureDescription) {
      return res.status(400).json({ success: false, error: "Feature title and description are required" });
    }

    const { subject, html, text } = buildCorporateFeatureEmail(featureTitle, featureDescription, actionUrl);

    let sentCount = 0;
    const sanitizedEmails = [...new Set(toEmails.filter(e => typeof e === "string" && e.includes("@")))];

    for (const email of sanitizedEmails) {
      const resSend = await dispatchEmail(email, subject, html, text);
      if (resSend.success) sentCount++;
    }

    res.json({
      success: true,
      sentCount,
      totalRequested: sanitizedEmails.length,
      message: `Dispatched feature announcement to ${sentCount} recipient(s).`
    });
  } catch (error: any) {
    console.error("Announcement email error:", error);
    res.status(500).json({ success: false, error: "Failed to dispatch announcement" });
  }
});

// Helper to extract compact JSON schema instructions for fallback providers (Groq / OpenRouter)
function summarizeSchemaForPrompt(schema: any, depth = 0): string {
  if (!schema || typeof schema !== "object" || depth > 4) return "any";
  const t = String(schema.type || "").toUpperCase();
  if (t === "ARRAY") {
    return `[${summarizeSchemaForPrompt(schema.items, depth + 1)}]`;
  }
  if (t === "OBJECT" && schema.properties && typeof schema.properties === "object") {
    const entries = Object.entries(schema.properties).map(([k, v]: [string, any]) => {
      const valDesc = summarizeSchemaForPrompt(v, depth + 1);
      return `"${k}": ${valDesc}`;
    });
    return `{ ${entries.join(", ")} }`;
  }
  if (t === "STRING") return schema.description ? `"string (${String(schema.description).slice(0, 60)})"` : `"string"`;
  if (t === "NUMBER" || t === "INTEGER") return "number";
  if (t === "BOOLEAN") return "boolean";
  return "string";
}

function extractPromptText(contents: any): string {
  if (typeof contents === "string") return contents;
  if (Array.isArray(contents)) {
    return contents
      .map((c: any) => {
        if (typeof c === "string") return c;
        if (c?.text) return String(c.text);
        if (Array.isArray(c?.parts)) return c.parts.map((p: any) => p?.text || "").join("\n");
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  if (contents?.parts && Array.isArray(contents.parts)) {
    return contents.parts.map((p: any) => p?.text || "").join("\n");
  }
  if (contents?.text) return String(contents.text);
  return "";
}

// AI Diagnostic / Test Route
apiRouter.get("/ai/test", async (req, res) => {
  try {
    const geminiKeys = getGeminiKeys();
    for (const key of geminiKeys) {
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const testModels = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-4-hydrogen"];
      for (const tModel of testModels) {
        try {
          const response = await ai.models.generateContent({
            model: tModel,
            contents: [{ role: "user", parts: [{ text: "Say 'Gemini Connection Successful'" }] }]
          });
          return res.json({ message: response.text, provider: "gemini", model: tModel });
        } catch (mErr: any) {
          const msg = String(mErr?.message || mErr || "");
          console.warn(`[AI Test] Gemini ${tModel} failed:`, msg.slice(0, 200));
          if (msg.includes("API_KEY_INVALID") || msg.toLowerCase().includes("api key not valid")) {
            break;
          }
          continue;
        }
      }
    }

    const groqKey = getGroqKey();
    if (groqKey) {
      const groq = new Groq({ apiKey: groqKey });
      const testModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
      for (const tModel of testModels) {
        try {
          const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Say 'Groq Connection Successful'" }],
            model: tModel
          });
          return res.json({ message: completion.choices[0]?.message?.content, provider: "groq", model: tModel });
        } catch (err: any) {
          console.warn(`[AI Test] Groq ${tModel} failed:`, err?.message);
          continue;
        }
      }
    }

    const openRouterKeys = getOpenRouterKeys();
    for (const orKey of openRouterKeys) {
      for (const orModel of ["meta-llama/llama-3.3-70b-instruct:free", "openrouter/free"]) {
        try {
          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${orKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://smartpeindia.app",
              "X-Title": "SmartPE India"
            },
            body: JSON.stringify({
              model: orModel,
              messages: [{ role: "user", content: "Say 'OpenRouter Connection Successful'" }]
            })
          });
          if (orRes.ok) {
            const orData: any = await orRes.json();
            const txt = orData?.choices?.[0]?.message?.content;
            if (txt) return res.json({ message: txt, provider: "openrouter", model: orModel });
          }
        } catch {
          continue;
        }
      }
    }

    res.status(503).json({ error: "No working AI provider keys succeeded on the server." });
  } catch (error: any) {
    console.error("AI test error:", error);
    res.status(500).json({ error: error.message || "AI test diagnostics failed" });
  }
});

// AI Generation Endpoint (Protected by Per-User/IP Rate Limiting, Input Validation & Multi-Provider Fallback)
apiRouter.post("/ai/generate", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const clientIp = getClientIp(req);
    const isAuthenticatedUser = Boolean(req.user?.uid);
    const userKey = isAuthenticatedUser ? `u:${req.user!.uid}` : `ip:${clientIp}`;
    const maxPerMinute = isAuthenticatedUser ? 45 : 25;

    const rl = checkRateLimit(`ai_generate_${userKey}`, maxPerMinute, 60 * 1000);
    if (!rl.allowed) {
      res.setHeader("Retry-After", String(rl.retryAfter || 60));
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait a moment before sending another AI request.",
        retryAfter: rl.retryAfter
      });
    }

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Invalid JSON request body." });
    }

    const { model, contents, config } = req.body;

    // Input length & shape validation before dispatching upstream
    if (model !== undefined && (typeof model !== "string" || model.length > 120)) {
      return res.status(400).json({ error: "Invalid AI model identifier." });
    }
    const extractedPrompt = extractPromptText(contents).trim();
    if (!contents || (!extractedPrompt && !Array.isArray(contents))) {
      return res.status(400).json({ error: "Prompt contents are required." });
    }
    let serializedContentsLength = 0;
    try {
      serializedContentsLength = typeof contents === "string" ? contents.length : JSON.stringify(contents).length;
    } catch {
      return res.status(400).json({ error: "Malformed AI prompt payload." });
    }
    if (serializedContentsLength === 0 || serializedContentsLength > 32000) {
      return res.status(400).json({
        error: serializedContentsLength === 0
          ? "Prompt contents cannot be empty."
          : "Prompt exceeds maximum allowed length (32,000 characters)."
      });
    }
    if (config?.systemInstruction !== undefined) {
      if (typeof config.systemInstruction !== "string" || config.systemInstruction.length > 8000) {
        return res.status(400).json({
          error: "System instruction must be a string under 8,000 characters."
        });
      }
    }

    const resolveModel = (modelName: string): string => {
      const m = (modelName || "").toLowerCase();
      if (m.includes("3.1-pro") || m.includes("pro-preview") || m.includes("pro")) {
        return "gemini-3.1-pro-preview";
      }
      if (m.includes("3.8-flash") || m.includes("flash-large")) {
        return "gemini-3.8-flash";
      }
      if (m.includes("4-hydrogen") || m.includes("hydrogen")) {
        return "gemini-4-hydrogen";
      }
      return "gemini-3.1-flash-lite";
    };

    const resolvedModel = resolveModel(model);
    const geminiKeys = getGeminiKeys();
    const groqKey = getGroqKey();
    const openRouterKeys = getOpenRouterKeys();

    if (geminiKeys.length === 0 && !groqKey && openRouterKeys.length === 0) {
      return res.status(503).json({
        error: "AI service is temporarily unconfigured on this server.",
        message: "Please configure GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in the Environment Variables."
      });
    }

    let lastError: any = null;

    // 1. Try Gemini first (with key rotation, referrer header recovery, and multi-model fallback)
    if (geminiKeys.length > 0) {
      const keysToTry = [...geminiKeys];
      const uniqueModels = [
        ...new Set([
          resolvedModel,
          "gemini-2.5-flash",
          "gemini-3.1-flash-lite",
          "gemini-4-hydrogen"
        ])
      ];

      for (const key of keysToTry) {
        let customHeaders: Record<string, string> = { "User-Agent": "aistudio-build" };

        for (const currentModel of uniqueModels) {
          let stripThinking = false;
          for (let attempt = 0; attempt < 2; attempt++) {
            const perModelAbort = new AbortController();
            const timeoutTimer = setTimeout(() => perModelAbort.abort(), 14000);
            try {
              const ai = new GoogleGenAI({
                apiKey: key,
                httpOptions: { headers: customHeaders }
              });

              const formattedContents = Array.isArray(contents)
                ? contents
                : (typeof contents === "string" ? [{ role: "user", parts: [{ text: contents }] }] : [contents]);

              const finalConfig = { ...(config || {}) };
              const isSupportedModel = currentModel.includes("gemini-3");

              if (stripThinking || !isSupportedModel) {
                delete finalConfig.thinkingConfig;
              } else if (isSupportedModel && !finalConfig.thinkingConfig) {
                finalConfig.thinkingConfig = { thinkingLevel: "LOW" };
              }

              const response = await ai.models.generateContent({
                model: currentModel,
                contents: formattedContents,
                config: {
                  ...finalConfig,
                  abortSignal: perModelAbort.signal
                }
              });

              clearTimeout(timeoutTimer);
              return res.json({
                text: response.text,
                provider: "gemini",
                model: currentModel
              });
            } catch (modelErr: any) {
              clearTimeout(timeoutTimer);
              const msg = String(modelErr?.message || modelErr || "");
              const lowerMsg = msg.toLowerCase();
              console.warn(`[AI Core] Gemini model=${currentModel} attempt=${attempt + 1} failed:`, msg.slice(0, 260));
              lastError = modelErr;

              // Check key/credential/referrer failures FIRST (Note: Gemini returns status=INVALID_ARGUMENT with API_KEY_INVALID!)
              const isReferrerBlocked =
                msg.includes("API_KEY_HTTP_REFERRER_BLOCKED") ||
                lowerMsg.includes("referer") ||
                lowerMsg.includes("referrer");
              if (isReferrerBlocked && !customHeaders["Referer"]) {
                const originHeader =
                  (typeof req.headers.origin === "string" && req.headers.origin) ||
                  (typeof req.headers.referer === "string" && req.headers.referer) ||
                  "https://smartpeindia.app/";
                customHeaders = { ...customHeaders, Referer: originHeader };
                continue;
              }

              const isBadKey =
                msg.includes("API_KEY_INVALID") ||
                lowerMsg.includes("api key not valid") ||
                msg.includes("API_KEY_SERVICE_BLOCKED") ||
                msg.includes("CONSUMER_SUSPENDED") ||
                lowerMsg.includes("permission_denied") ||
                lowerMsg.includes("api key expired");
              if (isBadKey) {
                // Skip remaining models for this broken key and immediately move to next key or fallback provider
                stripThinking = false;
                break;
              }

              // If model rejected thinkingConfig, retry once without thinkingConfig
              if (!stripThinking && lowerMsg.includes("thinking")) {
                stripThinking = true;
                continue;
              }

              // Otherwise break retry loop for this model and move to next model
              break;
            }
          }

          // If key itself was flagged bad on previous model, stop trying other models with same bad key
          const lastMsg = String(lastError?.message || "").toLowerCase();
          if (
            lastMsg.includes("api_key_invalid") ||
            lastMsg.includes("api key not valid") ||
            lastMsg.includes("api_key_service_blocked") ||
            lastMsg.includes("consumer_suspended") ||
            lastMsg.includes("api key expired")
          ) {
            break;
          }
        }
      }
    }

    const promptText = extractedPrompt || JSON.stringify(contents);
    const isJson = config?.responseMimeType === "application/json";
    const schemaSummary = isJson && config?.responseSchema ? summarizeSchemaForPrompt(config.responseSchema) : "";
    const jsonSchemaHint = isJson
      ? ` You must respond with strictly valid raw JSON only (no markdown code fences or commentary).${schemaSummary ? ` Required JSON structure: ${schemaSummary}` : ""}`
      : "";
    const systemPrompt = (config?.systemInstruction || "You are an expert AI physical education assistant.") + jsonSchemaHint;

    // 2. Fallback to Groq if Gemini was exhausted
    if (groqKey) {
      try {
        console.log("[AI Core] Falling back to Groq...");
        const groq = new Groq({ apiKey: groqKey });

        const groqModels = [
          "llama-3.3-70b-versatile",
          "openai/gpt-oss-120b",
          "openai/gpt-oss-20b",
          "llama-3.1-8b-instant"
        ];

        for (const gModel of groqModels) {
          for (const useResponseFormat of (isJson ? [true, false] : [false])) {
            try {
              const completion = await groq.chat.completions.create({
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: promptText }
                ],
                model: gModel,
                ...(useResponseFormat ? { response_format: { type: "json_object" as const } } : {})
              });

              const outText = completion.choices[0]?.message?.content;
              if (outText) {
                return res.json({
                  text: outText,
                  provider: "groq",
                  model: gModel
                });
              }
            } catch (gErr: any) {
              const gMsg = String(gErr?.message || gErr || "");
              console.warn(`[AI Core] Groq model=${gModel} jsonMode=${useResponseFormat} failed:`, gMsg.slice(0, 200));
              lastError = gErr;
              if (gErr?.status === 401 || gMsg.toLowerCase().includes("invalid api key")) {
                break;
              }
              if (useResponseFormat && gMsg.includes("400")) {
                continue; // Retry without response_format
              }
              break;
            }
          }
          if (lastError?.status === 401 || String(lastError?.message || "").toLowerCase().includes("invalid api key")) {
            break;
          }
        }
      } catch (groqErr) {
        lastError = groqErr;
        console.error("[AI Core] Groq fallback completely failed:", groqErr);
      }
    }

    // 3. Fallback to OpenRouter if Gemini & Groq were exhausted
    if (openRouterKeys.length > 0) {
      const openRouterModels = [
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemma-3-27b-it:free",
        "mistralai/mistral-small-3.1-24b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "openrouter/free",
        "google/gemini-2.5-flash",
        "openai/gpt-4o-mini"
      ];

      for (const orKey of openRouterKeys) {
        for (const orModel of openRouterModels) {
          let keyInvalid = false;
          for (const useResponseFormat of (isJson ? [true, false] : [false])) {
            const orAbort = new AbortController();
            const orTimer = setTimeout(() => orAbort.abort(), 16000);
            try {
              const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${orKey}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": "https://smartpeindia.app",
                  "X-Title": "SmartPE India"
                },
                body: JSON.stringify({
                  model: orModel,
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: promptText }
                  ],
                  ...(useResponseFormat ? { response_format: { type: "json_object" } } : {})
                }),
                signal: orAbort.signal
              });
              clearTimeout(orTimer);

              if (!orRes.ok) {
                const errText = await orRes.text().catch(() => "");
                console.warn(`[AI Core] OpenRouter model=${orModel} status=${orRes.status}:`, errText.slice(0, 180));
                lastError = new Error(`OpenRouter ${orRes.status}: ${errText.slice(0, 150)}`);
                if (orRes.status === 401 || orRes.status === 403) {
                  keyInvalid = true;
                  break;
                }
                if (useResponseFormat && orRes.status === 400) {
                  continue; // Retry without response_format
                }
                break;
              }

              const orData: any = await orRes.json();
              const textOut = orData?.choices?.[0]?.message?.content;
              if (textOut) {
                return res.json({
                  text: textOut,
                  provider: "openrouter",
                  model: orModel
                });
              }
            } catch (orErr: any) {
              clearTimeout(orTimer);
              lastError = orErr;
              console.warn(`[AI Core] OpenRouter model=${orModel} error:`, orErr?.message);
              break;
            }
          }
          if (keyInvalid) break;
        }
      }
    }

    console.error("[AI Core] All providers exhausted for /api/ai/generate:", lastError?.message || lastError);

    // Sanitize error outputs for production safety
    let statusCode = 503;
    let errorMessage = "The AI service is temporarily unavailable on the server. Please try again shortly.";
    const errorStr = String(lastError?.message || "").toLowerCase();

    if (errorStr.includes("quota") || errorStr.includes("429") || errorStr.includes("resource_exhausted")) {
      statusCode = 429;
      errorMessage = "AI generation quota is temporarily saturated. Please try again in a few moments.";
    } else if (errorStr.includes("503") || errorStr.includes("high demand") || errorStr.includes("unavailable")) {
      statusCode = 503;
      errorMessage = "AI servers are experiencing temporary high demand. Please try again in a moment.";
    } else if (
      errorStr.includes("api_key_invalid") ||
      errorStr.includes("api key not valid") ||
      errorStr.includes("invalid_api_key") ||
      errorStr.includes("invalid api key")
    ) {
      statusCode = 503;
      errorMessage = "Upstream AI service credentials are temporarily unavailable. Please try again shortly.";
    }

    res.status(statusCode).json({
      error: errorMessage,
      message: errorMessage
    });
  } catch (globalError: any) {
    console.error("Critical error in /ai/generate:", globalError);
    res.status(500).json({ error: "Internal server error during AI generation." });
  }
});

// Dedicated Audio Transcription Endpoint (Protected by User/IP Rate Limiting & Optional Auth)
apiRouter.post("/ai/transcribe", express.json({ limit: "15mb" }), optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const clientIp = getClientIp(req);
    const isAuthenticatedUser = Boolean(req.user?.uid);
    const userKey = isAuthenticatedUser ? `u:${req.user!.uid}` : `ip:${clientIp}`;
    const maxPerMinute = isAuthenticatedUser ? 20 : 10;

    const rl = checkRateLimit(`ai_transcribe_${userKey}`, maxPerMinute, 60 * 1000);
    if (!rl.allowed) {
      res.setHeader("Retry-After", String(rl.retryAfter || 60));
      return res.status(429).json({
        error: "Too many voice requests. Please wait a moment before recording again.",
        retryAfter: rl.retryAfter
      });
    }

    const {
      audioBase64,
      mimeType = "audio/webm",
      prompt = "Transcribe this audio recording verbatim and accurately. Keep sports terminology, referee rules, physical education vocabulary, player names, and tactical terms exact."
    } = req.body;

    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({ error: "Missing audioBase64 data in request body." });
    }
    if (typeof prompt !== "string" || prompt.length > 4000) {
      return res.status(400).json({ error: "Transcription prompt exceeds maximum length." });
    }

    // Protect against massive memory bloat (>10MB base64 string)
    if (audioBase64.length > 14 * 1024 * 1024) {
      return res.status(413).json({ error: "Audio recording exceeds maximum permitted length (10MB). Please record shorter voice notes." });
    }

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
    const geminiKeys = getGeminiKeys();
    if (geminiKeys.length === 0) {
      return res.status(500).json({ 
        error: "No Gemini API keys configured for transcription.",
        message: "Please configure GEMINI_API_KEY in the Environment Variables."
      });
    }

    let lastError: any = null;
    const modelsToTry = ["gemini-3.5-transcribe", "gemini-3.8-flash", "gemini-3.1-flash-lite"];

    for (const key of geminiKeys) {
      try {
        const ai = new GoogleGenAI({ 
          apiKey: key,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const audioPart = {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: cleanBase64,
          },
        };

        for (const currentModel of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model: currentModel,
              contents: [
                audioPart,
                { 
                  text: prompt || "Listen to this audio recording carefully and transcribe the spoken words verbatim. Keep all sports terms, referee rules, drill positions, player names, and numbers exact. Return ONLY the transcribed text. Do NOT add commentary, conversational replies, quotes, or pleasantries."
                }
              ],
              config: {
                systemInstruction: "You are a professional Physical Education & Sports audio speech-to-text transcriber. Transcribe exactly what is spoken in the audio without adding conversational replies, pleasantries, or explanations. If no speech is detected, output nothing."
              }
            });

            const transcription = response.text || "";

            return res.json({
              text: transcription.trim(),
              model: currentModel,
              provider: "gemini",
              success: true
            });
          } catch (modelErr: any) {
            console.warn(`Model ${currentModel} transcription attempt failed:`, modelErr?.message);
            lastError = modelErr;
            continue;
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn("Transcription error with current key:", err?.message);
        continue;
      }
    }

    console.error("Transcription exhausted all keys/models:", lastError?.message || lastError);
    return res.status(500).json({ 
      error: "Audio transcription failed.", 
      message: "Could not transcribe audio at this time. Please try again."
    });
  } catch (error: any) {
    console.error("Critical error in /ai/transcribe:", error);
    res.status(500).json({ 
      error: "Audio transcription failed.", 
      message: "Failed to process audio transcription."
    });
  }
});

// Mount API routes
app.use("/api", apiRouter);

// Fallback for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

export default app;

