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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { lifecycleBadgeVariant } from './stories-list-client';

// Generic field-driven editor: the five module tables (characters, facts,
// acts, clues, endings) share one ResourceSection component configured by
// field definitions. Optional modules are collapsible and never required —
// a story with only characters + opening letter is publishable.

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

const textareaCls =
  'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 min-h-24 font-mono';

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
    <div className={def.wide ? 'col-span-full' : ''}>
      <label htmlFor={id} className="mb-1 block text-sm text-muted-foreground">
        {label}
      </label>
      {def.type === 'text' && (
        <Input id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      )}
      {def.type === 'textarea' && (
        <textarea
          id={id}
          className={textareaCls}
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
          className="mt-2 size-4"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      )}
      {def.type === 'select' && (
        <select
          id={id}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value={String(value ?? def.options?.[0] ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          {(def.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
      {def.type === 'slugs' && (
        <div className="flex flex-wrap gap-3 rounded-md border border-input p-2">
          {slugOptions.length === 0 ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            slugOptions.map((slug) => {
              const selected = Array.isArray(value) && (value as string[]).includes(slug);
              return (
                <label key={slug} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    className="size-4"
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
                  {slug}
                </label>
              );
            })
          )}
        </div>
      )}
      {def.type === 'json' && (
        <JsonField id={id} value={value} onChange={onChange} />
      )}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
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
        className={`${textareaCls} ${bad ? 'border-destructive' : ''}`}
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
      {bad ? <p className="mt-1 text-xs text-destructive">Invalid JSON</p> : null}
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
    <div className="rounded-md border border-border bg-muted/30 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <div className="mt-4 flex gap-2">
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
      </div>
    </div>
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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <button type="button" className="flex items-center gap-2" onClick={() => setOpen(!open)}>
            <span>{open ? '▾' : '▸'}</span>
            {t(`storiesAdmin.sections.${resource}`)}
            <Badge variant="secondary">{rows.length}</Badge>
            {optional ? (
              <span className="text-xs font-normal text-muted-foreground">
                {t('storiesAdmin.optionalModule')}
              </span>
            ) : null}
          </button>
          {open ? (
            <Button size="sm" variant="outline" onClick={() => setEditingId('new')}>
              {t('storiesAdmin.add')}
            </Button>
          ) : null}
        </CardTitle>
      </CardHeader>
      {open ? (
        <CardContent className="space-y-3">
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
              <div
                key={row.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span className="truncate text-sm">{summary(row)}</span>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(row.id)}>
                  {t('storiesAdmin.edit')}
                </Button>
              </div>
            ),
          )}
          {rows.length === 0 && editingId !== 'new' ? (
            <p className="text-sm text-muted-foreground">{t('common.none')}</p>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
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
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
        <Link href="/admin/stories" className="text-muted-foreground transition-colors hover:text-foreground">
          ← {t('storiesAdmin.backToList')}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-semibold">{story.title_it || story.slug}</h1>
        <Badge variant={lifecycleBadgeVariant(story.lifecycle)}>
          {t(`storiesAdmin.lifecycle.${story.lifecycle}`)}
        </Badge>
      </div>

      {activeGamesCount > 0 ? (
        <div className="mt-4 rounded-md border border-amber-500/60 bg-amber-500/10 p-4 text-sm">
          <strong>⚠️ {t('storiesAdmin.activeGamesWarningTitle')}</strong>{' '}
          {t('storiesAdmin.activeGamesWarningBody').replace('{count}', String(activeGamesCount))}
        </div>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('storiesAdmin.sections.metadata')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.slug')}</label>
              <Input value={meta.slug} onChange={(e) => set({ slug: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.title')} (IT)</label>
              <Input value={meta.title_it} onChange={(e) => set({ title_it: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.title')} (EN)</label>
              <Input value={meta.title_en} onChange={(e) => set({ title_en: e.target.value })} />
            </div>
            <div className="col-span-full">
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.description')} (IT)</label>
              <textarea className={textareaCls} value={meta.description_it} onChange={(e) => set({ description_it: e.target.value })} />
            </div>
            <div className="col-span-full">
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.description')} (EN)</label>
              <textarea className={textareaCls} value={meta.description_en} onChange={(e) => set({ description_en: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.price_cents')}</label>
              <Input type="number" value={meta.price_cents} onChange={(e) => set({ price_cents: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.lifecycle')}</label>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={meta.lifecycle}
                onChange={(e) => set({ lifecycle: e.target.value as StoryRow['lifecycle'] })}
              >
                {(['draft', 'testing', 'released'] as const).map((lc) => (
                  <option key={lc} value={lc}>
                    {t(`storiesAdmin.lifecycle.${lc}`)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">{t(`storiesAdmin.lifecycleHint.${meta.lifecycle}`)}</p>
            </div>
            <div className="flex flex-col gap-2 pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4" checked={meta.is_published} onChange={(e) => set({ is_published: e.target.checked })} />
                {t('storiesAdmin.fields.published')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4" checked={meta.allow_dynamic_npcs} onChange={(e) => set({ allow_dynamic_npcs: e.target.checked })} />
                {t('storiesAdmin.fields.allow_dynamic_npcs')}
              </label>
            </div>
            <div className="col-span-full">
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.first_letter')}</label>
              <textarea className={textareaCls} value={meta.first_letter} onChange={(e) => set({ first_letter: e.target.value })} />
              <p className="mt-1 text-xs text-muted-foreground">{t('storiesAdmin.hints.firstLetterLegacy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('storiesAdmin.sections.time')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.start_mode')}</label>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={meta.time_config.start_mode}
                onChange={(e) =>
                  set({ time_config: { ...meta.time_config, start_mode: e.target.value as 'fixed' | 'actual' } })
                }
              >
                <option value="fixed">{t('storiesAdmin.startMode.fixed')}</option>
                <option value="actual">{t('storiesAdmin.startMode.actual')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.story_start_date')}</label>
              <Input
                type="date"
                value={meta.time_config.story_start_date}
                disabled={meta.time_config.start_mode === 'actual'}
                onChange={(e) => set({ time_config: { ...meta.time_config, story_start_date: e.target.value } })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.date_locale')}</label>
              <Input
                value={meta.time_config.date_locale}
                onChange={(e) => set({ time_config: { ...meta.time_config, date_locale: e.target.value } })}
              />
            </div>
            <div className="col-span-full grid grid-cols-1 gap-4 md:grid-cols-4">
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
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
                {t('storiesAdmin.fields.visible_delay_enabled')}
              </label>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.visible_delay_min')}</label>
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
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.visible_delay_max')}</label>
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
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.max_letters_per_turn')}</label>
              <Input
                type="number"
                value={meta.settings.max_letters_per_turn}
                onChange={(e) => set({ settings: { ...meta.settings, max_letters_per_turn: Number(e.target.value) } })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.max_turns')}</label>
              <Input
                type="number"
                value={meta.settings.max_turns}
                onChange={(e) => set({ settings: { ...meta.settings, max_turns: Number(e.target.value) } })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('storiesAdmin.fields.story_locale')}</label>
              <Input
                value={meta.settings.locale}
                onChange={(e) => set({ settings: { ...meta.settings, locale: e.target.value } })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 mt-4 flex items-center gap-3">
        <Button onClick={saveStory} disabled={busy}>
          {t('storiesAdmin.saveStory')}
        </Button>
        {saved ? <span className="text-sm text-green-600">{t('storiesAdmin.saved')}</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>

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
