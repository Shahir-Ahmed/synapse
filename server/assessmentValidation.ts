import { randomBytes } from 'node:crypto';
import { calculateGradeLetter, type AssessmentTopic } from '../src/types/index.ts';

export function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export type TopicValidation =
  | { ok: true; topics: AssessmentTopic[]; totalAchieved: number; totalMax: number; overallPercentage: number }
  | { ok: false; error: string };

export function validateAssessmentTopics(rawTopics: unknown): TopicValidation {
  if (!Array.isArray(rawTopics) || rawTopics.length === 0) {
    return { ok: false, error: 'At least one topic score is required.' };
  }

  const topics: AssessmentTopic[] = [];
  let totalAchieved = 0;
  let totalMax = 0;

  for (let i = 0; i < rawTopics.length; i++) {
    const raw = rawTopics[i];
    if (!isRecord(raw)) return { ok: false, error: `Topic #${i + 1} must be an object.` };

    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    const achieved = typeof raw.marksAchieved === 'number'
      ? raw.marksAchieved
      : typeof raw.marksAchieved === 'string' && raw.marksAchieved.trim() !== ''
      ? Number(raw.marksAchieved)
      : NaN;
    const max = typeof raw.marksMax === 'number'
      ? raw.marksMax
      : typeof raw.marksMax === 'string' && raw.marksMax.trim() !== ''
      ? Number(raw.marksMax)
      : NaN;

    if (!name) return { ok: false, error: `Topic #${i + 1} must have a title.` };
    if (!Number.isFinite(max) || max <= 0) {
      return { ok: false, error: `Topic "${name}" maximum marks must be a finite number greater than 0.` };
    }
    if (!Number.isFinite(achieved) || achieved < 0) {
      return { ok: false, error: `Topic "${name}" achieved marks must be a finite number greater than or equal to 0.` };
    }
    if (achieved > max) {
      return { ok: false, error: `Topic "${name}" achieved marks (${achieved}) cannot exceed maximum marks (${max}).` };
    }

    const percentage = Number(((achieved / max) * 100).toFixed(1));
    totalAchieved += achieved;
    totalMax += max;
    if (!Number.isFinite(totalAchieved) || !Number.isFinite(totalMax)) {
      return { ok: false, error: 'Topic totals exceed the supported numeric range.' };
    }

    topics.push({
      id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : `topic-${randomBytes(8).toString('hex')}`,
      name,
      marksAchieved: achieved,
      marksMax: max,
      percentage,
      gradeLetter: calculateGradeLetter(percentage),
    });
  }

  return {
    ok: true,
    topics,
    totalAchieved,
    totalMax,
    overallPercentage: Number(((totalAchieved / totalMax) * 100).toFixed(1)),
  };
}

export function validateFeedbackObject(value: unknown, requireAllSections = false): boolean {
  if (!isRecord(value)) return false;

  const sectionNames = ['strengths', 'growthAreas', 'nextSteps'] as const;
  for (const field of sectionNames) {
    if (requireAllSections && (typeof value[field] !== 'string' || !value[field].trim())) return false;
    if (value[field] !== undefined && typeof value[field] !== 'string') return false;
    if (typeof value[field] === 'string' && value[field].length > 10000) return false;
  }

  if (value.generatedBy !== undefined && value.generatedBy !== 'gemini' && value.generatedBy !== 'rule_engine') {
    return false;
  }
  if (value.tone !== undefined && !['encouraging', 'rigorous', 'foundational'].includes(value.tone)) {
    return false;
  }
  return true;
}
