import type { CodeNode } from './types';

/**
 * Stable user GUID re-used across exports so re-imports in ATLAS.ti merge cleanly.
 * Matches the `creatingUserGuid` from the reference sample.
 */
export const RESEARCHER_USER_GUID = '3259B7CC-0F60-4FE3-95C7-C813D9F61B56';
export const RESEARCHER_USER_NAME = 'Diana Stanciu';
export const ATLAS_USER_GUID = 'C32A2BD5-537F-4838-8B17-DF9EFBAFDF4B';
export const ATLAS_USER_NAME = 'ATLAS.ti';

/**
 * Stable GUIDs for the deterministic role codes. These match the sample so that
 * re-importing on top of an existing project keeps a single canonical code.
 */
export const AI_CODE_GUID = 'B9BE11CE-6543-45F0-BACD-5E318FB31ADC';
export const UMANO_CODE_GUID = '63106DDC-3E7E-4578-9CE9-28ED297E555F';

/**
 * 33 baseline codes extracted verbatim from the reference sample
 * `atlasti-generator-samples/imbustai-sample2-qdpx-uncompressed/imbustai.qde`.
 *
 * Structure: 21 standalone codes + 1 `Emozioni e comportamenti` category that
 * groups 11 nested codes (total = 33 distinct codes, presented as 22 top-level
 * entries because the category itself is also a code in the REFI-QDA model).
 *
 * GUIDs are reused intentionally: identity is preserved across exports, which
 * means quotations applied to "apertura" in one .qdpx still resolve to the same
 * "apertura" in another.
 */
export const BASELINE_CODES: CodeNode[] = [
  {
    guid: 'C6C31265-093C-43D8-8819-37B10EFF75B6',
    name: 'apertura',
    isCodable: true,
    description:
      'Applico questo codice quando qualcuno si apre a qualcosa di nuovo e di diverso',
  },
  {
    guid: '0E0A8847-4828-4DBE-A692-AC8EAAC6D6A4',
    name: 'chiusura',
    isCodable: true,
    description:
      'Applico questo codice quando qualcuno si chiude davanti a qualcosa di nuovo o diverso',
  },
  {
    guid: '8A553ED6-15F3-4031-B938-D84CC29A33F3',
    name: 'dispositivo retorico',
    isCodable: true,
  },
  {
    guid: AI_CODE_GUID,
    name: 'ai',
    isCodable: true,
    description: 'Applico questo codice alle lettere prodotte dall\u2019intelligenza artificiale',
  },
  {
    guid: UMANO_CODE_GUID,
    name: 'umano',
    isCodable: true,
    description: 'Applico questo codice alle lettere prodotte dai partecipanti',
  },
  {
    guid: 'CF1C7CB1-B8EB-48DE-B4AA-D6EC36BC9657',
    name: "Nostalgia: Ricordi d'infanzia",
    isCodable: true,
    description:
      'Applico questo codice quando qualcuno parla di ricordi di quando erano bambini',
  },
  {
    guid: 'E550314D-2F95-49DD-84F9-3899FE609505',
    name: 'Cambiamento nella vita',
    isCodable: true,
    description: 'Applico questo codice quando si parla di cambiamenti di vita',
  },
  {
    guid: '12902A6C-665D-4A36-9C5A-8885629FA637',
    name: 'adattamento sociale',
    isCodable: true,
    description:
      'Applico questo codice quando si accetta qualche tipo di cambiamento sociale',
  },
  {
    guid: '07BC1849-1436-4BE0-80C5-C13634734E30',
    name: 'nostalgia',
    isCodable: true,
    description:
      'Applico questo codice quando ci sono sentimenti nostalgici verso qualcosa di astratto o concreto',
  },
  {
    guid: '642517E9-E152-4E14-AA3C-BA2F62C28420',
    name: 'Comunit\u00e0',
    isCodable: true,
    description:
      'Applico questo codice quando si descrive una comunit\u00e0 in cui si vive e le tradizioni',
  },
  {
    guid: '909455C5-A966-4C20-A73A-E1BB71FB73F1',
    name: 'Riflessione sulla vita',
    isCodable: true,
    description:
      'Applico questo codice quando si fa qualche riflessione sulla propria situazione',
  },
  {
    guid: '18B1608D-0083-42FD-9C50-492D55AE06C6',
    name: "curiosit\u00e0 verso l'altro",
    isCodable: true,
    description:
      'Applico questo codice quando si fanno domande nei riguardi dell\u2019altra persona, per sapere di pi\u00f9 sulla sua vita',
  },
  {
    guid: '317A78F5-A6A1-4546-9F3B-B51ACB000DD5',
    name: 'critica sociale',
    isCodable: true,
    description:
      'Applico questo codice quando ci sono critiche verso la societ\u00e0 e si esprime un giudizio',
  },
  {
    guid: '1FFCCA0E-F889-4691-973A-7AF1B2C54E8A',
    name: 'Emozioni e comportamenti',
    isCodable: true,
    children: [
      {
        guid: '4FED279A-114D-4F13-B793-588135813131',
        name: 'soddisfazione',
        isCodable: true,
        description: 'Applico questo codice quando emerge qualcosa che soddisfa',
      },
      {
        guid: '809B03A6-A699-4BD3-9E98-89A0F5521DEE',
        name: 'affetto',
        isCodable: true,
        description: 'Applico questo codice quando emerge qualche sentimento di affetto',
      },
      {
        guid: '80647555-894C-4F69-B2C5-70E89E3244B8',
        name: 'ironia/sarcasmo',
        isCodable: true,
        description:
          'Applico questo codice quando qualcosa viene detto in maniera sarcastica o ironica',
      },
      {
        guid: '2EFEF56B-75D7-4DCE-B726-F5605FA7C745',
        name: 'tensione',
        isCodable: true,
        description: 'Applico questo codice quando c\u2019\u00e8 un momento di tensione',
      },
      {
        guid: 'FCBC4E08-A6DB-4FF1-9779-4AC0D99CEF54',
        name: 'ansia',
        isCodable: true,
        description: 'Applico questo codice quando emergono ansia o nervosismo',
      },
      {
        guid: 'CDE1306C-412D-4B99-AF9C-C4E99739683C',
        name: 'affetto per gli animali',
        isCodable: true,
        description: 'Applico questo codice quando viene descritto un affetto verso animali',
      },
      {
        guid: '584A87C2-B0EF-45D4-9849-C2FCFFCB8125',
        name: 'indifferenza',
        isCodable: true,
        description:
          'Applico questo codice quando si prende distanza attraverso l\u2019indifferenza',
      },
      {
        guid: '2DD4A5DE-1BF7-41C6-98A1-3C9B027DAA12',
        name: 'resposabilit\u00e0',
        isCodable: true,
        description: 'Applico questo codice quando qualcuno parla di cosa deve fare',
      },
      {
        guid: '13D0A6F3-BC61-4735-B4BC-0AAD0AA79985',
        name: 'empatia',
        isCodable: true,
        description:
          'Applico questo codice quando qualcuno si immedesima nei panni dell\u2019altro',
      },
      {
        guid: 'C1596013-CF42-4BE7-9A1E-2B37904D8950',
        name: 'stress',
        isCodable: true,
        description: 'Applico questo codice quando emerge stress',
      },
      {
        guid: '02DF33D0-16FB-4868-9EEF-BA2CBCE501BC',
        name: 'oppressione',
        isCodable: true,
        description:
          'Applico questo codice quando si parla di qualcosa di opprimente, che non fa esprimere',
      },
    ],
  },
  {
    guid: '7A3E4CCB-5978-4B11-AF26-5A03326794D6',
    name: 'Identit\u00e0',
    isCodable: true,
    description: 'Applico questo codice quando qualcuno parla di chi \u00e8',
  },
  {
    guid: '42D6DE16-ECDD-4F01-9F3A-1B44FEB414B5',
    name: 'riti di passaggio',
    isCodable: true,
    description: 'Applico questo codice quando viene menzionato un rito di passaggio nella vita',
  },
  {
    guid: 'AE552DDE-7E7E-4C20-9699-11ACB1EFDC82',
    name: 'umorismo',
    isCodable: true,
    description:
      'Applico questo codice quando viene fatta una battuta o detto qualcosa in chiave ironica o scherzosa',
  },
  {
    guid: '33CBE847-9452-403C-8D00-B0095865AACD',
    name: 'Relazioni',
    isCodable: true,
    description:
      'Applico questo codice quando si parla di una relazione con una persona o animale o cosa',
  },
  {
    guid: '0BD18CC1-3AF4-4287-ABF5-684229545B16',
    name: 'supporto',
    isCodable: true,
    description:
      'Applico questo codice quando qualcuno supporta l\u2019altro cercando di tirarlo su di morale ad esempio',
  },
  {
    guid: '56C41C77-B554-4432-A925-EA23EA736866',
    name: 'critica verso il singolo',
    isCodable: true,
    description:
      'Applico questo codice quando viene mossa una critica verso un singolo e non verso la comunit\u00e0',
  },
  {
    guid: '8BE0E228-41BB-4F7B-A479-29BE4EB89CE5',
    name: 'Decisione',
    isCodable: true,
    description: 'Applico questo codice quando viene presa una decisione',
  },
  {
    guid: 'D6A968EF-5792-4F4D-8456-82E37C3E4FF9',
    name: 'distanza dai voleri della comunit\u00e0',
    isCodable: true,
    description: 'Applico questo codice quando qualcuno fa qualcosa che va contro alla comunit\u00e0',
  },
];

/** Flat list (depth-first) of every code in the baseline, useful for prompt + lookup. */
export function flattenCodes(roots: CodeNode[] = BASELINE_CODES): CodeNode[] {
  const out: CodeNode[] = [];
  const walk = (n: CodeNode) => {
    out.push(n);
    if (n.children) for (const c of n.children) walk(c);
  };
  for (const r of roots) walk(r);
  return out;
}

/** name → GUID lookup over the baseline codebook (case-insensitive). */
export function buildCodeNameIndex(roots: CodeNode[] = BASELINE_CODES): Map<string, string> {
  const idx = new Map<string, string>();
  for (const c of flattenCodes(roots)) {
    idx.set(c.name.toLowerCase(), c.guid);
  }
  return idx;
}
