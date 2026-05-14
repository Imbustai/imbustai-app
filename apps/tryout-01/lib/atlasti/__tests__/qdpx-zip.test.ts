import { describe, it, expect } from 'vitest';
import { packQdpx, unpackQdpx } from '../qdpx-zip';

describe('packQdpx / unpackQdpx', () => {
  it('round-trips the qde xml and a source file', async () => {
    const qdeXml = '<?xml version="1.0"?><Project name="t"/>';
    const buf = await packQdpx({
      qdeXml,
      textSources: [
        {
          guid: 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA',
          name: 'doc',
          text: 'hello\nworld',
          creationDateTime: '2026-04-28T08:27:55Z',
          modifiedDateTime: '2026-04-28T08:27:55Z',
          selections: [],
        },
      ],
    });

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);

    const { qdeXml: outXml, sources } = await unpackQdpx(buf);
    expect(outXml).toBe(qdeXml);
    expect(sources.get('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA')).toBe('hello\nworld');
  });

  it('writes the qde under the default filename project.qde', async () => {
    const buf = await packQdpx({
      qdeXml: '<a/>',
      textSources: [],
    });
    const JSZip = (await import('jszip')).default;
    const z = await JSZip.loadAsync(buf);
    expect(z.file('project.qde')).not.toBeNull();
  });

  it('preserves utf-8 characters in sources', async () => {
    const ITALIAN = 'però è così\n— davvero';
    const buf = await packQdpx({
      qdeXml: '<a/>',
      textSources: [
        {
          guid: 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB',
          name: 'd',
          text: ITALIAN,
          creationDateTime: '2026-04-28T08:27:55Z',
          modifiedDateTime: '2026-04-28T08:27:55Z',
          selections: [],
        },
      ],
    });
    const { sources } = await unpackQdpx(buf);
    expect(sources.get('BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB')).toBe(ITALIAN);
  });
});
