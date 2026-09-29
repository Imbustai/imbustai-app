// PROTOTYPE — throwaway. One real Voss Turn, end to end (#25) + the Italian editing pass (#37 part 2).
// Run from the repo root:  pnpm exec tsx docs/prototypes/one-voss-turn/run-turn.PROTOTYPE.mts <step>
// Steps: reader | drafts | check-drafts | rewrite | edit | offices   (each reads the previous step's files in out/)
// Every call appends its usage and dollar cost to out/costs.jsonl; the run aborts past BUDGET.
import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
const read = (p: string) => fs.readFileSync(path.join(HERE, p), "utf8");
const write = (p: string, s: string) => fs.writeFileSync(path.join(OUT, p), s);
const readOut = (p: string) => fs.readFileSync(path.join(OUT, p), "utf8");

const BUDGET = 4.6;
const WRITER = "claude-fable-5-1";
let ANALYST = "claude-sonnet-5-5"; // clerk/analyst per #14; falls back to claude-sonnet-5 if unknown
// $ per MTok: input, cache write (5 min), cache read, output
const PRICES: Record<string, [number, number, number, number]> = {
  "claude-fable-5-1": [10, 12.5, 0.25, 50],
  "claude-sonnet-5-5": [2, 2.5, 0.2, 10],
  "claude-sonnet-5": [2, 2.5, 0.2, 10],
  "claude-opus-4-8": [5, 6.25, 0.5, 25],
};

const client = new Anthropic();

function spent(): number {
  const f = path.join(OUT, "costs.jsonl");
  if (!fs.existsSync(f)) return 0;
  return fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean)
    .reduce((s, l) => s + JSON.parse(l).usd, 0);
}

function cost(model: string, u: any): number {
  const p = PRICES[model];
  if (!p) throw new Error(`no price for ${model}`);
  return ((u.input_tokens ?? 0) * p[0] + (u.cache_creation_input_tokens ?? 0) * p[1] +
    (u.cache_read_input_tokens ?? 0) * p[2] + (u.output_tokens ?? 0) * p[3]) / 1e6;
}

type Sys = { text: string; cache?: boolean }[];
async function call(label: string, o: {
  model: string; effort: "low" | "medium" | "high"; system: Sys;
  messages: Anthropic.Beta.BetaMessageParam[]; schema?: object; maxTokens?: number;
}) {
  if (spent() > BUDGET) throw new Error(`budget: $${spent().toFixed(2)} spent, stop`);
  const params: any = {
    model: o.model,
    max_tokens: o.maxTokens ?? 32000,
    system: o.system.map((b) => ({ type: "text", text: b.text, ...(b.cache ? { cache_control: { type: "ephemeral" } } : {}) })),
    messages: o.messages,
    output_config: { effort: o.effort, ...(o.schema ? { format: { type: "json_schema", schema: o.schema } } : {}) },
  };
  if (o.model === WRITER) { params.betas = ["server-side-fallback-2026-07-01"]; params.fallbacks = "default"; }
  let msg: any;
  try {
    msg = await client.beta.messages.stream(params).finalMessage();
  } catch (e: any) {
    if (e instanceof Anthropic.NotFoundError && o.model === "claude-sonnet-5-5") {
      console.log("claude-sonnet-5-5 not found, using claude-sonnet-5");
      ANALYST = "claude-sonnet-5";
      return call(label, { ...o, model: ANALYST });
    }
    throw e;
  }
  if (msg.stop_reason === "refusal") throw new Error(`${label}: refusal ${JSON.stringify(msg.stop_details)}`);
  if (msg.stop_reason === "max_tokens") throw new Error(`${label}: hit max_tokens`);
  const servedBy = msg.model;
  const usd = cost(PRICES[servedBy] ? servedBy : o.model, msg.usage);
  const text = msg.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  const line = { label, model: o.model, servedBy, effort: o.effort, usage: msg.usage, usd, words: text.split(/\s+/).filter(Boolean).length };
  fs.appendFileSync(path.join(OUT, "costs.jsonl"), JSON.stringify(line) + "\n");
  console.log(`${label}: ${servedBy} $${usd.toFixed(3)} (in ${msg.usage.input_tokens} / cw ${msg.usage.cache_creation_input_tokens} / cr ${msg.usage.cache_read_input_tokens} / out ${msg.usage.output_tokens}) — total $${spent().toFixed(2)}`);
  return { text, content: msg.content, usd };
}

// ---------- shared material ----------
const branchFile = (branch: string, file: string) =>
  execSync(`git show origin/${branch}:${file}`, { cwd: HERE, encoding: "utf8", maxBuffer: 1 << 24 });
const envelope = branchFile("prototype/lombardo-opening-envelope", "docs/prototypes/lombardo-opening-envelope.PROTOTYPE.md");
const caseFile = branchFile("prototype/il-quarto-nome-case-file", "docs/prototypes/il-quarto-nome-case-file.PROTOTYPE.md");
const openingLetter = envelope.split("### 7.3 La prima lettera di Voss")[1].split("**Controllo rispetto")[0]
  .split("\n").filter((l) => l.startsWith(">")).map((l) => l.replace(/^> ?/, "")).join("\n").trim();

const player = { voss: read("player/1-voss.md"), cancelleria: read("player/2-cancelleria.md"), mobile: read("player/3-mobile.md") };

const TURN_STATE = `## Il Turno (dall'Engine)
- Voss risponde **martedì 22 settembre 1987**, da Roma. La lettera di Lombardo, datata lunedì 14 settembre, gli è arrivata sabato 19 settembre, a casa.
- Tra il 5 e il 22 settembre a Roma non è successo niente di fisso: nessun nuovo delitto. I giornali continuano con la «setta della trinità». Giovedì 10 e giovedì 17 Voss ha giocato a scacchi al bar, come sempre.
- Fiducia: media-bassa (è la prima risposta di Lombardo, che però ha risposto alle sue domande personali e ha preso sul serio la sua paura).
- Strati consentiti: 0 e 1. Lo strato 2 solo se Lombardo chiede della sua carriera o del perché di tanta paura. Gli strati 3 e 4 no.
- Scale del dubbio: al massimo un passo per scala, e solo se Lombardo ha argomentato con una ragione o un documento.
- Signature: nessun momento clou. Vino al massimo in una riga; schiena al massimo in una riga.
- Aldo: solo come compagno di scacchi, in una riga, senza dettagli nuovi sulla sua vita.
- Texture già usata nella prima lettera (non ripeterla come novità): Mario e la carbonara, «Floria'», gli scacchi del giovedì, le notti in macchina col termos, Termeno, i gerani, la madre la domenica, Cerroni piantone, l'appuntato al telefono di luglio.
- Ledger dei fatti che Lombardo ha scritto di sé: ancora vuoto prima di questa lettera.`;

const VOSS_INSTRUCTIONS = `Scrivi le Lettere di Florian Voss, un personaggio di un gioco epistolare in italiano ambientato a Roma nel 1987. Il Giocatore è il commissario Giacomo Lombardo, esiliato a Lipari: gioca scrivendo Lettere, e le tue sono le risposte di Voss. Tutto ciò che serve è nei documenti che seguono: chi è Voss, che cosa sa del caso, come scrive, chi è Lombardo per lui, e tre lettere di esempio della sua voce. Voss sa soltanto ciò che è scritto lì: non inventare fatti del caso; puoi inventare piccoli fatti della sua vita, dello stesso genere di quelli descritti.

Scrivi soltanto la Lettera, in testo semplice, dal luogo e la data fino alla firma e all'eventuale P.S. Nessun commento prima o dopo.`;

const vossSystem = (anchors: string): Sys => [
  { text: VOSS_INSTRUCTIONS },
  { text: read("prefix/voss.md") },
  { text: read("prefix/lombardo-per-voss.md") },
  { text: anchors, cache: true },
];

const correspondence = (reader: string) => `## La corrispondenza finora

### Voss a Lombardo (sabato 5 settembre 1987)
${openingLetter}

### Lombardo a Voss (lunedì 14 settembre 1987)
${player.voss}

## Che cosa c'è nella lettera di Lombardo (note del lettore)
${reader}

${TURN_STATE}`;

// ---------- schemas ----------
const READER_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["questions", "claims_about_himself", "actions_reported", "hypotheses", "requests", "answers_to_voss_questions", "tone"],
  properties: {
    questions: { type: "array", items: { type: "string" }, description: "Every question Lombardo asks Voss, explicit or implicit, in order, in Italian" },
    claims_about_himself: { type: "array", items: { type: "string" }, description: "New facts Lombardo states about himself or his life (Ledger)" },
    actions_reported: { type: "array", items: { type: "string" }, description: "What Lombardo says he has done (letters sent, etc.)" },
    hypotheses: {
      type: "array", items: {
        type: "object", additionalProperties: false, required: ["hypothesis", "reason_given"],
        properties: { hypothesis: { type: "string" }, reason_given: { type: "string", description: "The argument or document he offers, or empty if a bare assertion" } },
      },
    },
    requests: { type: "array", items: { type: "string" }, description: "What Lombardo asks Voss to do or not do" },
    answers_to_voss_questions: { type: "array", items: { type: "string" }, description: "Which of Voss's personal questions from his last letter Lombardo answered, and how" },
    tone: { type: "string" },
  },
};
const CHECK_SCHEMA = {
  type: "object", additionalProperties: false, required: ["issues", "questions_answered", "verdict"],
  properties: {
    issues: {
      type: "array", items: {
        type: "object", additionalProperties: false, required: ["rule", "severity", "quote", "problem", "fix"],
        properties: {
          rule: { type: "string" }, severity: { type: "string", enum: ["must", "should"] },
          quote: { type: "string" }, problem: { type: "string" }, fix: { type: "string" },
        },
      },
    },
    questions_answered: {
      type: "array", items: {
        type: "object", additionalProperties: false, required: ["question", "answered", "how"],
        properties: { question: { type: "string" }, answered: { type: "string", enum: ["full", "partial_true", "deferred_with_reason", "no"] }, how: { type: "string" } },
      },
    },
    verdict: { type: "string", enum: ["ok", "rewrite"] },
  },
};

const checkerSystem = (): Sys => [
  { text: read("prefix/checker.md") },
  { text: "# The case file (whole truth, author only)\n\n" + caseFile, cache: true },
];

async function check(label: string, character: string, turn: string, playerLetter: string, reader: string, letter: string) {
  const r = await call(label, {
    model: ANALYST, effort: "medium", system: checkerSystem(), schema: CHECK_SCHEMA,
    messages: [{ role: "user", content: `# The Character's sheet\n${character}\n\n# Turn state\n${turn}\n\n# The Player's letter\n${playerLetter}\n\n# The reader's notes (questions to answer)\n${reader}\n\n# The Letter to check\n${letter}` }],
  });
  return r.text;
}

const issuesToItalian = (checkJson: string) => {
  const c = JSON.parse(checkJson);
  return c.issues.filter((i: any) => i.severity === "must").map((i: any, n: number) => `${n + 1}. [${i.severity}] «${i.quote}» — ${i.problem} Correzione: ${i.fix}`).join("\n");
};

// ---------- steps ----------
const steps: Record<string, () => Promise<void>> = {
  async reader() {
    const r = await call("reader", {
      model: ANALYST, effort: "low", schema: READER_SCHEMA,
      system: [{ text: "You read a Letter the Player (Commissario Giacomo Lombardo) wrote in an Italian epistolary game, and extract what the replying Character needs. Be exhaustive on questions: a Character must answer each one. Write the extracted items in Italian." }],
      messages: [{ role: "user", content: `## The Character's previous letter (Voss to Lombardo)\n${openingLetter}\n\n## Lombardo's reply\n${player.voss}` }],
    });
    write("1-reader.json", JSON.stringify(JSON.parse(r.text), null, 2));
  },

  async drafts() {
    const reader = readOut("1-reader.json");
    for (const variant of ["whole", "stripped"] as const) {
      const r = await call(`voss-draft-${variant}`, {
        model: WRITER, effort: "medium", system: vossSystem(read(`prefix/anchors-${variant}.md`)),
        messages: [{ role: "user", content: correspondence(reader) + "\n\nScrivi la risposta di Voss." }],
      });
      write(`2-voss-draft-${variant}.md`, r.text);
      write(`2-voss-draft-${variant}.content.json`, JSON.stringify(r.content));
    }
  },

  async "check-drafts"() {
    const reader = readOut("1-reader.json");
    for (const variant of ["whole", "stripped"]) {
      const t = await check(`check-voss-${variant}`, read("prefix/voss.md"), TURN_STATE, player.voss, reader, readOut(`2-voss-draft-${variant}.md`));
      write(`3-check-voss-${variant}.json`, JSON.stringify(JSON.parse(t), null, 2));
    }
  },

  // Continues the chosen draft's conversation (append-only, so the prefix and the draft's thinking stay valid).
  // A = rewrite for the checker only; B = rewrite for the checker + the Italian editing pass in the same call.
  async rewrite() {
    const variant = process.argv[3] ?? "stripped";
    const reader = readOut("1-reader.json");
    const issues = issuesToItalian(readOut(`3-check-voss-${variant}.json`));
    const history: Anthropic.Beta.BetaMessageParam[] = [
      { role: "user", content: correspondence(reader) + "\n\nScrivi la risposta di Voss." },
      { role: "assistant", content: JSON.parse(readOut(`2-voss-draft-${variant}.content.json`)) },
    ];
    const ask = `Il controllo delle regole ha trovato questi punti nella tua Lettera:\n${issues}\n\nRiscrivi la Lettera intera correggendo questi punti. Tutto il resto resta com'è. Scrivi soltanto la Lettera.`;
    const a = await call("voss-rewrite-A", { model: WRITER, effort: "medium", system: vossSystem(read(`prefix/anchors-${variant}.md`)), messages: [...history, { role: "user", content: ask }] });
    write("4-voss-rewrite-A.md", a.text);
    const askB = ask.replace("Scrivi soltanto la Lettera.", `Nella stessa riscrittura rileggi l'italiano come farebbe un redattore, con questo metodo:\n\n${read("prefix/editor.md")}\n\nScrivi soltanto la Lettera.`);
    const b = await call("voss-rewrite-B-with-editing", { model: WRITER, effort: "medium", system: vossSystem(read(`prefix/anchors-${variant}.md`)), messages: [...history, { role: "user", content: askB }] });
    write("4-voss-rewrite-B-with-editing.md", b.text);
  },

  // Separate editing pass on rewrite A, on the writer model and on the clerk model, to compare quality and cost.
  async edit() {
    const voice = read("prefix/voss.md").split("## 4. La voce")[1].split("## 5.")[0];
    const system: Sys = [
      { text: read("prefix/editor.md") },
      { text: `# Il Personaggio: Florian Voss\n\nAgente di polizia a Roma, 33 anni, nato a Termeno (Alto Adige), padre di Brema: scrive un italiano corretto, un po' formale, con qualche costruzione tedesca voluta. Scrive a un vecchio superiore e amico, il commissario Giacomo Lombardo, a cui dà del tu.\n\n## La sua voce\n${voice}\n\n# Lettere di Voss già rilette e approvate (esempi di stile)\n\n${read("prefix/anchors-stripped.md")}`, cache: true },
    ];
    const letter = readOut("4-voss-rewrite-A.md");
    for (const [label, model] of [["edit-voss-writer", WRITER], ["edit-voss-analyst", ANALYST]] as const) {
      const r = await call(label, { model, effort: "medium", system, messages: [{ role: "user", content: `Rileggi e correggi questa Lettera. Restituisci soltanto la Lettera corretta, intera.\n\n${letter}` }] });
      write(`5-voss-${label}.md`, r.text);
    }
  },

  async offices() {
    for (const [key, file, date] of [["cancelleria", "prefix/cancelleria.md", "lunedì 19 ottobre 1987"], ["mobile", "prefix/mobile.md", "lunedì 5 ottobre 1987"]] as const) {
      const letter = player[key];
      const officeSheet = read("prefix/uffici.md") + "\n\n" + read(file);
      const draft = await call(`office-${key}`, {
        model: ANALYST, effort: "medium",
        system: [{ text: officeSheet, cache: true }],
        messages: [{ role: "user", content: `La lettera del commissario Lombardo, arrivata a Roma lunedì 21 settembre 1987:\n\n${letter}\n\nScrivi la risposta dell'ufficio, datata ${date}. Soltanto la lettera, in testo semplice.` }],
      });
      write(`6-office-${key}.md`, draft.text);
      const c = await check(`check-office-${key}`, officeSheet, `Office reply dated ${date}.`, letter, "(office letter: answer each request in it)", draft.text);
      write(`6-office-${key}.check.json`, JSON.stringify(JSON.parse(c), null, 2));
      const ed = await call(`edit-office-${key}`, {
        model: ANALYST, effort: "low",
        system: [{ text: read("prefix/editor.md") + "\n\nIl Personaggio qui è un ufficio pubblico italiano del 1987: il registro burocratico e le formule d'ufficio sono la sua voce, non vanno sciolte." }],
        messages: [{ role: "user", content: `Rileggi e correggi questa Lettera. Restituisci soltanto la Lettera corretta, intera.\n\n${draft.text}` }],
      });
      write(`6-office-${key}.edited.md`, ed.text);
    }
  },
};

const step = process.argv[2];
if (!steps[step]) { console.log(`steps: ${Object.keys(steps).join(" | ")}`); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
await steps[step]();
console.log(`spent so far: $${spent().toFixed(2)}`);
