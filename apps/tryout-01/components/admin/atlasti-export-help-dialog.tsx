'use client';

import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Operator-facing help: which repo files control Claude before running an export.
 */
export function AtlastiExportHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="How to tune ATLAS.ti export and AI coding"
        >
          <CircleHelp className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tuning the export before you generate</DialogTitle>
          <DialogDescription>
            The REFI-QDA file is built on the server. Claude reads fixed files from
            the codebase. Edit them locally, save, then run the dev server again (or
            let hot reload pick up changes) before clicking Generate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-foreground">
          <section className="space-y-2">
            <h3 className="font-medium">1. Conceptual catalog (JSON)</h3>
            <p className="text-muted-foreground">
              Secondary reference for the model: theoretical concepts and suggested
              codes. The AI is instructed to prefer the baseline codebook first; use
              this file when you want different conceptual scaffolding for the same
              baseline labels.
            </p>
            <pre className="rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed break-all">
              apps/tryout-01/lib/atlasti/codici_tesi_atlasti.json
            </pre>
            <p className="text-muted-foreground">
              Valid JSON only. After editing, trigger a new export; no separate build
              step is required in development.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-medium">2. System prompt (rules and output shape)</h3>
            <p className="text-muted-foreground">
              Defines role, output JSON schema, code precedence (baseline → few-shots
              style → catalog → new codes), and what to annotate. Bundled with the app
              so it must live in TypeScript, not a loose markdown file next to the
              server bundle.
            </p>
            <pre className="rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed break-all">
              apps/tryout-01/lib/atlasti/system-prompt.ts
            </pre>
            <p className="text-muted-foreground">
              Edit the <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8rem]">SYSTEM_PROMPT</code>{' '}
              string constant. Keep the JSON output contract in sync with{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8rem]">claude-coder.ts</code>{' '}
              if you change field names or structure.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-medium">3. Optional: human few-shot examples</h3>
            <p className="text-muted-foreground">
              Grounding examples from your sample project. Normally you regenerate
              them when the reference QDPA changes; manual edits are possible but easy
              to overwrite.
            </p>
            <pre className="rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed break-all">
              apps/tryout-01/lib/atlasti/sample-fewshots.json
            </pre>
            <pre className="rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed break-all">
              pnpm tsx apps/tryout-01/lib/atlasti/scripts/extract-sample-fewshots.ts
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="font-medium">4. API key</h3>
            <p className="text-muted-foreground">
              Claude calls require{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8rem]">ANTHROPIC_API_KEY</code>{' '}
              in <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8rem]">apps/tryout-01/.env.local</code>
              .
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
