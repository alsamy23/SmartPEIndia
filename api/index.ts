import express from "express";
import { GoogleGenAI } from "@google/genai";
import * as genAiPackage from "@google/genai";
const ThinkingLevel = (genAiPackage as any).ThinkingLevel;
import Groq from "groq-sdk";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { 
  getEmailConfig, 
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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Secure AI Initialization (Server-side only)
// Note: Google Gemini API keys start with AIza or standard Google key formats.
// OpenAI/OpenRouter keys (starting with sk-) must NEVER be passed to @google/genai.
const isGoogleApiKey = (key: string): boolean => {
  if (!key || typeof key !== "string") return false;
  const clean = key.trim().replace(/^["']|["']$/g, '');
  if (clean.length < 20) return false;
  // Exclude OpenAI/OpenRouter keys that start with sk-
  if (clean.startsWith("sk-") || clean.startsWith("sk_")) return false;
  return true;
};

const getGeminiKeys = (): string[] => {
  const keys: string[] = [];
  // Prioritize primary official GEMINI_API_KEY first
  const primaryNames = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "API_KEY", "VITE_GEMINI_API_KEY"];
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
  const primaryNames = ["OPENROUTER_API_KEY", "VITE_OPENROUTER_API_KEY"];
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
  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
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

// API Routes
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
    res.status(500).json({ status: "error", message: "Health check failed" });
  }
});

// Check transactional email service configuration
apiRouter.get("/email/status", (req, res) => {
  try {
    const config = getEmailConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ configured: false, error: err.message });
  }
});

// Automated Corporate Welcome Email endpoint
apiRouter.post("/email/welcome", async (req, res) => {
  try {
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
    res.status(500).json({ success: false, error: error.message || "Failed to dispatch welcome email" });
  }
});

// Trigger a specific step of the 3-part nurture sequence (Step 1, 2, or 3)
apiRouter.post("/email/nurture/trigger", async (req, res) => {
  try {
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
    res.status(500).json({ success: false, error: error.message || "Failed to trigger nurture email" });
  }
});

// Automated Registration Date Evaluator: Checks user registration date and sends next due nurture email
apiRouter.post("/email/nurture/evaluate", async (req, res) => {
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
      dueStep = 1; // Day 0 - Welcome & Pass
    } else if (daysSinceRegistration >= 2 && !step2SentAt) {
      dueStep = 2; // Day 2+ - Lesson Planner
    } else if (daysSinceRegistration >= 5 && !step3SentAt) {
      dueStep = 3; // Day 5+ - Khelo India & Fitness Tests
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
    res.status(500).json({ success: false, error: error.message || "Failed to evaluate nurture sequence" });
  }
});

// Preview HTML for any nurture step
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
    res.status(500).json({ error: err.message });
  }
});

// Dedicated Auth User Created Webhook (for external triggers or Cloud Functions)
apiRouter.post("/webhooks/auth-user-created", async (req, res) => {
  try {
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
    res.status(500).json({ success: false, error: error.message || "Webhook processing failed" });
  }
});

// Corporate Feature Update & Announcement email endpoint
apiRouter.post("/email/announcement", async (req, res) => {
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
    res.status(500).json({ success: false, error: error.message || "Failed to dispatch announcement" });
  }
});

apiRouter.get("/ai/test", async (req, res) => {
  try {
    const geminiKeys = getGeminiKeys();
    if (geminiKeys.length > 0) {
      const ai = new GoogleGenAI({ 
        apiKey: geminiKeys[0],
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const testModels = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-3.7-flash"];
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
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-3.1-8b-instant",
        "gemma2-9b-it"
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

    res.status(401).json({ error: "No AI API keys found" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Test failed" });
  }
});

apiRouter.post("/ai/generate", async (req, res) => {
  try {
    const { model, contents, config } = req.body;
    
    const resolveModel = (modelName: string): string => {
      const m = (modelName || "").toLowerCase();
      if (m.includes("3.1-pro") || m.includes("pro-preview")) {
        return "gemini-3.1-pro-preview";
      }
      return "gemini-3.7-flash";
    };

    const resolvedModel = resolveModel(model);
    const geminiKeys = getGeminiKeys();
    const groqKey = getGroqKey();
    
    if (geminiKeys.length === 0 && !groqKey) {
      return res.status(500).json({ 
        error: "No AI API keys configured.",
        message: "Please configure a valid GEMINI_API_KEY in the Environment Variables."
      });
    }

    let lastError: any = null;

    // 1. Try Gemini first (with rotation and model fallback)
    if (geminiKeys.length > 0) {
      const keysToTry = [...geminiKeys];
      
      // Determine which models we can try
      const modelsToTry = [
        resolvedModel,
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash"
      ];
      
      // Filter out duplicates but keep order
      const uniqueModels = [...new Set(modelsToTry)];

      for (const key of keysToTry) {
        const ai = new GoogleGenAI({ 
          apiKey: key,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        
        for (const currentModel of uniqueModels) {
          try {
            console.log(`Attempting generation with ${currentModel}...`);
            
            // Prepare contents
            const formattedContents = Array.isArray(contents) 
              ? contents 
              : (typeof contents === 'string' ? [{ role: 'user', parts: [{ text: contents }] }] : [contents]);

            // Ensure thinkingLevel is only used if supported (Gemini 3 series)
            const finalConfig = { ...config };
            const isSupportedModel = currentModel.includes("gemini-3");
            
            if (isSupportedModel && ThinkingLevel) {
              if (!finalConfig.thinkingConfig) {
                finalConfig.thinkingConfig = { thinkingLevel: (ThinkingLevel as any).LOW || "LOW" };
              }
            } else {
              delete finalConfig.thinkingConfig;
            }

            const response = await ai.models.generateContent({
              model: currentModel,
              contents: formattedContents,
              config: finalConfig,
            });

            const textValue = response.text;

            console.log(`Success with Gemini model: ${currentModel}`);
            return res.json({
              text: textValue,
              provider: "gemini",
              model: currentModel,
              candidates: response.candidates
            });
          } catch (error: any) {
            lastError = error;
            const errorMsg = (error.message || JSON.stringify(error) || "").toLowerCase();
            
            // Log the specific error for debugging
            console.warn(`Gemini error with model ${currentModel}:`, errorMsg);

            // Handle safety blocks
            if (errorMsg.includes("safety") || errorMsg.includes("blocked")) {
              console.error("Safety block triggered. Skipping to next provider/model.");
              break; // Skip this key, try next model or provider
            }

            // If it's a definitive auth/expired error, try NEXT KEY
            const isDefinitiveBadKey = errorMsg.includes("expired") || 
                                      errorMsg.includes("renew") ||
                                      errorMsg.includes("api key not valid") ||
                                      errorMsg.includes("api_key_invalid") ||
                                      (error.status === 401) ||
                                      (error.status === 400 && errorMsg.includes("key"));

            if (isDefinitiveBadKey) {
              console.error(`Definitive bad key detected. Trying next key.`);
              break; // Break inner loop to try next key
            }

            // Handle Quota
            const isQuotaError = errorMsg.includes("429") || error.status === 429 || errorMsg.includes("resource_exhausted") || errorMsg.includes("quota");
            if (isQuotaError) {
              console.warn("Quota exceeded for this key. Trying next key.");
              break; // Break inner loop to try next key
            }

            // For other errors, try next model on same key
            continue;
          }
        }
      }
    }

    // 2. Fallback to Groq if Gemini failed or wasn't available
    if (groqKey) {
      try {
        console.log("Falling back to Groq...");
        const groq = new Groq({ apiKey: groqKey });
        
        let prompt = "";
        const processedContents = Array.isArray(contents) ? contents : (contents?.contents || contents);
        
        if (typeof contents === 'string') {
          prompt = contents;
        } else if (Array.isArray(processedContents)) {
          prompt = processedContents.map((c: any) => {
            if (typeof c === 'string') return c;
            if (c.parts) return c.parts.map((p: any) => p.text).join("\n");
            return "";
          }).join("\n");
        } else if (contents?.parts) {
          prompt = contents.parts.map((p: any) => p.text).join("\n");
        }

        const systemPrompt = typeof config?.systemInstruction === 'string' 
          ? config.systemInstruction 
          : (config?.systemInstruction?.parts ? config.systemInstruction.parts.map((p: any) => p.text).join("\n") : "You are a professional assistant.");
        
        // Active Groq models after August 16, 2026 decommissioning of llama-3.3-70b-versatile
        const groqModelsToTry = [
          "openai/gpt-oss-120b",
          "qwen/qwen3-32b",
          "meta-llama/llama-4-scout-17b-16e-instruct",
          "llama-3.1-8b-instant",
          "gemma2-9b-it",
          "openai/gpt-oss-20b"
        ];

        let groqSuccess = false;
        let groqResult: any = null;

        for (const groqModel of groqModelsToTry) {
          try {
            console.log(`Attempting Groq generation with model: ${groqModel}...`);
            const completion = await groq.chat.completions.create({
              messages: [
                { role: "system", content: systemPrompt + (config?.responseMimeType === "application/json" ? "\n\nIMPORTANT: Return ONLY valid JSON that strictly follows this schema structure:\n" + JSON.stringify(config.responseSchema || {}) : "") },
                { role: "user", content: prompt }
              ],
              model: groqModel,
              temperature: config?.temperature || 0.7,
              response_format: config?.responseMimeType === "application/json" ? { type: "json_object" } : undefined
            });

            groqResult = completion.choices[0]?.message?.content;
            if (groqResult) {
              groqSuccess = true;
              console.log(`Success with Groq model: ${groqModel}`);
              return res.json({
                text: groqResult,
                provider: "groq",
                model: groqModel
              });
            }
          } catch (modelErr: any) {
            console.warn(`Groq model ${groqModel} failed:`, modelErr.message);
            lastError = modelErr;
            continue;
          }
        }
      } catch (groqError: any) {
        console.error("Groq fallback execution failed:", groqError);
        lastError = groqError;
      }
    }

    let errorMessage = "AI generation failed after trying all available providers.";
    let statusCode = 500;

    const errorStr = (lastError?.message || JSON.stringify(lastError || "")).toLowerCase();
    const isInvalidKey = errorStr.includes("expired") || 
                        errorStr.includes("renew") ||
                        errorStr.includes("api key not valid") ||
                        errorStr.includes("api_key_invalid") ||
                        errorStr.includes("api key") ||
                        (lastError?.status === 401) ||
                        (lastError?.status === 400 && errorStr.includes("key"));

    if (isInvalidKey) {
      statusCode = 401;
      errorMessage = "Gemini API key is invalid or not configured. Please ensure a valid GEMINI_API_KEY is set in Settings > Secrets or Environment Variables.";
    } else if (errorStr.includes("quota") || errorStr.includes("429") || errorStr.includes("resource_exhausted")) {
      statusCode = 429;
      errorMessage = "Gemini AI quota exceeded. Please try again in a few moments, or configure a fallback GROQ_API_KEY in Environment Variables.";
    } else if (!groqKey && geminiKeys.length > 0) {
      errorMessage = "AI generation failed. Please check your Gemini API key or network connection.";
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      message: errorMessage,
      originalError: lastError?.message || errorStr,
      details: lastError?.stack
    });
  } catch (globalError: any) {
    console.error("Critical error in /ai/generate:", globalError);
    res.status(500).json({ error: "Internal server error during AI generation.", details: globalError.message });
  }
});

// Dedicated Audio Transcription Endpoint (Gemini 3.5 Transcribe)
apiRouter.post("/ai/transcribe", async (req, res) => {
  try {
    const { 
      audioBase64, 
      mimeType = "audio/webm", 
      prompt = "Transcribe this audio recording verbatim and accurately. Keep sports terminology, referee rules, physical education vocabulary, player names, and tactical terms exact." 
    } = req.body;

    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({ error: "Missing audioBase64 data in request body." });
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    const geminiKeys = getGeminiKeys();
    if (geminiKeys.length === 0) {
      return res.status(500).json({ 
        error: "No Gemini API keys configured for transcription.",
        message: "Please configure GEMINI_API_KEY in the Environment Variables."
      });
    }

    let lastError: any = null;
    const modelsToTry = ["gemini-3.5-transcribe", "gemini-2.5-flash", "gemini-3.7-flash"];

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
            console.log(`Transcribing audio with ${currentModel} (mimeType: ${mimeType})...`);

            const response = await ai.models.generateContent({
              model: currentModel,
              contents: { 
                parts: [
                  audioPart, 
                  { text: prompt }
                ] 
              },
            });

            const transcription = response.text || "";
            console.log(`Transcription succeeded with ${currentModel}`);

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

    throw lastError || new Error("Failed to transcribe audio with available keys.");
  } catch (error: any) {
    console.error("Critical error in /ai/transcribe:", error);
    res.status(500).json({ 
      error: "Audio transcription failed.", 
      message: error.message || "Failed to process audio transcription.",
      details: error.stack
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
