#!/usr/bin/env tsx
/**
 * Extracts human-coded few-shot examples from the reference REFI-QDA sample at
 * `atlasti-generator-samples/imbustai-sample2-qdpx-uncompressed/` and writes
 * `apps/tryout-01/lib/atlasti/sample-fewshots.json`.
 *
 * The output is committed to the repo and embedded in Claude's system prompt as
 * the PRIMARY grounding signal: real human-coded annotations on the same kind
 * of material (imbustai epistolary exchanges).
 *
 * Run with:
 *   pnpm tsx apps/tryout-01/lib/atlasti/scripts/extract-sample-fewshots.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import type { SampleFewshot } from '../types';

const REPO_ROOT = resolve(__dirname, '../../../../..');
const SAMPLE_DIR = resolve(
  REPO_ROOT,
  'atlasti-generator-samples/imbustai-sample2-qdpx-uncompressed'
);
const QDE_PATH = resolve(SAMPLE_DIR, 'imbustai.qde');
const OUT_PATH = resolve(__dirname, '..', 'sample-fewshots.json');

/** Documents the user manually annotated. */
const HUMAN_CODED_DOCS = new Set(['12 f', '13 f']);

interface Code {
  guid: string;
  name: string;
}

interface PlainTextSelection {
  startPosition: number;
  endPosition: number;
  codeGuids: string[];
}

function ensureArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function walkCodes(node: any, out: Map<string, Code>): void {
  if (!node) return;
  const codes = ensureArray<any>(node.Code);
  for (const c of codes) {
    const guid = c['@_guid'];
    const name = c['@_name'];
    if (guid && name) out.set(guid, { guid, name });
    if (c.Code) walkCodes(c, out);
  }
}

function main(): void {
  const xml = readFileSync(QDE_PATH, 'utf-8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseAttributeValue: false,
    isArray: (name) =>
      ['Code', 'TextSource', 'PlainTextSelection', 'Coding', 'CodeRef', 'User'].includes(name),
  });
  const doc = parser.parse(xml);
  const project = doc.Project;

  const codeBook = project.CodeBook;
  const codesIndex = new Map<string, Code>();
  walkCodes(codeBook?.Codes, codesIndex);

  const sources = ensureArray<any>(project.Sources?.TextSource);
  const fewshots: SampleFewshot[] = [];

  for (const src of sources) {
    const name = src['@_name'];
    if (!HUMAN_CODED_DOCS.has(name)) continue;

    const plainTextPath: string = src['@_plainTextPath'];
    const fileGuid = plainTextPath.replace(/^internal:\/\//, '').replace(/\.txt$/, '');
    const txtPath = resolve(SAMPLE_DIR, 'sources', `${fileGuid}.txt`);
    const fullText = readFileSync(txtPath, 'utf-8');

    const selections = ensureArray<any>(src.PlainTextSelection);
    for (const sel of selections) {
      const startPosition = Number(sel['@_startPosition']);
      const endPosition = Number(sel['@_endPosition']);

      const codings = ensureArray<any>(sel.Coding);
      const codeGuids: string[] = [];
      for (const coding of codings) {
        const refs = ensureArray<any>(coding.CodeRef);
        for (const ref of refs) {
          const g = ref['@_targetGUID'];
          if (g) codeGuids.push(g);
        }
      }

      const quoteText = fullText.slice(startPosition, endPosition);
      const codeNames = codeGuids
        .map((g) => codesIndex.get(g)?.name)
        .filter((n): n is string => Boolean(n));

      if (!quoteText.trim() || codeNames.length === 0) continue;

      fewshots.push({ doc: name, quoteText, codeNames });
    }
  }

  // Stable order: by doc, then by occurrence in text (already preserved).
  fewshots.sort((a, b) => (a.doc < b.doc ? -1 : a.doc > b.doc ? 1 : 0));

  writeFileSync(OUT_PATH, JSON.stringify(fewshots, null, 2) + '\n', 'utf-8');
  console.log(
    `Wrote ${fewshots.length} fewshots to ${OUT_PATH} (codes referenced: ${
      new Set(fewshots.flatMap((f) => f.codeNames)).size
    })`
  );
}

main();
