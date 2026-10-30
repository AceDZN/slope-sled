import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import './style.css';
import { Game } from './game/game.ts';

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (ms: number) => void;
    __game: Game;
  }
}

const root = document.getElementById('game')!;
const boot = document.getElementById('boot')!;
const msg = document.getElementById('boot-msg')!;
const game = new Game(root);
window.__game = game;

let manual = false;
let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!manual) game.update(dt);
  game.render();
  requestAnimationFrame(frame);
}

window.render_game_to_text = () => game.textState();
/** Deterministic stepping for tests: advances in fixed 1/60 s frames (respects pause). */
window.advanceTime = (ms: number) => {
  manual = true;
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) game.update(1 / 60);
  game.render();
};

new ResizeObserver(() => game.resize()).observe(root);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (game.mode === 'ride' || game.mode === 'swoop')) game.setPaused(true);
});
window.addEventListener('blur', () => {
  if (game.mode === 'ride' || game.mode === 'swoop') game.setPaused(true);
});
const canvas = game.world.renderer.domElement;
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  msg.textContent = 'התצוגה התאפסה — טוען מחדש…';
  root.appendChild(boot);
});
canvas.addEventListener('webglcontextrestored', () => location.reload());

game
  .init((f) => (msg.textContent = `טוען את ההר… ${Math.round(f * 100)}%`))
  .then(() => {
    boot.remove();
    requestAnimationFrame(frame);
  })
  .catch((err) => {
    msg.textContent = 'שגיאה בטעינה';
    console.error(err);
  });
