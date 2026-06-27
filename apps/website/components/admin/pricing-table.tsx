'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@imbustai/i18n';
import type { AiModelPricingRow } from '@/lib/types/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Draft = Pick<
  AiModelPricingRow,
  | 'provider'
  | 'model'
  | 'input_usd_per_mtok'
  | 'output_usd_per_mtok'
  | 'cache_read_usd_per_mtok'
  | 'cache_write_usd_per_mtok'
  | 'notes'
>;

const NUMERIC: (keyof Draft)[] = [
  'input_usd_per_mtok',
  'output_usd_per_mtok',
  'cache_read_usd_per_mtok',
  'cache_write_usd_per_mtok',
];

const EMPTY: Draft = {
  provider: '',
  model: '',
  input_usd_per_mtok: 0,
  output_usd_per_mtok: 0,
  cache_read_usd_per_mtok: 0,
  cache_write_usd_per_mtok: 0,
  notes: '',
};

// Admin pricing editor for ai_model_pricing. Prices are stored in the DB (not
// hardcoded) and edits affect future cost snapshots only.
export function PricingTable({ rows }: { rows: AiModelPricingRow[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<Draft>>>({});
  const [adding, setAdding] = useState<Draft>(EMPTY);

  const valueOf = (row: AiModelPricingRow, field: keyof Draft) =>
    (edits[row.id]?.[field] ?? row[field]) as string | number;

  function setEdit(id: string, field: keyof Draft, value: string) {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: NUMERIC.includes(field) ? Number(value) : value,
      },
    }));
  }

  async function send(key: string, url: string, init: RequestInit) {
    setBusy(key);
    setError(null);
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(`${t('common.error')} (${body.error ?? res.status})`);
      return false;
    }
    router.refresh();
    return true;
  }

  async function saveRow(row: AiModelPricingRow) {
    const patch = edits[row.id];
    if (!patch) return;
    const ok = await send(`save-${row.id}`, `/api/admin/pricing/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (ok) setEdits((prev) => ({ ...prev, [row.id]: {} }));
  }

  async function deleteRow(row: AiModelPricingRow) {
    await send(`del-${row.id}`, `/api/admin/pricing/${row.id}`, { method: 'DELETE' });
  }

  async function addRow() {
    const ok = await send('add', '/api/admin/pricing', {
      method: 'POST',
      body: JSON.stringify(adding),
    });
    if (ok) setAdding(EMPTY);
  }

  const numInput = (value: string | number, onChange: (v: string) => void) => (
    <Input
      type="number"
      step="0.000001"
      min="0"
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-24 tabular-nums"
    />
  );

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin.cost.provider')}</TableHead>
            <TableHead>{t('admin.cost.model')}</TableHead>
            <TableHead>{t('admin.cost.input')}</TableHead>
            <TableHead>{t('admin.cost.output')}</TableHead>
            <TableHead>{t('admin.cost.cacheRead')}</TableHead>
            <TableHead>{t('admin.cost.cacheWrite')}</TableHead>
            <TableHead>{t('admin.cost.notes')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const dirty = !!edits[row.id] && Object.keys(edits[row.id]).length > 0;
            return (
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    value={String(valueOf(row, 'provider'))}
                    onChange={(e) => setEdit(row.id, 'provider', e.target.value)}
                    className="h-8 w-28"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={String(valueOf(row, 'model'))}
                    onChange={(e) => setEdit(row.id, 'model', e.target.value)}
                    className="h-8 w-44"
                  />
                </TableCell>
                <TableCell>
                  {numInput(valueOf(row, 'input_usd_per_mtok'), (v) =>
                    setEdit(row.id, 'input_usd_per_mtok', v),
                  )}
                </TableCell>
                <TableCell>
                  {numInput(valueOf(row, 'output_usd_per_mtok'), (v) =>
                    setEdit(row.id, 'output_usd_per_mtok', v),
                  )}
                </TableCell>
                <TableCell>
                  {numInput(valueOf(row, 'cache_read_usd_per_mtok'), (v) =>
                    setEdit(row.id, 'cache_read_usd_per_mtok', v),
                  )}
                </TableCell>
                <TableCell>
                  {numInput(valueOf(row, 'cache_write_usd_per_mtok'), (v) =>
                    setEdit(row.id, 'cache_write_usd_per_mtok', v),
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    value={String(valueOf(row, 'notes'))}
                    onChange={(e) => setEdit(row.id, 'notes', e.target.value)}
                    className="h-8 w-40"
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!dirty || busy !== null}
                    onClick={() => saveRow(row)}
                  >
                    {busy === `save-${row.id}` ? '…' : t('admin.cost.save')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-1 text-destructive"
                    disabled={busy !== null}
                    onClick={() => deleteRow(row)}
                  >
                    {busy === `del-${row.id}` ? '…' : t('admin.cost.delete')}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {/* Add-new row */}
          <TableRow>
            <TableCell>
              <Input
                value={adding.provider}
                placeholder="anthropic"
                onChange={(e) => setAdding((a) => ({ ...a, provider: e.target.value }))}
                className="h-8 w-28"
              />
            </TableCell>
            <TableCell>
              <Input
                value={adding.model}
                placeholder="claude-…"
                onChange={(e) => setAdding((a) => ({ ...a, model: e.target.value }))}
                className="h-8 w-44"
              />
            </TableCell>
            <TableCell>
              {numInput(adding.input_usd_per_mtok, (v) =>
                setAdding((a) => ({ ...a, input_usd_per_mtok: Number(v) })),
              )}
            </TableCell>
            <TableCell>
              {numInput(adding.output_usd_per_mtok, (v) =>
                setAdding((a) => ({ ...a, output_usd_per_mtok: Number(v) })),
              )}
            </TableCell>
            <TableCell>
              {numInput(adding.cache_read_usd_per_mtok, (v) =>
                setAdding((a) => ({ ...a, cache_read_usd_per_mtok: Number(v) })),
              )}
            </TableCell>
            <TableCell>
              {numInput(adding.cache_write_usd_per_mtok, (v) =>
                setAdding((a) => ({ ...a, cache_write_usd_per_mtok: Number(v) })),
              )}
            </TableCell>
            <TableCell>
              <Input
                value={adding.notes}
                onChange={(e) => setAdding((a) => ({ ...a, notes: e.target.value }))}
                className="h-8 w-40"
              />
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                disabled={busy !== null || !adding.provider.trim() || !adding.model.trim()}
                onClick={addRow}
              >
                {busy === 'add' ? '…' : t('admin.cost.addModel')}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
