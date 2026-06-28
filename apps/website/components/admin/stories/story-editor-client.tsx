'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@imbustai/i18n';
import type {
  StoryActRow,
  StoryCharacterRow,
  StoryClueRow,
  StoryEndingRow,
  StoryFactRow,
  StoryRow,
} from '@/lib/types/db';
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Grid,
  Inline,
  Input,
  Select,
  Stack,
  Typography,
} from '@imbustai/ds';
import { lifecycleBadgeVariant } from './stories-list-client';
import s from '../admin-styles.module.css';

type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'nullnumber'
  | 'checkbox'
  | 'select'
  | 'slugs'
  | 'json';

interface FieldDef {
  name: string;
  type: FieldType;
  options?: string[];
  hint?: string;
  wide?: boolean;
}

type Row = Record<string, unknown> & { id: string };

function FieldInput({
  def,
  value,
  onChange,
  slugOptions,
  label,
  hint,
}: {
  def: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  slugOptions: string[];
  label: string;
  hint?: string;
}) {
  const id = `f-${def.name}`;
  return (
    <Box gridColumn={def.wide ? 'span-full' : undefined}>
      <Stack gap="1">
        <Typography variant="caption" tone="muted" as="label" id={`label-${id}`}>
          {label}
        </Typography>
        {def.type === 'text' && (
          <Input id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
        )}
        {def.type === 'textarea' && (
          <textarea
            id={id}
            className={s.textarea}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {def.type === 'number' && (
          <Input
            id={id}
            type="number"
            value={Number(value ?? 0)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        )}
        {def.type === 'nullnumber' && (
          <Input
            id={id}
            type="number"
            value={value == null ? '' : Number(value)}
            placeholder="—"
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          />
        )}
        {def.type === 'checkbox' && (
          <input
            id={id}
            type="checkbox"
            className={s.nativeCheckbox}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
        )}
        {def.type === 'select' && (
          <Select
            id={id}
            value={String(value ?? def.options?.[0] ?? '')}
            onChange={(e) => onChange(e.target.value)}
          >
            {(def.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        )}
        {def.type === 'slugs' && (
          <SlugCheckboxes
            slugOptions={slugOptions}
            value={value}
            onChange={onChange}
          />
        )}
        {def.type === 'json' && (
          <JsonField id={id} value={value} onChange={onChange} />
        )}
        {hint ? <Typography variant="caption" tone="muted">{hint}</Typography> : null}
      </Stack>
    </Box>
  );
}

function SlugCheckboxes({
  slugOptions,
  value,
  onChange,
}: {
  slugOptions: string[];
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <Inline gap="3">
      {slugOptions.length === 0 ? (
        <Typography variant="caption" tone="muted" as="span">—</Typography>
      ) : (
        slugOptions.map((slug) => {
          const selected = Array.isArray(value) && (value as string[]).includes(slug);
          return (
            <Inline key={slug} gap="1">
              <label>
                <Inline gap="1">
                  <input
                    type="checkbox"
                    className={s.nativeCheckbox}
                    checked={selected}
                    onChange={(e) => {
                      const current = Array.isArray(value) ? (value as string[]) : [];
                      onChange(
                        e.target.checked
                          ? [...current, slug]
                          : current.filter((s) => s !== slug),
                      );
                    }}
                  />
                  <Typography variant="caption" as="span">{slug}</Typography>
                </Inline>
              </label>
            </Inline>
          );
        })
      )}
    </Inline>
  );
}

function JsonField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [text, setText] = useState(JSON.stringify(value ?? {}, null, 2));
  const [bad, setBad] = useState(false);
  return (
    <div>
      <textarea
        id={id}
        className={`${s.textarea} ${bad ? s.textareaBorderError : ''}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setBad(false);
          } catch {
            setBad(true);
          }
        }}
      />
      {bad ? <Typography variant="caption" tone="muted" as="p">Invalid JSON</Typography> : null}
    </div>
  );
}

function RowForm({
  resource,
  storyId,
  row,
  fields,
  slugOptions,
  onDone,
}: {
  resource: string;
  storyId: string;
  row: Partial<Row> & { id?: string };
  fields: FieldDef[];
  slugOptions: string[];
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...row });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    const { id, story_id: _s, created_at: _c, updated_at: _u, ...payload } = draft as Row;
    const url = id
      ? `/api/admin/stories/${storyId}/${resource}/${id}`
      : `/api/admin/stories/${storyId}/${resource}`;
    const res = await fetch(url, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const key = `storiesAdmin.errors.${body.error}`;
      const text = t(key);
      setError(text === key ? `${t('common.error')} (${body.error ?? res.status})` : text);
      return;
    }
    onDone();
  }

  async function remove() {
    if (!row.id) return onDone();
    if (!window.confirm(t('storiesAdmin.confirmDelete'))) return;
    setBusy(true);
    await fetch(`/api/admin/stories/${storyId}/${resource}/${row.id}`, { method: 'DELETE' });
    setBusy(false);
    onDone();
  }

  return (
    <Box padding="4" borderRadius="md">
      <Stack gap="4">
        <Grid columns={3} gap="4">
          {fields.map((def) => (
            <FieldInput
              key={def.name}
              def={def}
              value={draft[def.name]}
              onChange={(v) => setDraft((d) => ({ ...d, [def.name]: v }))}
              slugOptions={slugOptions}
              label={t(`storiesAdmin.fields.${def.name}`)}
              hint={def.hint ? t(def.hint) : undefined}
            />
          ))}
        </Grid>
        {error ? <p className={s.errorText}>{error}</p> : null}
        <Inline gap="2">
          <Button size="sm" onClick={save} disabled={busy}>
            {t('common.save')}
          </Button>
          <Button size="sm" variant="outline" onClick={onDone} disabled={busy}>
            {t('common.cancel')}
          </Button>
          {row.id ? (
            <Button size="sm" variant="destructive" onClick={remove} disabled={busy}>
              {t('storiesAdmin.delete')}
            </Button>
          ) : null}
        </Inline>
      </Stack>
    </Box>
  );
}

function ResourceSection({
  resource,
  storyId,
  rows,
  fields,
  newRow,
  summary,
  slugOptions,
  optional,
}: {
  resource: string;
  storyId: string;
  rows: Row[];
  fields: FieldDef[];
  newRow: Record<string, unknown>;
  summary: (row: Row) => string;
  slugOptions: string[];
  optional?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(!optional || rows.length > 0);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);

  function done() {
    setEditingId(null);
    router.refresh();
  }

  return (
    <Box marginTop="6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Inline justify="space-between" align="center">
              <button type="button" onClick={() => setOpen(!open)}>
                <Inline gap="2">
                  <span>{open ? '▾' : '▸'}</span>
                  {t(`storiesAdmin.sections.${resource}`)}
                  <Badge variant="secondary">{rows.length}</Badge>
                  {optional ? (
                    <Typography variant="caption" tone="muted" as="span">
                      {t('storiesAdmin.optionalModule')}
                    </Typography>
                  ) : null}
                </Inline>
              </button>
              {open ? (
                <Button size="sm" variant="outline" onClick={() => setEditingId('new')}>
                  {t('storiesAdmin.add')}
                </Button>
              ) : null}
            </Inline>
          </CardTitle>
        </CardHeader>
        {open ? (
          <CardContent>
            <Stack gap="3">
              {editingId === 'new' ? (
                <RowForm
                  resource={resource}
                  storyId={storyId}
                  row={newRow}
                  fields={fields}
                  slugOptions={slugOptions}
                  onDone={done}
                />
              ) : null}
              {rows.map((row) =>
                editingId === row.id ? (
                  <RowForm
                    key={row.id}
                    resource={resource}
                    storyId={storyId}
                    row={row}
                    fields={fields}
                    slugOptions={slugOptions}
                    onDone={done}
                  />
                ) : (
                  <Box key={row.id} display="flex" justifyContent="space-between" alignItems="center" padding="3">
                    <Typography variant="caption" as="span">{summary(row)}</Typography>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(row.id)}>
                      {t('storiesAdmin.edit')}
                    </Button>
                  </Box>
                ),
              )}
              {rows.length === 0 && editingId !== 'new' ? (
                <Typography variant="caption" tone="muted">{t('common.none')}</Typography>
              ) : null}
            </Stack>
          </CardContent>
        ) : null}
      </Card>
    </Box>
  );
}

const CHARACTER_FIELDS: FieldDef[] = [
  { name: 'slug', type: 'text', hint: 'storiesAdmin.hints.slug' },
  { name: 'name', type: 'text' },
  { name: 'role', type: 'text' },
  { name: 'responsiveness', type: 'select', options: ['immediate', 'slow', 'unreliable', 'expert'] },
  { name: 'reply_delay_min_days', type: 'number' },
  { name: 'reply_delay_max_days', type: 'number' },
  { name: 'contactable_from_start', type: 'checkbox' },
  { name: 'sort_order', type: 'number' },
  { name: 'opening_letter_day_offset', type: 'number' },
  { name: 'backstory', type: 'textarea', wide: true },
  { name: 'personality', type: 'json', wide: true, hint: 'storiesAdmin.hints.personality' },
  { name: 'hidden_agenda', type: 'textarea', wide: true, hint: 'storiesAdmin.hints.hiddenAgenda' },
  { name: 'knowledge_notes', type: 'textarea', wide: true },
  { name: 'unlock_rules', type: 'json', wide: true },
  { name: 'opening_letter', type: 'textarea', wide: true, hint: 'storiesAdmin.hints.openingLetter' },
];

const FACT_FIELDS: FieldDef[] = [
  { name: 'fact_key', type: 'text', hint: 'storiesAdmin.hints.slug' },
  { name: 'category', type: 'text' },
  { name: 'is_public', type: 'checkbox' },
  { name: 'reveal_act', type: 'nullnumber' },
  { name: 'content', type: 'textarea', wide: true },
  { name: 'known_by', type: 'slugs', wide: true, hint: 'storiesAdmin.hints.knownBy' },
];

const ACT_FIELDS: FieldDef[] = [
  { name: 'act_number', type: 'number' },
  { name: 'title', type: 'text' },
  { name: 'turn_min', type: 'number' },
  { name: 'turn_max', type: 'nullnumber' },
  { name: 'goals', type: 'json', wide: true },
  { name: 'reveal_rules', type: 'json', wide: true },
];

const CLUE_FIELDS: FieldDef[] = [
  { name: 'clue_key', type: 'text', hint: 'storiesAdmin.hints.slug' },
  { name: 'reliability', type: 'select', options: ['true_useful', 'true_misleading', 'false_coherent', 'red_herring'] },
  { name: 'category', type: 'select', options: ['physical', 'testimonial', 'documentary', 'subtle'] },
  { name: 'act_available', type: 'number' },
  { name: 'source_character_slug', type: 'text' },
  { name: 'description', type: 'textarea', wide: true },
];

const ENDING_FIELDS: FieldDef[] = [
  { name: 'ending_key', type: 'text', hint: 'storiesAdmin.hints.slug' },
  { name: 'title', type: 'text' },
  { name: 'conditions', type: 'json', wide: true, hint: 'storiesAdmin.hints.conditions' },
  { name: 'narrative_guidance', type: 'textarea', wide: true },
];

export function StoryEditorClient({
  story,
  characters,
  facts,
  acts,
  clues,
  endings,
  activeGamesCount,
}: {
  story: StoryRow;
  characters: StoryCharacterRow[];
  facts: StoryFactRow[];
  acts: StoryActRow[];
  clues: StoryClueRow[];
  endings: StoryEndingRow[];
  activeGamesCount: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [meta, setMeta] = useState({
    title_en: story.title_en,
    title_it: story.title_it,
    description_en: story.description_en,
    description_it: story.description_it,
    slug: story.slug,
    price_cents: story.price_cents,
    lifecycle: story.lifecycle,
    is_published: story.is_published,
    allow_dynamic_npcs: story.allow_dynamic_npcs,
    first_letter: story.first_letter,
    settings: {
      max_letters_per_turn: story.settings.max_letters_per_turn ?? 4,
      max_turns: story.settings.max_turns ?? 25,
      locale: story.settings.locale ?? 'it',
    },
    time_config: {
      start_mode: story.time_config.start_mode ?? 'fixed',
      story_start_date:
        story.time_config.story_start_date ?? new Date().toISOString().slice(0, 10),
      visible_delay: story.time_config.visible_delay ?? {
        enabled: false,
        min_minutes: 30,
        max_minutes: 180,
      },
      date_locale: story.time_config.date_locale ?? 'it-IT',
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const slugOptions = characters.map((c) => c.slug);

  async function saveStory() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/admin/stories/${story.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const key = `storiesAdmin.errors.${body.error}`;
      const text = t(key);
      setError(text === key ? `${t('common.error')} (${body.error ?? res.status})` : text);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const set = (patch: Partial<typeof meta>) => setMeta((m) => ({ ...m, ...patch }));

  return (
    <div>
      <Box marginBottom="6">
        <Link href="/admin/stories" className={s.mutedLink}>
          ← {t('storiesAdmin.backToList')}
        </Link>
      </Box>

      <Inline gap="3">
        <Typography variant="h2" as="h1">{story.title_it || story.slug}</Typography>
        <Badge variant={lifecycleBadgeVariant(story.lifecycle)}>
          {t(`storiesAdmin.lifecycle.${story.lifecycle}`)}
        </Badge>
      </Inline>

      {activeGamesCount > 0 ? (
        <Box marginTop="4">
          <div className={s.warningBox}>
            <strong>⚠️ {t('storiesAdmin.activeGamesWarningTitle')}</strong>{' '}
            {t('storiesAdmin.activeGamesWarningBody').replace('{count}', String(activeGamesCount))}
          </div>
        </Box>
      ) : null}

      <Box marginTop="6">
        <Card>
          <CardHeader>
            <CardTitle>{t('storiesAdmin.sections.metadata')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Grid columns={3} gap="4">
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.slug')}</Typography>
                <Input value={meta.slug} onChange={(e) => set({ slug: e.target.value })} />
              </Stack>
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.title')} (IT)</Typography>
                <Input value={meta.title_it} onChange={(e) => set({ title_it: e.target.value })} />
              </Stack>
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.title')} (EN)</Typography>
                <Input value={meta.title_en} onChange={(e) => set({ title_en: e.target.value })} />
              </Stack>
              <Box gridColumn="span-full">
                <Stack gap="1">
                  <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.description')} (IT)</Typography>
                  <textarea className={s.textarea} value={meta.description_it} onChange={(e) => set({ description_it: e.target.value })} />
                </Stack>
              </Box>
              <Box gridColumn="span-full">
                <Stack gap="1">
                  <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.description')} (EN)</Typography>
                  <textarea className={s.textarea} value={meta.description_en} onChange={(e) => set({ description_en: e.target.value })} />
                </Stack>
              </Box>
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.price_cents')}</Typography>
                <Input type="number" value={meta.price_cents} onChange={(e) => set({ price_cents: Number(e.target.value) })} />
              </Stack>
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.lifecycle')}</Typography>
                <Select
                  value={meta.lifecycle}
                  onChange={(e) => set({ lifecycle: e.target.value as StoryRow['lifecycle'] })}
                >
                  {(['draft', 'testing', 'released'] as const).map((lc) => (
                    <option key={lc} value={lc}>
                      {t(`storiesAdmin.lifecycle.${lc}`)}
                    </option>
                  ))}
                </Select>
                <Typography variant="caption" tone="muted">{t(`storiesAdmin.lifecycleHint.${meta.lifecycle}`)}</Typography>
              </Stack>
              <Box display="flex" flexDirection="column" gap="2" paddingTop="6">
                <label>
                  <Inline gap="2">
                    <input type="checkbox" className={s.nativeCheckbox} checked={meta.is_published} onChange={(e) => set({ is_published: e.target.checked })} />
                    <Typography variant="caption" as="span">{t('storiesAdmin.fields.published')}</Typography>
                  </Inline>
                </label>
                <label>
                  <Inline gap="2">
                    <input type="checkbox" className={s.nativeCheckbox} checked={meta.allow_dynamic_npcs} onChange={(e) => set({ allow_dynamic_npcs: e.target.checked })} />
                    <Typography variant="caption" as="span">{t('storiesAdmin.fields.allow_dynamic_npcs')}</Typography>
                  </Inline>
                </label>
              </Box>
              <Box gridColumn="span-full">
                <Stack gap="1">
                  <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.first_letter')}</Typography>
                  <textarea className={s.textarea} value={meta.first_letter} onChange={(e) => set({ first_letter: e.target.value })} />
                  <Typography variant="caption" tone="muted">{t('storiesAdmin.hints.firstLetterLegacy')}</Typography>
                </Stack>
              </Box>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Box marginTop="6">
        <Card>
          <CardHeader>
            <CardTitle>{t('storiesAdmin.sections.time')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Grid columns={3} gap="4">
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.start_mode')}</Typography>
                <Select
                  value={meta.time_config.start_mode}
                  onChange={(e) =>
                    set({ time_config: { ...meta.time_config, start_mode: e.target.value as 'fixed' | 'actual' } })
                  }
                >
                  <option value="fixed">{t('storiesAdmin.startMode.fixed')}</option>
                  <option value="actual">{t('storiesAdmin.startMode.actual')}</option>
                </Select>
              </Stack>
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.story_start_date')}</Typography>
                <Input
                  type="date"
                  value={meta.time_config.story_start_date}
                  disabled={meta.time_config.start_mode === 'actual'}
                  onChange={(e) => set({ time_config: { ...meta.time_config, story_start_date: e.target.value } })}
                />
              </Stack>
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.date_locale')}</Typography>
                <Input
                  value={meta.time_config.date_locale}
                  onChange={(e) => set({ time_config: { ...meta.time_config, date_locale: e.target.value } })}
                />
              </Stack>
              <Box gridColumn="span-full">
                <Grid columns={4} gap="4">
                  <label>
                    <Inline gap="2" align="center">
                      <input
                        type="checkbox"
                        className={s.nativeCheckbox}
                        checked={meta.time_config.visible_delay.enabled}
                        onChange={(e) =>
                          set({
                            time_config: {
                              ...meta.time_config,
                              visible_delay: { ...meta.time_config.visible_delay, enabled: e.target.checked },
                            },
                          })
                        }
                      />
                      <Typography variant="caption" as="span">{t('storiesAdmin.fields.visible_delay_enabled')}</Typography>
                    </Inline>
                  </label>
                  <Stack gap="1">
                    <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.visible_delay_min')}</Typography>
                    <Input
                      type="number"
                      value={meta.time_config.visible_delay.min_minutes}
                      onChange={(e) =>
                        set({
                          time_config: {
                            ...meta.time_config,
                            visible_delay: { ...meta.time_config.visible_delay, min_minutes: Number(e.target.value) },
                          },
                        })
                      }
                    />
                  </Stack>
                  <Stack gap="1">
                    <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.visible_delay_max')}</Typography>
                    <Input
                      type="number"
                      value={meta.time_config.visible_delay.max_minutes}
                      onChange={(e) =>
                        set({
                          time_config: {
                            ...meta.time_config,
                            visible_delay: { ...meta.time_config.visible_delay, max_minutes: Number(e.target.value) },
                          },
                        })
                      }
                    />
                  </Stack>
                </Grid>
              </Box>
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.max_letters_per_turn')}</Typography>
                <Input
                  type="number"
                  value={meta.settings.max_letters_per_turn}
                  onChange={(e) => set({ settings: { ...meta.settings, max_letters_per_turn: Number(e.target.value) } })}
                />
              </Stack>
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.max_turns')}</Typography>
                <Input
                  type="number"
                  value={meta.settings.max_turns}
                  onChange={(e) => set({ settings: { ...meta.settings, max_turns: Number(e.target.value) } })}
                />
              </Stack>
              <Stack gap="1">
                <Typography variant="caption" tone="muted" as="label">{t('storiesAdmin.fields.story_locale')}</Typography>
                <Input
                  value={meta.settings.locale}
                  onChange={(e) => set({ settings: { ...meta.settings, locale: e.target.value } })}
                />
              </Stack>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Box position="sticky" marginTop="4" paddingBottom="4">
        <Inline gap="3">
          <Button onClick={saveStory} disabled={busy}>
            {t('storiesAdmin.saveStory')}
          </Button>
          {saved ? <span className={s.savedText}>{t('storiesAdmin.saved')}</span> : null}
          {error ? <span className={s.errorText}>{error}</span> : null}
        </Inline>
      </Box>

      <ResourceSection
        resource="characters"
        storyId={story.id}
        rows={characters as unknown as Row[]}
        fields={CHARACTER_FIELDS}
        slugOptions={slugOptions}
        summary={(r) =>
          `${r.slug} — ${r.name}${r.contactable_from_start ? ' ✉' : ''}${String(r.opening_letter ?? '').trim() ? ` · ${t('storiesAdmin.hasOpeningLetter')}` : ''}`
        }
        newRow={{
          slug: '',
          name: '',
          role: '',
          personality: {},
          backstory: '',
          hidden_agenda: '',
          knowledge_notes: '',
          responsiveness: 'slow',
          reply_delay_min_days: 1,
          reply_delay_max_days: 3,
          contactable_from_start: false,
          unlock_rules: {},
          opening_letter: '',
          opening_letter_day_offset: 0,
          sort_order: characters.length + 1,
        }}
      />

      <ResourceSection
        resource="facts"
        storyId={story.id}
        rows={facts as unknown as Row[]}
        fields={FACT_FIELDS}
        slugOptions={slugOptions}
        optional
        summary={(r) => `[${r.fact_key}] ${String(r.content).slice(0, 80)}`}
        newRow={{ fact_key: '', content: '', category: 'general', known_by: [], is_public: false, reveal_act: null }}
      />

      <ResourceSection
        resource="acts"
        storyId={story.id}
        rows={acts as unknown as Row[]}
        fields={ACT_FIELDS}
        slugOptions={slugOptions}
        optional
        summary={(r) => `Act ${r.act_number} — ${r.title} (${r.turn_min}–${r.turn_max ?? '∞'})`}
        newRow={{ act_number: acts.length + 1, title: '', goals: {}, turn_min: 1, turn_max: null, reveal_rules: {} }}
      />

      <ResourceSection
        resource="clues"
        storyId={story.id}
        rows={clues as unknown as Row[]}
        fields={CLUE_FIELDS}
        slugOptions={slugOptions}
        optional
        summary={(r) => `[${r.clue_key}] (${r.reliability}) ${String(r.description).slice(0, 60)}`}
        newRow={{ clue_key: '', description: '', reliability: 'true_useful', category: 'subtle', act_available: 1, source_character_slug: null }}
      />

      <ResourceSection
        resource="endings"
        storyId={story.id}
        rows={endings as unknown as Row[]}
        fields={ENDING_FIELDS}
        slugOptions={slugOptions}
        optional
        summary={(r) => `[${r.ending_key}] ${r.title}`}
        newRow={{ ending_key: '', title: '', conditions: {}, narrative_guidance: '' }}
      />
    </div>
  );
}
