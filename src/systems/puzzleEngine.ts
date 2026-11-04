import type { PuzzleDef, PuzzleProgress } from '../types/game';

export type AnswerResult =
  | { kind: 'correct'; assisted: boolean }
  | { kind: 'retry'; hintKey: string; hintLevel: number; remainingChoices: string[] }
  | { kind: 'ignored' }; // duplicate / invalid input, never counted against the child

export const newProgress = (): PuzzleProgress => ({ attempts: 0, hintLevel: 0, solved: false, assisted: false });

/** After this many mistakes the encounter is simplified, then assisted. */
export const SIMPLIFY_AFTER = 2;
export const ASSIST_AFTER = 4;

/** Deterministic display order so answer correctness never depends on graphic position. */
export function displayOrder(p: PuzzleDef, seed: number): string[] {
  const ids = p.choices.map((c) => c.id);
  let s = (seed >>> 0) || 1;
  for (let i = ids.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

/** Choices still shown: wrong distractors are removed once the child has struggled. */
export function visibleChoices(p: PuzzleDef, prog: PuzzleProgress): string[] {
  const all = p.choices.map((c) => c.id);
  if (typeof p.correctAnswer !== 'string' || prog.attempts < SIMPLIFY_AFTER) return all;
  return all.filter((id) => id === p.correctAnswer);
}

function sameSeq(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Single-choice puzzles (sound-picture, matching). */
export function answerChoice(p: PuzzleDef, prog: PuzzleProgress, choiceId: string): AnswerResult {
  if (prog.solved || typeof p.correctAnswer !== 'string') return { kind: 'ignored' };
  if (!p.choices.some((c) => c.id === choiceId)) return { kind: 'ignored' };
  if (choiceId === p.correctAnswer) return solve(prog);
  return miss(p, prog);
}

/** Pattern / sequence puzzles: the child's placed tiles so far. Only a full wrong fill counts as a miss. */
export function answerSequence(p: PuzzleDef, prog: PuzzleProgress, placed: string[]): AnswerResult {
  if (prog.solved || !Array.isArray(p.correctAnswer)) return { kind: 'ignored' };
  const target = p.correctAnswer;
  if (placed.length < target.length) return { kind: 'ignored' }; // still placing
  return sameSeq(placed.slice(0, target.length), target) ? solve(prog) : miss(p, prog);
}

/**
 * Counting with one-to-one correspondence: each object can be counted once.
 * `counted` is the set of object ids already tapped; duplicates are ignored (T09).
 */
export function countTap(
  p: PuzzleDef,
  prog: PuzzleProgress,
  counted: Set<string>,
  objectId: string
): { result: 'counted' | 'duplicate' | 'done'; number: number } {
  if (prog.solved) return { result: 'duplicate', number: counted.size };
  if (counted.has(objectId)) return { result: 'duplicate', number: counted.size };
  counted.add(objectId);
  if (typeof p.correctAnswer === 'number' && counted.size >= p.correctAnswer) {
    solve(prog);
    return { result: 'done', number: counted.size };
  }
  return { result: 'counted', number: counted.size };
}

function solve(prog: PuzzleProgress): AnswerResult {
  prog.solved = true;
  prog.assisted = prog.attempts >= ASSIST_AFTER;
  return { kind: 'correct', assisted: prog.assisted };
}

function miss(p: PuzzleDef, prog: PuzzleProgress): AnswerResult {
  prog.attempts += 1;
  prog.hintLevel = Math.min(p.hintKeys.length, prog.hintLevel + 1);
  return {
    kind: 'retry',
    hintKey: p.hintKeys[Math.min(prog.hintLevel, p.hintKeys.length) - 1],
    hintLevel: prog.hintLevel,
    remainingChoices: visibleChoices(p, prog)
  };
}

/** "Let's do it together": the correct answer to animate once the child has needed help. */
export function assistedSolution(p: PuzzleDef, prog: PuzzleProgress): string | string[] | number | null {
  return prog.attempts >= ASSIST_AFTER ? p.correctAnswer : null;
}

/** Every key a puzzle needs to be fully spoken. Used by the narration coverage test. */
export function narrationKeysFor(p: PuzzleDef): string[] {
  return [p.narrationKey, ...p.hintKeys, ...p.choices.map((c) => c.narrationKey), `success_${p.id}`];
}
