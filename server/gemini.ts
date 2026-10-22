import { GoogleGenAI, Type } from '@google/genai';
import type { FeedbackContent, GenerateFeedbackRequest } from '../src/types/index';
import { validateFeedbackObject } from './assessmentValidation';

/**
 * Deterministic rule-based feedback generator fallback.
 * Strictly adheres to verified topic scores without hallucinations.
 */
export function generateRuleBasedFeedback(data: GenerateFeedbackRequest): FeedbackContent {
  const sortedTopics = [...data.topics].sort((a, b) => b.percentage - a.percentage);
  const bestTopic = sortedTopics[0];
  const lowestTopic = sortedTopics[sortedTopics.length - 1];
  const secondLowest = sortedTopics.length > 2 ? sortedTopics[sortedTopics.length - 2] : null;

  let strengthsText = '';
  if (bestTopic) {
    strengthsText = `Demonstrated solid conceptual competence in ${bestTopic.name}, achieving ${bestTopic.percentage.toFixed(1)}% (${bestTopic.marksAchieved}/${bestTopic.marksMax} marks) and executing the core objectives with confidence.`;
  } else {
    strengthsText = `Demonstrated positive overall engagement across the assessment objectives with an overall score of ${data.overallPercentage.toFixed(1)}%.`;
  }

  let growthText = '';
  if (lowestTopic && lowestTopic.percentage < 85) {
    growthText = `${lowestTopic.name} (${lowestTopic.percentage.toFixed(1)}%, ${lowestTopic.marksAchieved}/${lowestTopic.marksMax} marks) indicates areas where key definitions and problem-solving steps require further consolidation`;
    if (secondLowest && secondLowest.percentage < 75 && secondLowest.name !== lowestTopic.name) {
      growthText += `, along with targeted review in ${secondLowest.name} (${secondLowest.percentage.toFixed(1)}%)`;
    }
    growthText += '.';
  } else {
    growthText = `To progress from strong execution to advanced mastery, focus on refining edge-case problem solving and rigorous step-by-step verification on ${lowestTopic ? lowestTopic.name : 'all topics'}.`;
  }

  let nextStepsText = '';
  if (lowestTopic) {
    nextStepsText = `Review the lecture notes and review examples for ${lowestTopic.name}, then complete 3 targeted self-check questions before the next class review.`;
  } else {
    nextStepsText = `Review your graded answer sheet to verify missed partial-credit marks, and compile any remaining questions for office hours.`;
  }

  if (data.teacherNotes && data.teacherNotes.trim()) {
    growthText += ` Teacher note: ${data.teacherNotes.trim()}`;
  }

  return {
    strengths: strengthsText,
    growthAreas: growthText,
    nextSteps: nextStepsText,
    generatedBy: 'rule_engine',
    generatedAt: new Date().toISOString(),
    tone: data.tone || 'encouraging',
  };
}

/**
 * Generate feedback using server-side Gemini 3.8 Flash with tone and section awareness.
 */
export async function generateFeedback(data: GenerateFeedbackRequest): Promise<FeedbackContent> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.info('[ClearFeedback AI] GEMINI_API_KEY not configured or placeholder. Using verified deterministic rule-based feedback generator.');
    return generateRuleBasedFeedback(data);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const topicBreakdown = data.topics
      .map(t => `- ${t.name}: ${t.marksAchieved}/${t.marksMax} (${t.percentage.toFixed(1)}%)`)
      .join('\n');

    const toneGuide = data.tone === 'rigorous'
      ? 'Adopt a high-standard academic and analytical tone suitable for secondary/pre-collegiate scholarship.'
      : data.tone === 'foundational'
      ? 'Adopt an approachable, simplified tone with very plain vocabulary suitable for middle or foundational grades.'
      : 'Adopt a balanced, encouraging, and growth-oriented educational tone.';

    const prompt = `
You are the senior pedagogical evaluation intelligence engine for ClearFeedback.
Your job is to produce clear, actionable, evidence-based feedback for a student based STRICTLY on the verified assessment results below.

Assessment: "${data.assessmentTitle}"
Student: "${data.studentName}"
Overall Score: ${data.overallPercentage.toFixed(1)}%
Selected Pedagogical Tone: ${data.tone || 'encouraging'} (${toneGuide})

Verified Topic-Level Evidence:
${topicBreakdown}

${data.teacherNotes ? `Teacher's Observational Notes: "${data.teacherNotes}"` : 'Teacher Notes: None provided.'}

STRICT PEDAGOGICAL DIRECTIVES:
1. Strengths: Highlight ONE specific strength directly supported by the student's highest scoring topic(s). Explicitly mention the topic name and score.
2. Areas for Growth: Highlight ONE or TWO specific improvement areas directly supported by lower scoring topic(s). Never use harsh labels like 'lazy', 'weak', or 'incapable'. Focus objectively on concepts that need consolidation.
3. Next Steps: Provide ONE practical, concrete, actionable recommendation directly addressing the growth areas (e.g., targeted practice, diagram review, method verification).
4. Strictly respect the specified tone (${data.tone || 'encouraging'}).
5. Do NOT invent student behavior, personal circumstances, or extra topics. Keep each section to 1-2 concise, supportive sentences.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are the ClearFeedback educational feedback engine. You only produce evidence-based student feedback adhering strictly to the provided assessment scores. Never invent marks or make ungrounded claims.',
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: {
              type: Type.STRING,
              description: 'One specific strength supported by top scoring topic(s).',
            },
            growthAreas: {
              type: Type.STRING,
              description: 'One or two specific improvement areas supported by lower scores.',
            },
            nextSteps: {
              type: Type.STRING,
              description: 'One practical, concrete recommendation directly addressing the growth areas.',
            },
          },
          required: ['strengths', 'growthAreas', 'nextSteps'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response received from Gemini model.');
    }

    const parsed: unknown = JSON.parse(text);
    if (!validateFeedbackObject(parsed, true)) {
      throw new Error('Gemini response did not contain all non-empty feedback sections.');
    }
    const feedbackSections = parsed as Pick<FeedbackContent, 'strengths' | 'growthAreas' | 'nextSteps'>;
    return {
      strengths: feedbackSections.strengths,
      growthAreas: feedbackSections.growthAreas,
      nextSteps: feedbackSections.nextSteps,
      generatedBy: 'gemini',
      generatedAt: new Date().toISOString(),
      tone: data.tone || 'encouraging',
    };
  } catch (err) {
    console.warn('[ClearFeedback AI] Gemini generation encountered an issue, falling back to rule engine:', err);
    return generateRuleBasedFeedback(data);
  }
}
