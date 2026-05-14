'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  selectedGameIds: string[];
  onExported?: () => void;
}

export function AtlasTiExportButton({ selectedGameIds, onExported }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const disabled = busy || selectedGameIds.length === 0;

  async function handleClick() {
    if (selectedGameIds.length === 0) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/atlasti-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameIds: selectedGameIds }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
      }

      const blob = await response.blob();
      const filename = parseFilenameFromContentDisposition(
        response.headers.get('Content-Disposition')
      );
      triggerDownload(blob, filename);
      onExported?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error ? (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      ) : null}
      <Button onClick={handleClick} disabled={disabled} aria-busy={busy}>
        {busy
          ? 'Generating\u2026'
          : `Generate ATLAS.ti file${selectedGameIds.length > 0 ? ` (${selectedGameIds.length})` : ''}`}
      </Button>
    </div>
  );
}

async function readErrorMessage(response: Response): Promise<string> {
  const ct = response.headers.get('Content-Type') ?? '';
  if (ct.includes('application/json')) {
    try {
      const json = (await response.json()) as { error?: string };
      if (json?.error) return json.error;
    } catch {
      // fall through
    }
  }
  return `Export failed (${response.status} ${response.statusText})`;
}

function parseFilenameFromContentDisposition(header: string | null): string {
  const fallback = `imbustai-${new Date().toISOString().replace(/[:.]/g, '-')}.qdpx`;
  if (!header) return fallback;
  const match = header.match(/filename\s*=\s*"?([^";]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}
