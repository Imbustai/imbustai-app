import JSZip from 'jszip';
import type { TextSourceDoc } from './types';

export interface QdpxPackInput {
  qdeXml: string;
  textSources: TextSourceDoc[];
  /** Name used as the inner XML filename. ATLAS.ti expects `project.qde`. */
  qdeFileName?: string;
}

/**
 * Pack the QDE XML + plain text sources into a REFI-QDA `.qdpx` (zip) buffer.
 *
 * Layout:
 *   project.qde
 *   sources/<guid>.txt
 */
export async function packQdpx(input: QdpxPackInput): Promise<Buffer> {
  const zip = new JSZip();
  const qdeName = input.qdeFileName ?? 'project.qde';
  zip.file(qdeName, input.qdeXml);

  const sources = zip.folder('sources');
  if (!sources) throw new Error('Failed to create sources/ folder in zip');

  for (const src of input.textSources) {
    sources.file(`${src.guid}.txt`, src.text);
  }

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/** Roundtrip helper for tests: returns the QDE XML and a map of sources. */
export async function unpackQdpx(
  buf: Buffer
): Promise<{ qdeXml: string; sources: Map<string, string> }> {
  const zip = await JSZip.loadAsync(buf);
  const sources = new Map<string, string>();
  let qdeXml = '';

  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (name.endsWith('.qde')) {
      qdeXml = await entry.async('string');
    } else if (name.startsWith('sources/')) {
      const guid = name.slice('sources/'.length).replace(/\.txt$/, '');
      sources.set(guid, await entry.async('string'));
    }
  }
  return { qdeXml, sources };
}
