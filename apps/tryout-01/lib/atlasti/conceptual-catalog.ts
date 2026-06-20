/**
 * Helpers for `codici_tesi_atlasti.json` — thesis-level conceptual codes used
 * alongside the baseline ATLAS.ti codebook.
 */

export interface ConceptualCodeEntry {
  code_name: string;
  description: string | null;
}

export interface ConceptualConcept {
  concept: string;
  parent_concept?: string;
  theoretical_references?: string | null;
  description?: string;
  suggested_or_possible_codes: ConceptualCodeEntry[];
}

export type ConceptualCatalog = ConceptualConcept[];

export interface ConceptualCodeMeta {
  /** Canonical name as stored in the catalog (case-sensitive). */
  name: string;
  description: string;
  concept: string;
}

/** Case-insensitive lookup: normalized name → catalog metadata. */
export function buildConceptualCodeIndex(
  catalog: ConceptualCatalog
): Map<string, ConceptualCodeMeta> {
  const idx = new Map<string, ConceptualCodeMeta>();
  for (const concept of catalog) {
    for (const entry of concept.suggested_or_possible_codes ?? []) {
      const name = entry.code_name?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (idx.has(key)) continue;
      const desc =
        entry.description?.trim() ||
        concept.description?.trim() ||
        `Codice concettuale — ${concept.concept}`;
      idx.set(key, { name, description: desc, concept: concept.concept });
    }
  }
  return idx;
}

/** Flat list of allowed `conceptualCodeNames` values (for prompt checklists). */
export function listConceptualCodeNames(catalog: ConceptualCatalog): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const meta of buildConceptualCodeIndex(catalog).values()) {
    if (!seen.has(meta.name)) {
      seen.add(meta.name);
      names.push(meta.name);
    }
  }
  return names.sort((a, b) => a.localeCompare(b, 'it'));
}
