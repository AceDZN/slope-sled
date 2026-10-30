// Level-select diorama: a snowy Hermon with a winding trail and one flag per level, built far from the course.
import * as THREE from 'three';
import type { Assets } from './assets.ts';
import { COLORS } from './world.ts';

export const MAP_ORIGIN = new THREE.Vector3(600, 0, 0);

export interface MapFlag {
  id: number;
  world: number;
  pos: THREE.Vector3;
}

function std(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
}

export class TrailMap {
  readonly group = new THREE.Group();
  readonly flags: MapFlag[] = [];
  private cloths = new Map<number, THREE.Mesh>();
  readonly worldCenters: THREE.Vector3[] = [];

  constructor(assets: Assets, levels: Array<{ id: number; world: number }>) {
    this.group.position.copy(MAP_ORIGIN);
    const snow = std(COLORS.snow, { roughness: 0.95 });
    // The mountain: a broad lumpy cone, summit at the back.
    const geo = new THREE.ConeGeometry(70, 46, 48, 12, true);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = Math.sin(x * 0.21) * Math.cos(z * 0.17) * 2.2 + Math.sin(x * 0.07 + z * 0.05) * 3;
      p.setY(i, y + (y < 22 ? n : 0));
    }
    geo.computeVertexNormals();
    const mountain = new THREE.Mesh(geo, snow);
    mountain.position.set(0, 23, -22);
    mountain.receiveShadow = true;
    this.group.add(mountain);

    // A winding trail from the summit down to the valley: 18 stops.
    const pts: THREE.Vector3[] = [];
    const N = levels.length;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      // Serpentine down the front face, from the summit (t = 0) to the valley (t = 1).
      const r = 6 + t * 54;
      const x = Math.sin(t * Math.PI * 3.2) * (13 + t * 24);
      const z = -22 + r * 0.9;
      pts.push(new THREE.Vector3(x, 0, z));
    }
    // Snap each stop onto the cone surface (height falls off with distance from the summit axis).
    for (const v of pts) {
      const d = Math.hypot(v.x, v.z + 22);
      v.y = Math.max(0.3, 46 * (1 - d / 70)) + 2.4;
    }
    // The trail is walked from the bottom (level 1) up to the summit (level 18).
    pts.reverse();
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.9, 6), std(0x9fd8ff, { emissive: 0x2a8fd8, emissiveIntensity: 0.35 }));
    this.group.add(tube);

    levels.forEach((l, i) => {
      const pos = pts[i];
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.2, 6), std(0xeeeeee));
      pole.position.set(pos.x, pos.y + 2.1, pos.z);
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), std(COLORS.grid, { side: THREE.DoubleSide }));
      cloth.position.set(pos.x + 1.1, pos.y + 3.5, pos.z);
      this.cloths.set(l.id, cloth);
      this.group.add(pole, cloth);
      this.flags.push({ id: l.id, world: l.world, pos: pos.clone().add(MAP_ORIGIN).add(new THREE.Vector3(0, 5.2, 0)) });
    });
    for (let w = 1; w <= 4; w++) {
      const f = this.flags.filter((x) => x.world === w);
      const c = f.reduce((a, x) => a.add(x.pos), new THREE.Vector3()).multiplyScalar(1 / f.length);
      // Signs stand beside their stretch of trail, alternating sides so they never cover the flags.
      const minX = Math.min(...f.map((x) => x.pos.x)), maxX = Math.max(...f.map((x) => x.pos.x));
      c.x = w % 2 ? minX - 16 : maxX + 16;
      c.y -= 4;
      this.worldCenters.push(c);
    }
    // Forest and a hut at the foot of the trail.
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 18 + rnd() * 52;
      const x = Math.cos(a) * r, z = -22 + Math.sin(a) * r * 0.7;
      const d = Math.hypot(x, z + 22);
      const y = Math.max(0, 46 * (1 - d / 70));
      if (pts.some((q) => Math.hypot(q.x - x, q.z - z) < 4)) continue;
      const pine = assets.pine(3 + rnd() * 3);
      pine.position.set(x, y, z);
      this.group.add(pine);
    }
    const hut = assets.hut();
    hut.scale.setScalar(0.8);
    hut.position.set(pts[0].x + 6, pts[0].y - 0.4, pts[0].z - 2);
    this.group.add(hut);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(160, 40), snow);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);
  }

  setState(id: number, state: 'done' | 'current' | 'locked'): void {
    const c = this.cloths.get(id);
    if (!c) return;
    const m = c.material as THREE.MeshStandardMaterial;
    m.color.set(state === 'done' ? 0x3ee08f : state === 'current' ? 0x35d0ff : 0x8a94a6);
    m.emissive.set(state === 'current' ? 0x1b6fa0 : 0x000000);
  }

  /** Camera pose that frames the whole mountain. */
  cameraPose(t: number): { pos: THREE.Vector3; look: THREE.Vector3 } {
    const look = MAP_ORIGIN.clone().add(new THREE.Vector3(0, 20, 0));
    const a = Math.sin(t * 0.12) * 0.1;
    const pos = look.clone().add(new THREE.Vector3(Math.sin(a) * 125, 52, Math.cos(a) * 125));
    return { pos, look };
  }
}
