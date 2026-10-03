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
  getNurtureEmailTemplate,
  dispatchEmail 
} from "./email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Controlled Request Limits (Anti-DOS):
// General JSON body: 2MB max
// Raw/Audio transcribe body: 15MB max (applied directly on /api/ai/transcribe)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

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
  if (clean.startsWith("sk-") || clean.startsWith("sk_")) return false;
  return true;
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
  for (let i = 1; i <= 20; i++) {
    const val = process.env[`GEMINI_KEY_${i}`];
    if (val && val.startsWith("sk-or-")) {
      const clean = val.trim().replace(/^["']|["']$/g, '');
      if (!keys.includes(clean)) keys.push(clean);
    }
  }
  return keys;
};

const getGroqKey = () => {
  const key = process.env.GROQ_API_KEY;
  if (key && key.trim() !== "" && key !== "undefined" && key !== "null") {
    return key.trim().replace(/^["']|["']$/g, '');
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

apiRouter.get("/health", (req, res) => {
  try {
    const status = getAI();
    const emailStatus = getEmailConfig();
    res.json({ 
      status: (status.hasGemini || status.hasGroq) ? "ok" : "missing",
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
    console.error("Brevo status error:", err);
    res.status(500).json({ 
      configured: false, 
      connected: false, 
      apiKeyFound: false, 
      fromEmail: "alsamy36@gmail.com",
      senderVerified: false, 
      error: err.message || "Failed to inspect Brevo status" 
    });
  }
});

// Send a test email via active provider (Brevo / SMTP / Resend)
apiRouter.post("/email/test", async (req, res) => {
  try {
    const { toEmail } = req.body;
    const targetEmail = toEmail || "alsamy36@gmail.com";

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
    console.error("Test email dispatch error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to dispatch test email" });
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

// Automated Registration Date Evaluator
apiRouter.post("/email/nurture/evaluate", requireAuth, async (req: AuthenticatedRequest, res) => {
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
      step3SentAt 
    } = req.body;

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
      actionTaken: `sent_step_${dueStep}`,
      dispatchedStep: dueStep,
      stepName: template.stepName,
      triggerDay: template.triggerDay,
      daysSinceRegistration,
      provider: result.provider,
      recipient: targetEmail,
      message: `Triggered Part ${dueStep} (${template.stepName}) based on registration date.`,
      updatedStatus
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

// AI Diagnostic / Test Route
apiRouter.get("/ai/test", async (req, res) => {
  try {
    const geminiKeys = getGeminiKeys();
    if (geminiKeys.length > 0) {
      const ai = new GoogleGenAI({ 
        apiKey: geminiKeys[0],
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const testModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
      for (const tModel of testModels) {
        try {
          const response = await ai.models.generateContent({
            model: tModel,
            contents: [{ role: 'user', parts: [{ text: "Say 'Gemini Connection Successful'" }] }]
          });
          return res.json({ message: response.text, provider: "gemini", model: tModel });
        } catch (mErr) {
          continue;
        }
      }
    }
    
    const groqKey = getGroqKey();
    if (groqKey) {
      const groq = new Groq({ apiKey: groqKey });
      const testModels = [
        "openai/gpt-oss-120b",
        "qwen/qwen3-32b",
        "meta-llama/llama-4-scout-17b-16e-instruct"
      ];
      
      let lastTestErr: any = null;
      for (const tModel of testModels) {
        try {
          const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Say 'Groq Connection Successful'" }],
            model: tModel,
          });
          return res.json({ message: completion.choices[0]?.message?.content, provider: "groq", model: tModel });
        } catch (err) {
          lastTestErr = err;
          continue;
        }
      }
      if (lastTestErr) throw lastTestErr;
    }

    res.status(500).json({ error: "No AI API keys configured" });
  } catch (error: any) {
    console.error("AI test error:", error);
    res.status(500).json({ error: error.message || "AI test diagnostics failed" });
  }
});

// AI Generation Endpoint (Protected by User Rate Limiting & Optional Firebase Auth)
apiRouter.post("/ai/generate", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userKey = req.user?.uid || req.ip || "anon";
    // Limit to 60 generations per minute per user/IP
    const rl = checkRateLimit(`ai_generate_${userKey}`, 60, 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({ 
        error: "Rate limit exceeded. Please wait a moment before sending another AI request.",
        retryAfter: rl.retryAfter
      });
    }

    const { model, contents, config } = req.body;
    
    const resolveModel = (modelName: string): string => {
      const m = (modelName || "").toLowerCase();
      if (m.includes("3.1-pro") || m.includes("pro-preview") || m.includes("pro")) {
        return "gemini-3.1-pro-preview";
      }
      if (m.includes("flash-lite") || m.includes("lite")) {
        return "gemini-3.1-flash-lite";
      }
      return "gemini-3.8-flash";
    };

    const resolvedModel = resolveModel(model);
    const geminiKeys = getGeminiKeys();
    const groqKey = getGroqKey();
    
    if (geminiKeys.length === 0 && !groqKey) {
      return res.status(500).json({ 
        error: "AI service configuration error.",
        message: "Please configure GEMINI_API_KEY in the Environment Variables."
      });
    }

    let lastError: any = null;

    // 1. Try Gemini first (with key rotation and multi-model fallback)
    if (geminiKeys.length > 0) {
      const keysToTry = [...geminiKeys];
      const modelsToTry = [
        resolvedModel,
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash"
      ];
      const uniqueModels = [...new Set(modelsToTry)];

      for (const key of keysToTry) {
        const ai = new GoogleGenAI({ 
          apiKey: key,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        
        for (const currentModel of uniqueModels) {
          try {
            const formattedContents = Array.isArray(contents) 
              ? contents 
              : (typeof contents === 'string' ? [{ role: 'user', parts: [{ text: contents }] }] : [contents]);

            const finalConfig = { ...config };
            const isSupportedModel = currentModel.includes("gemini-3");
            
            if (isSupportedModel && !finalConfig.thinkingConfig) {
              finalConfig.thinkingConfig = { thinkingLevel: 'LOW' };
            } else if (!isSupportedModel && finalConfig.thinkingConfig) {
              delete finalConfig.thinkingConfig;
            }

            const response = await ai.models.generateContent({
              model: currentModel,
              contents: formattedContents,
              config: finalConfig
            });
            
            return res.json({ 
              text: response.text, 
              provider: "gemini",
              model: currentModel 
            });
          } catch (modelErr: any) {
            console.warn(`Model ${currentModel} failed:`, modelErr?.message || modelErr);
            lastError = modelErr;
            continue;
          }
        }
      }
    }

    // 2. Fallback to Groq if Gemini was exhausted
    if (groqKey) {
      try {
        console.log("Attempting fallback with Groq...");
        const groq = new Groq({ apiKey: groqKey });
        
        let promptText = "";
        if (typeof contents === 'string') {
          promptText = contents;
        } else if (Array.isArray(contents)) {
          promptText = contents.map((c: any) => {
            if (typeof c === 'string') return c;
            if (c.parts) return c.parts.map((p: any) => p.text || '').join('\n');
            return '';
          }).join('\n\n');
        } else if (contents?.parts) {
          promptText = contents.parts.map((p: any) => p.text || '').join('\n');
        }

        const groqModels = [
          "openai/gpt-oss-120b",
          "qwen/qwen3-32b",
          "meta-llama/llama-4-scout-17b-16e-instruct"
        ];

        for (const gModel of groqModels) {
          try {
            const completion = await groq.chat.completions.create({
              messages: [
                { role: "system", content: config?.systemInstruction || "You are an expert AI physical education assistant." },
                { role: "user", content: promptText }
              ],
              model: gModel,
              response_format: config?.responseMimeType === "application/json" ? { type: "json_object" } : undefined
            });

            return res.json({ 
              text: completion.choices[0]?.message?.content, 
              provider: "groq",
              model: gModel 
            });
          } catch (gErr: any) {
            console.warn(`Groq model ${gModel} failed:`, gErr?.message);
            lastError = gErr;
            continue;
          }
        }
      } catch (groqErr) {
        lastError = groqErr;
        console.error("Groq fallback completely failed:", groqErr);
      }
    }

    // Sanitize error outputs for production safety
    let statusCode = 500;
    let errorMessage = "AI generation could not be completed at this time.";
    const errorStr = (lastError?.message || "").toLowerCase();

    if (errorStr.includes("quota") || errorStr.includes("429") || errorStr.includes("resource_exhausted")) {
      statusCode = 429;
      errorMessage = "AI generation quota is temporarily saturated. Please try again in a few moments.";
    } else if (lastError?.message) {
      errorMessage = lastError.message;
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

// Dedicated Audio Transcription Endpoint (Protected by User Rate Limiting & Optional Auth)
apiRouter.post("/ai/transcribe", express.json({ limit: "15mb" }), optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userKey = req.user?.uid || req.ip || "anon";
    // Limit to 20 voice transcriptions per minute per user/IP
    const rl = checkRateLimit(`ai_transcribe_${userKey}`, 20, 60 * 1000);
    if (!rl.allowed) {
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

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: "0.0.0.0",
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Error handler for API
  app.use("/api", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  if (!process.env.VERCEL || process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

export default app;
