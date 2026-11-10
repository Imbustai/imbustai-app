'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@imbustai/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Grid,
  Input,
  Label,
  Select,
  Stack,
  Typography,
} from '@imbustai/ds';
import s from '../admin/admin-styles.module.css';

const ROLES = ['writer', 'clerk', 'analyst', 'player'] as const;
const PERSONAS = [
  ['methodical', 'personaMethodical'],
  ['warm', 'personaWarm'],
  ['impulsive', 'personaImpulsive'],
] as const;

/**
 * The admin button that starts a Run on a Story: persona, cap, Turns and the
 * model serving each role. The Run's Game opens in the admin and plays there.
 */
export function StartRunCard({
  storyId,
  models,
  defaultCapUsd,
  defaultTurns,
}: {
  storyId: string;
  /** Every priced model: the only ones a Run may call. */
  models: string[];
  defaultCapUsd: number;
  defaultTurns: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [persona, setPersona] = useState<string>('methodical');
  const [cap, setCap] = useState(String(defaultCapUsd));
  const [turns, setTurns] = useState(String(defaultTurns));
  const [roleModels, setRoleModels] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const roles = Object.fromEntries(
      Object.entries(roleModels)
        .filter(([, model]) => model)
        .map(([role, model]) => [role, { model }]),
    );
    const res = await fetch('/api/admin/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        story_id: storyId,
        persona,
        cap_usd: Number(cap),
        max_turns: Number(turns),
        model_profile: { roles },
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { gameId?: string; error?: string };
    setBusy(false);
    if (!res.ok || !body.gameId) {
      setError(body.error ?? t('common.error'));
      return;
    }
    router.push(`/admin/game/${body.gameId}?run=play`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.run.startTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap="4">
          <Typography variant="caption" tone="muted">{t('admin.run.startHint')}</Typography>
          <Grid columns={3} gap="3">
            <Stack gap="1">
              <Label htmlFor="run-persona">{t('admin.run.persona')}</Label>
              <Select id="run-persona" value={persona} onChange={(e) => setPersona(e.target.value)}>
                {PERSONAS.map(([key, label]) => (
                  <option key={key} value={key}>{t(`admin.run.${label}`)}</option>
                ))}
              </Select>
            </Stack>
            <Stack gap="1">
              <Label htmlFor="run-cap">{t('admin.run.cap')}</Label>
              <Input id="run-cap" type="number" min="0.5" step="0.5" value={cap} onChange={(e) => setCap(e.target.value)} />
            </Stack>
            <Stack gap="1">
              <Label htmlFor="run-turns">{t('admin.run.maxTurns')}</Label>
              <Input id="run-turns" type="number" min="1" step="1" value={turns} onChange={(e) => setTurns(e.target.value)} />
            </Stack>
          </Grid>
          <Grid columns={4} gap="3">
            {ROLES.map((role) => (
              <Stack gap="1" key={role}>
                <Label htmlFor={`run-model-${role}`}>{role}</Label>
                <Select
                  id={`run-model-${role}`}
                  value={roleModels[role] ?? ''}
                  onChange={(e) => setRoleModels((prev) => ({ ...prev, [role]: e.target.value }))}
                >
                  <option value="">{t('admin.run.storyDefault')}</option>
                  {models.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </Select>
              </Stack>
            ))}
          </Grid>
          <div>
            <Button type="button" disabled={busy} onClick={start}>
              {busy ? t('common.loading') : t('admin.run.start')}
            </Button>
          </div>
          {error ? <p className={s.errorText} role="alert">{error}</p> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
