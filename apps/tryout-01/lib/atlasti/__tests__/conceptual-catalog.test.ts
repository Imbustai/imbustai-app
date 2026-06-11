import { describe, it, expect } from 'vitest';
import conceptualCatalogJson from '../codici_tesi_atlasti.json';
import {
  buildConceptualCodeIndex,
  listConceptualCodeNames,
  type ConceptualCatalog,
} from '../conceptual-catalog';

const CATALOG = conceptualCatalogJson as ConceptualCatalog;

describe('conceptual-catalog', () => {
  it('indexes all suggested code_name values', () => {
    const idx = buildConceptualCodeIndex(CATALOG);
    expect(idx.size).toBeGreaterThan(20);
    expect(idx.get('relativizzazione culturale')?.name).toBe('Relativizzazione culturale');
  });

  it('lists unique sorted names', () => {
    const names = listConceptualCodeNames(CATALOG);
    expect(names).toContain('Confine negoziato');
    expect(names.length).toBe(new Set(names).size);
  });
});
