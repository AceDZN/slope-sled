// Level data model. Coordinates in meters: x = horizontal distance (grows left → right), y = altitude.

export interface ParamSpec {
  /** Value the player cannot change (shown on the card). */
  fixed?: number;
  /** Pick among big buttons instead of a dial (tutorial levels). */
  choices?: number[];
  min?: number;
  max?: number;
  step?: number;
  /** Starting value of the dial. */
  initial?: number;
}

export interface SegmentSpec {
  id: string;
  /** Nominal x-interval; inner ends are replaced by the joints (intersections). */
  x0: number;
  x1: number;
  m: ParamSpec;
  b: ParamSpec;
  /** The whole segment is given (drawn in full, not editable). */
  given?: boolean;
  /** Ride launches into the air off this segment's end (finish kicker). */
  launch?: boolean;
  /** Short Hebrew name shown on the card, e.g. "ירידה", "האגם הקפוא". */
  name?: string;
}

/** Joint between segment i and i+1: their lines must cross inside [z0, z1]. */
export interface JointSpec {
  zone: [number, number];
}

/** A gate (snow arch) the track must pass through at x: |y(x) − y| ≤ tol. */
export interface GateSpec {
  kind: 'gate';
  id: string;
  x: number;
  y: number;
  tol?: number;
  /** Hide the coordinate label (transfer levels). */
  hideLabel?: boolean;
  /** 'flag' gates are plain flags; 'cable' is the old lift cable point; 'meet' is a meeting point. */
  look?: 'arch' | 'flag' | 'cable' | 'meet';
}

/**
 * Linear inequality the track must satisfy on [x0, x1]:
 * side 'above' → y_track ≥ m x + b (rocks, ridges); 'below' → y_track ≤ m x + b (branches, ice bridges, avalanche).
 * strict turns ≥/≤ into >/<.
 */
export interface ConstraintSpec {
  kind: 'constraint';
  id: string;
  side: 'above' | 'below';
  m: number;
  b: number;
  x0: number;
  x1: number;
  strict?: boolean;
  look: 'rocks' | 'branch' | 'bridge' | 'avalanche' | 'ridge' | 'cornice';
}

export type ObjectSpec = GateSpec | ConstraintSpec;

/** A rival/dog line raced next to you. */
export interface RivalSpec {
  who: 'dog' | 'friend' | 'ghost' | 'rival';
  m: number;
  b: number;
  x0: number;
  x1: number;
  /** What the race needs between your line and theirs over [x0, x1]. */
  goal?: 'cross' | 'parallel' | 'same';
  /** Show the rival's line as a graph only (two readable grid points), not its equation. */
  graphOnly?: boolean;
}

export interface FinishSpec {
  x: number;
  y: number;
  tol?: number;
  look?: 'lodge' | 'hut' | 'powder';
}

export interface HintSpec {
  /** Points to highlight on the grid. */
  points?: Array<[number, number]>;
  /** Inequality boundaries to highlight (ids of constraints). */
  boundaries?: string[];
  /** One short Hebrew sentence; never the equation. */
  text: string;
}

export interface StageSpec {
  id: string;
  /** Hebrew instruction line for this stage (race 1/2/3 in level 16). */
  brief?: string;
  segments: SegmentSpec[];
  /** joints[i] connects segments[i] and segments[i+1]. */
  joints: JointSpec[];
  objects: ObjectSpec[];
  rival?: RivalSpec;
  finish: FinishSpec;
  /** Data table instead of grid labels (transfer level 5). */
  table?: { xs: number[]; ys: number[] };
  /** Coach's altitude graph silhouette (level 17), as points. */
  shapeGraph?: Array<[number, number]>;
  hint?: HintSpec;
}

export interface LevelSpec {
  id: number;
  world: 1 | 2 | 3 | 4;
  title: string;
  /** One-line Hebrew goal. */
  goal: string;
  /** Show the full line while building (tutorial only). */
  fullPreview?: boolean;
  noHints?: boolean;
  transfer?: boolean;
  mood?: 'day' | 'night' | 'dusk';
  /** Grid extent. */
  view: { x0: number; x1: number; y0: number; y1: number };
  stages: StageSpec[];
  /** Curriculum module slugs (see CURRICULUM.md). */
  modules: string[];
}

/** The player's chosen parameters for one stage, per segment. */
export type StageParams = Array<{ m: number; b: number }>;
