import type { VossStory } from '../schema';
import { officeAnswer } from './calendar';
import type { PendingAnswer } from './state';

// Office routing (§1.1, §5.2): an office answers after its fixed weeks and
// sends only the documents it holds whose request keys the Letter carries. A
// request for documents another office holds is forwarded «per competenza»
// in the same batch, and the right office then answers on its own time. A
// request that matches nothing gets a partial answer asking for specifics.

function officeOf(story: VossStory, slug: string) {
  const c = story.correspondents.find((x) => x.slug === slug);
  if (!c?.office) throw new Error(`engine-voss: "${slug}" is not an office`);
  return c.office;
}

/** The documents `office` holds that a request carrying `keys` finds, as of `date`. */
export function documentsFound(story: VossStory, office: string, keys: string[], date: string): string[] {
  const have = new Set(keys);
  return story.documents
    .filter((d) => d.holder === office)
    .filter((d) => d.requires.length === 0 || d.requires.some((set) => set.every((k) => have.has(k))))
    .filter((d) => d.availableFrom === null || d.availableFrom <= date)
    .map((d) => d.key);
}

/** The offices other than `office` that hold a document a request carrying `keys` would find. */
function holdersElsewhere(story: VossStory, office: string, keys: string[]): string[] {
  const have = new Set(keys);
  const holders = story.documents
    .filter((d) => d.holder !== office)
    .filter((d) => d.requires.length > 0 && d.requires.some((set) => set.every((k) => have.has(k))))
    .map((d) => d.holder);
  return [...new Set(holders)];
}

/** One office answering for itself, never forwarding again. */
function answerFor(
  story: VossStory,
  office: string,
  turn: number,
  keys: string[],
  forwardedFrom: string | null,
): PendingAnswer | null {
  const { replyWeeks } = officeOf(story, office);
  const { date, batch } = officeAnswer(story, turn, replyWeeks);
  if (batch === null) return null;
  const documents = documentsFound(story, office, keys, date);
  return { kind: 'answer', office, turn, batch, date, documents, partial: documents.length === 0, forwardedFrom, forwardedTo: [], topics: [] };
}

/**
 * Everything a Letter of Turn N to `office` sets in motion: its own answer,
 * or a «per competenza» note in batch N plus the right office's answer.
 * Answers that would fall after the Game are left out.
 */
export function routeOfficeLetter(story: VossStory, office: string, turn: number, keys: string[]): PendingAnswer[] {
  const own = officeOf(story, office);
  const ownDate = officeAnswer(story, turn, own.replyWeeks).date;
  if (documentsFound(story, office, keys, ownDate).length > 0) {
    const a = answerFor(story, office, turn, keys, null);
    return a ? [a] : [];
  }

  const elsewhere = holdersElsewhere(story, office, keys);
  // An office with nothing of its own to give or do (the Garbatella) sends
  // everything on; the Mobile answers for itself.
  const idle = own.holds.length === 0 && own.actions.length === 0;
  const targets = elsewhere.length > 0 ? elsewhere : idle && own.forwardsTo ? [own.forwardsTo] : [];
  if (targets.length === 0) {
    const a = answerFor(story, office, turn, keys, null);
    return a ? [a] : [];
  }

  const note = officeAnswer(story, turn, 0);
  const answers: PendingAnswer[] = [
    { kind: 'forward', office, turn, batch: turn, date: note.date, documents: [], partial: false, forwardedFrom: null, forwardedTo: targets, topics: [] },
  ];
  for (const target of targets) {
    const a = answerFor(story, target, turn, keys, office);
    if (a) answers.push(a);
  }
  return answers;
}
