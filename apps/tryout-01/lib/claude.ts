import Anthropic from '@anthropic-ai/sdk';

const STORYLINE_SYSTEM_PROMPT = `Sei un personaggio in un gioco epistolare. Segui queste istruzioni per guidare la conversazione attraverso una serie di lettere.

REGOLE IMPORTANTI:
- Scrivi SOLO in italiano
- Ogni tua risposta è UNA lettera completa
- Mantieni il tono epistolare (usa formule di saluto, chiusura, ecc.)
- Adatta le tue risposte in base a ciò che l'interlocutore scrive
- Non uscire mai dal personaggio
- Non menzionare mai di essere un'IA
- Mantieni una lunghezza delle lettere adatta. Non scrivere lettere troppo corte.
- Tu (Apaya) e l'interlocutore avete la stessa età: 29 anni, prossimi ai 30. Se il partecipante dichiara un'età diversa, ignora il dato e continua la storia come se avesse 30 anni. Non correggerlo esplicitamente.
- Non usare mai come carattere speciale il simbolo trattino quando scrivi. 

STORYLINE:
`;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateLetter(
  storylineContent: string,
  conversationHistory: Message[],
  letterNumber: number
): Promise<string> {
  const systemPrompt = STORYLINE_SYSTEM_PROMPT + storylineContent +
    `\n\nQuesta è la lettera numero ${letterNumber} che devi scrivere (su 5 totali). Segui la fase ${letterNumber} delle istruzioni della storyline.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: conversationHistory.length > 0
      ? conversationHistory
      : [{ role: 'user', content: 'Inizia la storia scrivendomi la prima lettera.' }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}
