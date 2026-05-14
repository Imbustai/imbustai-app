import { describe, it, expect } from 'vitest';
import { buildQdeXml, emptyProject } from '../qde-writer';
import {
  AI_CODE_GUID,
  BASELINE_CODES,
  RESEARCHER_USER_GUID,
  RESEARCHER_USER_NAME,
  UMANO_CODE_GUID,
} from '../codebook';

describe('buildQdeXml', () => {
  it('emits the REFI-QDA namespace and required root attributes', () => {
    const xml = buildQdeXml({
      ...emptyProject('2026-04-28T08:27:55Z'),
      users: [{ guid: RESEARCHER_USER_GUID, name: RESEARCHER_USER_NAME }],
      codes: BASELINE_CODES,
    });

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="utf-8" standalone="yes"\?>/);
    expect(xml).toContain('xmlns="urn:QDA-XML:project:1.0"');
    expect(xml).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
    expect(xml).toContain('xsi:schemaLocation="urn:QDA-XML:project:1.0');
    expect(xml).toContain(`creatingUserGUID="${RESEARCHER_USER_GUID}"`);
    expect(xml).toContain(`modifyingUserGUID="${RESEARCHER_USER_GUID}"`);
  });

  it('reuses the sample GUIDs for the ai and umano codes', () => {
    const xml = buildQdeXml({
      ...emptyProject('2026-04-28T08:27:55Z'),
      codes: BASELINE_CODES,
    });
    expect(xml).toContain(`guid="${AI_CODE_GUID}" name="ai"`);
    expect(xml).toContain(`guid="${UMANO_CODE_GUID}" name="umano"`);
  });

  it('nests codes when a category contains children', () => {
    const xml = buildQdeXml({
      ...emptyProject('2026-04-28T08:27:55Z'),
      codes: BASELINE_CODES,
    });
    expect(xml).toContain(
      '<Code guid="1FFCCA0E-F889-4691-973A-7AF1B2C54E8A" name="Emozioni e comportamenti"'
    );
    expect(xml).toMatch(
      /<Code guid="1FFCCA0E-F889-4691-973A-7AF1B2C54E8A"[^>]*>[\s\S]*<Code guid="4FED279A-114D-4F13-B793-588135813131" name="soddisfazione"/
    );
  });

  it('emits TextSource with PlainTextSelection + Coding/CodeRef', () => {
    const xml = buildQdeXml({
      ...emptyProject('2026-04-28T08:27:55Z'),
      users: [{ guid: RESEARCHER_USER_GUID, name: RESEARCHER_USER_NAME }],
      codes: BASELINE_CODES,
      sources: [
        {
          guid: 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA',
          name: 'Game abc — alice@example.com',
          text: 'hello world',
          creationDateTime: '2026-04-28T08:27:55Z',
          modifiedDateTime: '2026-04-28T08:27:55Z',
          selections: [
            {
              guid: 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB',
              startPosition: 0,
              endPosition: 5,
              name: 'hello',
              codeGuids: [AI_CODE_GUID],
            },
          ],
        },
      ],
    });

    expect(xml).toContain(
      'plainTextPath="internal://AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA.txt"'
    );
    expect(xml).toContain('startPosition="0"');
    expect(xml).toContain('endPosition="5"');
    expect(xml).toContain(`<CodeRef targetGUID="${AI_CODE_GUID}"`);
  });

  it('is deterministic for identical inputs apart from generated Coding GUIDs', () => {
    const project = {
      ...emptyProject('2026-04-28T08:27:55Z'),
      codes: BASELINE_CODES,
    };
    const a = buildQdeXml(project);
    const b = buildQdeXml(project);
    expect(a).toBe(b);
  });
});
