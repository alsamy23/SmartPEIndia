import { CoachingSportId, PlayerProfileData, PlayerAssessmentRecord, SPORT_TEMPLATES } from './academyService';

export interface AiCoachingRecommendationResult {
  summary: string;
  strengthsNotes: string;
  prioritiesNotes: string;
  trainingFocus: string;
  suggestedGoals: {
    goal: string;
    skill: string;
    target: string;
    duration: string;
  }[];
}

export async function generateAiCoachingRecommendations(
  player: PlayerProfileData,
  sport: CoachingSportId,
  position: string,
  assessmentType: string,
  skillRatings: Record<string, number>,
  coachObservation: string
): Promise<AiCoachingRecommendationResult> {
  const template = SPORT_TEMPLATES[sport] || SPORT_TEMPLATES.football;
  
  // Build skill summary list with ratings
  const skillSummaryList = Object.entries(skillRatings).map(([id, rating]) => {
    const skillObj = template.skills.find(s => s.id === id);
    const skillName = skillObj?.name || id;
    const cat = skillObj?.category || 'General';
    return `- ${skillName} (${cat}): ${rating}/5`;
  }).join('\n');

  const prompt = `You are a professional youth sports development director and master academy coach for SmartPE India.
Analyze the following player assessment and generate constructive, positive, coach-centered development suggestions.

PLAYER DETAILS:
- Name: ${player.name}
- Age: ${player.age} | Gender: ${player.gender}
- Sport: ${template.name}
- Playing Position / Role: ${position}
- Assessment Cycle: ${assessmentType}
- Player's Personal Goals: ${player.playerGoals || 'General improvement'}
- Coach Initial Observations: ${coachObservation || 'Standard developmental session evaluation'}

ASSESSMENT RATINGS (1-5 Coaching Scale: 1=Beginning, 2=Developing, 3=Emerging Competence, 4=Proficient, 5=Advanced):
${skillSummaryList}

CRITICAL RULES:
1. Speak in positive, developmental sports coaching terminology (e.g., "Developing", "Progressing", "High potential", "Strong asset"). Avoid academic marksheet words or negative labels like "Failed" or "Weak".
2. Focus on actionable tactical/technical progression for youth athletes.
3. Suggest 2-3 specific Next 3-Month Goals with measurable targets (e.g., "Hit 8/10 rolling cutback strikes on target").

Return ONLY valid JSON matching this exact structure:
{
  "summary": "2-3 concise sentences summarizing current technical and tactical development stage and key growth milestones.",
  "strengthsNotes": "Detailed description of 2-3 standout strengths and how to leverage them in matches.",
  "prioritiesNotes": "Clear explanation of 2-3 primary developmental focus areas without being discouraging.",
  "trainingFocus": "Recommended weekly drill themes, repetition volume, and game situation emphasis.",
  "suggestedGoals": [
    {
      "goal": "Specific development objective",
      "skill": "Skill name",
      "target": "Actionable measurable milestone",
      "duration": "3 Months"
    }
  ]
}`;

  try {
    const response = await fetch(`/api/ai/generate?t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      })
    });

    if (!response.ok) {
      throw new Error(`AI Service returned ${response.status}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean code fences if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text) as AiCoachingRecommendationResult;
    return parsed;
  } catch (error) {
    console.warn('AI recommendation generation fallback to local heuristic engine:', error);
    
    // High quality deterministic fallback if offline or no key configured
    const ratedEntries = Object.entries(skillRatings).map(([id, r]) => {
      const s = template.skills.find(sk => sk.id === id);
      return { name: s?.name || id, rating: r, category: s?.category || 'general' };
    });

    const topSkills = [...ratedEntries].sort((a, b) => b.rating - a.rating).slice(0, 3).map(s => s.name);
    const growthSkills = [...ratedEntries].sort((a, b) => a.rating - b.rating).slice(0, 2).map(s => s.name);

    return {
      summary: `${player.name} is demonstrating solid developmental trajectory in ${template.name}, showing strong engagement and positive game behavior. Continued focus on high-tempo execution will accelerate overall match readiness.`,
      strengthsNotes: `Demonstrates standout confidence in ${topSkills.join(', ')}. These abilities provide an excellent foundation for dynamic positional play and leadership.`,
      prioritiesNotes: `Key growth focus should center on ${growthSkills.join(' and ')}, building consistent repetition under match tempo and pressure.`,
      trainingFocus: `Incorporate 15 minutes of structured technical ball mastery and 3v1/4v2 small-sided rondos during every weekly training cycle.`,
      suggestedGoals: growthSkills.map(s => ({
        goal: `Elevate ${s} to consistent match execution`,
        skill: s,
        target: `Achieve 80% success rate in conditioned drills and small-sided games`,
        duration: `3 Months`
      }))
    };
  }
}
