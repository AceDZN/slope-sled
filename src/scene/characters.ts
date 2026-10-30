// The rigged sledder (on the sled) and the dog. Uses Tripo clips when present, procedural stand-ins otherwise.
import * as THREE from 'three';
import { Assets, normalize } from './assets.ts';
import { COLORS } from './world.ts';

export type RiderPose = 'idle' | 'ride' | 'tuck' | 'cheer' | 'fall' | 'trick';
export type DogPose = 'idle' | 'run' | 'jump' | 'sit';

function std(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
}

function findClip(clips: THREE.AnimationClip[], ...keys: string[]): THREE.AnimationClip | undefined {
  for (const k of keys) {
    const c = clips.find((x) => x.name.toLowerCase().includes(k));
    if (c) return c;
  }
  return undefined;
}

class Animator {
  mixer: THREE.AnimationMixer | null = null;
  private actions = new Map<string, THREE.AnimationAction>();
  current = '';
  constructor(root: THREE.Object3D, clips: THREE.AnimationClip[], map: Record<string, string[]>) {
    if (!clips.length) return;
    this.mixer = new THREE.AnimationMixer(root);
    for (const [pose, keys] of Object.entries(map)) {
      const c = findClip(clips, ...keys);
      if (c) this.actions.set(pose, this.mixer.clipAction(c));
    }
  }
  has(pose: string): boolean {
    return this.actions.has(pose);
  }
  /** hold: jump to the clip's last frame and stay there (e.g. seated at the end of "sit"). */
  play(pose: string, once = false, fade = 0.25, hold = false): boolean {
    const a = this.actions.get(pose);
    if (!a) return false;
    if (this.current === pose) return true;
    const prev = this.actions.get(this.current);
    a.reset();
    a.setLoop(once || hold ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    a.clampWhenFinished = once || hold;
    a.enabled = true;
    if (hold) a.time = a.getClip().duration - 0.05;
    a.fadeIn(fade).play();
    prev?.fadeOut(fade);
    this.current = pose;
    return true;
  }
  update(dt: number): void {
    this.mixer?.update(dt);
  }
}

export class Rider {
  /** Root: origin on the track surface; +x is forward. Rotate z for slope. */
  readonly root = new THREE.Group();
  /** Tilts for lean / trick spins. */
  readonly body = new THREE.Group();
  readonly kidHolder = new THREE.Group();
  private kid: THREE.Object3D;
  private anim: Animator;
  private procedural: { torso: THREE.Object3D; head: THREE.Object3D; armL: THREE.Object3D; armR: THREE.Object3D } | null = null;
  pose: RiderPose = 'idle';
  private t = 0;
  private sitBones: Array<{ bone: THREE.Bone; rot: THREE.Euler }> = [];
  readonly usingTripo: boolean;

  constructor(assets: Assets) {
    this.root.add(this.body);
    const sled = assets.sled();
    this.body.add(sled);
    this.body.add(this.kidHolder);
    const c = assets.clone('sledder');
    this.usingTripo = !!c;
    if (c) {
      this.kid = normalize(c, { height: 1.6 });
      // glTF characters face +z; our forward is +x.
      this.kid.rotation.y = Math.PI / 2;
      this.anim = new Animator(c, assets.clips('sledder'), {
        idle: ['idle', 'breath', 'stand'],
        sit: ['sit'],
        cheer: ['cheer', 'victory', 'celebrat', 'clap', 'jump', 'dance', 'happy'],
        fall: ['fall', 'knock', 'death', 'die', 'hit', 'stumble'],
        wave: ['wave', 'greet'],
      });
      this.findSitBones(c);
    } else {
      this.kid = this.proceduralKid();
      this.anim = new Animator(this.kid, [], {});
    }
    this.kidHolder.add(this.kid);
    this.setPose('idle');
  }

  private proceduralKid(): THREE.Object3D {
    const g = new THREE.Group();
    const jacket = std(COLORS.jacket);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.38, 6, 12), jacket);
    torso.position.set(-0.1, 0.72, 0);
    const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 4, 8), std(0x2b3e6b));
    legs.rotation.z = Math.PI / 2;
    legs.position.set(0.25, 0.5, 0);
    const head = new THREE.Group();
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), std(0xf2c29b));
    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0x2f6fd6));
    hat.position.y = 0.04;
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), std(0xffffff));
    pom.position.y = 0.26;
    head.add(face, hat, pom);
    head.position.set(-0.08, 1.15, 0);
    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.36, 4, 8), jacket);
    armL.position.set(0.05, 0.8, 0.3);
    armL.rotation.z = -1.0;
    const armR = armL.clone();
    armR.position.z = -0.3;
    g.add(torso, legs, head, armL, armR);
    g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    this.procedural = { torso, head, armL, armR };
    return g;
  }

  /** Mixamo-style bones for a seated pose layered over the idle clip. */
  private findSitBones(root: THREE.Object3D): void {
    const want: Array<[RegExp, THREE.Euler]> = [
      [/(left|l)_?up_?leg|thigh_?l|lthigh/i, new THREE.Euler(-1.45, 0, 0.08)],
      [/(right|r)_?up_?leg|thigh_?r|rthigh/i, new THREE.Euler(-1.45, 0, -0.08)],
      [/(left|l)_?leg$|(left|l)_?calf|calf_?l|shin_?l|lshin/i, new THREE.Euler(1.2, 0, 0)],
      [/(right|r)_?leg$|(right|r)_?calf|calf_?r|shin_?r|rshin/i, new THREE.Euler(1.2, 0, 0)],
    ];
    root.traverse((o) => {
      const b = o as THREE.Bone;
      if (!b.isBone) return;
      const name = b.name.replace(/^mixamorig:?/i, '');
      for (const [re, rot] of want) {
        if (re.test(name) && !this.sitBones.some((s) => s.bone === b)) this.sitBones.push({ bone: b, rot });
      }
    });
  }

  setPose(p: RiderPose): void {
    this.pose = p;
    if (p === 'cheer') this.anim.play('cheer', false) || this.anim.play('idle');
    else if (p === 'fall') this.anim.play('fall', true) || this.anim.play('idle');
    else this.anim.has('sit') ? this.anim.play('sit', false, 0.2, true) : this.anim.play('idle');
  }

  /** Is the kid seated (bones overridden after the mixer)? */
  private get seated(): boolean {
    return this.pose !== 'cheer' && this.pose !== 'fall' && !this.anim.has('sit');
  }

  update(dt: number, lean: number): void {
    this.t += dt;
    this.anim.update(dt);
    if (this.usingTripo && this.seated) {
      for (const s of this.sitBones) {
        s.bone.rotation.x = s.rot.x;
        s.bone.rotation.z = s.rot.z;
      }
    }
    // Seat height: a seated kid sits on the deck; standing clips stand next to the sled.
    const tuck = this.pose === 'tuck' ? 1 : 0;
    if (this.usingTripo) {
      const standing = this.pose === 'cheer' || this.pose === 'fall';
      this.kidHolder.position.set(standing ? -0.2 : -0.15, standing ? 0 : -0.25, standing ? 1.1 : 0);
      this.kidHolder.rotation.z = -tuck * 0.35;
    } else if (this.procedural) {
      const pr = this.procedural;
      pr.torso.rotation.z = -tuck * 0.6 + (this.pose === 'cheer' ? 0.2 : 0);
      pr.head.position.y = 1.15 - tuck * 0.2;
      const arms = this.pose === 'cheer' ? 2.6 + Math.sin(this.t * 10) * 0.3 : this.pose === 'fall' ? 3 : -1.0;
      pr.armL.rotation.z = arms;
      pr.armR.rotation.z = arms;
    }
    this.body.rotation.x = lean * 0.35;
  }
}

export class Dog {
  readonly root = new THREE.Group();
  private model: THREE.Object3D;
  private anim: Animator;
  private legs: THREE.Object3D[] = [];
  private t = 0;
  pose: DogPose = 'idle';
  private still = false;
  readonly usingTripo: boolean;

  constructor(assets: Assets) {
    const c = assets.clone('dog');
    this.usingTripo = !!c;
    if (c) {
      this.model = normalize(c, { height: 0.75 });
      // The Tripo dog's head points to −x; our forward is +x.
      this.model.rotation.y = Math.PI;
      this.anim = new Animator(c, assets.clips('dog'), {
        idle: ['idle', 'stand', 'breath'],
        run: ['run', 'gallop', 'trot', 'walk'],
        jump: ['jump', 'leap'],
        sit: ['sit'],
      });
    } else {
      this.model = this.proceduralDog();
      this.anim = new Animator(this.model, [], {});
    }
    this.root.add(this.model);
    this.setPose('idle');
  }

  private proceduralDog(): THREE.Object3D {
    const g = new THREE.Group();
    const fur = std(0xf1e2c4);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 6, 10), fur);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.48;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), fur);
    head.position.set(0.45, 0.66, 0);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), std(0xe8d3ad));
    snout.position.set(0.6, 0.62, 0);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), std(0x222222));
    nose.position.set(0.68, 0.64, 0);
    for (const z of [-0.1, 0.1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 6), fur);
      ear.position.set(0.42, 0.85, z);
      g.add(ear);
    }
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.25, 4, 6), fur);
    tail.position.set(-0.42, 0.62, 0);
    tail.rotation.z = -0.9;
    for (const [x, z] of [[0.25, 0.1], [0.25, -0.1], [-0.25, 0.1], [-0.25, -0.1]] as const) {
      const leg = new THREE.Group();
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.28, 4, 6), fur);
      m.position.y = -0.18;
      leg.add(m);
      leg.position.set(x, 0.38, z);
      this.legs.push(leg);
      g.add(leg);
    }
    g.add(body, head, snout, nose, tail);
    g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    return g;
  }

  setPose(p: DogPose): void {
    this.pose = p;
    if (!this.anim.play(p)) {
      // Only a walk cycle exists: sped up for run/jump, frozen for idle/sit.
      this.anim.play('run');
    }
    this.still = p === 'idle' || p === 'sit';
  }

  update(dt: number, speed: number): void {
    this.t += dt;
    this.anim.update(this.still ? 0 : dt * (this.pose === 'run' || this.pose === 'jump' ? Math.min(2.4, 1.2 + speed / 10) : 1));
    if (!this.usingTripo) {
      const k = this.pose === 'run' ? 1 : 0;
      this.legs.forEach((l, i) => (l.rotation.z = Math.sin(this.t * 16 + (i % 2) * Math.PI + (i > 1 ? 1.2 : 0)) * 0.7 * k));
      this.model.position.y = this.pose === 'run' ? Math.abs(Math.sin(this.t * 16)) * 0.08 : 0;
    }
  }
}
