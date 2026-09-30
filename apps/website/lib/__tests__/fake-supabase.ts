import { randomUUID } from 'node:crypto';

// An in-memory stand-in for the Supabase admin client, covering the query
// shapes the reply workflow uses: select/insert/update/delete with eq, neq,
// gt, order, limit, single and maybeSingle. Rows get an id and timestamps.

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

class Query implements PromiseLike<{ data: unknown; error: { message: string } | null }> {
  private filters: Filter[] = [];
  private sort?: { column: string; ascending: boolean };
  private max?: number;
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: Row[] = [];
  private patch: Row = {};
  private selectAfterWrite = false;

  constructor(private readonly rows: Row[]) {}

  select(_columns?: string) {
    if (this.op !== 'select') this.selectAfterWrite = true;
    return this;
  }
  insert(values: Row | Row[]) {
    this.op = 'insert';
    const now = new Date().toISOString();
    this.payload = (Array.isArray(values) ? values : [values]).map((v) => ({
      id: randomUUID(),
      created_at: now,
      updated_at: now,
      ...v,
    }));
    return this;
  }
  update(patch: Row) {
    this.op = 'update';
    this.patch = patch;
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push((r) => r[column] === value);
    return this;
  }
  neq(column: string, value: unknown) {
    this.filters.push((r) => r[column] !== value);
    return this;
  }
  gt(column: string, value: unknown) {
    this.filters.push((r) => r[column] != null && String(r[column]) > String(value));
    return this;
  }
  order(column: string, opts: { ascending?: boolean } = {}) {
    this.sort = { column, ascending: opts.ascending ?? true };
    return this;
  }
  limit(n: number) {
    this.max = n;
    return this;
  }
  async single() {
    const { data, error } = await this.run();
    const rows = data as Row[];
    if (error) return { data: null, error };
    if (rows.length !== 1) return { data: null, error: { message: `expected 1 row, got ${rows.length}` } };
    return { data: rows[0], error: null };
  }
  async maybeSingle() {
    const { data, error } = await this.run();
    const rows = data as Row[];
    if (error) return { data: null, error };
    if (rows.length > 1) return { data: null, error: { message: `expected ≤1 row, got ${rows.length}` } };
    return { data: rows[0] ?? null, error: null };
  }
  then<T1, T2>(
    onfulfilled?: (value: { data: unknown; error: { message: string } | null }) => T1 | PromiseLike<T1>,
    onrejected?: (reason: unknown) => T2 | PromiseLike<T2>,
  ): PromiseLike<T1 | T2> {
    return this.run().then(onfulfilled, onrejected);
  }

  private matching(): Row[] {
    let rows = this.rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.sort) {
      const { column, ascending } = this.sort;
      rows = [...rows].sort((a, b) => {
        const [x, y] = [a[column], b[column]] as [number | string, number | string];
        return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1);
      });
    }
    return this.max === undefined ? rows : rows.slice(0, this.max);
  }

  private async run(): Promise<{ data: unknown; error: { message: string } | null }> {
    const clone = (rows: Row[]) => rows.map((r) => structuredClone(r));
    switch (this.op) {
      case 'select':
        return { data: clone(this.matching()), error: null };
      case 'insert':
        this.rows.push(...this.payload);
        return { data: this.selectAfterWrite ? clone(this.payload) : null, error: null };
      case 'update': {
        const rows = this.matching();
        for (const r of rows) Object.assign(r, structuredClone(this.patch));
        return { data: this.selectAfterWrite ? clone(rows) : null, error: null };
      }
      case 'delete': {
        const doomed = new Set(this.matching());
        const kept = this.rows.filter((r) => !doomed.has(r));
        this.rows.splice(0, this.rows.length, ...kept);
        return { data: null, error: null };
      }
    }
  }
}

export class FakeSupabase {
  readonly tables = new Map<string, Row[]>();

  table(name: string): Row[] {
    let rows = this.tables.get(name);
    if (!rows) this.tables.set(name, (rows = []));
    return rows;
  }

  from(name: string) {
    return new Query(this.table(name));
  }
}
