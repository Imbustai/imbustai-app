'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Check } from 'lucide-react';
import { useTranslation } from '@imbustai/i18n';

interface AppSettings {
  delayed_responses_enabled: boolean;
  min_response_time: number;
  max_response_time: number;
}

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>({
    delayed_responses_enabled: false,
    min_response_time: 30,
    max_response_time: 120,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setSettings({
            delayed_responses_enabled: data.delayed_responses_enabled,
            min_response_time: data.min_response_time,
            max_response_time: data.max_response_time,
          });
        }
      })
      .catch(() => setError(t('admin.settings.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.settings.saveError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const validationError =
    settings.min_response_time < 1
      ? t('admin.settings.validation.minAtLeastOne')
      : settings.max_response_time < settings.min_response_time
        ? t('admin.settings.validation.maxGreaterThanMin')
        : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.settings.title')}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        {t('admin.settings.subtitle')}
      </p>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">{t('admin.settings.delayedResponses.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('admin.settings.delayedResponses.description')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={settings.delayed_responses_enabled}
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  delayed_responses_enabled: !s.delayed_responses_enabled,
                }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                settings.delayed_responses_enabled
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  settings.delayed_responses_enabled
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
            <Label>
              {settings.delayed_responses_enabled ? t('admin.settings.enabled') : t('admin.settings.disabled')}
            </Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_response_time">
                {t('admin.settings.minResponseTime')}
              </Label>
              <Input
                id="min_response_time"
                type="number"
                min={1}
                value={settings.min_response_time}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    min_response_time: parseInt(e.target.value) || 0,
                  }))
                }
                disabled={!settings.delayed_responses_enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_response_time">
                {t('admin.settings.maxResponseTime')}
              </Label>
              <Input
                id="max_response_time"
                type="number"
                min={1}
                value={settings.max_response_time}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    max_response_time: parseInt(e.target.value) || 0,
                  }))
                }
                disabled={!settings.delayed_responses_enabled}
              />
            </div>
          </div>

          {settings.delayed_responses_enabled && (
            <p className="text-xs text-muted-foreground">
              {t('admin.settings.delayInfo')
                .replace('{min}', String(settings.min_response_time))
                .replace('{max}', String(settings.max_response_time))}
            </p>
          )}

          {(error || validationError) && (
            <p className="text-sm text-destructive">
              {error || validationError}
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || !!validationError}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('admin.settings.saving')}
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4" />
                {t('admin.settings.saved')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('admin.settings.saveSettings')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
