import type { ParticipantRecord } from './types';
import type { QuestionnaireData } from '@/lib/questionnaire';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function randomLikert(rng: () => number, center: number, spread = 1.2): number {
  const v = center + (rng() - 0.5) * 2 * spread;
  return clamp(Math.round(v), 1, 5);
}

type Archetype = {
  name: string;
  centers: [number, number, number, number, number, number, number, number, number, number, number];
};

const ARCHETYPES: Archetype[] = [
  { name: 'rigid-normative',         centers: [3, 2, 5, 2, 4, 2, 2, 4, 5, 2, 3] },
  { name: 'contextual-mediating',    centers: [4, 3, 2, 5, 2, 4, 3, 3, 2, 5, 3] },
  { name: 'empathic-interventionist', centers: [3, 2, 3, 3, 3, 2, 5, 1, 3, 3, 5] },
  { name: 'detached',                centers: [4, 3, 3, 3, 3, 3, 1, 5, 3, 3, 2] },
  { name: 'ambivalent',              centers: [3, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3] },
  { name: 'balanced',                centers: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3] },
];

export function generateMockParticipants(n = 80, seed = 12345): ParticipantRecord[] {
  const rng = seededRandom(seed);
  const participants: ParticipantRecord[] = [];

  const baseDate = new Date('2025-11-01T10:00:00Z');
  const completedCount = Math.floor(n * 0.85);

  for (let i = 0; i < n; i++) {
    const archetype = ARCHETYPES[Math.floor(rng() * ARCHETYPES.length)];
    const isCompleted = i < completedCount;
    const dayOffset = Math.floor(rng() * 120);
    const hourOffset = Math.floor(rng() * 14);
    const createdAt = new Date(
      baseDate.getTime() + dayOffset * 86400000 + hourOffset * 3600000
    );

    const durationMin = 15 + Math.floor(rng() * 90);
    const completedAt = isCompleted
      ? new Date(createdAt.getTime() + durationMin * 60000)
      : null;

    let questionnaire: QuestionnaireData | null = null;
    if (isCompleted) {
      questionnaire = {
        q1: randomLikert(rng, archetype.centers[0]),
        q2: randomLikert(rng, archetype.centers[1]),
        q3: randomLikert(rng, archetype.centers[2]),
        q4: randomLikert(rng, archetype.centers[3]),
        q5: randomLikert(rng, archetype.centers[4]),
        q6: randomLikert(rng, archetype.centers[5]),
        q7: randomLikert(rng, archetype.centers[6]),
        q8: randomLikert(rng, archetype.centers[7]),
        q9: randomLikert(rng, archetype.centers[8]),
        q10: randomLikert(rng, archetype.centers[9]),
        q11: randomLikert(rng, archetype.centers[10]),
      };
    }

    const interactionCount = isCompleted ? 9 : 2 + Math.floor(rng() * 5);
    const userInteractionCount = isCompleted ? 4 : Math.floor(interactionCount / 2);

    participants.push({
      gameId: `mock-${String(i + 1).padStart(4, '0')}`,
      userId: `user-${String(i + 1).padStart(4, '0')}`,
      userEmail: `participant${i + 1}@research.test`,
      status: isCompleted ? 'completed' : 'in_progress',
      createdAt: createdAt.toISOString(),
      completedAt: completedAt?.toISOString() ?? null,
      questionnaire,
      feedback: isCompleted && rng() > 0.4
        ? ['Very interesting experience.', 'Made me reflect on my values.', 'I enjoyed the letter exchange.', 'It was thought-provoking.', 'A unique format for introspection.'][Math.floor(rng() * 5)]
        : null,
      interactionCount,
      userInteractionCount,
      durationMinutes: isCompleted ? durationMin : null,
      avgTimeBetweenLettersMin: isCompleted
        ? Math.round((durationMin / userInteractionCount) * 10) / 10
        : null,
      avgLetterLength: isCompleted
        ? Math.round(80 + rng() * 400)
        : null,
    });
  }

  return participants;
}
