// Saved stars/unlocks and anonymous local learning events (localStorage only; safe when storage is blocked).

const KEY = 'slope-sled:v1';
const LOG_KEY = 'slope-sled:log:v1';

export interface Progress {
  stars: Record<number, number>;
  /** Best style score per level (generated runs: 100 + world). */
  best: Record<number, number>;
  /** Lesson cards already shown. */
  seenLessons: string[];
  /** Fresh / expert runs completed per world (keys like "fresh-2", "expert-3"). */
  runs: Record<string, number>;
  flakes: number;
  muted: boolean;
  reducedMotion: boolean;
}

export interface LearningEvent {
  t: number;
  level: number;
  stage: string;
  action: 'ride' | 'hint' | 'restart';
  params?: Array<{ m: number; b: number }>;
  outcome?: string;
  hintUsed: boolean;
  build: number;
  /** First unaided decision on this level (first ride, no hint). */
  firstUnaided: boolean;
}

export function starsFor(builds: number, hintUsed: boolean): number {
  let s = 3;
  if (hintUsed) s--;
  if (builds >= 2) s--;
  if (builds >= 4) s--;
  return Math.max(1, s);
}

export function loadProgress(): Progress {
  const empty: Progress = { stars: {}, best: {}, seenLessons: [], runs: {}, flakes: 0, muted: false, reducedMotion: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage blocked: progress lives for this session only */
  }
}

export class LearningLog {
  events: LearningEvent[] = [];
  constructor() {
    try {
      this.events = JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]');
    } catch {
      this.events = [];
    }
  }
  add(e: LearningEvent): void {
    this.events.push(e);
    if (this.events.length > 500) this.events.splice(0, this.events.length - 500);
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(this.events));
    } catch {
      /* in-memory only */
    }
  }
}

export function unlocked(p: Progress, id: number): boolean {
  return id === 1 || (p.stars[id - 1] ?? 0) > 0 || (p.stars[id] ?? 0) > 0;
}
