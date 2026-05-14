'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GameRowActions } from '@/components/admin/game-row-actions';
import { AtlasTiExportButton } from '@/components/admin/atlasti-export-button';
import { AtlastiExportHelpDialog } from '@/components/admin/atlasti-export-help-dialog';

export interface AdminGameRow {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  interaction_count: number;
  user_email: string;
  questionnaire: Record<string, number> | null;
  feedback: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface GamesTableProps {
  games: AdminGameRow[];
}

const MAX_SELECTION = 10;

export function GamesTable({ games }: GamesTableProps) {
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());

  const completedGames = React.useMemo(
    () => games.filter((g) => g.status === 'completed'),
    [games]
  );
  const completedIds = React.useMemo(
    () => completedGames.map((g) => g.id),
    [completedGames]
  );

  const allCompletedSelected =
    completedIds.length > 0 && completedIds.every((id) => selected.has(id));
  const someCompletedSelected =
    !allCompletedSelected && completedIds.some((id) => selected.has(id));

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        if (next.size >= MAX_SELECTION && !next.has(id)) return prev;
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(completedIds.slice(0, MAX_SELECTION)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {selected.size > 0
            ? `${selected.size} selected${
                selected.size >= MAX_SELECTION ? ` (max ${MAX_SELECTION})` : ''
              }`
            : `${completedIds.length} completed game${completedIds.length === 1 ? '' : 's'} available`}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <AtlastiExportHelpDialog />
          <AtlasTiExportButton
            selectedGameIds={Array.from(selected)}
            onExported={clearSelection}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[42px]">
                <Checkbox
                  aria-label="Select all completed games"
                  checked={allCompletedSelected}
                  indeterminate={someCompletedSelected}
                  disabled={completedIds.length === 0}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No games found.
                </TableCell>
              </TableRow>
            ) : (
              games.map((game) => {
                const isCompleted = game.status === 'completed';
                const isChecked = selected.has(game.id);
                const cannotSelect =
                  !isCompleted ||
                  (!isChecked && selected.size >= MAX_SELECTION);
                return (
                  <TableRow key={game.id} data-state={isChecked ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Select game from ${game.user_email}`}
                        checked={isChecked}
                        disabled={cannotSelect}
                        onChange={(e) => toggleOne(game.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/game/${game.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {game.user_email}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {isCompleted ? (
                        <Badge variant="default">Completed</Badge>
                      ) : (
                        <Badge variant="secondary">
                          In Progress ({game.interaction_count} interactions)
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(game.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(game.completed_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <GameRowActions
                        gameId={game.id}
                        questionnaire={game.questionnaire}
                        feedback={game.feedback}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
