'use client';

import type { ProfileFinding } from '@/lib/questionnaire';
import { Badge } from '@/components/ui/badge';

interface ProfileSummaryProps {
  findings: ProfileFinding[];
}

export function ProfileSummary({ findings }: ProfileSummaryProps) {
  if (findings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No dominant framing detected. Scores are balanced across dimensions.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {findings.map((finding) => (
        <div
          key={finding.label}
          className="rounded-lg border bg-muted/30 px-4 py-3"
        >
          <div className="mb-1 flex items-center gap-2">
            <Badge
              variant={
                finding.severity === 'primary' ? 'default' : 'secondary'
              }
            >
              {finding.label}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {finding.description}
          </p>
        </div>
      ))}
    </div>
  );
}
