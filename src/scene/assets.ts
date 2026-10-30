// Loads the Tripo GLBs (public/models) and hands out normalized clones.
// Every model has a procedural stand-in so the game still runs if a file is missing.
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { COLORS } from './world.ts';

export type ModelName = 'sledder' | 'dog' | 'sled' | 'hut' | 'pine' | 'rock' | 'pylon';
const NAMES: ModelName[] = ['sledder', 'dog', 'sled', 'hut', 'pine', 'rock', 'pylon'];

export interface LoadedModel {
  scene: THREE.Object3D;
  clips: THREE.AnimationClip[];
}

function std(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
}

/** Scale so the bounding-box height is h (or longest horizontal side is len), sit on y = 0, center in xz. */
export function normalize(obj: THREE.Object3D, opts: { height?: number; length?: number }): THREE.Group {
  const wrap = new THREE.Group();
  wrap.add(obj);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  let s = 1;
  if (opts.height) s = opts.height / Math.max(1e-6, size.y);
  else if (opts.length) s = opts.length / Math.max(1e-6, Math.max(size.x, size.z));
  obj.scale.multiplyScalar(s);
  obj.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(obj);
  const c = b2.getCenter(new THREE.Vector3());
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= b2.min.y;
  return wrap;
}

export class Assets {
  private models = new Map<ModelName, LoadedModel>();
  loaded: ModelName[] = [];
  missing: ModelName[] = [];

  async load(base = './models/', onProgress?: (f: number) => void): Promise<void> {
    const loader = new GLTFLoader();
    let done = 0;
    await Promise.all(
      NAMES.map(async (n) => {
        try {
          const g: GLTF = await loader.loadAsync(`${base}${n}.glb`);
          g.scene.traverse((o) => {
            const m = o as THREE.Mesh;
            if (m.isMesh) {
              m.castShadow = true;
              m.receiveShadow = true;
              const mat = m.material as THREE.MeshStandardMaterial;
              if (mat && 'roughness' in mat) mat.roughness = Math.max(0.55, mat.roughness ?? 0.8);
            }
          });
          this.models.set(n, { scene: g.scene, clips: g.animations });
          this.loaded.push(n);
        } catch {
          this.missing.push(n);
        } finally {
          onProgress?.(++done / NAMES.length);
        }
      }),
    );
  }

  has(n: ModelName): boolean {
    return this.models.has(n);
  }

  clips(n: ModelName): THREE.AnimationClip[] {
    return this.models.get(n)?.clips ?? [];
  }

  clone(n: ModelName): THREE.Object3D | null {
    const m = this.models.get(n);
    if (!m) return null;
    return m.clips.length ? SkeletonUtils.clone(m.scene) : m.scene.clone(true);
  }

  pine(height: number): THREE.Object3D {
    const c = this.clone('pine');
    if (c) return normalize(c, { height });
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * height / 8, 0.28 * height / 8, height * 0.3, 6), std(COLORS.wood));
    trunk.position.y = height * 0.15;
    g.add(trunk);
    for (let i = 0; i < 3; i++) {
      const r = height * (0.34 - i * 0.08);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, height * 0.42, 7), std(i % 2 ? COLORS.pine : COLORS.pineDark, { flatShading: true }));
      cone.position.y = height * (0.38 + i * 0.2);
      cone.castShadow = true;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.55, height * 0.16, 7), std(0xffffff, { flatShading: true }));
      cap.position.y = cone.position.y + height * 0.14;
      g.add(cone, cap);
    }
    return g;
  }

  rock(height: number, width: number): THREE.Object3D {
    const c = this.clone('rock');
    if (c) {
      const w = normalize(c, { height });
      const box = new THREE.Box3().setFromObject(w);
      const sx = width / Math.max(0.01, box.max.x - box.min.x);
      w.scale.x *= Math.min(2.5, Math.max(0.4, sx));
      // Tall rock walls stay shallow so they never bulge in front of the track and grid.
      const depth = box.max.z - box.min.z;
      if (depth > 2.4) w.scale.z *= 2.4 / depth;
      return w;
    }
    const g = new THREE.Group();
    const geo = new THREE.DodecahedronGeometry(1, 0);
    geo.translate(0, 1, 0);
    const r = new THREE.Mesh(geo, std(COLORS.basalt, { flatShading: true }));
    r.scale.set(width / 2, height / 2, 1.2);
    r.castShadow = r.receiveShadow = true;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), std(0xffffff));
    cap.scale.set(width / 2.4, 0.35, 1.0);
    cap.position.y = height - 0.25;
    g.add(r, cap);
    return g;
  }

  hut(): THREE.Object3D {
    const c = this.clone('hut');
    if (c) return normalize(c, { height: 6.5 });
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(6, 3.6, 5), std(COLORS.wood));
    body.position.y = 1.8;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.8, 4), std(0xc0392b, { flatShading: true }));
    roof.position.y = 5;
    roof.rotation.y = Math.PI / 4;
    const snow = new THREE.Mesh(new THREE.ConeGeometry(4.9, 1.0, 4), std(0xffffff, { flatShading: true }));
    snow.position.y = 6.0;
    snow.rotation.y = Math.PI / 4;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 1.2), std(0x5a3418));
    door.position.set(-3.02, 1.1, 0);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 1), std(0xffd27a, { emissive: 0xffb347, emissiveIntensity: 0.8 }));
    win.position.set(-3.02, 2.2, 1.6);
    for (const m of [body, roof, snow]) m.castShadow = m.receiveShadow = true;
    g.add(body, roof, snow, door, win);
    return g;
  }

  pylon(): THREE.Object3D {
    const c = this.clone('pylon');
    if (c) return normalize(c, { height: 16 });
    const g = new THREE.Group();
    const mat = std(0x7b8794, { metalness: 0.4, roughness: 0.5 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 15, 8), mat);
    mast.position.y = 7.5;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 5), mat);
    arm.position.y = 15.3;
    arm.rotation.y = Math.PI / 2;
    g.add(mast, arm);
    return g;
  }

  /** Sled (static prop), ~1.5 m long, facing +x. */
  sled(): THREE.Object3D {
    const c = this.clone('sled');
    if (c) {
      const w = normalize(c, { length: 1.6 });
      // Tripo props usually face +z; turn the long axis onto +x.
      const box = new THREE.Box3().setFromObject(w);
      const sz = box.getSize(new THREE.Vector3());
      if (sz.z > sz.x) w.rotation.y = Math.PI / 2;
      return w;
    }
    const g = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.7), std(0xc0392b));
    deck.position.y = 0.32;
    for (const z of [-0.3, 0.3]) {
      const run = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.06), std(0x5a3418));
      run.position.set(0.05, 0.05, z);
      const curl = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 6, 10, Math.PI), std(0x5a3418));
      curl.position.set(0.88, 0.22, z);
      curl.rotation.z = -Math.PI / 2;
      g.add(run, curl);
    }
    g.add(deck);
    g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    return g;
  }
}
