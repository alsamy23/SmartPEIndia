import { PhysicalDevelopmentProfile, ParentReportSummary } from '../types.ts';
import { callAIBase } from './geminiService.ts';

/**
 * AI-assisted interpretation of the deterministic Physical Development Profile.
 * Strictly operates on the already calculated numbers without modifying raw evidence or diagnosing conditions.
 */
export async function generatePhysicalDevelopmentInsights(
  profile: PhysicalDevelopmentProfile
): Promise<ParentReportSummary> {
  const domainSummaries = Object.entries(profile.domains)
    .map(([_, d]) => `${d.domainName}: ${d.scorePercent}% (${d.level}, ${d.testsCount} tests, trend: ${d.latestTrend})`)
    .join('\n');

  const bmiText = profile.currentBMI
    ? `BMI: ${profile.currentBMI.bmi} kg/m² (${profile.currentBMI.statusLabel})${profile.currentBMI.heightCm ? ` [${profile.currentBMI.weightKg}kg / ${profile.currentBMI.heightCm}cm]` : ''}`
    : 'BMI: Not recorded';

  const prompt = `You are a physical education curriculum specialist assisting a PE teacher.
Based STRICTLY on the deterministic Physical Development Profile data provided below for a student, generate a supportive, actionable, parent-friendly summary.

STUDENT PROFILE (Anonymized for Child Privacy):
- Grade/Class: ${profile.grade} - Section ${profile.section}
- Gender: ${profile.gender}
- Age: ${profile.age} years
- Current Term: ${profile.currentTerm}
- Overall Development Level: ${profile.overallLevel}
- ${bmiText}

6 DEVELOPMENT DOMAINS EVIDENCE:
${domainSummaries}

IDENTIFIED DEVELOPMENT FOCUS:
- Area: ${profile.developmentFocus?.domainName || 'General Agility'} (${profile.developmentFocus?.component || 'Coordination'})
- Suggested Goal: ${profile.developmentFocus?.suggestedGoal || 'Improve fundamental movement consistency'}

RULES:
1. NEVER invent test numbers or modify raw evidence.
2. NEVER use medical diagnosis labels, cardiovascular risk claims, or pathologize body stature. Treat BMI neutrally as a physical development tracking data point.
3. Keep the tone warm, constructive, and oriented around growth, effort, and enjoyment of physical play.
4. Output strict JSON conforming to this format:

{
  "whatIsGoingWell": [
    "2-3 positive, evidence-based bullet points highlighting the student's strongest domains and efforts"
  ],
  "progressThisTerm": [
    "2 bullet points describing actual growth and improvements from baseline"
  ],
  "developmentFocus": "1-2 sentence description of the focus area",
  "currentGoal": "1 clear, motivating goal for next term",
  "howFamilyCanSupport": [
    "3 fun, age-appropriate physical activities the family can do at home or park without specialized equipment"
  ],
  "teacherNotes": "A brief 2-sentence encouraging pedagogical summary from the PE department"
}`;

  try {
    const aiResponse = await (callAIBase as any)({
      prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(aiResponse.text || "{}");
    return {
      whatIsGoingWell: parsed.whatIsGoingWell || [
        `Demonstrates enthusiastic engagement in ${profile.grade} PE sessions.`,
        `Shows consistent physical development across fundamental movement drills.`
      ],
      progressThisTerm: parsed.progressThisTerm || [
        `Established baseline and showed positive effort across class activities.`,
        `Maintained steady participation in structured fitness and sport stations.`
      ],
      developmentFocus: parsed.developmentFocus || (profile.developmentFocus?.suggestedGoal || 'Focusing on movement agility and stamina.'),
      currentGoal: parsed.currentGoal || (profile.developmentFocus?.suggestedGoal || 'Continue building coordination and confidence in group games.'),
      howFamilyCanSupport: parsed.howFamilyCanSupport || [
        'Engage in 20 minutes of outdoor play, frisbee, or tag on weekends.',
        'Encourage daily hydration and regular walking or cycling together.',
        'Practice gentle skipping rope and balance games at home.'
      ],
      teacherNotes: parsed.teacherNotes || 'Great effort and steady physical development this term. Keep up the active enthusiasm!'
    };
  } catch (err) {
    console.warn("AI interpretation fallback:", err);
    // Deterministic fallback summary if AI is offline
    return {
      whatIsGoingWell: [
        `Solid performance in ${profile.overallLevel} physical development band.`,
        `Consistent active participation across school physical education activities.`
      ],
      progressThisTerm: [
        `Demonstrated positive effort in term assessments.`,
        `Good adherence to PE class drills and warm-up routines.`
      ],
      developmentFocus: profile.developmentFocus?.suggestedGoal || 'Continuing to refine movement skills and balance control.',
      currentGoal: profile.developmentFocus?.suggestedGoal || 'Build stamina and smooth agility in game situations.',
      howFamilyCanSupport: [
        'Enjoy 20-30 minutes of active family recreational play on weekends.',
        'Encourage regular outdoor active games like cycling, badminton, or jogging.',
        'Support healthy sleep and hydration routines after physical activity.'
      ],
      teacherNotes: 'Steady positive development throughout this academic cycle. Looking forward to continued growth!'
    };
  }
}
