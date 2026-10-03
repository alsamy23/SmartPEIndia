
import { BoardType, LessonPlan, YearlyPlan, TheoryContent, Language, FitnessAssessment, BiomechanicsConcept, TestPaper } from "../types.ts";
import { auth } from "./firebase.ts";

export const callAIBase = async (payload: any, retries = 2): Promise<any> => {
  // Check for internet connection first
  if (!navigator.onLine) {
    throw new Error("No Internet Connection: Please check your network settings and try again.");
  }

  // Map deprecated/legacy names to current best supported model
  const m = (payload.model || "").toLowerCase();
  if (m.includes("3.1-pro") || m.includes("pro-preview") || m.includes("pro")) {
    payload.model = "gemini-3.1-pro-preview";
  } else if (m.includes("flash-lite") || m.includes("lite")) {
    payload.model = "gemini-3.1-flash-lite";
  } else {
    payload.model = "gemini-3.8-flash";
  }
  
  // Add ThinkingLevel.LOW to config to minimize latency for speed (ONLY for Gemini 3 models that support it)
  if (!payload.config) payload.config = {};
  const supportsThinking = payload.model && payload.model.includes("gemini-3");
  
  if (supportsThinking && !payload.config.thinkingConfig) {
    payload.config.thinkingConfig = { thinkingLevel: 'LOW' };
  } else if (!supportsThinking && payload.config.thinkingConfig) {
    delete payload.config.thinkingConfig;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); 
  
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${idToken}`;
      } catch (tokenErr) {
        console.warn("Could not retrieve Firebase ID token:", tokenErr);
      }
    }

    const response = await fetch(`/api/ai/generate?t=${Date.now()}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: any = null;
      let responseText = "";
      try {
        responseText = await response.text();
        if (responseText) {
          errorData = JSON.parse(responseText);
        }
      } catch (e) {
        console.error("Could not parse error response as JSON", e);
      }
      
      const errorMessage = typeof errorData?.error === 'string' ? errorData.error : (errorData?.error?.message || errorData?.message || responseText || `Server returned ${response.status}: ${response.statusText}`);
      
      // Handle Quota Exceeded (429)
      const isQuotaError = response.status === 429 || errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.toLowerCase().includes("quota");
      if (isQuotaError) {
        throw new Error("AI Quota Exceeded: You've reached the daily limit for the free version of Gemini. Please try again in a few hours or use a different API key with a paid project.");
      }

      const isInvalidKeyError = (response.status === 401 && (errorMessage.includes("API_KEY") || errorMessage.includes("key"))) || 
                               errorMessage.includes("API_KEY_INVALID") || 
                               errorMessage.includes("api key not valid");
      if (isInvalidKeyError) {
        throw new Error("AI service authentication error. Please try again or refresh the page.");
      }

      const error: any = new Error(errorMessage);
      if (errorData?.originalError) error.originalError = errorData.originalError;
      
      if (retries > 0 && response.status >= 500) {
        return callAIBase(payload, retries - 1);
      }
      throw error;
    }
    
    const text = await response.text();
    if (!text) {
      throw new Error("Empty response from server.");
    }
    
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new Error(`Server returned invalid JSON response: ${text.substring(0, 100)}`);
    }

    return parsed;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error("The AI took too long to respond (Timeout). Please try a simpler request or check your internet connection.");
    }

    if (retries > 0) {
      return callAIBase(payload, retries - 1);
    }
    throw error;
  }
};

const safeParseJson = (data: any): any => {
  if (!data) throw new Error("AI response was empty.");
  
  // If it's already an object, return it (sometimes the proxy parses it)
  if (typeof data === 'object') return data;
  
  // If it's a string, try to parse it
  if (typeof data === 'string') {
    let cleanText = data.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(cleanText);
    } catch (e) {
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("The AI response was malformed. Please try again.");
      }
      
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerE) {
        throw new Error("The AI generated an invalid format. Try simplifying your request.");
      }
    }
  }

  return data;
};

export const generateLessonPlan = async (
  board: BoardType,
  grade: string,
  sport: string,
  topic: string,
  teacherName: string,
  duration: string,
  date: string,
  language: Language,
  equipment: string
): Promise<LessonPlan> => {
  const schema = {
    // ... schema remains same ...
    type: "OBJECT",
    properties: {
      teacher: { type: "STRING" },
      subject: { type: "STRING" },
      grade: { type: "STRING" },
      date: { type: "STRING" },
      topic: { type: "STRING" },
      period: { type: "STRING" },
      termWeek: { type: "STRING" },
      duration: { type: "STRING" },
      equipment: { type: "ARRAY", items: { type: "STRING" } },
      teachingAids: { type: "ARRAY", items: { type: "STRING" } },
      safety: { type: "ARRAY", items: { type: "STRING" } },
      keyVocabulary: { type: "ARRAY", items: { type: "STRING" } },
      sen: {
        type: "OBJECT",
        properties: {
          wave1: { type: "STRING" },
          wave2: { type: "STRING" },
          wave3: { type: "STRING" }
        }
      },
      objectives: {
        type: "OBJECT",
        properties: {
          know: { type: "STRING" },
          understand: { type: "STRING" },
          beAbleTo: { type: "STRING" }
        }
      },
      successCriteria: {
        type: "OBJECT",
        properties: {
          all: { type: "STRING" },
          most: { type: "STRING" },
          some: { type: "STRING" }
        }
      },
      starter: {
        type: "OBJECT",
        properties: {
          time: { type: "STRING" },
          title: { type: "STRING" },
          description: { type: "STRING" }
        }
      },
      mainActivity: {
        type: "OBJECT",
        properties: {
          time: { type: "STRING" },
          activities: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                description: { type: "STRING" },
                coachingPoints: { type: "ARRAY", items: { type: "STRING" } }
              }
            }
          }
        }
      },
      plenary: {
        type: "OBJECT",
        properties: {
          time: { type: "STRING" },
          title: { type: "STRING" },
          description: { type: "STRING" }
        }
      },
      homework: { type: "STRING" },
      collaboration: { type: "STRING" },
      differentiation: { type: "STRING" },
      criticalThinking: { type: "STRING" },
      warmupDiagramPrompt: { type: "STRING" },
      explanationDiagramPrompt: { type: "STRING" },
      gameDiagramPrompt: { type: "STRING" }
    },
    required: ["objectives", "starter", "mainActivity", "plenary", "warmupDiagramPrompt", "explanationDiagramPrompt"]
  };

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Detailed PE Lesson Plan. Board: ${board}, Grade: ${grade}, Sport: ${sport}, Topic: ${topic}, Lang: ${language}, Duration: ${duration}, Available Equipment: ${equipment || 'Standard PE equipment'}.`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: `You are an expert Physical Education Curriculum Designer and Teacher's Assistant. 
      Be decisive and do not ask for clarification.
      Create a highly professional, structured PE lesson plan for a ${duration} session. 
      Format:
      1. Objectives: Clear Psychomotor (Know), Cognitive (Understand), and Affective (Apply) goals.
      2. Success Criteria: Differentiated (All, Most, Some).
      3. Starter: Engaging warm-up related to the topic (${duration} appropriate).
      4. Main Activity: 3 progressive drills with clear coaching points.
      5. Plenary: Cool-down and reflective questions.
      6. Safety: Specific risks for this sport/activity.
      7. Equipment: List all necessary items. You MUST design the lesson plan around the available equipment provided by the user. If no specific equipment is provided, use standard PE equipment.
      8. Teaching Aids: Whistles, cones, charts, etc.
      9. Key Vocabulary: Terms students should learn.
      Translate all content to ${language}. Ensure NO fields are empty strings. Use the provided duration (${duration}) to time the activities correctly.`,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  // Handle both { text: "..." } and direct object responses
  const aiText = response.text || (typeof response === 'string' ? response : null);
  if (aiText) return safeParseJson(aiText);
  
  // If it's already an object but not in .text (some proxies)
  if (typeof response === 'object' && !Array.isArray(response) && Object.keys(response).length > 2) {
    return response;
  }
  
  throw new Error("AI returned an unexpected response format.");
};

export const generateYearlyPlan = async (
  grade: string,
  board: BoardType,
  frequency: string,
  calendarText: string,
  term1Focus: string,
  term2Focus: string,
  startDate: string,
  duration: string,
  language: Language
): Promise<YearlyPlan> => {
  const safeCalendarText = calendarText ? calendarText.substring(0, 1500) : "No calendar.";
  
  const schema = {
    type: "OBJECT",
    properties: {
      grade: { type: "STRING" },
      board: { type: "STRING" },
      academicYear: { type: "STRING" },
      terms: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            termName: { type: "STRING" },
            months: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  monthName: { type: "STRING" },
                  weeks: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        weekNumber: { type: "NUMBER" },
                        status: { type: "STRING", enum: ['Instructional', 'Holiday', 'Exam', 'Event'] },
                        dates: { type: "STRING" },
                        topic: { type: "STRING" },
                        details: { type: "STRING" }
                      },
                      required: ["weekNumber", "status", "topic", "details"]
                    }
                  }
                },
                required: ["monthName", "weeks"]
              }
            }
          },
          required: ["termName", "months"]
        }
      }
    },
    required: ["terms", "academicYear"]
  };

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Yearly Physical Education Curriculum Plan. 
    Grade: ${grade}, Board: ${board}, Language: ${language}. 
    Cycle: Indian Academic Session (April to March).
    Start Month: April. End Month: March.
    Term 1 Focus Game/Activities: "${term1Focus}".
    Term 2 Focus Game/Activities: "${term2Focus}".
    Additional Holidays/Calendar: ${safeCalendarText}`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: `You are a Senior Physical Education Director in a premium school following CBSE/national guidelines. 
      Generate a strictly valid JSON following the Indian academic cycle (APRIL to MARCH).
      
      STRUCTURE:
      - Term 1: April to September.
      - Term 2: October to March.
      
      STRICT TERM-WIDE FOCAL PURITY (MANDATORY NO-MIX RULE):
      - Term 1 (April to September) MUST focus EXCLUSIVELY on "${term1Focus}" and standard physical fitness tests (like CBSE Khelo India Battery). Under NO circumstance should you mix in or refer to "${term2Focus}".
      - Term 2 (October to March) MUST focus EXCLUSIVELY on "${term2Focus}" and relevant assessments/rules. Under NO circumstance should you mix in or refer to "${term1Focus}".
      - Keep each Term's lessons purely dedicated to its designated focus game. For example, if Basketball is selected for Term 1, weeks in Term 1 should be purely structured around basketball skills (dribbling, passing, layup, rules, assessments) and fitness, not mixing in football or other unselected sports.
      
      CALENDAR CONSTRAINTS:
      - May: Mark as 'Holiday' for at least 3-4 weeks (Summer Break).
      - December: Mark as 'Holiday' for at least 1-2 weeks (Winter Break).
      - March: Focus on revision and 'Exam'.
      
      WEEKLY CONTENT:
      - Each month MUST have exactly 4 weeks.
      - 'topic': Name of the specific skill, sport, or assessment (e.g., "${term1Focus} - Chest Pass" or "${term1Focus} - Physical Fitness Assessment").
      - 'details': Include specific skills, assessment parameters, how-to coaching points, and physical technical details (e.g., "Coaching points: Knees slightly bent, release the ball from chest, hands push outwards"). Make it highly professional and syllabus-aligned.
      - Ensure logical skill progressions (Intro, Basic Skills, Advanced Skills, Game Tactics, and Assessments).
      
      TRANSFERS: Translate all Topic and Details to ${language}.`,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  const parsed = safeParseJson(response.text || response);
  const terms = Array.isArray(parsed.terms) ? parsed.terms : [];

  return { 
    ...parsed, 
    grade: parsed.grade || grade, 
    board: parsed.board || board,
    duration: duration,
    terms: terms,
    generatedDate: new Date().toLocaleDateString(),
    academicYear: parsed.academicYear || "2024-2025"
  };
};

export const generateMindMap = async (grade: string, chapter: string, board: BoardType): Promise<{
  center: string;
  branches: {
    title: string;
    description: string;
    subTopics?: string[];
  }[];
}> => {
  const schema = {
    type: "OBJECT",
    properties: {
      center: { type: "STRING" },
      branches: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            description: { type: "STRING" },
            subTopics: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["title", "description"]
        }
      }
    },
    required: ["center", "branches"]
  };

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Generate a comprehensive mind map structure for CBSE Class ${grade} Physical Education Chapter: ${chapter}. 
    Include ALL major topics and sub-topics from the latest 2025-2026 CBSE curriculum and NCERT textbook.
    Provide exactly 6 to 8 main branches with clear, academic titles and brief descriptions.
    Each branch should have 3-5 sub-topics.`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: `You are a CBSE Physical Education Subject Matter Expert. 
      Generate a structured, hierarchical mind map in JSON format. 
      Ensure 'center' is a string and 'branches' is an array of objects.
      Each branch object MUST have 'title', 'description', and 'subTopics' (array of strings).
      Ensure full coverage of the specified chapter according to the 2025-2026 syllabus.`,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  
  const parsed = safeParseJson(response.text || response);
  if (!parsed || !parsed.branches) {
    throw new Error("The AI failed to generate segments for this chapter. Please try again.");
  }
  return parsed;
};

export const generateTheoryContent = async (grade: string, topic: string, board: BoardType, contentType: string, language: Language): Promise<TheoryContent> => {
  const schema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      contentType: { type: "STRING" },
      content: { type: "STRING" },
      questions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            answer: { type: "STRING" },
            type: { type: "STRING" }
          },
          required: ["question", "answer"]
        }
      }
    },
    required: ["title", "content", "questions"]
  };

  const isCBSE12 = board === 'CBSE' && (grade === '12' || grade === 'Class 12');
  const contextUrl = "https://www.failures.in/p/physical-education-class-12-notes-pdf.html";

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `PE Theory Content. Grade ${grade} ${board}. Topic: ${topic}. Type: ${contentType}. Language: ${language}.${isCBSE12 ? ` Use context from ${contextUrl}` : ''}`,
    config: { 
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: `You are an expert CBSE PE Teacher. Output valid JSON. 
      Content Language: ${language}. 
      
      GUIDELINES:
      1. Reference: Strictly follow NCERT and CBSE 2025-26 curriculum.
      2. Style: For 'Notes', use the "shortest way for math-like understanding" - very logical, bulleted, and precise. Avoid fluff.
      3. Case Studies: For 'CaseStudy', follow the latest board sample paper patterns (2024-25/2025-26). Include a scenario followed by 3-4 analytical questions.
      4. MCQs: Ensure options are challenging and follow board patterns.
      
      ${isCBSE12 ? `IMPORTANT: Prioritize and summarize information from ${contextUrl} for this CBSE Class 12 request.` : ''}`,
      responseMimeType: "application/json",
      responseSchema: schema,
      tools: isCBSE12 ? [{ urlContext: {} }] : undefined
    }
  });
  return safeParseJson(response.text || response);
};

export const generateGamesRubric = async (
  sport: string,
  totalMarks: number,
  numSkills: number,
  components: string[]
) => {
  const schema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      overallSummary: { type: "STRING" },
      skills: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            maxMarks: { type: "NUMBER" },
            criteria: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          }
        }
      },
      additionalComponents: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            marks: { type: "NUMBER" },
            description: { type: "STRING" }
          }
        }
      }
    }
  };

  const marksPerSkill = numSkills > 0 ? (totalMarks / numSkills) : 0;
  const prompt = `Create a CBSE-aligned Physical Education Practical Assessment Rubric for proficiency in ${sport}.
The total marks allocated for the Game/Sport proficiency section is ${totalMarks}.
We need to assess exactly ${numSkills} specific skills for ${sport}. 
Therefore, each skill should be graded out of exactly ${marksPerSkill} marks.

Include the following additional assessment components with standard nominal marks: ${components.join(', ')}.

Provide a structured output matching the schema:`;

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return safeParseJson(response.text || response);
};

export const generateAIToolContent = async (toolId: string, params: any) => {
  const schema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING", description: "Title of the generated resource" },
      content: { type: "STRING", description: "Main content, explanation or description" },
      items: { 
        type: "ARRAY", 
        items: { type: "STRING" },
        description: "List of key points, drill steps, or specific items"
      },
      summary: { type: "STRING", description: "Brief summary or conclusion" }
    },
    required: ["title", "content"]
  };

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `PE Tool ${toolId}. Parameters: ${JSON.stringify(params)}.`,
    config: { 
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: "You are a PE Expert. Be decisive and do not ask for clarification. Generate high-quality, actionable content. Do not return empty fields. If specific data is missing, generate realistic examples.",
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return safeParseJson(response.text || response);
};

export const generateLessonDiagram = async (prompt: string, context: string = 'general') => {
  if (!prompt || prompt.length < 5) return undefined;
  try {
    // Using a free image generation service (Pollinations AI) to provide actual visuals for drills
    const seed = Math.floor(Math.random() * 10000);
    const encodedPrompt = encodeURIComponent(`Professional sports coaching diagram, minimalist, whiteboard style, overhead view, ${context}: ${prompt}`);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;
  } catch (err) { 
    console.error("Diagram URL generation error:", err); 
  }
  return undefined;
};

export const generateSkillProgression = async (sport: string, skill: string) => {
  const schema = {
    type: "OBJECT",
    properties: {
      skillName: { type: "STRING" },
      level: { type: "STRING" },
      phases: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            phaseName: { type: "STRING" },
            drills: { type: "ARRAY", items: { type: "STRING" } },
            technicalFocus: { type: "STRING" },
            diagramPrompt: { type: "STRING" }
          },
          required: ["phaseName", "drills", "technicalFocus", "diagramPrompt"]
        }
      }
    },
    required: ["skillName", "phases"]
  };

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Skill progression: ${sport} - ${skill}`,
    config: { 
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: "Be decisive and do not ask for clarification. Generate a detailed 3-4 phase skill progression. Ensure diagrams prompts are descriptive. Drills must be actionable.",
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return safeParseJson(response.text || response);
};

export const getStateRegulationInsights = async (state: string, board: BoardType) => {
  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `PE regulations for ${state} ${board}. Marks, Hours, Curriculum.`,
    config: { thinkingConfig: { thinkingLevel: "LOW" } }
  });
  return response.text;
};

export const evaluateFitnessTests = async (
  age: string,
  gender: string,
  category: string,
  testName: string,
  value: string
): Promise<FitnessAssessment> => {
  const schema = {
    type: "OBJECT",
    properties: {
      studentName: { type: "STRING" },
      age: { type: "NUMBER" },
      gender: { type: "STRING" },
      overallSummary: { type: "STRING" },
      tests: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            testName: { type: "STRING" },
            score: { type: "STRING" },
            percentile: { type: "STRING" },
            rating: { type: "STRING", enum: ['Needs Improvement', 'Average', 'Good', 'Excellent', 'Elite'] },
            recommendation: { type: "STRING" },
          },
          required: ["testName", "score", "percentile", "rating", "recommendation"]
        }
      }
    },
    required: ["studentName", "age", "gender", "tests", "overallSummary"]
  };

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Assess fitness test result. 
    Category: ${category}.
    Test: ${testName}.
    Result: ${value}.
    Student: Age ${age}, ${gender}.`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: `You are a professional Sports Scientist and Fitness Assessor specializing in CBSE Physical Education & Khelo India Fitness Test (KIFT) protocols. 
      Be decisive and do not ask for clarification.
      Task: Compare the provided test result to CBSE/Khelo India standards and international norms (ACSM, NSCA, SAI).
      Speed & Sprint Guidelines (e.g. for schools with compact grounds without 100m tracks):
      - 25m Race / Sprint: Measures explosive start & acceleration (Ages 5-8: 4.8s-6.8s; Ages 9-14: 4.0s-5.6s; Ages 15-18: 3.4s-4.8s).
      - 30m Race / Sprint: Standard compact track sprint metric (Ages 5-8: 5.8s-7.8s; Ages 9-14: 4.6s-6.5s; Ages 15-18: 3.9s-5.4s).
      - 50m Sprint / Dash: Standard linear speed metric (Ages 9-14: 7.5s-10.8s; Ages 15-18: 6.4s-9.2s).
      Strength & Core Norms for Middle School (Class 6, 7, 8 / Ages 11-14) & Secondary:
      - Push-Ups (Boys): 60s trial (Class 6-8: Needs Imp <12, Avg 12-18, Good 19-27, Excellent 28-35, Elite >35).
      - Modified Push-Ups (Girls on knees): 60s trial (Class 6-8: Needs Imp <10, Avg 10-16, Good 17-25, Excellent 26-32, Elite >32).
      - Sit-Ups / Partial Curl-Ups: 60s trial (Class 6-8: Needs Imp <15, Avg 15-24, Good 25-38, Excellent 39-48, Elite >48).
      Output JSON must be fully populated.
      Calculate percentile and rating strictly based on standard age/gender norms.`,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return safeParseJson(response.text || response);
};

export const evaluateKheloIndiaScores = async (
  age: string,
  gender: string,
  tests: { name: string; value: string }[]
): Promise<FitnessAssessment> => {
  const schema = {
    type: "OBJECT",
    properties: {
      studentName: { type: "STRING" },
      age: { type: "NUMBER" },
      gender: { type: "STRING" },
      overallSummary: { type: "STRING" },
      tests: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            testName: { type: "STRING" },
            score: { type: "STRING" },
            percentile: { type: "STRING" },
            rating: { type: "STRING", enum: ['Needs Improvement', 'Average', 'Good', 'Excellent', 'Elite'] },
            recommendation: { type: "STRING" },
          },
          required: ["testName", "score", "percentile", "rating", "recommendation"]
        }
      }
    },
    required: ["studentName", "age", "gender", "tests", "overallSummary"]
  };

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Assess fitness based on Khelo India Norms. 
    Student: Age ${age}, ${gender}.
    Tests Provided: ${JSON.stringify(tests)}.`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: `You are an official Khelo India & CBSE Physical Education Fitness Assessor. 
      Be decisive and do not ask for clarification.
      Task: Compare scores to Indian National Fitness Protocols (Sports Authority of India & CBSE guidelines).
      Speed & Sprint Metric Reference (supports schools without standard 100m tracks):
      - 25m Race / Sprint: Acceleration and explosive speed (Ages 5-8: 4.8s-6.8s; Ages 9-14: 4.0s-5.6s; Ages 15-18: 3.4s-4.8s).
      - 30m Race / Sprint: Standard compact ground sprint metric (Ages 5-8: 5.8s-7.8s; Ages 9-14: 4.6s-6.5s; Ages 15-18: 3.9s-5.4s).
      - 50m Dash: Standard track sprint (Ages 9-14: 7.5s-10.8s; Ages 15-18: 6.4s-9.2s).
      Strength & Core Norms for Middle School (Class 6-8, Ages 11-14) & Secondary:
      - Push-Ups (Boys): 60s trial (Class 6-8: Needs Imp <12, Avg 12-18, Good 19-27, Excellent 28-35, Elite >35).
      - Modified Push-Ups (Girls on knees): 60s trial (Class 6-8: Needs Imp <10, Avg 10-16, Good 17-25, Excellent 26-32, Elite >32).
      - Sit-Ups / Partial Curl-Ups: 60s trial (Class 6-8: Needs Imp <15, Avg 15-24, Good 25-38, Excellent 39-48, Elite >48).
      CRITICAL: If test scores are missing or empty in the input, ESTIMATE typical scores for a student of this age/gender who is 'Average' and label them as (Estimated).
      Output JSON must be fully populated. Do not return empty strings for recommendations or ratings.
      Calculate percentiles strictly.`,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return safeParseJson(response.text || response);
};

export const generateTestPaper = async (
  grade: string,
  topic: string,
  testType: string,
  timeAllowed: string,
  maxMarks: number,
  language: Language
): Promise<TestPaper> => {
  const schema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      grade: { type: "STRING" },
      displayGrade: { type: "STRING" },
      subjectCode: { type: "STRING" },
      sessionLabel: { type: "STRING" },
      testType: { type: "STRING" },
      timeAllowed: { type: "STRING" },
      maxMarks: { type: "NUMBER" },
      generalInstructions: { type: "ARRAY", items: { type: "STRING" } },
      sections: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            sectionId: { type: "STRING" },
            heading: { type: "STRING" },
            instructions: { type: "STRING" },
            questions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  questionNumber: { type: "NUMBER" },
                  question: { type: "STRING" },
                  marks: { type: "NUMBER" },
                  options: { type: "ARRAY", items: { type: "STRING" } },
                  answer: { type: "STRING" },
                  caseStudyText: { type: "STRING" },
                  subQuestions: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        question: { type: "STRING" },
                        options: { type: "ARRAY", items: { type: "STRING" } },
                        answer: { type: "STRING" }
                      }
                    }
                  }
                },
                required: ["question", "marks"]
              }
            }
          },
          required: ["sectionId", "instructions", "questions"]
        }
      },
      markingScheme: {
        type: "OBJECT",
        properties: {
          header: { type: "STRING" },
          sections: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                sectionId: { type: "STRING" },
                items: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      qNo: { type: "STRING" },
                      answer: { type: "STRING" },
                      marks: { type: "STRING" }
                    },
                    required: ["qNo", "answer", "marks"]
                  }
                }
              },
              required: ["sectionId", "items"]
            }
          }
        },
        required: ["header", "sections"]
      }
    },
    required: ["title", "grade", "maxMarks", "sections", "generalInstructions", "markingScheme"]
  };

  const isCBSE12 = (grade === '12' || grade === 'Class 12') && (topic.toLowerCase().includes('cbse') || true); // Assuming CBSE if 70 marks or grade 12 for this context

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Generate a Physical Education Question Paper (CBSE). 
    Grade: ${grade}, Topic: ${topic}, 
    Type: ${testType}, Time: ${timeAllowed}, Marks: ${maxMarks}, 
    Language: ${language}.`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      maxOutputTokens: 8192,
      systemInstruction: `You are an expert CBSE Physical Education Examiner. 
      Be decisive and do not ask for clarification.
      Create a professional question paper following standard CBSE 2025-26 educational patterns for Code 048.
      
      ${maxMarks === 35 ? `
      STRICT STRUCTURE FOR 35 MARKS:
      Total 13 Questions (Strictly 35 Marks):
      1. Section A: Q1 to Q6 (6 Questions) - 1 mark each, MCQs.
      2. Section B: Q7 to Q9 (3 Questions) - 3 marks each, Short Answer.
      3. Section C: Q10 to Q13 (4 Questions) - 5 marks each, Long Answer.
      
      CRITICAL: You MUST provide Exactly 13 questions. Use the 6-3-5 mark distribution to reach exactly 35 marks. 
      ` : ''}

      ${isCBSE12 && maxMarks === 70 ? `
      STRICT STRUCTURE FOR 70 MARKS (CBSE CLASS 12 PHYSICAL EDUCATION - 048):
      This EXAM MUST ALWAYS HAVE EXACTLY 37 QUESTIONS. DO NOT TRUNCATE. 
      1. Section A: Q1 to Q18 (18 Questions) - 1 mark each, MCQs.
      2. Section B: Q19 to Q24 (6 Questions) - 2 marks each, Very Short Answer.
      3. Section C: Q25 to Q30 (6 Questions) - 3 marks each, Short Answer.
      4. Section D: Q31 to Q33 (3 Questions) - 4 marks each (Case Studies with 4 sub-questions each).
      5. Section E: Q34 to Q37 (4 Questions) - 5 marks each, Long Answer.
      
      CRITICAL: You MUST finish the JSON until question 37. If you are running out of tokens, keep the answers in the marking scheme very brief but finish all questions.
      ` : ''}
      
      TOTAL QUESTIONS FOR 70 MARKS: 37.
      TOTAL QUESTIONS FOR 35 MARKS: 13.
      
      CONTENT DISTRIBUTION:
      - The user has selected multiple chapters (Units).
      - You MUST distribute the questions proportionally across ALL chapters mentioned in the topic: ${topic}.
      - Do NOT focus only on one chapter. Ensure a balanced coverage of the entire selected syllabus.
      
      MARKING SCHEME:
      - You MUST generate a COMPLETE 'markingScheme' for EVERY SINGLE QUESTION from Q1 to Q37 (for 70 marks) or Q1 to Q13 (for 35 marks). 
      - For Section A (MCQs) and Section D: Provide the correct option (A, B, C or D) and the text.
      - For Short and Long Answers: Provide exhaustive point-wise answers and a clear marking breakdown.
      - The Marking Scheme must be 100% complete and match the Question Paper numbers exactly.
      `,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return safeParseJson(response.text || response);
};

export const explainBiomechanics = async (
  sport: string,
  concept: string,
  language: Language
): Promise<BiomechanicsConcept> => {
  const schema = {
    type: "OBJECT",
    properties: {
      concept: { type: "STRING" },
      sportApplication: { type: "STRING" },
      explanation: { type: "STRING" },
      analogy: { type: "STRING" },
      diagramPrompt: { type: "STRING" }
    },
    required: ["concept", "explanation", "analogy", "diagramPrompt"]
  };

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Explain biomechanics concept '${concept}' in '${sport}'. Language: ${language}.`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: `Output JSON. Be decisive and do not ask for clarification. Explanation must be simple for school students. Include a visual analogy description. Language: ${language}.`,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return safeParseJson(response.text || response);
};

export const getSportsRule = async (sport: string, query: string, language: Language) => {
  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Rule Check: ${sport}. Question: ${query}. Language: ${language}`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: `You are an expert official for global and Indian Sports (Kabaddi, Kho-Kho, Cricket, Football, Basketball, Tennis, Badminton, Athletics, Hockey, etc.). Be decisive and do not ask for clarification. Provide specific rule numbers if possible. Keep it concise. Language: ${language}.`,
    }
  });
  return response.text;
};

export const generateParentLetter = async (
  studentName: string,
  teacherName: string,
  purpose: string,
  details: string,
  language: Language
): Promise<string> => {
  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Generate a professional parent letter. 
    Student: ${studentName}, Teacher: ${teacherName}, 
    Purpose: ${purpose}, Details: ${details}, 
    Language: ${language}.`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: `You are a professional Physical Education Teacher and School Administrator. 
      Write a formal, polite, and professional letter to a parent. 
      The letter should follow a standard school communication format:
      - Date
      - Salutation (Dear Parent/Guardian of [Student Name])
      - Clear subject line
      - Body text clearly explaining the purpose: ${purpose}
      - Include specific details if provided: ${details}
      - Professional closing (Sincerely, [Teacher Name])
      Language: ${language}. 
      Ensure the tone is supportive and professional.`,
    }
  });
  return response.text;
};

export interface WeeklyAcademicPlanRow {
  subject: string;
  concept: string;
  learningObjective: string;
  studentPrep: string;
  homework: string;
  deadline: string;
  test: string;
  additionalRemarks: string;
}

export interface WeeklyAcademicPlan {
  classLabel: string;
  section: string;
  weekNo: string;
  weekOf: string;
  rows: WeeklyAcademicPlanRow[];
}

export const generateWeeklyAcademicPlan = async (
  classLabel: string,
  section: string,
  weekNo: string,
  weekOf: string,
  topic: string,
  language: Language = 'English'
): Promise<WeeklyAcademicPlan> => {
  const schema = {
    type: "OBJECT",
    properties: {
      classLabel: { type: "STRING" },
      section: { type: "STRING" },
      weekNo: { type: "STRING" },
      weekOf: { type: "STRING" },
      rows: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            subject: { type: "STRING", description: "Subject name (e.g. Physical Education)" },
            concept: { type: "STRING", description: "Split of concept, skill or topic being covered (e.g., Basketball Dribbling: Fingertip posturing, Lower-body stance)" },
            learningObjective: { type: "STRING", description: "Learning target / objective" },
            studentPrep: { type: "STRING", description: "Student preparation / participation before the class (if any)" },
            homework: { type: "STRING", description: "Homework assignment for practice" },
            deadline: { type: "STRING", description: "Deadline for homework/submission" },
            test: { type: "STRING", description: "Weekly test or assessment criteria for this skill" },
            additionalRemarks: { type: "STRING", description: "Safety checklist, equipment rules or remarks" }
          },
          required: ["subject", "concept", "learningObjective", "studentPrep", "homework", "deadline", "test", "additionalRemarks"]
        }
      }
    },
    required: ["classLabel", "section", "weekNo", "weekOf", "rows"]
  };

  const response = await callAIBase({
    model: 'gemini-3.7-flash',
    contents: `Generate a Weekly Academic Planner for class ${classLabel}, section ${section}, week number ${weekNo}, week range ${weekOf} on the topic of "${topic}". Split the physical education or sport skill of "${topic}" into 3 to 4 sequential weekly sessions or sub-concepts. Language: ${language}.`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" },
      systemInstruction: `You are a curriculum director and Physical Education expert in an elite school. Your task is to generate a comprehensive, highly specific, and beautifully structured Weekly Academic Planner that splits the requested sport skill/topic into 3 to 4 sequential, actionable sessions (lessons/classes) during that week.
Columns required for each session:
- subject: e.g. "Physical Education"
- concept: E.g., for basketball, split it into specific aspects like "Dribbling Stance & Fingertip Control", "Low and High Dribbles", or "In-motion Dribble Sprints"
- learningObjective: Concise learning target
- studentPrep: Preparation before the class (e.g., watch a video, perform light dynamic stretches, read basic rules)
- homework: Practice exercises at home
- deadline: homework submission date or next class
- test: micro assessment (e.g., complete 30 dribbles without look, timed 20-meter ball-control sprint)
- additionalRemarks: e.g., proper attire mandatory, stay hydrated, use standard court safety spaces
Make sure descriptions are realistic, detailed, and professional. Language: ${language}.`,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return safeParseJson(response.text || response);
};

