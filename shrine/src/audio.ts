import { assets } from './assets';
export const cues = {
  welcome: 'Let us help our friend. Tap Play!',
  demo: 'Watch the knight. Two squares, then one to the side. All in one jump!',
  tapKnight: 'Your turn! Tap the knight.',
  choose: 'Tap a square to jump to.',
  dangerIntro: 'Reach the star. Watch out for red squares. The golem can reach them.',
  battleIntro: 'Try it yourself! Jump to capture the golem. Tap it to see the danger squares.',
  danger: 'The golem is a rook. It moves in straight lines: up, down, left, or right. Look for the warning marks.',
  invalid: 'Not that square. Two squares, then one to the side. Try again!',
  enemy: 'Golem turn. Watch closely.',
  yourTurn: 'Your turn!',
  lost: 'The golem can reach that square. Tap Undo and try a new path.',
  undo: 'Back to your last turn. Try a new move!',
  hint: 'Look at the glowing squares. The knight can jump there.',
  hintDanger: 'Warning marks show where the golem can reach.',
  hintPath: 'Try the square with a little star.',
  success: 'Hooray! You did it. Let us go on!',
  complete: 'You freed the golem! Well done, little hero!',
  two: 'Two squares',
  turn: 'Then one to the side',
} as const;
export type Cue = keyof typeof cues;
export class GameAudio {
  enabled = true;
  last: Cue = 'welcome';
  private speech: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private active = new Set<OscillatorNode>();
  onUnavailable?: () => void;
  constructor(enabled = true) { this.enabled = enabled; if ('speechSynthesis' in window) speechSynthesis.getVoices(); }
  unlock() { try { this.ctx ??= new AudioContext(); void this.ctx.resume(); } catch { /* Visual cues still work. */ } }
  stop() { this.speech?.pause(); this.speech = null; if ('speechSynthesis' in window) speechSynthesis.cancel(); for (const o of this.active) { try { o.stop(); } catch {} } this.active.clear(); }
  say(id: Cue) {
    this.last = id;
    if (!('speechSynthesis' in window)) { this.onUnavailable?.(); return; }
    speechSynthesis.cancel();
    if (!this.enabled) return;
    const voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('en'));
    if (!voice) { this.onUnavailable?.(); return; }
    const utterance = new SpeechSynthesisUtterance(cues[id]);
    utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = .85;
    utterance.onerror = () => this.onUnavailable?.();
    speechSynthesis.speak(utterance);
  }
  effect(kind: 'tap' | 'jump' | 'hit' | 'win') {
    if (!this.enabled) return;
    this.unlock(); if (!this.ctx) return;
    const frequencies = kind === 'win' ? [523, 659, 784, 1046] : kind === 'jump' ? [330, 523] : kind === 'hit' ? [130, 90] : [620];
    const t = this.ctx.currentTime;
    frequencies.forEach((f, i) => {
      const o = this.ctx!.createOscillator(), g = this.ctx!.createGain();
      o.type = kind === 'hit' ? 'triangle' : 'sine'; o.frequency.setValueAtTime(f, t + i * .13);
      g.gain.setValueAtTime(.05, t + i * .13); g.gain.exponentialRampToValueAtTime(.001, t + i * .13 + .22);
      o.connect(g); g.connect(this.ctx!.destination); this.active.add(o);
      o.onended = () => { this.active.delete(o); o.disconnect(); g.disconnect(); };
      o.start(t + i * .13); o.stop(t + i * .13 + .23);
    });
  }
}
