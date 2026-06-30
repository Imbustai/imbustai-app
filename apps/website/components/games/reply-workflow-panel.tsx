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
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Textarea,
  Stack,
  Inline,
  Box,
  Typography,
} from '@imbustai/ds';
import { formatTokens, formatUsd } from '@/lib/format-cost';
import styles from './games.module.css';

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
    <Stack gap="6">
      {/* Game state */}
      <Card>
        <CardHeader>
          <Inline gap="2" align="center">
            <CardTitle>{t('replyAdmin.gameState')}</CardTitle>
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
          </Inline>
        </CardHeader>
        <CardContent>
          <Typography variant="caption" tone="muted">
            {t('replyAdmin.unlocked')}: {unlocked.map(nameOf).join(', ') || '—'}
          </Typography>
          {Array.isArray(runtime.clues_found) && runtime.clues_found.length > 0 ? (
            <Typography variant="caption" tone="muted">
              {t('replyAdmin.cluesFound')}: {(runtime.clues_found as string[]).join(', ')}
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      {/* Open turn workflow */}
      {openTurn ? (
        <div className={styles.primaryBorderCard}>
          <Card>
            <CardHeader>
              <Inline gap="2" align="center">
                <CardTitle>
                  {t('replyAdmin.pendingTurn')} #{openTurn.turn_number}
                </CardTitle>
                <Badge>{t(`replyAdmin.status.${openTurn.status}`)}</Badge>
                {latestDraft ? (
                  <Badge variant="secondary">
                    v{latestDraft.version} · {latestDraft.source}
                  </Badge>
                ) : null}
              </Inline>
            </CardHeader>
            <CardContent>
              <Stack gap="4">
                {/* Player letters of this turn */}
                <Stack gap="2">
                  <Typography variant="body">{t('replyAdmin.playerLetters')}</Typography>
                  <Stack gap="2">
                    {turnLetters
                      .filter((l) => l.role === 'user')
                      .map((l) => (
                        <div key={l.id} className={styles.costPanel}>
                          <Typography variant="caption" tone="muted">
                            → {nameOf(l.character_slug)} · {l.story_date ?? ''}
                          </Typography>
                          <Box marginTop="1">
                            <pre className={styles.letterContent}>{l.content}</pre>
                          </Box>
                        </div>
                      ))}
                  </Stack>
                </Stack>

                {/* Warnings */}
                {warnings.length > 0 ? (
                  <div className={styles.warningPanel}>
                    <Typography variant="body">⚠️ {t('replyAdmin.warnings')}</Typography>
                    <Stack gap="1" as="ul">
                      {warnings.map((w, i) => (
                        <Box key={i} as="li">
                          <Typography
                            variant="caption"
                            tone={w.severity === 'error' ? 'default' : 'muted'}
                          >
                            <strong>[{w.rule}]</strong> {w.message}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </div>
                ) : null}

                {/* AI cost of this draft */}
                {latestDraft ? (
                  <div className={styles.costPanel}>
                    <Inline gap="2" align="center">
                      <Typography variant="body">
                        💰 {t('admin.cost.draftCost')}: {formatUsd(Number(latestDraft.cost_usd ?? 0))}
                      </Typography>
                      <Typography variant="caption" tone="muted" as="span">
                        {latestDraft.model || '—'}
                      </Typography>
                    </Inline>
                    {draftUsage.length > 0 ? (
                      <Stack gap="1" as="ul">
                        {draftUsage.map((u, i) => (
                          <Box key={i} as="li">
                            <Inline gap="2" align="center">
                              <Typography variant="caption" as="span">
                                {u.call_type === 'orchestrator'
                                  ? t('admin.cost.orchestrator')
                                  : `${t('admin.cost.letterTo')} ${nameOf(u.character_slug ?? null)}`}
                              </Typography>
                              <Typography variant="caption" tone="muted" as="span">
                                ↓{formatTokens(u.input_tokens)} ↑{formatTokens(u.output_tokens)}
                              </Typography>
                              <Box marginLeft="auto">
                                <span className={styles.tabularNums}>
                                  <Typography variant="caption" as="span">{formatUsd(u.cost_usd)}</Typography>
                                </span>
                              </Box>
                            </Inline>
                          </Box>
                        ))}
                      </Stack>
                    ) : null}
                  </div>
                ) : null}

                {/* Narrator notes */}
                {latestDraft?.narrator_notes ? (
                  <div className={styles.narratorPanel}>
                    <Typography variant="body">🎭 {t('replyAdmin.narratorNotes')}</Typography>
                    <Box marginTop="1">
                      <pre className={styles.letterContent}>{latestDraft.narrator_notes}</pre>
                    </Box>
                  </div>
                ) : null}

                {/* Draft letters, one card per NPC */}
                {responses.map((r) => (
                  <div key={r.character_slug} className={styles.letterPanel}>
                    <Inline gap="2" align="center" justify="space-between">
                      <Typography variant="body">
                        ✉️ {nameOf(r.character_slug)}{' '}
                        <Typography variant="caption" tone="muted" as="span">· {r.story_date}</Typography>
                      </Typography>
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
                    </Inline>
                    <Box marginTop="2">
                      <Textarea
                        value={edited?.[r.character_slug] ?? r.content}
                        onChange={(e) =>
                          setEdited((prev) => ({ ...(prev ?? {}), [r.character_slug]: e.target.value }))
                        }
                      />
                    </Box>
                  </div>
                ))}

                {/* Action bar */}
                <Inline gap="2" align="center">
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
                      <span className={styles.approveButton}>
                        <Button
                          disabled={busy !== null || edited !== null}
                          onClick={() =>
                            call('approve', `/api/admin/turns/${openTurn.id}/approve`, {
                              body: JSON.stringify({ draft_id: latestDraft.id }),
                            })
                          }
                        >
                          {busy === 'approve' ? '…' : `✅ ${t('replyAdmin.approveSend')}`}
                        </Button>
                      </span>
                      {edited !== null ? (
                        <Typography variant="caption" tone="muted" as="span">
                          {t('replyAdmin.saveBeforeApprove')}
                        </Typography>
                      ) : null}
                    </>
                  ) : null}
                </Inline>
                {latestDraft ? (
                  <Stack gap="1">
                    <Typography variant="caption" tone="muted">
                      {t('replyAdmin.guidance')}
                    </Typography>
                    <Textarea
                      size="sm"
                      value={guidance}
                      onChange={(e) => setGuidance(e.target.value)}
                      placeholder={t('replyAdmin.guidancePlaceholder')}
                    />
                  </Stack>
                ) : null}
                {error ? (
                  <Typography variant="caption" tone="default">{error}</Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </Stack>
  );
}

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
    <Box marginTop="8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 {t('replyAdmin.testTurnTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Stack gap="3">
            <Typography variant="caption" tone="muted">{t('replyAdmin.testTurnHint')}</Typography>
            {testLetters.map((letter, idx) => (
              <div key={idx} className={styles.letterPanel}>
                <Stack gap="2">
                  <Select
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
                  </Select>
                  <Textarea
                    value={letter.content}
                    placeholder={t('replyAdmin.letterPlaceholder')}
                    onChange={(e) =>
                      setTestLetters((ls) =>
                        ls.map((l, i) => (i === idx ? { ...l, content: e.target.value } : l)),
                      )
                    }
                  />
                </Stack>
              </div>
            ))}
            <Inline gap="2">
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
            </Inline>
            {error ? (
              <Typography variant="caption" tone="default">{error}</Typography>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
