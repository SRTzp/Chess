export type Cell = { x: number; y: number };
export type Stage = 0 | 1 | 2;
export type Phase = 'intro' | 'demo' | 'player' | 'enemy' | 'won' | 'lost';
export type Board = { knight: Cell; rook: Cell | null; alive: boolean; patrol: number; round: number };
export type State = Board & { stage: Stage; phase: Phase; selected: boolean; hints: number; showThreats: boolean; attempts: number; undos: number };
export const SIZE = 6;
export const same = (a: Cell | null, b: Cell | null) => !!a && !!b && a.x === b.x && a.y === b.y;
export const inside = (p: Cell) => Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.x < SIZE && p.y >= 0 && p.y < SIZE;
export const copy = <T>(value: T): T => structuredClone(value);
export const cells: Cell[] = Array.from({ length: SIZE * SIZE }, (_, i) => ({ x: i % SIZE, y: Math.floor(i / SIZE) }));
export const knightMoves = (p: Cell): Cell[] => [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].map(([x, y]) => ({ x: p.x + x, y: p.y + y })).filter(inside);
export const rookAttacks = (rook: Cell | null, p: Cell) => !!rook && !same(rook, p) && (rook.x === p.x || rook.y === p.y);
export const threats = (board: Board) => cells.filter(p => rookAttacks(board.rook, p));
export const GOALS: Record<0 | 1, Cell> = { 0: { x: 2, y: 2 }, 1: { x: 3, y: 3 } };
const PATROL: Cell[] = [{ x: 5, y: 1 }, { x: 5, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 1 }];
export const LESSONS = [
  { name: 'Jump to the Star', label: 'Watch and Try', cue: 'tapKnight', help: 1 },
  { name: 'Watch the Golem', label: 'Spot the Danger', cue: 'dangerIntro', help: 1 },
  { name: 'Free the Golem', label: 'Try It Yourself', cue: 'battleIntro', help: 0 },
] as const;

export function initial(stage: Stage): State {
  return { stage, phase: 'intro', knight: { x: 1, y: 4 }, rook: stage === 0 ? null : { x: 5, y: stage === 1 ? 2 : 1 }, alive: true, patrol: 1, round: 0, selected: false, hints: LESSONS[stage].help, showThreats: stage === 1, attempts: 0, undos: 0 };
}

// The training enemy always follows the same visible patrol. No random difficulty,
// no hidden teleportation: capture if the knight is in its rook line, else patrol.
export function enemyReply(board: Board): Board {
  const next = copy(board);
  if (!next.rook || !next.alive) return next;
  if (rookAttacks(next.rook, next.knight)) {
    next.rook = copy(next.knight); next.alive = false; return next;
  }
  let destination = PATROL[next.patrol];
  if (same(destination, next.rook)) { next.patrol = (next.patrol + 1) % PATROL.length; destination = PATROL[next.patrol]; }
  // Stage 1 enters the same patrol from f4, along the f-file.
  if (!rookAttacks(next.rook, destination)) throw new Error('Invalid rook patrol segment');
  next.rook = copy(destination); next.patrol = (next.patrol + 1) % PATROL.length;
  return next;
}

export function simulateRound(board: Board, to: Cell): Board | null {
  if (!board.alive || !knightMoves(board.knight).some(p => same(p, to))) return null;
  const moved = copy(board); moved.knight = copy(to); moved.round++;
  if (same(moved.rook, to)) { moved.rook = null; return moved; }
  return enemyReply(moved);
}

// A deterministic small search provides hints that account for the enemy reply.
// It is not the enemy policy and does not change difficulty behind the player.
export function solution(board: Board, stage: Stage, maxDepth = 12): Cell[] | null {
  const queue: { b: Board; path: Cell[] }[] = [{ b: copy(board), path: [] }];
  const seen = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const { b, path } = queue[i];
    if (path.length >= maxDepth) continue;
    for (const p of knightMoves(b.knight)) {
      const next = simulateRound(b, p)!;
      if (!next.alive) continue;
      const route = [...path, p];
      if (stage === 2 ? next.rook === null : same(p, GOALS[stage])) return route;
      const key = `${p.x},${p.y}|${next.rook?.x},${next.rook?.y}|${next.patrol}`;
      if (!seen.has(key)) { seen.add(key); queue.push({ b: next, path: route }); }
    }
  }
  return null;
}

export class LessonGame {
  state: State;
  private history: State[] = [];
  constructor(stage: Stage = 0) { this.state = initial(stage); }
  get canUndo() { return this.history.length > 0; }
  get snapshot() { return copy(this.state); }
  reset(stage: Stage = this.state.stage) { this.state = initial(stage); this.history = []; }
  begin() { if (this.state.phase === 'intro') this.state.phase = this.state.stage === 0 ? 'demo' : 'player'; }
  finishDemo() { if (this.state.phase === 'demo') this.state.phase = 'player'; }
  select() { if (this.state.phase === 'player') this.state.selected = true; }
  inspectEnemy() { this.state.showThreats = !this.state.showThreats; }
  hint() { this.state.hints = Math.min(3, this.state.hints + 1); if (this.state.hints >= 2) this.state.showThreats = true; }
  move(to: Cell): { accepted: boolean; from?: Cell; capture?: boolean } {
    const s = this.state;
    if (s.phase !== 'player' || !s.selected) return { accepted: false };
    if (!inside(to) || !knightMoves(s.knight).some(p => same(p, to))) { s.attempts++; return { accepted: false }; }
    this.history.push(this.snapshot);
    const from = copy(s.knight); s.knight = copy(to); s.round++; s.selected = false;
    const capture = same(s.rook, to);
    if (capture) s.rook = null;
    s.phase = s.rook ? 'enemy' : this.reachedGoal() ? 'won' : 'player';
    return { accepted: true, from, capture };
  }
  reply() {
    if (this.state.phase !== 'enemy') return;
    const b = enemyReply(this.state);
    Object.assign(this.state, { rook: b.rook, alive: b.alive, patrol: b.patrol });
    this.state.phase = !b.alive ? 'lost' : this.reachedGoal() ? 'won' : 'player';
  }
  undo() {
    if (!this.canUndo) return false;
    const undos = this.state.undos + 1, attempts = this.state.attempts, hints = this.state.hints;
    this.state = this.history.pop()!;
    Object.assign(this.state, { phase: 'player', selected: false, undos, attempts, hints });
    return true;
  }
  private reachedGoal() { return this.state.stage === 2 ? !this.state.rook : same(this.state.knight, GOALS[this.state.stage]); }
}
