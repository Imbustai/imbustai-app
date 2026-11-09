// PROTOTYPE — throwaway (Imbustai/imbustai-app#43). How the Voss story's fixed
// pieces look to the Player: the rules card, the transfer order, clippings and
// the dispositivo. Variants via ?variant=; texts from the dev VossStory document.
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Box } from '@imbustai/ds';
import { createAdminClient } from '@/lib/supabase/admin';
import { PrototypeSwitcher } from '@/components/prototype/prototype-switcher';
import { FixedPiecesPrototype, type ProtoLetter, type ProtoData } from './variants';
import { VARIANTS } from './variant-list';

export const dynamic = 'force-dynamic';

interface Doc {
  lead: { name: string };
  correspondents: { slug: string; name: string; role: string; kind: string; contactableFromStart: boolean }[];
  texts: {
    key: string;
    from: string;
    kind: string;
    date: string | null;
    text: string;
    enclosures: { key: string; kind: 'document' | 'clipping'; title: string; body: string }[];
  }[];
  opening: {
    rulesCard: string;
    transferOrder: { title: string; body: string };
    letter: { from: string; storyDate: string; body: string };
  };
}

export default async function FixedPiecesPrototypePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { variant } = await searchParams;

  const admin = createAdminClient();
  const { data: story } = await admin.from('stories').select('id').eq('slug', 'voss-roma-1987').single();
  if (!story) notFound();
  const { data: row } = await admin.from('story_engine_data').select('data').eq('story_id', story.id).single();
  if (!row) notFound();
  const doc = row.data as Doc;

  const who = (slug: string) => doc.correspondents.find((c) => c.slug === slug);
  const text = (key: string) => {
    const t = doc.texts.find((x) => x.key === key);
    if (!t) throw new Error(`no text ${key}`);
    return t;
  };
  const fromText = (key: string, id: string): ProtoLetter => {
    const t = text(key);
    const c = who(t.from);
    return {
      id,
      mine: false,
      kind: t.kind === 'dispatch' ? 'dispatch' : t.kind === 'epilogue' ? 'epilogue' : 'letter',
      from: t.from,
      fromName: c?.name ?? t.from,
      fromKind: c?.kind ?? 'person',
      storyDate: t.date ?? '',
      body: t.text,
      enclosures: t.enclosures,
    };
  };

  const voss = who(doc.opening.letter.from);
  const letters: ProtoLetter[] = [
    {
      id: 'opening',
      mine: false,
      kind: 'letter',
      from: 'voss',
      fromName: voss?.name ?? 'Voss',
      fromKind: 'person',
      storyDate: doc.opening.letter.storyDate,
      body: doc.opening.letter.body,
      enclosures: [],
      opening: true,
    },
    {
      id: 'mine-1',
      mine: true,
      kind: 'letter',
      from: 'voss',
      fromName: voss?.name ?? 'Voss',
      fromKind: 'person',
      storyDate: '1987-09-14',
      body: 'Caro Florian,\n\n(Lettera del Giocatore, segnaposto del prototipo.)\n\nGiacomo',
      enclosures: [],
    },
    fromText('clipping_murder_3', 'clip-3'),
    fromText('clipping_lattanzi', 'clip-lattanzi'),
    fromText('adelaide_reveal', 'adelaide-reveal'),
    fromText('pm_letter', 'pm'),
  ];
  // The dispositivo is its own text in the document; it travels as the PM letter's Enclosure.
  const pm = letters.find((l) => l.id === 'pm')!;
  pm.enclosures = [
    { key: 'dispositivo', kind: 'document', title: 'Dispositivo della sentenza', body: text('dispositivo').text },
  ];

  const data: ProtoData = {
    leadName: doc.lead.name,
    rulesCard: doc.opening.rulesCard,
    transferOrder: doc.opening.transferOrder,
    contacts: doc.correspondents
      .filter((c) => c.contactableFromStart)
      .map((c) => ({ slug: c.slug, name: c.name, role: c.role })),
    letters,
  };

  return (
    <Box maxWidth="5xl" marginX="auto" paddingX="4" paddingY="10">
      <FixedPiecesPrototype variant={variant ?? VARIANTS[0].key} data={data} />
      <Suspense>
        <PrototypeSwitcher variants={VARIANTS} />
      </Suspense>
    </Box>
  );
}
