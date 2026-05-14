import { create } from 'xmlbuilder2';
import { v4 as uuidv4 } from 'uuid';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import type { CodeNode, QdaProject } from './types';
import { RESEARCHER_USER_GUID } from './codebook';

const NS_PROJECT = 'urn:QDA-XML:project:1.0';
const NS_XSI = 'http://www.w3.org/2001/XMLSchema-instance';
const SCHEMA_LOCATION =
  'urn:QDA-XML:project:1.0 http://schema.qdasoftware.org/versions/Project/v1.0/Project.xsd';
const ORIGIN = 'imbustai-monorepo (REFI-QDA exporter)';

/**
 * Walks the codebook depth-first and emits `<Code …>` / `<Code …><Code …/></Code>`
 * with `<Description>` when present. Mirrors the sample layout exactly.
 */
function emitCode(parent: XMLBuilder, code: CodeNode): void {
  const el = parent.ele('Code', {
    guid: code.guid,
    name: code.name,
    isCodable: code.isCodable ? 'true' : 'false',
  });
  if (code.description) {
    el.ele('Description').txt(code.description);
  }
  if (code.children) {
    for (const child of code.children) emitCode(el, child);
  }
}

/**
 * Builds the `project.qde` XML for the given project. Output is deterministic
 * given identical input (no implicit `new Date()` calls), enabling golden
 * snapshot tests.
 */
export function buildQdeXml(project: QdaProject): string {
  const doc = create({ version: '1.0', encoding: 'utf-8', standalone: true });
  const root = doc.ele(NS_PROJECT, 'Project', {
    'xmlns:xsi': NS_XSI,
    origin: ORIGIN,
    creatingUserGUID: project.creatingUserGuid,
    modifyingUserGUID: project.modifyingUserGuid,
    creationDateTime: project.creationDateTime,
    modifiedDateTime: project.modifiedDateTime,
    name: project.name,
    'xsi:schemaLocation': SCHEMA_LOCATION,
  });

  const users = root.ele('Users');
  for (const u of project.users) {
    users.ele('User', { guid: u.guid, name: u.name });
  }

  const codeBook = root.ele('CodeBook');
  const codes = codeBook.ele('Codes');
  for (const c of project.codes) emitCode(codes, c);

  if (project.sources.length > 0) {
    const sources = root.ele('Sources');
    for (const src of project.sources) {
      const ts = sources.ele('TextSource', {
        plainTextPath: `internal://${src.guid}.txt`,
        creatingUser: project.creatingUserGuid,
        creationDateTime: src.creationDateTime,
        modifyingUser: project.modifyingUserGuid,
        modifiedDateTime: src.modifiedDateTime,
        guid: src.guid,
        name: src.name,
      });
      for (const sel of src.selections) {
        const psel = ts.ele('PlainTextSelection', {
          guid: sel.guid,
          name: sel.name,
          startPosition: String(sel.startPosition),
          endPosition: String(sel.endPosition),
          creatingUser: project.creatingUserGuid,
          creationDateTime: src.creationDateTime,
          modifyingUser: project.modifyingUserGuid,
          modifiedDateTime: src.modifiedDateTime,
        });
        for (const codeGuid of sel.codeGuids) {
          const coding = psel.ele('Coding', {
            guid: uuidv4().toUpperCase(),
            creatingUser: project.creatingUserGuid,
            creationDateTime: src.creationDateTime,
          });
          coding.ele('CodeRef', { targetGUID: codeGuid });
        }
      }
    }
  }

  return doc.end({ prettyPrint: false });
}

/** Convenience factory used by the orchestrator and tests. */
export function emptyProject(now: string = new Date().toISOString()): QdaProject {
  return {
    name: 'imbustai',
    creationDateTime: now,
    modifiedDateTime: now,
    creatingUserGuid: RESEARCHER_USER_GUID,
    modifyingUserGuid: RESEARCHER_USER_GUID,
    users: [],
    codes: [],
    sources: [],
  };
}
