/**
 * Worst Superpower — deterministic entry picker.
 *
 * Competition: u-suroto-worst-superpower-461dcdbe ("Worst Superpower").
 * Task: invent the most useless superpower in one line of at most
 * 140 characters. A judge model ranks the field two at a time against
 * a published brief. This program does the same job deterministically:
 * it holds a hand-written shortlist of candidate one-liners, scores
 * each one against the judge's five published criteria, picks the
 * best, validates the gate, and writes it to entry.txt.
 *
 * The judge's criteria, most important first:
 *   1. The power is genuinely useless — the worst, most pointless
 *      one imaginable — stated in one line. A real, useful, or merely
 *      weak power loses to any entry on the subject.
 *   2. The uselessness lands as a joke: the reader pictures the
 *      power in use and laughs at how little it achieves.
 *   3. The idea is unexpected: a power nobody has heard before,
 *      not a familiar gag about slow flight or a hero who can only
 *      turn invisible while nobody watches.
 *   4. The wording is tight and specific, with a concrete detail
 *      that fixes the power in the world rather than a vague
 *      abstraction.
 *   5. The line is clear on a single reading, needing no setup
 *      beyond the sentence itself.
 *
 * Extra rules the judge states: a power that is really a curse, or
 * that quietly helps, is not a useless superpower. Shock value for
 * its own sake does not count.
 *
 * The gate: entry.txt must be UTF-8 text of 1 to 140 characters,
 * not only white space, and a single line.
 *
 * Runtime: Node 22+, standard library only. No network, no secrets,
 * no randomness: the same input always produces the same entry.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One hand-written candidate line for the worst-superpower brief. */
interface Candidate {
  /** The one-liner itself, exactly as it would be submitted. */
  text: string;
  /** A short note on what makes this power useless (for the log). */
  note: string;
}

/** Per-criterion scores for one candidate, each on a 0..10 scale. */
interface CriterionScores {
  /** Criterion 1: genuinely useless (most important). */
  uselessness: number;
  /** Criterion 2: the joke lands, the reader pictures it in use. */
  humour: number;
  /** Criterion 3: unexpected, nobody has heard it before. */
  novelty: number;
  /** Criterion 4: tight, specific, concrete detail. */
  specificity: number;
  /** Criterion 5: clear on a single reading. */
  clarity: number;
}

/** A candidate with its full score breakdown and weighted total. */
interface ScoredCandidate {
  candidate: Candidate;
  scores: CriterionScores;
  /** Weighted total, 0..10, using the judge's priority order. */
  total: number;
}

/* ------------------------------------------------------------------ */
/* The shortlist: 20 hand-written candidates                          */
/*                                                                     */
/* Every line was written for this brief and obeys the gate on its     */
/* own: one line, at most 140 characters, not only white space.        */
/* Each one names a power and, in the same breath, the catch that      */
/* makes it useless.                                                   */
/* ------------------------------------------------------------------ */

const CANDIDATES: Candidate[] = [
  {
    text: "I can make any queue move faster, but only the queue directly behind mine.",
    note: "The benefit always lands on strangers, never on you.",
  },
  {
    text: "I can predict the weather with perfect accuracy, but only for yesterday.",
    note: "Perfect knowledge, delivered one day too late to use.",
  },
  {
    text: "I can make any traffic light turn green, five minutes after I have already driven past it.",
    note: "The power works; the timing makes it worthless.",
  },
  {
    text: "I can read minds, but only the minds of goldfish, and only while they are forgetting.",
    note: "Two catches at once: the wrong species and a memory that resets.",
  },
  {
    text: "I can teleport exactly three inches to the left, once a day, and only while sneezing.",
    note: "A dramatic power shrunk to a distance nobody can use.",
  },
  {
    text: "I can summon rain, but only inside my own umbrella, which is already open.",
    note: "The power solves a problem that does not exist.",
  },
  {
    text: "I can instantly know the exact time, in a timezone nobody I know lives in.",
    note: "A useful-sounding power aimed at the wrong place.",
  },
  {
    text: "I can remember every password I have ever had, except the one I am currently typing.",
    note: "Total recall with a hole exactly where you need it.",
  },
  {
    text: "I can pause time for everyone except me, for exactly one second, once a year.",
    note: "The ultimate power, rationed down to nothing.",
  },
  {
    text: "I can hear what my houseplants think, but only on Tuesdays, and they only think about water.",
    note: "A conversation nobody asked for, on a strict schedule.",
  },
  {
    text: "I can speak fluent dolphin, but only underwater, where I cannot breathe.",
    note: "The power works only where using it kills you.",
  },
  {
    text: "I can heat any cup of tea to the perfect temperature, then immediately forget where I put it.",
    note: "The power finishes the job and erases the reward.",
  },
  {
    text: "I can change the colour of any traffic cone, once, and nobody will ever notice.",
    note: "A permanent change to the world that changes nothing.",
  },
  {
    text: "I can detect lies, but only my own, and only after I have already told them.",
    note: "A truth power that arrives after the damage is done.",
  },
  {
    text: "I can talk to appliances, but they only ever complain about the dust.",
    note: "A whole new sense, wasted on household grumbling.",
  },
  {
    text: "I can fly, but only downwards, at walking speed, and only when I am already falling.",
    note: "Flight reduced to a slightly slower accident.",
  },
  {
    text: "I can turn invisible, but only to people who were not looking at me anyway.",
    note: "The classic gag, included to be scored down for familiarity.",
  },
  {
    text: "I can summon a perfectly folded fitted sheet, but only when nobody needs one.",
    note: "A miracle of housekeeping with impeccably bad timing.",
  },
  {
    text: "I can see five seconds into the future, but only while I am asleep.",
    note: "Foresight that only ever arrives in dreams, where it cannot be used.",
  },
  {
    text: "I can make any vending machine give me exactly what I want, but only when it is already empty.",
    note: "Perfect command over a machine with nothing left to give.",
  },
];

/* ------------------------------------------------------------------ */
/* Scoring helpers                                                     */
/* ------------------------------------------------------------------ */

/** Split a line into words, ignoring punctuation. */
function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/** Clamp a number into the 0..10 range. */
function clamp10(n: number): number {
  if (n < 0) return 0;
  if (n > 10) return 10;
  return n;
}

/**
 * Words that mark a power as familiar — the gags the judge explicitly
 * names as tired (slow flight, invisible while nobody watches) and
 * their close cousins. A candidate carrying one loses novelty points.
 */
const FAMILIAR_GAG_WORDS: string[] = [
  "fly",
  "flying",
  "flight",
  "invisible",
  "invisibility",
  "super strength",
  "x-ray",
  "laser eyes",
  "super speed",
];

/**
 * Words that signal a catch — the turn that makes the power useless.
 * "only", "but", "except", "after", "already", "never" and friends
 * are the hinges every good entry in this field turns on.
 */
const CATCH_WORDS: string[] = [
  "only",
  "but",
  "except",
  "never",
  "already",
  "after",
  "while",
  "unless",
  "nobody",
  "once",
];

/**
 * Concrete, picture-making nouns and numbers. A line that names a
 * real object, place, or quantity scores higher on specificity than
 * one that stays abstract.
 */
const CONCRETE_WORDS: string[] = [
  "queue",
  "traffic",
  "light",
  "goldfish",
  "umbrella",
  "tea",
  "password",
  "dolphin",
  "houseplant",
  "houseplants",
  "cone",
  "appliance",
  "appliances",
  "tuesday",
  "tuesdays",
  "yesterday",
  "sheet",
  "inches",
  "second",
];

/** Count how many words from a list appear in a word list. */
function countHits(words: string[], list: string[]): number {
  let hits = 0;
  for (const w of words) {
    if (list.includes(w)) hits += 1;
  }
  return hits;
}

/** Does the text contain any word from the list (substring-safe)? */
function containsAny(text: string, list: string[]): boolean {
  const lower = text.toLowerCase();
  for (const item of list) {
    if (lower.includes(item)) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* The scorer: one function per published criterion                    */
/* ------------------------------------------------------------------ */

/**
 * Criterion 1 — genuinely useless (weight 5).
 *
 * A useless power is one whose catch cancels the benefit entirely:
 * the power works, but only where, when, or for whom it cannot help.
 * Score from the presence of a catch hinge ("only", "but", "except",
 * "already", "after", "never") plus a timing or target limiter
 * ("once a day", "once a year", "five minutes after", "behind mine",
 * "yesterday"). A line with no catch at all scores low: it may be a
 * real power.
 */
function scoreUselessness(text: string, words: string[]): number {
  let score = 3.0;
  const catchHits = countHits(words, CATCH_WORDS);
  score += Math.min(catchHits, 4) * 1.25;
  if (containsAny(text, ["once a day", "once a year", "once,"])) score += 1.0;
  if (containsAny(text, ["after", "already", "yesterday", "behind mine"])) {
    score += 1.0;
  }
  if (containsAny(text, ["cannot", "can't", "nobody"])) score += 0.5;
  return clamp10(score);
}

/**
 * Criterion 2 — the joke lands (weight 4).
 *
 * The reader must picture the power in use and laugh at how little
 * it achieves. The funniest entries put a grand power next to a
 * tiny, mundane outcome: weather for yesterday, a queue behind
 * yours, rain inside an umbrella. Score from the contrast between
 * a big power verb ("predict", "teleport", "pause time", "read
 * minds", "fly", "summon", "turn invisible") and a small, mundane
 * payoff, plus a concrete scene the reader can picture.
 */
function scoreHumour(text: string, words: string[]): number {
  const bigPowerVerbs: string[] = [
    "predict",
    "teleport",
    "pause",
    "read minds",
    "fly",
    "summon",
    "invisible",
    "detect",
    "speak",
    "hear",
    "remember",
    "change",
    "make",
    "turn",
    "heat",
  ];
  const mundanePayoffs: string[] = [
    "queue",
    "yesterday",
    "umbrella",
    "tea",
    "password",
    "dust",
    "traffic cone",
    "cone",
    "sheet",
    "goldfish",
    "houseplant",
    "houseplants",
    "dolphin",
    "behind mine",
  ];
  let score = 2.0;
  if (containsAny(text, bigPowerVerbs)) score += 2.0;
  if (containsAny(text, mundanePayoffs)) score += 2.5;
  const concreteHits = countHits(words, CONCRETE_WORDS);
  score += Math.min(concreteHits, 3) * 0.75;
  // A second catch compounds the joke: two ways the power fails.
  const catchHits = countHits(words, CATCH_WORDS);
  if (catchHits >= 3) score += 1.0;
  return clamp10(score);
}

/**
 * Criterion 3 — unexpected (weight 3).
 *
 * Start at a high base: every candidate here was written fresh for
 * this brief. Then dock points for the familiar gags the judge
 * names outright (slow flight, invisible while nobody watches) and
 * for near-cousins, and dock a little for the most common joke
 * shapes (mind-reading, time-pausing) that other entrants will
 * also reach for.
 */
function scoreNovelty(text: string, words: string[]): number {
  let score = 8.5;
  if (containsAny(text, FAMILIAR_GAG_WORDS)) score -= 4.0;
  // Note: do not dock "fly" again here — FAMILIAR_GAG_WORDS already
  // covers it (substring match catches "flying" too), and docking
  // twice would punish the flight gag harder than the invisibility
  // gag for no reason.
  if (containsAny(text, ["read minds", "pause time", "detect lies"])) {
    score -= 1.5;
  }
  // A power aimed at an oddly specific object is harder to copy.
  const concreteHits = countHits(words, CONCRETE_WORDS);
  if (concreteHits >= 2) score += 0.5;
  return clamp10(score);
}

/**
 * Criterion 4 — tight and specific (weight 2).
 *
 * Concrete details fix the power in the world: a number ("three
 * inches", "one second", "five minutes"), a named object ("traffic
 * light", "fitted sheet", "traffic cone"), a named day ("Tuesdays").
 * Vague lines score low; lines carrying two or more concrete
 * details score high. Over-long lines lose a point for sprawl.
 */
function scoreSpecificity(text: string, words: string[]): number {
  let score = 3.0;
  const concreteHits = countHits(words, CONCRETE_WORDS);
  score += Math.min(concreteHits, 4) * 1.25;
  if (/\d/.test(text)) score += 1.0;
  if (containsAny(text, ["three inches", "one second", "five minutes"])) {
    score += 1.0;
  }
  if (containsAny(text, ["tuesdays", "yesterday", "goldfish"])) score += 0.5;
  if (words.length > 22) score -= 1.0;
  return clamp10(score);
}

/**
 * Criterion 5 — clear on a single reading (weight 1).
 *
 * One sentence, one idea, plain words. Lines under 100 characters
 * with a single sentence and no subordinate pile-up read fastest.
 * Lines with two or more commas or a second "and" clause lose a
 * point for making the reader work.
 */
function scoreClarity(text: string, words: string[]): number {
  let score = 8.0;
  if (text.length > 110) score -= 1.5;
  if (text.length > 130) score -= 1.5;
  const commaCount = (text.match(/,/g) ?? []).length;
  if (commaCount >= 2) score -= 1.0;
  if (commaCount >= 3) score -= 1.0;
  const andCount = words.filter((w) => w === "and").length;
  if (andCount >= 2) score -= 1.0;
  if (!text.endsWith(".")) score -= 1.0;
  return clamp10(score);
}

/** Weights follow the judge's priority order: 5, 4, 3, 2, 1. */
const WEIGHTS = {
  uselessness: 5,
  humour: 4,
  novelty: 3,
  specificity: 2,
  clarity: 1,
} as const;

/** Score one candidate on all five criteria and total it. */
function scoreCandidate(candidate: Candidate): ScoredCandidate {
  const words = wordsOf(candidate.text);
  const scores: CriterionScores = {
    uselessness: scoreUselessness(candidate.text, words),
    humour: scoreHumour(candidate.text, words),
    novelty: scoreNovelty(candidate.text, words),
    specificity: scoreSpecificity(candidate.text, words),
    clarity: scoreClarity(candidate.text, words),
  };
  const weightedSum =
    scores.uselessness * WEIGHTS.uselessness +
    scores.humour * WEIGHTS.humour +
    scores.novelty * WEIGHTS.novelty +
    scores.specificity * WEIGHTS.specificity +
    scores.clarity * WEIGHTS.clarity;
  const weightTotal =
    WEIGHTS.uselessness +
    WEIGHTS.humour +
    WEIGHTS.novelty +
    WEIGHTS.specificity +
    WEIGHTS.clarity;
  return { candidate, scores, total: weightedSum / weightTotal };
}

/** Rank every candidate, best first. Ties break on the shorter line. */
function rankCandidates(candidates: Candidate[]): ScoredCandidate[] {
  const scored = candidates.map(scoreCandidate);
  scored.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.candidate.text.length - b.candidate.text.length;
  });
  return scored;
}

/* ------------------------------------------------------------------ */
/* The gate                                                            */
/* ------------------------------------------------------------------ */

/**
 * The sealed scorer's gate, as published: entry.txt must be UTF-8
 * text of 1 to 140 characters, not only white space — plus the
 * brief's own rule that the entry is a single line. Returns an
 * error message, or null when the text passes.
 */
function gateError(text: string): string | null {
  if (text.length < 1) return "entry is empty";
  if (text.length > 140) {
    return `entry is ${text.length} characters, over the 140 limit`;
  }
  if (text.trim().length === 0) return "entry is only white space";
  if (text.includes("\n") || text.includes("\r")) {
    return "entry spans more than one line";
  }
  return null;
}

/** Count characters the way the gate does: UTF-16 code units. */
function charCount(text: string): number {
  return text.length;
}

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

/** Where the entry goes: $MAKEFUN_OUTPUT_DIR, else /output. */
function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;
  return "/output";
}

/** Format one scored candidate as a readable log line. */
function formatScored(rank: number, s: ScoredCandidate): string {
  const c = s.scores;
  return (
    `${String(rank).padStart(2, " ")}. [${s.total.toFixed(2)}] ` +
    `U${c.uselessness.toFixed(1)} H${c.humour.toFixed(1)} ` +
    `N${c.novelty.toFixed(1)} S${c.specificity.toFixed(1)} ` +
    `C${c.clarity.toFixed(1)} (${s.candidate.text.length} chars) ` +
    `"${s.candidate.text}"`
  );
}

/** Print the full ranking table to stdout. */
function printRanking(ranked: ScoredCandidate[]): void {
  console.log(`Scored ${ranked.length} candidates against the judge's brief.`);
  console.log("Weights: uselessness x5, humour x4, novelty x3, specificity x2, clarity x1.");
  console.log("U=uselessness H=humour N=novelty S=specificity C=clarity.");
  for (let i = 0; i < ranked.length; i += 1) {
    console.log(formatScored(i + 1, ranked[i]));
  }
}

/**
 * Write the winning line to entry.txt, read it back, and verify the
 * bytes on disk are exactly the line we chose. Throws on any
 * mismatch so a bad write can never pass silently.
 */
function writeAndVerify(dir: string, text: string): string {
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "entry.txt");
  fs.writeFileSync(filePath, text, { encoding: "utf8" });
  const readBack = fs.readFileSync(filePath, { encoding: "utf8" });
  if (readBack !== text) {
    throw new Error(
      `verification failed: read back ${JSON.stringify(readBack)} ` +
        `but expected ${JSON.stringify(text)}`,
    );
  }
  const bytes = fs.readFileSync(filePath);
  const expectedBytes = Buffer.from(text, "utf8");
  if (!bytes.equals(expectedBytes)) {
    throw new Error("verification failed: bytes on disk differ from the entry");
  }
  return filePath;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

function main(): void {
  const ranked = rankCandidates(CANDIDATES);
  printRanking(ranked);

  const winner = ranked[0];
  const text = winner.candidate.text;

  console.log("");
  console.log(`Winner: "${text}"`);
  console.log(`Characters: ${charCount(text)} (limit 140)`);
  console.log(`Note: ${winner.candidate.note}`);

  const error = gateError(text);
  if (error !== null) {
    throw new Error(`gate failed for the winning entry: ${error}`);
  }
  console.log("Gate: PASS (1-140 chars, single line, not only white space)");

  const dir = outputDir();
  const filePath = writeAndVerify(dir, text);
  console.log(`Wrote and verified: ${filePath}`);
  console.log("Done.");
}

main();
