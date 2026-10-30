// Game controller: build ↔ ride loop, HUD, camera direction, saved progress, test hooks.
import * as THREE from 'three';
import { World } from '../scene/world.ts';
import { Labels } from '../scene/labels.ts';
import { Course, SEG_CSS, RIVAL_Z } from '../scene/course.ts';
import { Assets } from '../scene/assets.ts';
import { Rider, Dog } from '../scene/characters.ts';
import { Fx } from '../scene/fx.ts';
import { Sound } from '../audio.ts';
import { LEVELS, levelById } from '../math/levels.ts';
import { buildTrack, trackY, fogVisibleRange, type Track } from '../math/track.ts';
import { RideSim, type RideOutcome } from '../math/ride.ts';
import { snap } from '../math/line.ts';
import { equation, num, riseRun, ltr, point } from '../math/format.ts';
import type { LevelSpec, ParamSpec, StageParams, StageSpec } from '../math/types.ts';
import { explain, CHEERS, type Explanation } from './explain.ts';
import { loadProgress, saveProgress, starsFor, unlocked, LearningLog, type Progress } from './progress.ts';

type Mode = 'title' | 'select' | 'build' | 'swoop' | 'ride' | 'crash' | 'result';

const WORLD_NAMES: Record<number, [string, string]> = {
  1: ['גבעת הארנבים', 'שיפוע וקצב השתנות'],
  2: ['יער האורנים', 'האיבר החופשי ומשוואת ישר'],
  3: ['גן הסלעים', 'אי-שוויונות'],
  4: ['שבילים תאומים', 'מערכת משוואות ופתרון גרפי'],
};

const ICON = {
  pause: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7" stroke="#fff" stroke-width="2" fill="none"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#fff" stroke-width="2" fill="none"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6" stroke="#fff" stroke-width="2.2"/></svg>',
  mtn: '<svg class="mtn" viewBox="0 0 46 28"><path d="M0 28 L14 6 L20 14 L28 2 L46 28Z" fill="#cfe2ff"/><path d="M14 6 L18 12 L14 11 L11 12Z M28 2 L33 10 L28 8 L24 10Z" fill="#fff"/><path d="M4 28 L8 20 L12 28Z M36 28 L40 18 L44 28Z" fill="#1f4d3a"/></svg>',
};

function initialParam(p: ParamSpec): number {
  if (p.fixed !== undefined) return p.fixed;
  if (p.initial !== undefined) return p.initial;
  if (p.choices) return p.choices[Math.floor(p.choices.length / 2)];
  return p.min !== undefined && p.max !== undefined ? snap((p.min + p.max) / 2, p.step ?? 0.5) : 0;
}

function editable(p: ParamSpec): boolean {
  return p.fixed === undefined;
}

export class Game {
  readonly world: World;
  readonly labels: Labels;
  readonly assets = new Assets();
  course!: Course;
  rider!: Rider;
  dog!: Dog;
  rivalDog: Dog | null = null;
  rivalSled: Rider | null = null;
  readonly fx = new Fx();
  readonly sound = new Sound();
  progress: Progress = loadProgress();
  readonly log = new LearningLog();

  mode: Mode = 'title';
  paused = false;
  level!: LevelSpec;
  stageIdx = 0;
  params: StageParams = [];
  chosen: boolean[] = [];
  selected = 0;
  builds = 0;
  hintUsed = false;
  hintOn = false;
  sim: RideSim | null = null;
  outcome: RideOutcome | null = null;
  explanation: Explanation | null = null;
  lastStars = 0;
  private modeT = 0;
  private swoopFrom = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
  private camLook = new THREE.Vector3();
  private camPos = new THREE.Vector3();
  private shake = 0;
  private timeScale = 1;
  // ride input & style
  tuck = false;
  private leanTarget = 0;
  leanZ = 0;
  private trickT = -1;
  tricks = 0;
  flakes = 0;
  private flakeMeshes: THREE.Mesh[] = [];
  private crashT = 0;
  private crashAt = new THREE.Vector3();
  private crashVel = new THREE.Vector3();
  private finishFx = false;
  private passedGates = new Set<string>();

  private hud: HTMLDivElement;
  private root: HTMLElement;
  private els: Record<string, HTMLElement> = {};
  private keyRepeat: number | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.world = new World(root);
    this.labels = new Labels(root);
    this.hud = document.createElement('div');
    this.hud.className = 'hud';
    root.appendChild(this.hud);
    this.world.scene.add(this.fx.group);
    this.sound.muted = this.progress.muted;
    this.world.reducedMotion = this.fx.reduced = this.progress.reducedMotion;
  }

  async init(onProgress: (f: number) => void): Promise<void> {
    await this.assets.load('./models/', onProgress);
    this.course = new Course(this.labels, this.assets);
    this.world.scene.add(this.course.group);
    this.rider = new Rider(this.assets);
    this.dog = new Dog(this.assets);
    this.world.scene.add(this.rider.root, this.dog.root);
    this.bindInput();
    this.world.resize();
    // A scenic backdrop behind the title screen.
    this.loadLevel(1, false);
    this.setMode('title');
  }

  // ---------------- level & state ----------------
  get stage(): StageSpec {
    return this.level.stages[this.stageIdx];
  }

  loadLevel(id: number, toBuild = true): void {
    this.level = levelById(id);
    this.stageIdx = 0;
    this.builds = 0;
    this.hintUsed = false;
    this.loadStage();
    if (toBuild) this.setMode('build');
  }

  private loadStage(): void {
    const st = this.stage;
    this.params = st.segments.map((s) => ({ m: initialParam(s.m), b: initialParam(s.b) }));
    this.chosen = st.segments.map((s) => !s.m.choices);
    this.selected = Math.max(0, st.segments.findIndex((s) => !s.given));
    this.hintOn = false;
    this.world.setMood(this.level.mood ?? 'day');
    this.course.load(this.level, st);
    this.setupRival();
    this.redrawBuild();
  }

  private setupRival(): void {
    for (const r of [this.rivalDog?.root, this.rivalSled?.root]) if (r) this.world.scene.remove(r);
    this.rivalDog = this.rivalSled = null;
    const rv = this.stage.rival;
    if (!rv) return;
    if (rv.who === 'dog') {
      this.rivalDog = this.dog;
    } else {
      this.rivalSled = new Rider(this.assets);
      this.rivalSled.root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && rv.who === 'ghost') {
          const mat = (m.material as THREE.MeshStandardMaterial).clone();
          mat.transparent = true;
          mat.opacity = 0.45;
          mat.emissive = new THREE.Color(0x6fb8ff);
          mat.emissiveIntensity = 0.6;
          m.material = mat;
        }
      });
      this.world.scene.add(this.rivalSled.root);
    }
  }

  get track(): Track {
    return buildTrack(this.stage, this.params);
  }

  private redrawBuild(): void {
    const tr = this.track;
    const drawable = this.chosen.every(Boolean);
    this.course.drawTrack(tr, { mode: 'build', fullPreview: !!this.level.fullPreview && drawable, selected: this.selected });
    if (!drawable) this.course.drawTrack({ ...tr, pieces: [] }, { mode: 'build', fullPreview: false, selected: 0 });
    const y0 = trackY(tr, tr.x0);
    this.course.placeStart(tr.x0, y0);
    this.placeRiderAt(tr.x0, y0, Math.atan(tr.pieces[0].line.m), 0);
    this.rider.setPose('idle');
    this.dog.setPose('sit');
    if (!this.stage.rival || this.stage.rival.who !== 'dog') {
      this.dog.root.position.set(tr.x0 - 1.4, y0, 0.9);
      this.dog.root.rotation.set(0, 0, 0);
    } else this.placeRivalAt(this.stage.rival.x0);
    if (this.rivalSled && this.stage.rival) this.placeRivalAt(this.stage.rival.x0);
    this.course.showHint(this.hintOn);
  }

  private placeRiderAt(x: number, y: number, angle: number, z: number): void {
    this.rider.root.position.set(x, y, z);
    this.rider.root.rotation.set(0, 0, angle);
  }

  private placeRivalAt(x: number): void {
    const rv = this.stage.rival;
    if (!rv) return;
    const xx = Math.min(rv.x1, Math.max(rv.x0, x));
    const y = rv.m * xx + rv.b;
    const obj = this.rivalDog?.root ?? this.rivalSled?.root;
    if (!obj) return;
    obj.position.set(xx, y, RIVAL_Z);
    obj.rotation.set(0, 0, Math.atan(rv.m));
  }

  setMode(m: Mode): void {
    this.mode = m;
    this.modeT = 0;
    this.renderHud();
  }

  // ---------------- param editing ----------------
  setParam(seg: number, key: 'm' | 'b', value: number): void {
    const spec = this.stage.segments[seg][key];
    if (!editable(spec) || this.stage.segments[seg].given) return;
    let v = value;
    if (spec.choices) v = value;
    else {
      v = snap(v, spec.step ?? (key === 'm' ? 0.05 : 0.5));
      v = Math.min(spec.max ?? (key === 'm' ? 3 : 60), Math.max(spec.min ?? (key === 'm' ? -3 : -20), v));
    }
    if (this.params[seg][key] === v && this.chosen[seg]) return;
    const up = v > this.params[seg][key];
    this.params[seg][key] = v;
    if (key === 'm') this.chosen[seg] = true;
    this.sound.tick(up);
    this.redrawBuild();
    this.updateCards();
  }

  nudge(key: 'm' | 'b', dir: number, big = false): void {
    const seg = this.selected;
    const spec = this.stage.segments[seg][key];
    if (spec.choices) {
      const i = spec.choices.indexOf(this.params[seg][key]);
      const j = Math.min(spec.choices.length - 1, Math.max(0, (this.chosen[seg] ? i : 1) + dir));
      this.setParam(seg, key, spec.choices[j]);
      return;
    }
    const step = (spec.step ?? (key === 'm' ? 0.05 : 0.5)) * (big ? 5 : 1);
    this.setParam(seg, key, this.params[seg][key] + dir * step);
  }

  selectSeg(i: number): void {
    const segs = this.stage.segments;
    if (i < 0 || i >= segs.length || segs[i].given) return;
    this.selected = i;
    this.sound.click();
    this.redrawBuild();
    this.updateCards();
  }

  useHint(): void {
    if (this.level.noHints || !this.stage.hint || this.mode !== 'build' && this.mode !== 'result') return;
    if (!this.hintUsed) {
      this.hintUsed = true;
      this.log.add({ t: Date.now(), level: this.level.id, stage: this.stage.id, action: 'hint', hintUsed: true, build: this.builds, firstUnaided: false });
    }
    this.hintOn = true;
    this.sound.click();
    if (this.mode === 'result') this.backToBuild();
    else {
      this.course.showHint(true);
      this.renderHud();
    }
  }

  // ---------------- ride ----------------
  go(): void {
    if (this.mode !== 'build' || !this.chosen.every(Boolean)) return;
    this.sound.unlock();
    this.sound.go();
    this.builds++;
    this.sim = new RideSim(this.stage, this.params.map((p) => ({ ...p })));
    this.outcome = null;
    this.explanation = null;
    this.tricks = 0;
    this.flakes = 0;
    this.leanZ = 0;
    this.leanTarget = 0;
    this.trickT = -1;
    this.finishFx = false;
    this.passedGates.clear();
    this.timeScale = 1;
    this.course.showHint(false);
    this.course.clearMarker();
    this.course.drawTrack(this.sim.judgement.track, { mode: 'ride', fullPreview: false, selected: -1 });
    this.spawnFlakes(this.sim.judgement.track);
    this.swoopFrom.pos.copy(this.world.camera.position);
    this.swoopFrom.quat.copy(this.world.camera.quaternion);
    this.world.camera.clearViewOffset();
    this.rider.setPose('ride');
    this.dog.setPose('run');
    this.sound.bark();
    this.setMode('swoop');
  }

  private spawnFlakes(tr: Track): void {
    for (const f of this.flakeMeshes) this.world.scene.remove(f);
    this.flakeMeshes = [];
    const geo = new THREE.OctahedronGeometry(0.28);
    const mat = new THREE.MeshStandardMaterial({ color: 0xbff4ff, emissive: 0x5fd8ff, emissiveIntensity: 1.2, metalness: 0.2, roughness: 0.2 });
    let k = 0;
    for (let x = tr.x0 + 5; x < tr.x1 - 2; x += 3.2) {
      const z = [0, -0.7, -0.7, 0, 0.7, 0.7][k++ % 6];
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, trackY(tr, x) + 0.75, z);
      m.userData.alive = true;
      this.flakeMeshes.push(m);
      this.world.scene.add(m);
    }
  }

  private updateRide(dt: number): void {
    const sim = this.sim!;
    const prevPhase = sim.state.phase;
    sim.advance(dt * 1000);
    const s = sim.state;
    // Lean: lateral position on the ribbon (style only).
    this.leanZ += (this.leanTarget - this.leanZ) * Math.min(1, dt * 6);
    const air = s.phase === 'air';
    const angle = air ? Math.atan2(s.vy, s.v * Math.cos(s.angle)) * 0.5 : s.angle;
    this.placeRiderAt(s.x, s.y, angle, this.leanZ);
    this.rider.setPose(this.tuck && !air ? 'tuck' : 'ride');
    if (this.trickT >= 0) {
      this.trickT += dt;
      const k = Math.min(1, this.trickT / 0.7);
      this.rider.body.rotation.z = k * Math.PI * 2;
      if (k >= 1) {
        this.trickT = -1;
        this.rider.body.rotation.z = 0;
      }
    }
    // Dog sprints beside you (or on its own line when it is the rival).
    const rv = this.stage.rival;
    if (rv) {
      this.placeRivalAt(s.x);
      if (this.rivalDog) this.dog.setPose('run');
    }
    if (!rv || rv.who !== 'dog') {
      const d = this.dog.root.position;
      const tx = s.x - 1.1;
      d.x += (tx - d.x) * Math.min(1, dt * 5);
      d.y = air ? d.y : trackY(sim.judgement.track, Math.max(sim.judgement.track.x0, d.x));
      d.z = 0.95;
      this.dog.root.rotation.set(0, 0, s.angle);
    }
    // Snowflakes collected by lean.
    for (const f of this.flakeMeshes) {
      if (!f.userData.alive) continue;
      f.rotation.y += dt * 3;
      if (s.x >= f.position.x && s.x - f.position.x < 1.5) {
        if (Math.abs(f.position.z - this.leanZ) < 0.55) {
          f.userData.alive = false;
          f.visible = false;
          this.flakes++;
          this.sound.tick(true);
          this.fx.sparkles(f.position.clone());
        }
      }
    }
    // Gates passed: chime.
    for (const o of this.stage.objects) {
      if (o.kind === 'gate' && !this.passedGates.has(o.id) && s.x > o.x && s.phase !== 'crash') {
        this.passedGates.add(o.id);
        this.sound.gate();
      }
    }
    const fwd = new THREE.Vector3(Math.cos(s.angle), Math.sin(s.angle), 0);
    if (!air && s.phase === 'ride') this.fx.spray(this.rider.root.position.clone().add(new THREE.Vector3(-0.6, 0.1, 0)), fwd, s.v * (this.tuck ? 1.3 : 1), dt, this.leanTarget - this.leanZ);
    this.sound.wind(s.phase === 'ride' || air ? s.v : 0);
    const sl = this.els.speedlines;
    if (sl) sl.style.opacity = String(Math.min(0.9, Math.max(0, (s.v - 6) / 10) + (this.tuck ? 0.2 : 0)));
    this.updateRideHud();

    if (s.phase === 'air' && prevPhase !== 'air') this.sound.whoosh();
    if (sim.outcome && sim.done) this.onRideEnd(sim.outcome);
    else if (sim.outcome && !sim.outcome.ok && sim.outcome.reason === 'stall' && prevPhase === 'ride') this.sound.stall();
  }

  private onRideEnd(o: RideOutcome): void {
    this.outcome = o;
    this.sound.wind(0);
    this.explanation = explain(o, this.stage);
    this.log.add({
      t: Date.now(),
      level: this.level.id,
      stage: this.stage.id,
      action: 'ride',
      params: this.params.map((p) => ({ ...p })),
      outcome: o.ok ? 'success' : o.reason === 'stall' ? 'stall' : o.hazard.kind,
      hintUsed: this.hintUsed,
      build: this.builds,
      firstUnaided: this.builds === 1 && !this.hintUsed,
    });
    if (o.ok) {
      this.sound.land();
      this.sound.win();
      this.rider.setPose('cheer');
      this.dog.setPose('jump');
      this.fx.sparkles(this.rider.root.position.clone().add(new THREE.Vector3(0, 1, 0)));
      this.fx.burst(this.rider.root.position.clone(), 0.5);
      this.popup(CHEERS[this.level.id % CHEERS.length]);
      this.progress.flakes += this.flakes;
      this.setMode('crash'); // reuse the slow orbit for a short celebration
      this.timeScale = 1;
    } else {
      this.crashAt.copy(this.rider.root.position);
      const s = this.sim!.state;
      this.crashVel.set(Math.max(2, s.v * 0.6), 4 + s.v * 0.25, (Math.random() - 0.5) * 2);
      if (o.reason === 'hazard') {
        this.sound.crash();
        this.fx.burst(this.crashAt, 1);
        this.shake = 0.6;
        this.timeScale = this.world.reducedMotion ? 1 : 0.3;
      } else {
        this.crashVel.set(-1, 1.5, 0);
        this.timeScale = 1;
      }
      this.rider.setPose('fall');
      this.dog.setPose('idle');
      const tr = this.sim!.judgement.track;
      if (o.reason === 'hazard') {
        const h = o.hazard;
        this.course.drawTrack(tr, { mode: 'replay', fullPreview: false, selected: -1, badSeg: h.seg });
        this.course.showMarker(h.x, h.trackY, ['never-met', 'not-tandem', 'tangled'].includes(h.kind) ? null : h.needY);
      } else {
        this.course.drawTrack(tr, { mode: 'replay', fullPreview: false, selected: -1, badSeg: o.seg });
        this.course.showMarker(o.x, o.y, null);
      }
      this.setMode('crash');
    }
  }

  private finishLevelStage(): void {
    const last = this.stageIdx === this.level.stages.length - 1;
    if (last) {
      const stars = starsFor(this.builds, this.hintUsed);
      this.lastStars = stars;
      const prev = this.progress.stars[this.level.id] ?? 0;
      this.progress.stars[this.level.id] = Math.max(prev, stars);
    }
    saveProgress(this.progress);
    this.setMode('result');
    if (last && this.outcome?.ok) for (let i = 0; i < this.lastStars; i++) setTimeout(() => this.sound.star(i), 250 + i * 220);
  }

  backToBuild(): void {
    this.sim = null;
    this.course.clearMarker();
    this.rider.body.rotation.set(0, 0, 0);
    this.rider.kidHolder.rotation.set(0, 0, 0);
    for (const f of this.flakeMeshes) this.world.scene.remove(f);
    this.flakeMeshes = [];
    this.redrawBuild();
    this.setMode('build');
  }

  next(): void {
    if (this.stageIdx < this.level.stages.length - 1) {
      this.stageIdx++;
      this.sim = null;
      this.course.clearMarker();
      this.loadStage();
      this.setMode('build');
      return;
    }
    const nextId = this.level.id + 1;
    if (LEVELS.some((l) => l.id === nextId)) this.loadLevel(nextId);
    else this.setMode('select');
  }

  restartLevel(): void {
    this.log.add({ t: Date.now(), level: this.level.id, stage: this.stage.id, action: 'restart', hintUsed: this.hintUsed, build: this.builds, firstUnaided: false });
    this.paused = false;
    this.loadLevel(this.level.id);
  }

  // ---------------- per-frame ----------------
  update(dtReal: number): void {
    if (this.paused) return;
    this.modeT += dtReal;
    const dt = dtReal * this.timeScale;
    const cam = this.world.camera;
    if (this.mode === 'build' || this.mode === 'title' || this.mode === 'select') {
      this.course.setGridOpacity(this.mode === 'build' ? 1 : 0.35);
      this.frameBuild(dtReal, this.mode !== 'build');
    } else if (this.mode === 'swoop') {
      const k = Math.min(1, this.modeT / 1.3);
      const e = k * k * (3 - 2 * k);
      this.course.setGridOpacity(1 - e);
      this.labels.hidden = e > 0.5;
      const target = this.chasePose();
      cam.position.lerpVectors(this.swoopFrom.pos, target.pos, e);
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(target.pos, target.look, new THREE.Vector3(0, 1, 0)));
      cam.quaternion.slerpQuaternions(this.swoopFrom.quat, q, e);
      cam.fov = 40 + e * 18;
      cam.updateProjectionMatrix();
      this.camPos.copy(target.pos);
      this.camLook.copy(target.look);
      if (k >= 1) this.setMode('ride');
    } else if (this.mode === 'ride') {
      this.updateRide(dt);
      const t = this.chasePose();
      const lag = Math.min(1, dtReal * 4);
      this.camPos.lerp(t.pos, lag);
      this.camLook.lerp(t.look, Math.min(1, dtReal * 6));
      cam.position.copy(this.camPos);
      cam.lookAt(this.camLook);
      const v = this.sim?.state.v ?? 0;
      cam.fov = 58 + Math.min(14, v * 0.8) + (this.tuck ? 4 : 0);
      cam.updateProjectionMatrix();
    } else if (this.mode === 'crash') {
      this.updateCrash(dt, dtReal);
    }
    if (this.shake > 0 && !this.world.reducedMotion) {
      cam.position.x += (Math.random() - 0.5) * this.shake;
      cam.position.y += (Math.random() - 0.5) * this.shake;
      this.shake = Math.max(0, this.shake - dtReal * 1.5);
    }
    this.rider.update(dt, this.mode === 'ride' ? this.leanZ - this.leanTarget : 0);
    this.dog.update(dt, this.sim?.state.v ?? 0);
    this.rivalSled?.update(dt, 0);
    this.fx.update(dt);
    this.course.update(dtReal);
    this.world.update(dtReal);
    this.world.aimSun(this.mode === 'ride' || this.mode === 'swoop' ? this.rider.root.position : this.viewCenter());
    if (this.mode !== 'ride' && this.mode !== 'swoop') this.labels.hidden = this.mode === 'title';
  }

  private updateCrash(dt: number, dtReal: number): void {
    const sim = this.sim!;
    const o = this.outcome!;
    const cam = this.world.camera;
    if (o.ok) {
      // Celebration: keep simulating the landing, orbit slowly, then results.
      if (!sim.done) sim.advance(dt * 1000);
      const p = this.rider.root.position;
      const a = this.modeT * 0.35;
      const want = new THREE.Vector3(p.x - 6 * Math.cos(a), p.y + 3.2, 6 * Math.sin(a) + 4);
      cam.position.lerp(want, Math.min(1, dtReal * 2.5));
      cam.lookAt(p.x, p.y + 0.8, 0);
      // Dog leaps into your lap.
      const d = this.dog.root.position;
      const k = Math.min(1, this.modeT / 0.8);
      d.lerp(new THREE.Vector3(p.x + 0.1, p.y + 0.45 + Math.sin(k * Math.PI) * 1.4, 0.2), Math.min(1, dtReal * 6));
      if (this.modeT > 2.0) this.finishLevelStage();
      return;
    }
    // Wipeout: fling the kid, slow motion, swing to the side camera with the grid back.
    this.crashT += dt;
    if (o.reason === 'stall') {
      if (!sim.done) sim.advance(dt * 1000);
      const s = sim.state;
      this.placeRiderAt(s.x, s.y, s.angle, this.leanZ);
    } else {
      const t = Math.min(this.modeT * this.timeScale, 1.6);
      const kid = this.rider.kidHolder;
      kid.position.set(this.crashVel.x * t, this.crashVel.y * t - 4.2 * t * t + 0.2, this.crashVel.z * t + (this.rider.usingTripo ? 0 : 0));
      kid.rotation.set(t * 3, 0, -t * 5);
      this.rider.body.rotation.z = Math.min(1, t) * 2.4;
    }
    if (this.modeT > 0.5) this.timeScale = Math.min(1, this.timeScale + dtReal * 0.8);
    const k = Math.min(1, this.modeT / 1.2);
    this.course.setGridOpacity(k);
    this.labels.hidden = k < 0.5;
    const c = this.crashAt;
    const side = new THREE.Vector3(c.x - 3, c.y + 4, 24);
    cam.position.lerp(side, Math.min(1, dtReal * 2.2));
    this.camLook.lerp(new THREE.Vector3(c.x, c.y, 0), Math.min(1, dtReal * 3));
    cam.lookAt(this.camLook);
    cam.fov += (40 - cam.fov) * Math.min(1, dtReal * 2);
    cam.updateProjectionMatrix();
    if (this.modeT > 2.2 && this.mode === 'crash') {
      this.crashT = 0;
      this.finishLevelStage();
    }
  }

  private chasePose(): { pos: THREE.Vector3; look: THREE.Vector3 } {
    const p = this.rider.root.position;
    const s = this.sim?.state;
    const a = s && s.phase !== 'air' ? s.angle : 0;
    const back = 7.2;
    const pos = new THREE.Vector3(p.x - back * Math.cos(a), p.y - back * Math.sin(a) + 3.0, 2.4);
    const look = new THREE.Vector3(p.x + 6 * Math.cos(a), p.y + 6 * Math.sin(a) + 0.6, -0.3);
    return { pos, look };
  }

  private viewCenter(): THREE.Vector3 {
    const v = this.level.view;
    return new THREE.Vector3((v.x0 + v.x1) / 2, (v.y0 + v.y1) / 2, 0);
  }

  /** Frame the level's grid in the space the HUD leaves free, from an elevated three-quarter angle. */
  private frameBuild(dt: number, drift: boolean): void {
    const cam = this.world.camera;
    const W = Math.max(1, this.root.clientWidth);
    const H = Math.max(1, this.root.clientHeight);
    const narrow = W <= 760;
    const panel = this.mode === 'build' && this.els.panel ? this.els.panel.getBoundingClientRect() : null;
    let offX = 0;
    let offY = 0;
    let availW = W;
    let availH = H - 120;
    if (panel && panel.width > 0) {
      if (narrow) {
        offY = panel.height / 2;
        availH = H - panel.height - 100;
      } else {
        offX = (panel.width + 14) / 2;
        availW = W - panel.width - 40;
      }
    }
    if (this.mode === 'build' && this.els.choices && !narrow) availH -= 90;
    const v = this.level.view;
    const bw = v.x1 - v.x0 + 9;
    const bh = v.y1 - v.y0 + 6;
    const fov = 40;
    const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const aspect = Math.max(0.3, availW / Math.max(1, availH));
    const d = Math.max((bh / 2) / t * (H / Math.max(1, availH)), (bw / 2) / (t * aspect) * (H / Math.max(1, availH))) * 1.02;
    const center = new THREE.Vector3((v.x0 + v.x1) / 2 + 2.5, (v.y0 + v.y1) / 2 + 1.2 - (this.mode === 'build' && this.els.choices && !narrow ? bh * 0.06 : 0), 0);
    const yaw = drift ? Math.sin(performance.now() * 0.00015) * 0.25 : -0.16;
    const dir = new THREE.Vector3(Math.sin(yaw), 0.3, Math.cos(yaw)).normalize();
    const want = center.clone().addScaledVector(dir, d);
    const k = this.modeT < 0.05 ? 1 : Math.min(1, dt * 3.5);
    cam.position.lerp(want, k);
    this.camLook.lerp(center, k);
    cam.lookAt(this.camLook);
    cam.fov = fov;
    if (offX || offY) cam.setViewOffset(W, H, offX, offY, W, H);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }

  render(): void {
    this.world.render();
    this.labels.update(this.world.camera, this.root.clientWidth, this.root.clientHeight);
  }

  resize(): void {
    this.world.resize();
  }

  // ---------------- HUD ----------------
  private popup(text: string): void {
    const el = document.createElement('div');
    el.className = 'popup';
    el.textContent = text;
    this.hud.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  private topBar(): string {
    const stars = this.progress.stars[this.level.id] ?? 0;
    const st = [0, 1, 2].map((i) => `<span class="star ${i < stars ? 'on' : ''}">★</span>`).join('');
    const hint = this.level.noHints || !this.stage.hint ? '' : `<button class="hint-btn" data-a="hint" aria-label="רמז (עולה כוכב)" title="רמז (עולה כוכב)" ${this.mode !== 'build' ? 'disabled' : ''}>💡</button>`;
    return `<div class="tl"><button class="round" data-a="pause" aria-label="השהיה">${ICON.pause}</button><button class="round" data-a="mute" aria-label="השתקה">${this.sound.muted ? ICON.mute : ICON.sound}</button></div>
      <div class="tr"><div class="pill">${ICON.mtn}<div class="lvname"><b>שלב ${this.level.id}</b> : ${this.level.title}</div><div class="stars">${st}</div></div>${hint}</div>`;
  }

  renderHud(): void {
    const h = this.hud;
    this.els = {};
    if (this.mode === 'title') {
      h.innerHTML = `<div class="overlay"><div class="title-card"><h1>מזחלת <span>השיפוע</span></h1>
        <p>בונים מסלול מזחלות על החרמון מקווים ישרים ${ltr('y = mx + b')} — ואז גולשים בו!</p>
        <button class="btn primary" data-a="play">שחקו</button><button class="btn secondary" data-a="select">בחירת שלב</button></div></div>`;
    } else if (this.mode === 'select') {
      h.innerHTML = this.selectHtml();
    } else if (this.mode === 'build') {
      h.innerHTML = this.topBar() + this.buildHtml();
    } else if (this.mode === 'swoop' || this.mode === 'ride') {
      h.innerHTML = this.topBar() + this.rideHtml();
    } else if (this.mode === 'crash') {
      h.innerHTML = this.topBar() + (this.outcome?.ok ? '' : '<div class="replay">הילוך חוזר ◀◀</div>');
    } else if (this.mode === 'result') {
      h.innerHTML = this.topBar() + this.resultHtml();
    }
    if (this.paused) h.insertAdjacentHTML('beforeend', this.pauseHtml());
    h.querySelectorAll<HTMLElement>('[data-el]').forEach((e) => (this.els[e.dataset.el!] = e));
    if (this.mode === 'build') this.updateCards();
  }

  private buildHtml(): string {
    const st = this.stage;
    const lv = this.level;
    let html = `<div class="goal">${st.brief ? `<span class="brief">${st.brief}</span>` : ''}${lv.goal}</div>`;
    if (this.hintOn && st.hint) html += `<div class="hint-text">💡 ${st.hint.text}</div>`;
    const choiceSeg = st.segments.findIndex((s) => s.m.choices);
    if (choiceSeg >= 0 && st.segments.length === 1) {
      const s = st.segments[choiceSeg];
      html += `<div class="choices" data-el="choices"><p>בחרו את השיפוע של המסלול:</p><div class="opts">${s.m.choices!
        .map((c) => `<button class="choice" data-a="choice" data-v="${c}">${ltr(c === 0.5 ? '+½' : c === -0.5 ? '−½' : num(c))}</button>`)
        .join('')}</div></div>`;
    } else {
      html += `<div class="panel" data-el="panel"><h2>מקטעים</h2>${st.segments.map((s, i) => this.cardHtml(i)).join('')}</div>`;
    }
    if (st.table) {
      html += `<div class="table-card"><h3>הטבלה של המדריך</h3><table><tr><th>x</th>${st.table.xs.map((x) => `<td>${num(x)}</td>`).join('')}</tr><tr><th>y</th>${st.table.ys.map((y) => `<td>${num(y)}</td>`).join('')}</tr></table></div>`;
    }
    if (st.shapeGraph) html += `<div class="shape-card"><h3>גרף הגובה של המאמן</h3>${this.shapeSvg(st.shapeGraph)}</div>`;
    html += `<button class="go" data-a="go" data-el="go">סע!<small>${ltr('Enter')}</small></button>`;
    return html;
  }

  private shapeSvg(pts: Array<[number, number]>): string {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(0, ...ys), y1 = Math.max(...ys);
    const W = 220, H = 120, P = 18;
    const sx = (x: number) => P + ((x - x0) / (x1 - x0 || 1)) * (W - 2 * P);
    const sy = (y: number) => H - P - ((y - y0) / (y1 - y0 || 1)) * (H - 2 * P);
    const poly = pts.map((p) => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ');
    const dots = pts.map((p) => `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="3.5" fill="#ff7a1a"/><text x="${sx(p[0])}" y="${sy(p[1]) - 7}" font-size="10" text-anchor="middle" fill="#12203f">(${num(p[0])}, ${num(p[1])})</text>`).join('');
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" direction="ltr"><line x1="${P}" y1="${H - P}" x2="${W - 4}" y2="${H - P}" stroke="#8aa" /><line x1="${P}" y1="${H - P}" x2="${P}" y2="4" stroke="#8aa"/><polyline points="${poly}" fill="none" stroke="#1f62d6" stroke-width="3"/>${dots}</svg>`;
  }

  private cardHtml(i: number): string {
    const s = this.stage.segments[i];
    const c = SEG_CSS[i % SEG_CSS.length];
    const given = !!s.given;
    const mEd = !given && editable(s.m);
    const bEd = !given && editable(s.b);
    const p = this.stage.segments[i];
    const xa = i === 0 ? p.x0 : null;
    return `<div class="card ${given ? 'given' : ''}" data-a="sel" data-i="${i}" style="--c:${c}" data-el="card${i}">
      <div class="head"><div class="num">${i + 1}</div><div class="eq" data-el="eq${i}"></div></div>
      ${s.name ? `<div class="name">${s.name}${given ? ' · נתון' : ''}</div>` : given ? '<div class="name">מקטע נתון</div>' : ''}
      ${mEd ? `<div class="row"><div class="lab">שיפוע ${ltr('m')}<small>${ltr('Δy / Δx')}</small></div>
        <div class="knob" data-knob="${i}"><i data-el="knob${i}"></i></div>
        <button class="step" data-a="m-" data-i="${i}" aria-label="הקטנת שיפוע">−</button><div class="val" data-el="mv${i}"></div><button class="step" data-a="m+" data-i="${i}" aria-label="הגדלת שיפוע">+</button></div>
        <div class="row"><div class="riserun" data-el="rr${i}"></div></div>
        <input class="slider" type="range" min="${s.m.min ?? -3}" max="${s.m.max ?? 3}" step="${s.m.step ?? 0.05}" data-slider="m" data-i="${i}" aria-label="שיפוע">` : ''}
      ${bEd ? `<div class="row"><div class="lab">האיבר החופשי ${ltr('b')}</div><button class="step" data-a="b-" data-i="${i}" aria-label="הקטנת b">−</button><div class="val" data-el="bv${i}"></div><button class="step" data-a="b+" data-i="${i}" aria-label="הגדלת b">+</button></div>` : ''}
      <div class="range" data-el="rng${i}">${xa !== null ? '' : ''}</div></div>`;
  }

  private updateCards(): void {
    const st = this.stage;
    st.segments.forEach((s, i) => {
      const p = this.params[i];
      const eq = this.els[`eq${i}`];
      if (eq) eq.innerHTML = ltr(equation(p.m, p.b));
      const mv = this.els[`mv${i}`];
      if (mv) mv.innerHTML = ltr(num(p.m));
      const bv = this.els[`bv${i}`];
      if (bv) bv.innerHTML = ltr(num(p.b));
      const rr = this.els[`rr${i}`];
      if (rr) {
        const r = riseRun(p.m);
        rr.innerHTML = `עלייה / ריצה: ${ltr(`${num(r.rise)} / ${r.run}`)} — כל ${ltr(String(r.run))} מ׳ ימינה, הגובה ${r.rise < 0 ? 'יורד' : r.rise > 0 ? 'עולה' : 'לא משתנה'}${r.rise !== 0 ? ` ב־${ltr(String(Math.abs(r.rise)))}` : ''}`;
      }
      const knob = this.els[`knob${i}`];
      if (knob) knob.style.transform = `rotate(${(p.m / 3) * 135}deg)`;
      const rng = this.els[`rng${i}`];
      if (rng) {
        const tr = this.track;
        const pc = tr.pieces[i];
        rng.innerHTML = `${ltr(`x ∈ [${num(pc.xa, 2)}, ${num(pc.xb, 2)}]`)}${!s.given && !this.level.fullPreview ? ` · ערפל: רואים רק ${ltr('15%')}` : ''}`;
      }
      const card = this.els[`card${i}`];
      card?.classList.toggle('sel', i === this.selected && !s.given);
      const slider = this.hud.querySelector<HTMLInputElement>(`input[data-slider="m"][data-i="${i}"]`);
      if (slider && document.activeElement !== slider) slider.value = String(p.m);
    });
    this.hud.querySelectorAll<HTMLElement>('.choice').forEach((b) => b.classList.toggle('on', this.chosen[0] && Number(b.dataset.v) === this.params[0].m));
    const go = this.els.go as HTMLButtonElement | undefined;
    if (go) go.disabled = !this.chosen.every(Boolean);
    if (go) go.style.opacity = this.chosen.every(Boolean) ? '1' : '0.55';
  }

  private rideHtml(): string {
    return `<div class="speedlines" data-el="speedlines"></div>
      <div class="altg"><div class="t">גובה (מ׳)</div><div data-el="alt"></div></div>
      <div class="flakes">❄ <span data-el="flk">0</span></div>
      <div class="speedo"><svg viewBox="0 0 170 170" width="100%" height="100%"><circle cx="85" cy="85" r="80" fill="rgba(12,28,64,0.85)" stroke="#9fd8ff55" stroke-width="3"/>
        <path d="M 30 130 A 70 70 0 1 1 140 130" fill="none" stroke="#ffffff22" stroke-width="10" stroke-linecap="round"/>
        <path data-el="arc" d="M 30 130 A 70 70 0 1 1 140 130" fill="none" stroke="url(#sg)" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100"/>
        <defs><linearGradient id="sg"><stop offset="0" stop-color="#35d0ff"/><stop offset="0.7" stop-color="#ffe27a"/><stop offset="1" stop-color="#ff5a4e"/></linearGradient></defs></svg>
        <div class="num"><bdi dir="ltr" data-el="kmh">0</bdi></div><div class="unit">קמ״ש</div></div>
      <div class="ride-btns">
        <button class="rb trick" data-a="trick" aria-label="טריק"><div><span>★</span>טריק</div></button>
        <button class="rb lean" data-a="lean" aria-label="הטיה"><div><span>⇄</span>הטה</div></button>
        <button class="rb tuck" data-hold="tuck" aria-label="התכופפות"><div><span>⬇</span>התכופף</div></button>
      </div>`;
  }

  private updateRideHud(): void {
    const s = this.sim?.state;
    if (!s) return;
    const kmh = Math.round(Math.abs(s.v) * 3.6);
    if (this.els.kmh) this.els.kmh.textContent = String(kmh);
    if (this.els.arc) this.els.arc.setAttribute('stroke-dasharray', `${Math.min(100, (kmh / 80) * 100)} 100`);
    if (this.els.flk) this.els.flk.textContent = String(this.flakes);
    const alt = this.els.alt;
    if (alt) {
      const v = this.level.view;
      const W = 230, H = 84;
      const sx = (x: number) => 6 + ((x - v.x0) / (v.x1 - v.x0)) * (W - 12);
      const sy = (y: number) => H - 6 - ((y - v.y0) / (v.y1 - v.y0)) * (H - 12);
      if (!alt.dataset.ready) {
        const tr = this.sim!.judgement.track;
        const lines = tr.pieces
          .map((p, i) => `<line x1="${sx(p.xa)}" y1="${sy(p.line.m * p.xa + p.line.b)}" x2="${sx(p.xb)}" y2="${sy(p.line.m * p.xb + p.line.b)}" stroke="${SEG_CSS[i % 4]}" stroke-width="3" stroke-linecap="round"/>`)
          .join('');
        alt.innerHTML = `<svg width="${W}" height="${H}" direction="ltr"><line x1="6" y1="${H - 6}" x2="${W - 4}" y2="${H - 6}" stroke="#ffffff66"/>${lines}<circle data-dot r="4.5" fill="#fff" stroke="#14244a" stroke-width="2"/></svg>`;
        alt.dataset.ready = '1';
      }
      const dot = alt.querySelector('[data-dot]');
      dot?.setAttribute('cx', String(sx(s.x)));
      dot?.setAttribute('cy', String(sy(s.y)));
    }
  }

  private resultHtml(): string {
    const o = this.outcome;
    const ex = this.explanation;
    if (!o || !ex) return '';
    if (o.ok) {
      const last = this.stageIdx === this.level.stages.length - 1;
      const stars = last ? [0, 1, 2].map((i) => `<span class="star ${i < this.lastStars ? 'on' : ''}">★</span>`).join('') : '';
      const nextLabel = last ? (LEVELS.some((l) => l.id === this.level.id + 1) ? 'לשלב הבא' : 'למפה') : 'למרוץ הבא';
      return `<div class="result win"><h1>${last ? 'יש!' : 'הצלחה!'}</h1><h2>${last ? 'הגעתם לבקתה' : `מקטע ${this.stageIdx + 1} מתוך ${this.level.stages.length}`}</h2>
        ${last ? `<div class="bigstars">${stars}</div>` : ''}
        <div class="box"><div class="txt">המסלול: ${this.params.map((p, i) => `<div>${i + 1}. ${ltr(equation(p.m, p.b))}</div>`).join('')}
        <div class="meta" style="color:#4b5b80">ניסיונות: ${ltr(String(this.builds))}${this.hintUsed ? ' · השתמשתם ברמז' : ''} · ❄ ${ltr(String(this.flakes))}${this.tricks ? ` · טריקים: ${ltr(String(this.tricks))}` : ''}</div></div></div>
        <div class="btns"><button class="btn primary" data-a="next">${nextLabel}</button><button class="btn secondary" data-a="retry">שוב</button></div></div>`;
    }
    const rows = ex.rows.map(([l, v, tone]) => `<div><span>${l}</span><span class="${tone}">${v}</span></div>`).join('');
    const canHint = !this.level.noHints && !!this.stage.hint;
    return `<div class="result"><h1>${ex.title}</h1><h2>${ex.subtitle}</h2>
      <div class="box">${rows ? `<div class="cmp">${rows}</div>` : ''}<div class="txt">${ex.text}</div></div>
      <div class="btns"><button class="btn primary" data-a="retry">↻ נסו שוב</button>${canHint ? `<button class="btn secondary" data-a="hint">💡 רמז</button>` : ''}</div></div>`;
  }

  private selectHtml(): string {
    const total = Object.values(this.progress.stars).reduce((a, b) => a + b, 0);
    let cur = 1;
    for (const l of LEVELS) if (unlocked(this.progress, l.id)) cur = l.id;
    const worlds = [1, 2, 3, 4]
      .map((w) => {
        const flags = LEVELS.filter((l) => l.world === w)
          .map((l) => {
            const un = unlocked(this.progress, l.id);
            const s = this.progress.stars[l.id] ?? 0;
            return `<button class="flag ${un ? '' : 'locked'} ${l.id === cur ? 'current' : ''}" data-a="level" data-i="${l.id}" ${un ? '' : 'disabled'}>
              <div class="n">${un ? l.id : '🔒'}</div><div class="ft">${l.title}${l.transfer ? ' ⛰' : ''}</div><div class="fs">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</div></button>`;
          })
          .join('');
        return `<div class="world"><h3>${WORLD_NAMES[w][0]}</h3><div class="sub">${WORLD_NAMES[w][1]}</div><div class="flags">${flags}</div></div>`;
      })
      .join('');
    return `<div class="select"><div class="top"><h1>⛰ החרמון</h1><div class="pill"><div class="lvname">★ ${ltr(String(total))} / ${ltr(String(LEVELS.length * 3))} · ❄ ${ltr(String(this.progress.flakes))}</div></div></div>
      <div class="worlds">${worlds}</div>
      <div class="bottom"><div class="info">${ltr('x')} גדל משמאל לימין גם בממשק בעברית · שיפוע שלילי = ירידה</div><button class="btn primary" style="flex:none;min-width:180px" data-a="level" data-i="${cur}">שחקו</button></div></div>`;
  }

  private pauseHtml(): string {
    return `<div class="overlay" data-a="noop"><div class="pause-card"><h2>הפסקה</h2>
      <button class="btn primary" data-a="resume">המשך</button>
      <button class="btn secondary" style="flex:none" data-a="restart">התחלת השלב מחדש</button>
      <button class="btn secondary" style="flex:none" data-a="select">מפת השלבים</button>
      <label class="toggle">צלילים <input type="checkbox" data-t="sound" ${this.sound.muted ? '' : 'checked'}></label>
      <label class="toggle">תנועה מופחתת <input type="checkbox" data-t="motion" ${this.world.reducedMotion ? 'checked' : ''}></label></div></div>`;
  }

  setPaused(p: boolean): void {
    if (this.mode === 'title' || this.mode === 'select') p = false;
    this.paused = p;
    if (p) this.sound.wind(0);
    this.renderHud();
  }

  // ---------------- input ----------------
  private action(a: string, el: HTMLElement): void {
    this.sound.unlock();
    const i = Number(el.dataset.i);
    switch (a) {
      case 'play': {
        let first = 1;
        for (const l of LEVELS) if (unlocked(this.progress, l.id) && !(this.progress.stars[l.id] > 0)) { first = l.id; break; }
        this.sound.click();
        this.loadLevel(first);
        break;
      }
      case 'select': this.paused = false; this.sound.click(); this.setMode('select'); break;
      case 'level': this.sound.click(); this.loadLevel(i); break;
      case 'pause': this.setPaused(true); break;
      case 'resume': this.setPaused(false); break;
      case 'restart': this.restartLevel(); break;
      case 'mute':
        this.sound.setMuted(!this.sound.muted);
        this.progress.muted = this.sound.muted;
        saveProgress(this.progress);
        this.renderHud();
        break;
      case 'hint': this.useHint(); break;
      case 'go': this.go(); break;
      case 'choice': this.setParam(0, 'm', Number(el.dataset.v)); break;
      case 'sel': this.selectSeg(i); break;
      case 'm-': this.selected = i; this.nudge('m', -1); break;
      case 'm+': this.selected = i; this.nudge('m', 1); break;
      case 'b-': this.selected = i; this.nudge('b', -1); break;
      case 'b+': this.selected = i; this.nudge('b', 1); break;
      case 'retry': this.sound.click(); this.backToBuild(); break;
      case 'next': this.sound.click(); this.next(); break;
      case 'trick': this.trick(); break;
      case 'lean': this.leanTarget = this.leanTarget > 0 ? -0.7 : 0.7; break;
    }
  }

  private trick(): void {
    if (this.mode !== 'ride' || !this.sim) return;
    if (this.sim.state.phase === 'air' && this.trickT < 0) {
      this.trickT = 0;
      this.tricks++;
      this.sound.trick();
      this.popup('סלטה!');
    } else if (this.trickT < 0) {
      this.rider.body.position.y = 0.25;
      setTimeout(() => (this.rider.body.position.y = 0), 180);
    }
  }

  private bindInput(): void {
    const hud = this.hud;
    hud.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-a]');
      if (!t || (t as HTMLButtonElement).disabled) return;
      if (t.dataset.a === 'sel' && (e.target as HTMLElement).closest('button, input, .knob')) return;
      this.action(t.dataset.a!, t);
    });
    hud.addEventListener('change', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.dataset.t === 'sound') {
        this.sound.setMuted(!t.checked);
        this.progress.muted = this.sound.muted;
      } else if (t.dataset.t === 'motion') {
        this.world.reducedMotion = this.fx.reduced = t.checked;
        this.progress.reducedMotion = t.checked;
      }
      saveProgress(this.progress);
    });
    hud.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.dataset.slider) {
        this.selected = Number(t.dataset.i);
        this.setParam(this.selected, t.dataset.slider as 'm', Number(t.value));
      }
    });
    // Hold buttons (tuck) and steppers with auto-repeat.
    hud.addEventListener('pointerdown', (e) => {
      const t = e.target as HTMLElement;
      const hold = t.closest<HTMLElement>('[data-hold]');
      if (hold) {
        this.tuck = true;
        hold.classList.add('active');
      }
      const step = t.closest<HTMLElement>('.step');
      if (step) {
        const a = step.dataset.a!;
        const i = Number(step.dataset.i);
        let delay = 380;
        const rep = () => {
          this.selected = i;
          this.nudge(a[0] as 'm' | 'b', a[1] === '+' ? 1 : -1);
          delay = Math.max(60, delay * 0.8);
          this.keyRepeat = window.setTimeout(rep, delay);
        };
        this.keyRepeat = window.setTimeout(rep, delay);
      }
      const knob = t.closest<HTMLElement>('[data-knob]');
      if (knob) {
        const i = Number(knob.dataset.knob);
        this.selected = i;
        const r = knob.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let last = Math.atan2(e.clientY - cy, e.clientX - cx);
        let acc = 0;
        knob.setPointerCapture(e.pointerId);
        const move = (ev: PointerEvent) => {
          const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
          let d = a - last;
          if (d > Math.PI) d -= Math.PI * 2;
          if (d < -Math.PI) d += Math.PI * 2;
          last = a;
          acc += d;
          const stepAng = 0.16;
          while (Math.abs(acc) >= stepAng) {
            const dir = Math.sign(acc);
            this.nudge('m', dir);
            acc -= dir * stepAng;
          }
        };
        const up = () => {
          knob.removeEventListener('pointermove', move);
          knob.removeEventListener('pointerup', up);
          knob.removeEventListener('pointercancel', up);
        };
        knob.addEventListener('pointermove', move);
        knob.addEventListener('pointerup', up);
        knob.addEventListener('pointercancel', up);
      }
    });
    const release = () => {
      this.tuck = false;
      hud.querySelectorAll('.active').forEach((x) => x.classList.remove('active'));
      if (this.keyRepeat) clearTimeout(this.keyRepeat);
      this.keyRepeat = null;
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    window.addEventListener('keydown', (e) => {
      this.sound.unlock();
      const k = e.key;
      if (k === 'Escape' || k === 'p' || k === 'P') return this.setPaused(!this.paused);
      if (k === 'm' || k === 'M') return this.action('mute', this.hud);
      if (this.paused) return;
      if (this.mode === 'title' && (k === 'Enter' || k === ' ')) return this.action('play', this.hud);
      if (this.mode === 'build') {
        if (k === 'ArrowUp') { this.nudge('m', 1, e.shiftKey); e.preventDefault(); }
        else if (k === 'ArrowDown') { this.nudge('m', -1, e.shiftKey); e.preventDefault(); }
        else if (k === 'ArrowRight' || k === 'PageUp') { this.nudge('b', 1, e.shiftKey); e.preventDefault(); }
        else if (k === 'ArrowLeft' || k === 'PageDown') { this.nudge('b', -1, e.shiftKey); e.preventDefault(); }
        else if (k === 'Enter') { this.go(); e.preventDefault(); }
        else if (k === 'h' || k === 'H') this.useHint();
        else if (k === 'r' || k === 'R') this.restartLevel();
        else if (k === 'Tab') {
          e.preventDefault();
          const n = this.stage.segments.length;
          for (let j = 1; j <= n; j++) {
            const c = (this.selected + (e.shiftKey ? -j : j) + n) % n;
            if (!this.stage.segments[c].given) { this.selectSeg(c); break; }
          }
        } else if (/^[1-4]$/.test(k)) {
          const seg = this.stage.segments[0];
          if (this.stage.segments.length === 1 && seg.m.choices) this.setParam(0, 'm', seg.m.choices[Number(k) - 1] ?? this.params[0].m);
          else this.selectSeg(Number(k) - 1);
        }
      } else if (this.mode === 'ride' || this.mode === 'swoop') {
        if (k === ' ' || k === 'ArrowDown') { this.tuck = true; e.preventDefault(); }
        if (k === 'ArrowLeft') this.leanTarget = -0.7;
        if (k === 'ArrowRight') this.leanTarget = 0.7;
        if (k === 'ArrowUp' || k === 'x' || k === 'X') { this.trick(); e.preventDefault(); }
      } else if (this.mode === 'result') {
        if (k === 'Enter') this.action(this.outcome?.ok ? 'next' : 'retry', this.hud);
        if (k === 'r' || k === 'R') this.action('retry', this.hud);
        if (k === 'h' || k === 'H') this.useHint();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'ArrowDown') this.tuck = false;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') this.leanTarget = 0;
    });
  }

  // ---------------- test hooks ----------------
  textState(): string {
    const st = this.stage;
    const tr = this.track;
    const s = this.sim?.state;
    return JSON.stringify({
      coords: 'x = horizontal distance (m, grows left→right), y = altitude (m)',
      mode: this.mode,
      paused: this.paused,
      level: this.level ? { id: this.level.id, title: this.level.title, world: this.level.world, stage: `${this.stageIdx + 1}/${this.level.stages.length}` } : null,
      objective: this.level?.goal,
      builds: this.builds,
      hintUsed: this.hintUsed,
      selectedSegment: this.selected + 1,
      segments: st?.segments.map((seg, i) => ({
        n: i + 1,
        equation: equation(this.params[i].m, this.params[i].b),
        m: this.params[i].m,
        b: this.params[i].b,
        chosen: this.chosen[i],
        given: !!seg.given,
        editable: { m: !seg.given && editable(seg.m), b: !seg.given && editable(seg.b) },
        choices: seg.m.choices,
        interval: [tr.pieces[i].xa, tr.pieces[i].xb],
        fogVisible: this.mode === 'build' && !this.level.fullPreview && !seg.given ? fogVisibleRange(st, tr, i) : null,
      })),
      joints: st?.joints.map((j) => ({ zone: j.zone })),
      objects: st?.objects.map((o) => (o.kind === 'gate' ? { gate: o.id, at: o.hideLabel ? 'unlabeled' : point(o.x, o.y) } : { constraint: o.id, look: o.look, rule: `y ${o.side === 'above' ? (o.strict ? '>' : '>=') : o.strict ? '<' : '<='} ${o.m}x + ${o.b}`, on: [o.x0, o.x1] })),
      rival: st?.rival ? { who: st.rival.who, goal: st.rival.goal, line: st.rival.graphOnly ? 'graph only' : equation(st.rival.m, st.rival.b) } : null,
      table: st?.table ?? null,
      finish: st ? point(st.finish.x, st.finish.y) : null,
      ride: s ? { t: +s.t.toFixed(2), x: +s.x.toFixed(2), y: +s.y.toFixed(2), speed: +s.v.toFixed(2), phase: s.phase, lean: +this.leanZ.toFixed(2), tuck: this.tuck, flakes: this.flakes, tricks: this.tricks } : null,
      outcome: this.outcome ? (this.outcome.ok ? 'success' : this.outcome.reason === 'stall' ? 'stall' : this.outcome.hazard.kind) : null,
      explanation: this.explanation?.plain ?? null,
      stars: this.level ? this.progress.stars[this.level.id] ?? 0 : 0,
      models: { tripo: this.assets.loaded, missing: this.assets.missing, riderTripo: this.rider?.usingTripo, dogTripo: this.dog?.usingTripo },
    });
  }
}
