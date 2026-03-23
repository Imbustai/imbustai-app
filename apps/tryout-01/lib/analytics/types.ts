import type { QuestionnaireData, SessionIndices, SessionBalances } from '@/lib/questionnaire';

export interface ParticipantRecord {
  gameId: string;
  userId: string;
  userEmail: string;
  status: 'in_progress' | 'completed';
  createdAt: string;
  completedAt: string | null;
  questionnaire: QuestionnaireData | null;
  feedback: string | null;
  interactionCount: number;
  userInteractionCount: number;
  durationMinutes: number | null;
  avgTimeBetweenLettersMin: number | null;
  avgLetterLength: number | null;
}

export type ProfileLabel =
  | 'rigid-normative'
  | 'contextual-mediating'
  | 'ambivalent'
  | 'empathic-interventionist'
  | 'detached'
  | 'unclassified';

export type UsageLabel =
  | 'fast-completer'
  | 'slow-reflective'
  | 'high-engagement'
  | 'low-engagement'
  | 'typical';

export interface EnrichedParticipant extends ParticipantRecord {
  indices: SessionIndices | null;
  balances: SessionBalances | null;
  profileLabel: ProfileLabel;
  usageLabel: UsageLabel;
  clusterId: number | null;
}

export interface ClusterResult {
  assignments: number[];
  centroids: number[][];
  k: number;
}

export interface DescriptiveStats {
  label: string;
  mean: number;
  median: number;
  stddev: number;
  min: number;
  max: number;
  values: number[];
}

export interface CorrelationEntry {
  rowKey: string;
  colKey: string;
  value: number;
}
