'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BalancesChart } from '@/components/admin/charts/balances-chart';
import { RadarSnapshot } from '@/components/admin/charts/radar-snapshot';
import { ProfileSummary } from '@/components/admin/profile-summary';
import {
  computeIndices,
  computeBalances,
  generateProfileSummary,
  QUESTION_LABELS,
  QUESTION_DESCRIPTIONS,
  type QuestionnaireData,
  type QuestionKey,
} from '@/lib/questionnaire';
import { Star } from 'lucide-react';

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < value
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

interface SessionAnalyticsProps {
  questionnaire: Record<string, number> | null;
  feedback: string | null;
}

export function SessionAnalytics({
  questionnaire,
  feedback,
}: SessionAnalyticsProps) {
  const analytics = useMemo(() => {
    if (!questionnaire) return null;
    const q = questionnaire as QuestionnaireData;
    return {
      indices: computeIndices(q),
      balances: computeBalances(q),
      findings: generateProfileSummary(q),
    };
  }, [questionnaire]);

  if (!analytics) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No questionnaire data available for this session.
          </p>
        </CardContent>
      </Card>
    );
  }

  const balanceList = [
    analytics.balances.responsibilityBalance,
    analytics.balances.agencyBalance,
    analytics.balances.emotionalPositioning,
    analytics.balances.boundaryOrientation,
  ];

  const questionKeys = Object.keys(QUESTION_LABELS) as QuestionKey[];

  return (
    <div className="mt-6 space-y-6">
      <h2 className="text-lg font-semibold tracking-tight">
        Session Analytics
      </h2>

      {/* Raw Scores Overview */}
      <Card>
        <CardContent className="py-5">
          <h3 className="mb-3 text-sm font-semibold">Raw Likert Scores</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {questionKeys.map((key) => (
              <div
                key={key}
                className="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs leading-snug">
                    <span className="font-mono text-[10px] font-medium uppercase text-foreground/50">
                      {key}
                    </span>
                    <span className="font-medium text-foreground">
                      {QUESTION_LABELS[key]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {QUESTION_DESCRIPTIONS[key]}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                  <Stars value={questionnaire![key]} />
                  <span className="w-6 text-right text-xs font-medium">
                    {questionnaire![key]}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Balances + Visual Snapshot side-by-side on wide screens */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <h3 className="mb-1 text-sm font-semibold">
              Dimensional Balances
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Diverging scores centered on zero. Positive values lean toward the
              right pole, negative toward the left.
            </p>
            <BalancesChart balances={balanceList} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5">
            <h3 className="mb-1 text-sm font-semibold">Visual Snapshot</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Radar chart of the 10 derived indices (scale 1-5).
            </p>
            <RadarSnapshot indices={analytics.indices} />
          </CardContent>
        </Card>
      </div>

      {/* Profile Summary */}
      <Card>
        <CardContent className="py-5">
          <h3 className="mb-1 text-sm font-semibold">Profile Summary</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Rule-based interpretation of score patterns.
          </p>
          <ProfileSummary findings={analytics.findings} />
        </CardContent>
      </Card>

      {/* Feedback */}
      {feedback && (
        <Card>
          <CardContent className="py-5">
            <h3 className="mb-3 text-sm font-semibold">
              Participant Free-text Feedback
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {feedback}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
