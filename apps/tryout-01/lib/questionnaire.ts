export const QUESTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11'] as const;

export type QuestionKey = (typeof QUESTION_KEYS)[number];
export type QuestionnaireData = Record<QuestionKey, number>;

export const QUESTION_LABELS: Record<QuestionKey, string> = {
  q1: 'Understand before judging',
  q2: 'Difficulty taking a position',
  q3: 'Individual choices',
  q4: 'Context & social expectations',
  q5: 'Interlocutor free to choose',
  q6: 'Interlocutor constrained',
  q7: 'Emotional involvement',
  q8: 'Emotional distance',
  q9: 'Clear moral boundary',
  q10: 'Mediation of viewpoints',
  q11: 'Argumentative engagement',
};

export const QUESTION_DESCRIPTIONS: Record<QuestionKey, string> = {
  q1: 'Whether the participant tried to understand the context before forming an opinion.',
  q2: 'Degree of difficulty the participant felt in adopting a definite stance.',
  q3: 'Attribution of actions to personal, individual choices.',
  q4: 'Attribution of actions to social norms, context, or expectations.',
  q5: 'Perception that the interlocutor had freedom and autonomy to act.',
  q6: 'Perception that the interlocutor was limited or conditioned by circumstances.',
  q7: 'Degree of emotional closeness and empathy felt toward the interlocutor.',
  q8: 'Degree to which the participant maintained emotional detachment.',
  q9: 'Strength of a fixed boundary between acceptable and unacceptable behavior.',
  q10: 'Willingness to reconcile one\'s own viewpoint with the interlocutor\'s.',
  q11: 'Effort to explain, justify, and argue one\'s own position in responses.',
};

export interface SessionIndices {
  judgementReflection: number;
  individualResponsibility: number;
  socialResponsibility: number;
  perceivedAgency: number;
  perceivedConstraint: number;
  emotionalInvolvement: number;
  emotionalDistance: number;
  moralBoundaryRigidity: number;
  moralBoundaryMediation: number;
  argumentativeEngagement: number;
}

export const INDEX_LABELS: Record<keyof SessionIndices, string> = {
  judgementReflection: 'Judgement Reflection',
  individualResponsibility: 'Individual Responsibility',
  socialResponsibility: 'Social Responsibility',
  perceivedAgency: 'Perceived Agency',
  perceivedConstraint: 'Perceived Constraint',
  emotionalInvolvement: 'Emotional Involvement',
  emotionalDistance: 'Emotional Distance',
  moralBoundaryRigidity: 'Moral Boundary Rigidity',
  moralBoundaryMediation: 'Moral Boundary Mediation',
  argumentativeEngagement: 'Argumentative Engagement',
};

export interface BalanceDescriptor {
  key: string;
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
}

export interface SessionBalances {
  responsibilityBalance: BalanceDescriptor;
  agencyBalance: BalanceDescriptor;
  emotionalPositioning: BalanceDescriptor;
  boundaryOrientation: BalanceDescriptor;
}

export interface ProfileFinding {
  label: string;
  description: string;
  severity: 'primary' | 'secondary';
}

export function computeIndices(q: QuestionnaireData): SessionIndices {
  return {
    judgementReflection: (q.q1 + q.q2) / 2,
    individualResponsibility: q.q3,
    socialResponsibility: q.q4,
    perceivedAgency: q.q5,
    perceivedConstraint: q.q6,
    emotionalInvolvement: q.q7,
    emotionalDistance: q.q8,
    moralBoundaryRigidity: q.q9,
    moralBoundaryMediation: q.q10,
    argumentativeEngagement: q.q11,
  };
}

export function computeBalances(q: QuestionnaireData): SessionBalances {
  return {
    responsibilityBalance: {
      key: 'responsibility',
      label: 'Responsibility',
      leftLabel: 'Social',
      rightLabel: 'Individual',
      value: q.q3 - q.q4,
    },
    agencyBalance: {
      key: 'agency',
      label: 'Agency',
      leftLabel: 'Constraint',
      rightLabel: 'Agency',
      value: q.q5 - q.q6,
    },
    emotionalPositioning: {
      key: 'emotional',
      label: 'Emotional Positioning',
      leftLabel: 'Distance',
      rightLabel: 'Involvement',
      value: q.q7 - q.q8,
    },
    boundaryOrientation: {
      key: 'boundary',
      label: 'Boundary Orientation',
      leftLabel: 'Mediation',
      rightLabel: 'Rigidity',
      value: q.q9 - q.q10,
    },
  };
}

const HIGH = 4;
const LOW = 2;

export function generateProfileSummary(q: QuestionnaireData): ProfileFinding[] {
  const findings: ProfileFinding[] = [];

  if (q.q9 >= HIGH && q.q3 >= HIGH && q.q5 >= HIGH) {
    findings.push({
      label: 'Rigid / Individual-responsibility framing',
      description:
        'This participant shows high moral boundary rigidity, attributes responsibility to individual choices, and perceives the interlocutor as free to act.',
      severity: 'primary',
    });
  }

  if (q.q10 >= HIGH && q.q4 >= HIGH && q.q6 >= HIGH) {
    findings.push({
      label: 'Contextual / Mediating framing',
      description:
        'This participant favors mediation, attributes influence to social context, and perceives the interlocutor as constrained by the situation.',
      severity: 'primary',
    });
  }

  if (q.q7 >= HIGH && q.q11 >= HIGH) {
    findings.push({
      label: 'Empathic & Argumentative',
      description:
        'High emotional involvement combined with active argumentation, suggesting an engaged and expressive interaction style.',
      severity: 'secondary',
    });
  }

  if (q.q2 >= HIGH) {
    findings.push({
      label: 'Ambivalent / Uncertain',
      description:
        'The participant reports difficulty in taking a clear position, indicating ambivalence or openness to multiple interpretations.',
      severity: 'secondary',
    });
  }

  if (q.q1 >= HIGH && q.q8 >= HIGH) {
    findings.push({
      label: 'Reflective & Detached',
      description:
        'High reflective judgment paired with emotional distance, suggesting an analytical, observer-like stance.',
      severity: 'secondary',
    });
  }

  if (q.q7 >= HIGH && q.q8 <= LOW) {
    findings.push({
      label: 'Strongly Involved',
      description:
        'High emotional involvement with low emotional distance indicates deep personal engagement with the narrative.',
      severity: 'secondary',
    });
  }

  if (q.q3 >= HIGH && q.q4 <= LOW) {
    findings.push({
      label: 'Individualist Attribution',
      description:
        'Strong attribution to individual choices with low recognition of social influence.',
      severity: 'secondary',
    });
  }

  if (q.q4 >= HIGH && q.q3 <= LOW) {
    findings.push({
      label: 'Contextualist Attribution',
      description:
        'Strong recognition of social/contextual influence with low attribution to individual agency.',
      severity: 'secondary',
    });
  }

  return findings;
}

export interface ExportInteraction {
  role: 'ai' | 'user';
  content: string;
  letter_number: number;
  created_at: string;
}

export function generateTextExport(
  q: QuestionnaireData,
  feedback: string | null,
  interactions: ExportInteraction[]
): string {
  const lines: string[] = [];

  lines.push('SESSION ANALYTICS EXPORT');
  lines.push('='.repeat(50));
  lines.push('');

  lines.push('INTERACTIONS');
  lines.push('-'.repeat(50));
  const sorted = [...interactions].sort(
    (a, b) =>
      a.letter_number - b.letter_number ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  if (sorted.length === 0) {
    lines.push('  (none)');
  } else {
    for (const interaction of sorted) {
      const date = new Date(interaction.created_at).toLocaleDateString(
        'en-GB',
        { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      );
      const sender =
        interaction.role === 'ai' ? 'AI (Apaya)' : 'User';
      lines.push(
        `  [Letter ${interaction.letter_number}] ${sender} — ${date}`
      );
      lines.push('');
      for (const paragraph of interaction.content.split('\n')) {
        lines.push(`    ${paragraph}`);
      }
      lines.push('');
    }
  }

  lines.push('QUESTIONNAIRE ANSWERS (Likert 1-5)');
  lines.push('-'.repeat(50));
  for (const key of QUESTION_KEYS) {
    lines.push(`  ${key.toUpperCase()}: ${q[key]}/5 — ${QUESTION_LABELS[key]}`);
  }
  lines.push('');

  lines.push('DERIVED INDICES');
  lines.push('-'.repeat(50));
  const indices = computeIndices(q);
  for (const [key, value] of Object.entries(indices)) {
    const label = INDEX_LABELS[key as keyof SessionIndices];
    lines.push(`  ${label}: ${value.toFixed(1)}`);
  }
  lines.push('');

  lines.push('DIMENSIONAL BALANCES (range -4 to +4)');
  lines.push('-'.repeat(50));
  const balances = computeBalances(q);
  for (const b of Object.values(balances)) {
    const sign = b.value > 0 ? '+' : '';
    lines.push(
      `  ${b.label}: ${sign}${b.value} (${b.leftLabel} ← 0 → ${b.rightLabel})`
    );
  }
  lines.push('');

  lines.push('PROFILE SUMMARY');
  lines.push('-'.repeat(50));
  const findings = generateProfileSummary(q);
  if (findings.length === 0) {
    lines.push('  No dominant framing detected.');
  } else {
    for (const f of findings) {
      lines.push(`  [${f.label}]`);
      lines.push(`    ${f.description}`);
    }
  }
  lines.push('');

  lines.push('FREE-TEXT FEEDBACK');
  lines.push('-'.repeat(50));
  lines.push(feedback?.trim() || '  (none)');
  lines.push('');

  return lines.join('\n');
}
