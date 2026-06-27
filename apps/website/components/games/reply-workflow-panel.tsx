'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@imbustai/i18n';
import type {
  AiDraftRow,
  GameRow,
  InteractionRow,
  InteractionTurnRow,
  StoryCharacterRow,
  StoryRow,
  UsageRecord,
} from '@/lib/types/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTokens, formatUsd } from '@/lib/format-cost';

// Admin reply workflow (Phase 3): pending turn → Generate → review per-NPC
// cards (edit / regenerate) with narrator notes + canon warnings → Approve &
// Send. Also hosts the Phase 3 test harness ("write as the player") until the
// Phase 4 play UI exists.

interface DraftResponse {
  character_slug: string;
  story_date: string;
  content: string;
  metadata?: { clues_revealed?: string[]; facts_referenced?: string[] };
  date_sent?: string;
}

interface Warning {
  rule: string;
  severity: 'warning' | 'error';
  message: string;
  character_slug?: string;
}

const textareaCls =
  'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 min-h-32';

export function ReplyWorkflowPanel({
  gameId,
  game,
  story,
  characters,
  openTurn,
  latestDraft,
  turnLetters,
}: {
  gameId: string;
  game: GameRow;
  story: StoryRow | null;
  characters: StoryCharacterRow[];
  openTurn: InteractionTurnRow | null;
  latestDraft: AiDraftRow | null;
  turnLetters: InteractionRow[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState('');
  const [edited, setEdited] = useState<Record<string, string> | null>(null);

  const nameOf = (slug: string | null) =>
    characters.find((c) => c.slug === slug)?.name ?? slug ?? '—';

  const runtime = game.runtime_state ?? {};
  const unlocked = (runtime.unlocked_npcs as string[] | undefined) ?? [];
  const responses = (latestDraft?.responses ?? []) as unknown as DraftResponse[];
  const warnings = (latestDraft?.validation_warnings ?? []) as unknown as Warning[];
  const draftUsage = (latestDraft?.usage ?? []) as UsageRecord[];

  async function call(key: string, url: string, init?: RequestInit) {
    setBusy(key);
    setError(null);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(`${t('common.error')} (${body.error ?? res.status})`);
      return false;
    }
    setEdited(null);
    router.refresh();
    return true;
  }

  async function saveEdits() {
    if (!latestDraft || !edited) return;
    const updated = responses.map((r) =>
      edited[r.character_slug] != null ? { ...r, content: edited[r.character_slug] } : r,
    );
    await call('save', `/api/admin/drafts/${latestDraft.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ responses: updated }),
    });
  }

  if (!story) return null;

  return (
    <div className="space-y-6">
      {/* Game state */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {t('replyAdmin.gameState')}
            <Badge variant="secondary">
              {t('replyAdmin.turn')} {String(runtime.current_turn ?? 0)}
            </Badge>
            <Badge variant="secondary">
              {t('replyAdmin.act')} {String(runtime.current_act ?? 1)}
            </Badge>
            <Badge variant="secondary">📅 {String(runtime.story_date ?? '—')}</Badge>
            <Badge variant={story.lifecycle === 'released' ? 'default' : 'outline'}>
              {t(`storiesAdmin.lifecycle.${story.lifecycle}`)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            {t('replyAdmin.unlocked')}: {unlocked.map(nameOf).join(', ') || '—'}
          </p>
          {Array.isArray(runtime.clues_found) && runtime.clues_found.length > 0 ? (
            <p className="mt-1">
              {t('replyAdmin.cluesFound')}: {(runtime.clues_found as string[]).join(', ')}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Open turn workflow */}
      {openTurn ? (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {t('replyAdmin.pendingTurn')} #{openTurn.turn_number}
              <Badge>{t(`replyAdmin.status.${openTurn.status}`)}</Badge>
              {latestDraft ? (
                <Badge variant="secondary">
                  v{latestDraft.version} · {latestDraft.source}
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Player letters of this turn */}
            <div>
              <h3 className="mb-2 text-sm font-medium">{t('replyAdmin.playerLetters')}</h3>
              <div className="space-y-2">
                {turnLetters
                  .filter((l) => l.role === 'user')
                  .map((l) => (
                    <div key={l.id} className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="mb-1 text-xs text-muted-foreground">
                        → {nameOf(l.character_slug)} · {l.story_date ?? ''}
                      </p>
                      <p className="whitespace-pre-wrap text-sm">{l.content}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 ? (
              <div className="rounded-md border border-amber-500/60 bg-amber-500/10 p-3">
                <h3 className="mb-1 text-sm font-medium">⚠️ {t('replyAdmin.warnings')}</h3>
                <ul className="space-y-1 text-sm">
                  {warnings.map((w, i) => (
                    <li key={i} className={w.severity === 'error' ? 'text-destructive' : ''}>
                      <strong>[{w.rule}]</strong> {w.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* AI cost of this draft (admin-only) */}
            {latestDraft ? (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    💰 {t('admin.cost.draftCost')}: {formatUsd(Number(latestDraft.cost_usd ?? 0))}
                  </span>
                  <span className="text-xs text-muted-foreground">{latestDraft.model || '—'}</span>
                </div>
                {draftUsage.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {draftUsage.map((u, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground">
                          {u.call_type === 'orchestrator'
                            ? t('admin.cost.orchestrator')
                            : `${t('admin.cost.letterTo')} ${nameOf(u.character_slug ?? null)}`}
                        </span>
                        <span>
                          ↓{formatTokens(u.input_tokens)} ↑{formatTokens(u.output_tokens)}
                        </span>
                        <span className="ml-auto tabular-nums">{formatUsd(u.cost_usd)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {/* Narrator notes (admin-only) */}
            {latestDraft?.narrator_notes ? (
              <div className="rounded-md border border-violet-500/50 bg-violet-500/10 p-3">
                <h3 className="mb-1 text-sm font-medium">🎭 {t('replyAdmin.narratorNotes')}</h3>
                <p className="whitespace-pre-wrap text-sm">{latestDraft.narrator_notes}</p>
              </div>
            ) : null}

            {/* Draft letters, one card per NPC */}
            {responses.map((r) => (
              <div key={r.character_slug} className="rounded-md border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    ✉️ {nameOf(r.character_slug)}{' '}
                    <span className="text-xs text-muted-foreground">· {r.story_date}</span>
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy !== null}
                    onClick={() =>
                      call('regen-one', `/api/admin/turns/${openTurn.id}/regenerate`, {
                        body: JSON.stringify({ character_slug: r.character_slug }),
                      })
                    }
                  >
                    {busy === 'regen-one' ? '…' : t('replyAdmin.regenerateOne')}
                  </Button>
                </div>
                <textarea
                  className={textareaCls}
                  value={edited?.[r.character_slug] ?? r.content}
                  onChange={(e) =>
                    setEdited((prev) => ({ ...(prev ?? {}), [r.character_slug]: e.target.value }))
                  }
                />
              </div>
            ))}

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2">
              {openTurn.status === 'pending_ai' ? (
                <Button
                  disabled={busy !== null}
                  onClick={() => call('generate', `/api/admin/turns/${openTurn.id}/generate`)}
                >
                  {busy === 'generate' ? t('replyAdmin.generating') : `🤖 ${t('replyAdmin.generate')}`}
                </Button>
              ) : null}
              {latestDraft ? (
                <>
                  {edited ? (
                    <Button disabled={busy !== null} onClick={saveEdits}>
                      {t('replyAdmin.saveEdits')}
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() =>
                      call('regen', `/api/admin/turns/${openTurn.id}/regenerate`, {
                        body: JSON.stringify({ admin_guidance: guidance || undefined }),
                      })
                    }
                  >
                    {busy === 'regen' ? t('replyAdmin.generating') : `🔄 ${t('replyAdmin.regenerate')}`}
                  </Button>
                  <Button
                    variant="default"
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={busy !== null || edited !== null}
                    onClick={() =>
                      call('approve', `/api/admin/turns/${openTurn.id}/approve`, {
                        body: JSON.stringify({ draft_id: latestDraft.id }),
                      })
                    }
                  >
                    {busy === 'approve' ? '…' : `✅ ${t('replyAdmin.approveSend')}`}
                  </Button>
                  {edited !== null ? (
                    <span className="text-xs text-muted-foreground">
                      {t('replyAdmin.saveBeforeApprove')}
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
            {latestDraft ? (
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  {t('replyAdmin.guidance')}
                </label>
                <textarea
                  className={`${textareaCls} min-h-16`}
                  value={guidance}
                  onChange={(e) => setGuidance(e.target.value)}
                  placeholder={t('replyAdmin.guidancePlaceholder')}
                />
              </div>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/**
 * Test harness: submit a turn as the player (Phase 3 tool; the player play
 * UI replaces it for real players in Phase 4). Rendered by the admin game
 * page BELOW the conversation.
 */
export function TestHarnessCard({
  gameId,
  game,
  characters,
  hasOpenTurn,
}: {
  gameId: string;
  game: GameRow;
  characters: StoryCharacterRow[];
  hasOpenTurn: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runtime = game.runtime_state ?? {};
  const unlocked = (runtime.unlocked_npcs as string[] | undefined) ?? [];
  const nameOf = (slug: string) => characters.find((c) => c.slug === slug)?.name ?? slug;

  const [testLetters, setTestLetters] = useState<
    Array<{ recipient_slug: string; content: string }>
  >([{ recipient_slug: unlocked[0] ?? '', content: '' }]);

  if (hasOpenTurn || game.status !== 'in_progress') return null;

  async function submitTestTurn() {
    const letters = testLetters.filter((l) => l.recipient_slug && l.content.trim());
    if (letters.length === 0) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/game/${gameId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letters }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(`${t('common.error')} (${body.error ?? res.status})`);
      return;
    }
    setTestLetters([{ recipient_slug: unlocked[0] ?? '', content: '' }]);
    router.refresh();
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>🧪 {t('replyAdmin.testTurnTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t('replyAdmin.testTurnHint')}</p>
        {testLetters.map((letter, idx) => (
          <div key={idx} className="rounded-md border border-border p-3">
            <select
              className="mb-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={letter.recipient_slug}
              onChange={(e) =>
                setTestLetters((ls) =>
                  ls.map((l, i) => (i === idx ? { ...l, recipient_slug: e.target.value } : l)),
                )
              }
            >
              <option value="">{t('replyAdmin.chooseRecipient')}</option>
              {unlocked.map((slug) => (
                <option key={slug} value={slug}>
                  {nameOf(slug)}
                </option>
              ))}
            </select>
            <textarea
              className={textareaCls}
              value={letter.content}
              placeholder={t('replyAdmin.letterPlaceholder')}
              onChange={(e) =>
                setTestLetters((ls) =>
                  ls.map((l, i) => (i === idx ? { ...l, content: e.target.value } : l)),
                )
              }
            />
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTestLetters((ls) => [...ls, { recipient_slug: '', content: '' }])}
          >
            + {t('replyAdmin.addLetter')}
          </Button>
          <Button size="sm" disabled={busy} onClick={submitTestTurn}>
            {busy ? '…' : `📨 ${t('replyAdmin.sendAsPlayer')}`}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
