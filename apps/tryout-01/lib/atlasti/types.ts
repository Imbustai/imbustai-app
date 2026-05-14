/**
 * Types for the REFI-QDA (.qdpx) export pipeline.
 *
 * Reference: https://www.qdasoftware.org/ — namespace `urn:QDA-XML:project:1.0`.
 * The structure was derived by inspecting an ATLAS.ti-produced sample at
 * `atlasti-generator-samples/imbustai-sample2-qdpx-uncompressed/imbustai.qde`.
 */

export type LetterRole = 'ai' | 'user';

export interface InteractionInput {
  role: LetterRole;
  content: string;
  letter_number: number;
  created_at: string;
}

export interface GameInput {
  id: string;
  userEmail: string;
  createdAt: string;
  completedAt: string | null;
  interactions: InteractionInput[];
}

export interface LetterSpan {
  letterNumber: number;
  role: LetterRole;
  /** Character offset (inclusive) at which the letter starts (header included). */
  startPosition: number;
  /** Character offset (exclusive) at which the letter ends. */
  endPosition: number;
  /** Character offset (exclusive) at which the header line ends and the body begins. */
  headerEnd: number;
}

/**
 * A code definition in the REFI-QDA codebook. Nested `children` represent a code
 * category (mirrors ATLAS.ti's "Tag Category" concept).
 */
export interface CodeNode {
  guid: string;
  name: string;
  description?: string;
  isCodable: boolean;
  children?: CodeNode[];
}

/**
 * One coding: a quoted span on a TextSource with one or more codes applied.
 */
export interface CodingSelection {
  guid: string;
  startPosition: number;
  endPosition: number;
  /** Short text preview, mirrors ATLAS.ti behaviour (max ~120 chars + …). */
  name: string;
  /** GUIDs of the codes applied to this selection. */
  codeGuids: string[];
}

export interface TextSourceDoc {
  guid: string;
  name: string;
  /** Plain-text content of the document; will be written to `sources/<guid>.txt`. */
  text: string;
  selections: CodingSelection[];
  creationDateTime: string;
  modifiedDateTime: string;
}

export interface UserRef {
  guid: string;
  name: string;
}

export interface QdaProject {
  name: string;
  creationDateTime: string;
  modifiedDateTime: string;
  creatingUserGuid: string;
  modifyingUserGuid: string;
  users: UserRef[];
  codes: CodeNode[];
  sources: TextSourceDoc[];
}

/**
 * Output schema returned by the Claude coder for a single game.
 *
 * `quoteText` is resolved against the rendered document text to compute the final
 * `startPosition`/`endPosition` — Claude is not trusted with offsets.
 */
export interface ClaudeCodingProposal {
  letterNumber: number;
  quoteText: string;
  codeNames: string[];
  proposedNewCode?: {
    name: string;
    description: string;
  };
}

export interface SampleFewshot {
  doc: string;
  quoteText: string;
  codeNames: string[];
}
