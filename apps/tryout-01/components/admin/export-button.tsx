'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  generateTextExport,
  type QuestionnaireData,
  type ExportInteraction,
} from '@/lib/questionnaire';

interface ExportButtonProps {
  questionnaire: Record<string, number> | null;
  feedback: string | null;
  interactions: ExportInteraction[];
  gameId: string;
}

export function ExportButton({
  questionnaire,
  feedback,
  interactions,
  gameId,
}: ExportButtonProps) {
  const hasData = !!questionnaire;

  function handleDownload() {
    if (!questionnaire) return;
    const text = generateTextExport(
      questionnaire as QuestionnaireData,
      feedback,
      interactions
    );
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${gameId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      disabled={!hasData}
      onClick={handleDownload}
    >
      <Download className="size-4" />
      {hasData ? 'Export Summary' : 'No Data to Export'}
    </Button>
  );
}
