import type { SessionIndices, SessionBalances, QuestionnaireData } from '@/lib/questionnaire';
import type { ProfileLabel, UsageLabel, ParticipantRecord } from './types';
import { percentile, median } from './statistics';

/**
 * Rule-based profile labeling with transparent, deterministic thresholds.
 * Each rule checks index values against fixed cutoffs.
 * First matching rule wins; order reflects priority.
 */
export function assignProfileLabel(
  indices: SessionIndices,
  balances: SessionBalances,
  q: QuestionnaireData
): ProfileLabel {
  const bo = balances.boundaryOrientation.value;
  const rb = balances.responsibilityBalance.value;
  const ab = balances.agencyBalance.value;

  // rigid-normative: high rigidity + individual responsibility + positive boundary orientation
  if (
    indices.moralBoundaryRigidity >= 4 &&
    indices.individualResponsibility >= 4 &&
    bo > 1
  ) {
    return 'rigid-normative';
  }

  // contextual-mediating: high mediation + social responsibility + negative boundary orientation
  if (
    indices.moralBoundaryMediation >= 4 &&
    indices.socialResponsibility >= 4 &&
    bo < -1
  ) {
    return 'contextual-mediating';
  }

  // empathic-interventionist: high involvement + argumentation, low distance
  if (
    indices.emotionalInvolvement >= 4 &&
    indices.argumentativeEngagement >= 4 &&
    indices.emotionalDistance <= 2
  ) {
    return 'empathic-interventionist';
  }

  // detached: high distance, low involvement
  if (
    indices.emotionalDistance >= 4 &&
    indices.emotionalInvolvement <= 2
  ) {
    return 'detached';
  }

  // ambivalent: high difficulty positioning + balanced responsibility and agency
  if (
    q.q2 >= 4 &&
    Math.abs(rb) <= 1 &&
    Math.abs(ab) <= 1
  ) {
    return 'ambivalent';
  }

  return 'unclassified';
}

/**
 * Usage-based segmentation using session behavioral metadata.
 * Thresholds are computed relative to the population (percentile-based).
 */
export function assignUsageLabels(participants: ParticipantRecord[]): UsageLabel[] {
  const durations = participants
    .map((p) => p.durationMinutes)
    .filter((d): d is number => d !== null);
  const letterLengths = participants
    .map((p) => p.avgLetterLength)
    .filter((l): l is number => l !== null);
  const timeBetween = participants
    .map((p) => p.avgTimeBetweenLettersMin)
    .filter((t): t is number => t !== null);

  const durP25 = percentile(durations, 25);
  const durP75 = percentile(durations, 75);
  const lenP25 = percentile(letterLengths, 25);
  const lenP75 = percentile(letterLengths, 75);
  const timeMed = median(timeBetween);

  return participants.map((p) => {
    if (p.durationMinutes !== null && p.durationMinutes < durP25) {
      return 'fast-completer';
    }
    if (
      p.durationMinutes !== null &&
      p.durationMinutes > durP75 &&
      p.avgTimeBetweenLettersMin !== null &&
      p.avgTimeBetweenLettersMin > timeMed
    ) {
      return 'slow-reflective';
    }
    if (p.avgLetterLength !== null && p.avgLetterLength > lenP75) {
      return 'high-engagement';
    }
    if (p.avgLetterLength !== null && p.avgLetterLength < lenP25) {
      return 'low-engagement';
    }
    return 'typical';
  });
}
