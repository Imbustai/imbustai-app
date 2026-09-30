import { z } from 'zod';

// The Voss Story document: everything narrative engine-voss plays, as one
// versioned JSON document (ADR 0001). Code holds the mechanics; this holds
// the cast, what each Character knows, the case file, the offices and their
// documents, the clues and their schedule, the evidence, the numeric gates
// and the Endings. Italian content, English keys.
//
// Sources, all approved on the map (Imbustai/imbustai-app#9): the case file
// (#19), the eight Turns and the Endings (#26, §11 is the compact spec), the
// Voss dossier (#22), Adelaide (#23), the opening envelope (#24) and the one
// real Voss Turn (#25).

export const STORY_SCHEMA_VERSION = 1;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const slug = z.string().regex(/^[a-z][a-z0-9_]*$/, 'expected a lowercase slug');
/** Markdown, never empty. */
const md = z.string().trim().min(1);
const batch = z.number().int().min(0).max(8);
const turn = z.number().int().min(1).max(8);

// ─── The calendar ───────────────────────────────────────────────────────────

const turnRowSchema = z.object({
  turn,
  /** The date on the Player's Letters of this Turn. */
  playerDate: isoDate,
  /** When those Letters reach Rome. */
  arrivesRome: isoDate,
  /** The date batch N bears, about (Characters who answer at once). */
  batchDate: isoDate,
  /** When the Player reads batch N, i.e. writes Turn N+1; null after the last Turn. */
  readDate: isoDate.nullable(),
});

const fixedEventSchema = z.object({
  key: slug,
  date: isoDate,
  /** The batch it falls after (it happens between batch N and the Player reading it). */
  afterBatch: batch,
  what: md,
});

const calendarSchema = z.object({
  /** Voss's first Letter, the opening envelope. */
  openingDate: isoDate,
  /** When the Player opens the envelope. */
  envelopeReadDate: isoDate,
  turns: z.array(turnRowSchema).length(8),
  /** Days a Letter takes each way between Rome and Lipari. */
  mailDays: z.number().int().positive(),
  /** A Character who answers at once dates the reply D_N + min…max days. */
  prompt: z.object({ minDays: z.number().int(), maxDays: z.number().int() }),
  events: z.array(fixedEventSchema),
  /** Turns the Engine counts to but the Player never sees. */
  deadlines: z.object({
    /** Last Turn whose Letter to the Procura can bring a search before 17 Dec. */
    search: turn,
    /** Last Turn whose Letter reaches Rome before 17 Dec (stakeout, a ladder step). */
    stakeout: turn,
    /** Last Turn in which the Panorama operation can be deduced. */
    panoramaDeduction: turn,
  }),
});

// ─── Plot keys and the collision check ──────────────────────────────────────

const plotKeySchema = z.object({
  key: slug,
  /** The fixed fact, in Italian. */
  fact: md,
});

/**
 * A Plot-key name, street or object. A Letter that uses one is a collision
 * (Texture planting a false clue) unless its sender is allowed it, or the
 * Player has already written it.
 */
const reservedTermSchema = z.object({
  /** Matched case-insensitively on word boundaries. */
  patterns: z.array(z.string().min(2)).min(1),
  kind: z.enum(['person', 'street', 'place', 'object']),
  /** Why it is reserved: the Plot key it belongs to. */
  plotKey: slug,
  /** Correspondents who know it and may write it. */
  allowedFor: z.array(slug),
});

// ─── Characters ─────────────────────────────────────────────────────────────

const exampleLetterSchema = z.object({
  key: slug,
  /** What the Lead had written, so the example reads as a reply. */
  context: md,
  /** The Letter, with its clues stripped. */
  text: md,
});

const signatureSchema = z.object({
  key: slug,
  name: z.string().min(1),
  /** How it shows up in ordinary Letters, and how often. */
  ordinary: md,
  /** The showpiece, used at most once per Story; when it may come is mechanics. */
  showpiece: md,
});

/** Knowledge a Character gains during the Game, appended to its view when earned. */
const knowledgeUnlockSchema = z.object({
  key: slug,
  /** What earns it (an event, the Lead's Letter, a reveal), for the mechanics and the reader. */
  when: md,
  text: md,
});

const officeSchema = z.object({
  /** Office time in weeks, on top of a week of post each way; 0 = answers in the same Turn. */
  replyWeeks: z.number().int().min(0).max(4),
  /** Documents it holds, by key. Its sheet never lists anything else. */
  holds: z.array(slug),
  /** What it can do besides sending documents (a search, a stakeout). */
  actions: z.array(md).default([]),
  /** Where it sends a request that is not its own, «per competenza». */
  forwardsTo: slug.nullable(),
});

const correspondentSchema = z.object({
  slug,
  name: z.string().min(1),
  role: z.string().min(1),
  address: z.string().min(1),
  kind: z.enum(['person', 'office', 'newspaper']),
  /** The model role that writes it: Characters are `writer`, offices `clerk`. */
  writer: z.enum(['writer', 'clerk']).nullable(),
  /** Whether the Player can write to it from the opening envelope. */
  contactableFromStart: z.boolean(),
  /**
   * The writer view: the cached prefix of every Letter it writes. Only what
   * it knows — no ladder answers, nothing scheduled for later Turns.
   */
  writerView: md.nullable(),
  /** The Lead as this correspondent knows him. */
  leadView: md.nullable(),
  /** The voice section alone, for the Italian editing pass. */
  voice: md.nullable(),
  examples: z.array(exampleLetterSchema).default([]),
  signatures: z.array(signatureSchema).default([]),
  unlocks: z.array(knowledgeUnlockSchema).default([]),
  /** Words per Letter; null = no cap (Voss). */
  length: z.object({ min: z.number().int(), max: z.number().int() }).nullable(),
  office: officeSchema.nullable(),
});

const leadSchema = z.object({
  slug,
  name: z.string().min(1),
  role: z.string().min(1),
  address: z.string().min(1),
  /**
   * The Lead sheet, for the reader and the checker. Writers get their own
   * correspondent's `leadView` instead: Adelaide knows less than Voss.
   */
  sheet: md,
});

// ─── Offices' documents ─────────────────────────────────────────────────────

const documentSchema = z.object({
  key: slug,
  holder: slug,
  title: z.string().min(1),
  /**
   * What a request must carry to get it: any one of these sets of request
   * keys, all keys of the set. Empty = any request about the matter.
   */
  requires: z.array(z.array(slug).min(1)),
  /** The document does not exist before this date (a crime-scene report). */
  availableFrom: isoDate.nullable(),
  /** The evidence it is, if any. */
  evidence: z.string().regex(/^P\d+$/).nullable(),
  /** Clues it carries. */
  clues: z.array(z.string().regex(/^[KI]\d+$/)).default([]),
  /** The Enclosure body, fixed Story text; the clerk lists it, never copies it. */
  text: md,
});

const requestKeySchema = z.object({
  key: slug,
  /** What the Lead's Letter must contain, for the reader. */
  means: md,
});

// ─── Clues, evidence ────────────────────────────────────────────────────────

const clueSchema = z.object({
  key: z.string().regex(/^K\d+$/),
  clue: md,
  from: z.array(slug).min(1),
  /** First batch it may appear in; null = only on request. */
  firstBatch: batch.nullable(),
  /** How it comes back when ignored or misread, from another side. */
  reapproach: z.array(z.object({ batch: batch.nullable(), how: md })),
  understoodWhen: md,
  unlocks: md.nullable(),
});

const panoramaClueSchema = z.object({
  key: z.string().regex(/^I\d+$/),
  clue: md,
  /** The latest batch it arrives in; null = only on request. */
  latestBatch: batch.nullable(),
});

const aldoThreadSchema = z.object({
  batch,
  clue: md,
  /** A suggested bridge, only a hint for the writer. */
  bridge: md,
});

const evidenceSchema = z.object({
  key: z.string().regex(/^P\d+$/),
  name: md,
  weight: z.number().int().min(0),
  /** Weight when Voss is dead (P8 only). */
  weightIfVossDead: z.number().int().min(0).nullable(),
  /** Which of the 1987 murders it proves on its own. */
  proves: z.array(z.enum(['cortesi', 'ferri', 'benvenuti', 'voss'])),
  howObtained: md,
  note: md.nullable(),
});

/** Worth no points but shaping the verdict or the PM's Letter (the bulb, Mario). */
const circumstanceSchema = z.object({
  key: slug,
  name: md,
  effect: md,
});

// ─── Voss's state: trust, layers, ladders, doors ────────────────────────────

const trustSchema = z.object({
  min: z.number().int(),
  max: z.number().int(),
  start: z.number().int(),
  medium: z.number().int(),
  high: z.number().int(),
  maxGainPerTurn: z.number().int(),
  rules: z.array(
    z.object({
      key: slug,
      /** The question the reader answers about each of the Lead's Letters to Voss. */
      question: md,
      delta: z.number().int(),
      /** A cold Turn follows (the accusation). */
      coldTurn: z.boolean().default(false),
    }),
  ),
  coldTurn: md,
});

const layerSchema = z.object({
  layer: z.number().int().min(0).max(4),
  says: md,
  /** Gates, all required: trust at least, a question the Lead asks, a fact first. */
  minTrust: z.number().int().nullable(),
  question: md.nullable(),
  afterEvent: slug.nullable(),
  afterLayer: z.number().int().nullable(),
  fromBatch: batch,
});

const ladderStepSchema = z.object({
  step: z.number().int().min(0).max(2),
  stance: md,
  /** What moves Voss here: always an argument (a reason or a document). */
  requires: md.nullable(),
  fromBatch: batch.nullable(),
});

const ladderSchema = z.object({
  key: z.enum(['target', 'killer', 'luca']),
  name: z.string().min(1),
  /** Before the ladder lights up (the target, before murder 3). */
  before: md.nullable(),
  steps: z.array(ladderStepSchema).length(3),
  atTop: md.nullable(),
});

const doorSchema = z.object({
  key: slug,
  office: slug,
  /** The document Voss names; never the field to read. */
  document: md,
  fromBatch: batch,
});

const vossStateSchema = z.object({
  trust: trustSchema,
  layers: z.array(layerSchema).length(5),
  layersPerBatch: z.number().int(),
  ladders: z.array(ladderSchema).length(3),
  ladderRules: md,
  doors: z.array(doorSchema),
  /** At most this many new Aldo clues per Voss Letter (direct answers aside). */
  aldoCluesPerLetter: z.number().int(),
  maxReapproaches: z.number().int(),
});

// ─── The 17 December and the Endings ────────────────────────────────────────

const routeSchema = z.object({
  key: z.enum(['search', 'stakeout', 'voss_knows', 'voss_hides', 'otherwise']),
  order: z.number().int().min(1).max(5),
  condition: md,
  lastTurn: turn.nullable(),
  /** Evidence the Lead must already hold and cite (search). */
  minEvidence: z.number().int().nullable(),
  minEvidenceIfBenvenutiReported: z.number().int().nullable(),
  outcome: md,
});

const endingSchema = z.object({
  key: slug,
  number: z.number().int().min(1).max(6),
  title: z.string().min(1),
  vossAlive: z.boolean(),
  killer: z.enum(['unknown', 'fled', 'caught']),
  playerKnowsOn21Dec: md,
  batch8: md,
  epilogue: md,
  /** The PM's Letter and the dispositivo close it. */
  hasTrial: z.boolean(),
});

const verdictSchema = z.object({
  /** Score ≥ all → guilty of the three 1987 murders. */
  all: z.number().int(),
  /** partial ≤ score < all → guilty only where a proof of its own exists. */
  partial: z.number().int(),
  rules: md,
  sentence: md,
  dates: z.object({
    summary: z.object({ verdict: isoDate, letter: isoDate }),
    formal: z.object({ verdict: isoDate, letter: isoDate }),
  }),
  finds: z.array(z.object({ arrest: z.enum(['A', 'B', 'C']), what: md, confession: md })),
});

// ─── Fixed texts ────────────────────────────────────────────────────────────

/** An authored text: a Dispatch, an anchor, an Enclosure. */
const fixedTextSchema = z.object({
  key: slug,
  /** Who it is from (a correspondent slug). */
  from: slug,
  kind: z.enum(['letter', 'dispatch', 'epilogue', 'passage', 'enclosure']),
  /** The date it bears; null when the Engine dates it. */
  date: isoDate.nullable(),
  /** When it is used. */
  use: md,
  text: md,
  /** Changes by state, each one a short instruction or a replacement. */
  variants: z.array(z.object({ when: md, change: md })).default([]),
});

const openingSchema = z.object({
  /** Outside the fiction, shown by the Player UI before anything else. */
  rulesCard: md,
  /** The Lead's own document; a fixed Story field, not a Letter. */
  transferOrder: z.object({ title: z.string().min(1), body: md }),
  /** Voss's layer-0 Letter: the one `opening` Letter. */
  letter: z.object({ from: slug, storyDate: isoDate, body: md }),
});

// ─── The Story document ─────────────────────────────────────────────────────

export const vossStorySchema = z
  .object({
    schemaVersion: z.literal(STORY_SCHEMA_VERSION),
    locale: z.literal('it'),
    maxLettersPerTurn: z.number().int().min(1),
    turns: z.literal(8),
    calendar: calendarSchema,
    lead: leadSchema,
    correspondents: z.array(correspondentSchema).min(1),
    plotKeys: z.array(plotKeySchema).min(1),
    reserved: z.array(reservedTermSchema),
    requestKeys: z.array(requestKeySchema),
    documents: z.array(documentSchema),
    clues: z.array(clueSchema),
    panorama: z.object({
      clues: z.array(panoramaClueSchema),
      deduction: md,
      calendarEnclosure: md,
    }),
    aldoThread: z.array(aldoThreadSchema),
    evidence: z.array(evidenceSchema),
    circumstances: z.array(circumstanceSchema),
    voss: vossStateSchema,
    routes: z.array(routeSchema).length(5),
    endings: z.array(endingSchema).length(6),
    verdict: verdictSchema,
    texts: z.array(fixedTextSchema),
    opening: openingSchema,
    /** Prompts of the writing pipeline, as data. */
    pipeline: z.object({
      /** The Italian editing method (#37). */
      editor: md,
      /** The reply-rule checker's rules (#25, v2). */
      checker: md,
      /** How every Roman office answers. */
      officeStyle: md,
    }),
  })
  .superRefine((story, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const unique = (keys: string[], path: string) => {
      const seen = new Set<string>();
      for (const k of keys) {
        if (seen.has(k)) issue([path], `duplicate key "${k}"`);
        seen.add(k);
      }
      return seen;
    };

    const slugs = unique([story.lead.slug, ...story.correspondents.map((c) => c.slug)], 'correspondents');
    const offices = new Set(story.correspondents.filter((c) => c.office).map((c) => c.slug));
    const docs = unique(story.documents.map((d) => d.key), 'documents');
    const requestKeys = unique(story.requestKeys.map((r) => r.key), 'requestKeys');
    const plotKeys = unique(story.plotKeys.map((p) => p.key), 'plotKeys');
    const evidence = unique(story.evidence.map((e) => e.key), 'evidence');
    const events = unique(story.calendar.events.map((e) => e.key), 'calendar.events');
    unique(story.clues.map((c) => c.key), 'clues');
    unique(story.panorama.clues.map((c) => c.key), 'panorama.clues');
    unique(story.texts.map((t) => t.key), 'texts');
    unique(story.endings.map((e) => e.key), 'endings');
    const clueKeys = new Set([...story.clues.map((c) => c.key), ...story.panorama.clues.map((c) => c.key)]);

    story.correspondents.forEach((c, i) => {
      if ((c.kind === 'office') !== (c.office !== null)) {
        issue(['correspondents', i, 'office'], `${c.slug}: an office needs an office block, nobody else has one`);
      }
      if (c.writer !== null && c.writerView === null) {
        issue(['correspondents', i, 'writerView'], `${c.slug}: a correspondent that writes needs a writer view`);
      }
      if (c.office) {
        for (const d of c.office.holds) {
          const doc = story.documents.find((x) => x.key === d);
          if (!doc) issue(['correspondents', i, 'office', 'holds'], `${c.slug}: unknown document "${d}"`);
          else if (doc.holder !== c.slug) issue(['correspondents', i, 'office', 'holds'], `${c.slug}: "${d}" is held by ${doc.holder}`);
        }
        if (c.office.forwardsTo !== null && !offices.has(c.office.forwardsTo)) {
          issue(['correspondents', i, 'office', 'forwardsTo'], `${c.slug}: forwards to "${c.office.forwardsTo}", not an office`);
        }
      }
    });

    story.documents.forEach((d, i) => {
      if (!offices.has(d.holder)) issue(['documents', i, 'holder'], `${d.key}: holder "${d.holder}" is not an office`);
      const holder = story.correspondents.find((c) => c.slug === d.holder);
      if (holder?.office && !holder.office.holds.includes(d.key)) {
        issue(['documents', i, 'holder'], `${d.key}: not listed in ${d.holder}'s holdings`);
      }
      for (const set of d.requires) for (const k of set) {
        if (!requestKeys.has(k)) issue(['documents', i, 'requires'], `${d.key}: unknown request key "${k}"`);
      }
      if (d.evidence !== null && !evidence.has(d.evidence)) issue(['documents', i, 'evidence'], `${d.key}: unknown evidence ${d.evidence}`);
      for (const k of d.clues) if (!clueKeys.has(k)) issue(['documents', i, 'clues'], `${d.key}: unknown clue ${k}`);
    });
    void docs;

    story.reserved.forEach((r, i) => {
      if (!plotKeys.has(r.plotKey)) issue(['reserved', i, 'plotKey'], `unknown Plot key "${r.plotKey}"`);
      for (const s of r.allowedFor) if (!slugs.has(s)) issue(['reserved', i, 'allowedFor'], `unknown correspondent "${s}"`);
    });

    story.clues.forEach((c, i) => {
      for (const s of c.from) if (!slugs.has(s)) issue(['clues', i, 'from'], `${c.key}: unknown correspondent "${s}"`);
    });

    story.voss.layers.forEach((l, i) => {
      if (l.layer !== i) issue(['voss', 'layers', i], 'layers must be 0–4 in order');
      if (l.afterEvent !== null && !events.has(l.afterEvent)) issue(['voss', 'layers', i, 'afterEvent'], `unknown event "${l.afterEvent}"`);
    });
    story.voss.ladders.forEach((ladder, i) =>
      ladder.steps.forEach((s, j) => {
        if (s.step !== j) issue(['voss', 'ladders', i, 'steps', j], 'steps must be 0–2 in order');
      }),
    );
    story.voss.doors.forEach((d, i) => {
      if (!offices.has(d.office)) issue(['voss', 'doors', i, 'office'], `unknown office "${d.office}"`);
    });
    story.routes.forEach((r, i) => {
      if (r.order !== i + 1) issue(['routes', i, 'order'], 'routes must be listed in the order they are tried');
    });
    story.endings.forEach((e, i) => {
      if (e.number !== i + 1) issue(['endings', i, 'number'], 'Endings must be listed 1–6');
    });
    story.texts.forEach((t, i) => {
      if (!slugs.has(t.from)) issue(['texts', i, 'from'], `${t.key}: unknown sender "${t.from}"`);
    });
    if (!slugs.has(story.opening.letter.from)) issue(['opening', 'letter', 'from'], 'unknown sender');
  });

export type VossStory = z.infer<typeof vossStorySchema>;
export type VossCorrespondent = VossStory['correspondents'][number];
export type VossDocument = VossStory['documents'][number];
