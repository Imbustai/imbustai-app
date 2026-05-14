import { v4 as uuidv4 } from 'uuid';
import {
  AI_CODE_GUID,
  ATLAS_USER_GUID,
  ATLAS_USER_NAME,
  BASELINE_CODES,
  RESEARCHER_USER_GUID,
  RESEARCHER_USER_NAME,
  UMANO_CODE_GUID,
} from './codebook';
import { buildGameText, quotePreview } from './text-builder';
import { buildQdeXml } from './qde-writer';
import { packQdpx } from './qdpx-zip';
import { analyzeGame, type ClaudeCoderDeps } from './claude-coder';
import type {
  CodeNode,
  CodingSelection,
  GameInput,
  QdaProject,
  TextSourceDoc,
} from './types';

export interface GenerateQdpxOptions {
  projectName?: string;
  /** ISO datetime used for `creationDateTime` / `modifiedDateTime`. */
  now?: string;
  /** Cap concurrent Claude calls. */
  concurrency?: number;
  /** Hard cap on number of games processed (additional games are skipped). */
  maxGames?: number;
  /** Injected dependencies for Claude. Tests use this to stub the SDK. */
  claudeDeps?: ClaudeCoderDeps;
  /** Skip Claude entirely (only emit deterministic ai/umano codings). */
  skipClaude?: boolean;
  /** Optional progress callback fired after each game completes. */
  onProgress?: (event: { gameId: string; index: number; total: number; ok: boolean; error?: string }) => void;
}

export interface GenerateQdpxResult {
  buffer: Buffer;
  filename: string;
  /** Per-game summary, useful for logging on the server. */
  summary: Array<{
    gameId: string;
    sourceGuid: string;
    deterministicCodings: number;
    claudeCodings: number;
    newCodes: string[];
    error?: string;
  }>;
}

/**
 * Build a TextSource for a single game with deterministic ai/umano codings on
 * each letter body (header excluded).
 */
function buildSourceForGame(
  game: GameInput,
  now: string
): {
  source: TextSourceDoc;
  text: string;
  // Re-exposed so the orchestrator can hand them to Claude.
  letters: ReturnType<typeof buildGameText>['letters'];
} {
  const { text, letters } = buildGameText(game);
  const sourceGuid = uuidv4().toUpperCase();

  const deterministic: CodingSelection[] = letters.map((l) => {
    const codeGuid = l.role === 'ai' ? AI_CODE_GUID : UMANO_CODE_GUID;
    const preview = quotePreview(text.slice(l.headerEnd, l.endPosition));
    return {
      guid: uuidv4().toUpperCase(),
      startPosition: l.headerEnd,
      endPosition: l.endPosition,
      name: preview,
      codeGuids: [codeGuid],
    };
  });

  return {
    text,
    letters,
    source: {
      guid: sourceGuid,
      name: `Game ${shortId(game.id)} \u2014 ${game.userEmail}`,
      text,
      creationDateTime: game.createdAt || now,
      modifiedDateTime: game.completedAt || now,
      selections: deterministic,
    },
  };
}

function shortId(guid: string): string {
  return guid.split('-')[0].toLowerCase();
}

/** Simple promise pool with bounded concurrency. */
async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers: Promise<void>[] = [];
  const n = Math.max(1, Math.min(concurrency, items.length));
  for (let k = 0; k < n; k++) {
    workers.push(
      (async () => {
        while (true) {
          const i = cursor++;
          if (i >= items.length) return;
          results[i] = await worker(items[i], i);
        }
      })()
    );
  }
  await Promise.all(workers);
  return results;
}

/**
 * Orchestrator entrypoint: given a list of completed games, produce a single
 * REFI-QDA `.qdpx` zip ready for ATLAS.ti's `File → Import Project` action.
 */
export async function generateQdpxForGames(
  games: GameInput[],
  opts: GenerateQdpxOptions = {}
): Promise<GenerateQdpxResult> {
  const now = opts.now ?? new Date().toISOString();
  const maxGames = opts.maxGames ?? 10;
  const concurrency = opts.concurrency ?? 2;
  const projectName = opts.projectName ?? 'imbustai';

  const accepted = games.slice(0, maxGames);

  // Phase 1 (serial, fast): build text + deterministic codings.
  const phaseA = accepted.map((g) => buildSourceForGame(g, now));

  // Phase 2 (concurrent): call Claude for each game.
  const claudeOutputs = await runWithConcurrency(
    phaseA,
    async (item, idx) => {
      const game = accepted[idx];
      try {
        if (opts.skipClaude) {
          return { selections: [], newCodes: [] as CodeNode[], error: undefined as string | undefined };
        }
        const result = await analyzeGame(
          { game, text: item.text, letters: item.letters },
          opts.claudeDeps
        );
        return { selections: result.selections, newCodes: result.newCodes, error: undefined as string | undefined };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { selections: [] as CodingSelection[], newCodes: [] as CodeNode[], error: message };
      } finally {
        opts.onProgress?.({
          gameId: game.id,
          index: idx + 1,
          total: phaseA.length,
          ok: true,
        });
      }
    },
    concurrency
  );

  // Phase 3: merge new codes (dedup by lowercase name), apply Claude codings.
  const newCodesByName = new Map<string, CodeNode>();
  const summary: GenerateQdpxResult['summary'] = [];
  const sources: TextSourceDoc[] = [];

  for (let i = 0; i < phaseA.length; i++) {
    const item = phaseA[i];
    const game = accepted[i];
    const claude = claudeOutputs[i];
    const newCodesFromGame: string[] = [];

    for (const nc of claude.newCodes) {
      const key = nc.name.toLowerCase();
      const existing = newCodesByName.get(key);
      if (existing) {
        // Re-key any selections in this game from the duplicate guid → existing guid.
        for (const sel of claude.selections) {
          sel.codeGuids = sel.codeGuids.map((g) => (g === nc.guid ? existing.guid : g));
        }
      } else {
        newCodesByName.set(key, nc);
        newCodesFromGame.push(nc.name);
      }
    }

    item.source.selections.push(...claude.selections);
    sources.push(item.source);

    summary.push({
      gameId: game.id,
      sourceGuid: item.source.guid,
      deterministicCodings: item.source.selections.length - claude.selections.length,
      claudeCodings: claude.selections.length,
      newCodes: newCodesFromGame,
      error: claude.error,
    });
  }

  const codes: CodeNode[] = [...BASELINE_CODES, ...newCodesByName.values()];

  const project: QdaProject = {
    name: projectName,
    creationDateTime: now,
    modifiedDateTime: now,
    creatingUserGuid: RESEARCHER_USER_GUID,
    modifyingUserGuid: RESEARCHER_USER_GUID,
    users: [
      { guid: ATLAS_USER_GUID, name: ATLAS_USER_NAME },
      { guid: RESEARCHER_USER_GUID, name: RESEARCHER_USER_NAME },
    ],
    codes,
    sources,
  };

  const qdeXml = buildQdeXml(project);
  const buffer = await packQdpx({ qdeXml, textSources: sources });
  const ts = (opts.now ?? new Date().toISOString()).replace(/[:.]/g, '-');
  const filename = `imbustai-${ts}.qdpx`;

  return { buffer, filename, summary };
}

export * from './types';
export { BASELINE_CODES, AI_CODE_GUID, UMANO_CODE_GUID } from './codebook';
export { buildGameText } from './text-builder';
export { buildQdeXml } from './qde-writer';
export { packQdpx, unpackQdpx } from './qdpx-zip';
export { analyzeGame, buildClaudePrompt } from './claude-coder';
