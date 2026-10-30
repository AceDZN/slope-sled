// Per-level 3D content: the coordinate grid, obstacles drawn exactly from the inequalities,
// gates, the finish hut, the rival lane, and the track ribbon built from the player's lines.
import * as THREE from 'three';
import type { LevelSpec, StageSpec, ConstraintSpec, GateSpec } from '../math/types.ts';
import { fogVisibleRange, type Track } from '../math/track.ts';
import { yAt } from '../math/line.ts';
import { equation, num, point, ltr } from '../math/format.ts';
import type { Labels } from './labels.ts';
import { COLORS } from './world.ts';
import type { Assets } from './assets.ts';
import { cliffFace, corduroy, hash2 } from './textures.ts';

export const SEG_COLORS = [0xff7a1a, 0x35d0ff, 0xb56cff, 0x3ee08f];
export const SEG_CSS = ['#ff7a1a', '#35d0ff', '#b56cff', '#3ee08f'];
export const TRACK_W = 3.4;
export const GRID_Z = -1.6;
export const RIVAL_Z = -3.6;

function std(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...extra });
}

function disposeTree(o: THREE.Object3D): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh || (c as THREE.LineSegments).isLineSegments) {
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat && !(mat as THREE.Material & { shared?: boolean }).userData?.shared) mat.dispose();
    }
  });
}

export interface TrackDrawOpts {
  mode: 'build' | 'ride' | 'replay';
  fullPreview: boolean;
  selected: number;
  /** Segment to paint red (wipeout replay). */
  badSeg?: number;
}

export class Course {
  readonly group = new THREE.Group();
  private gridGroup = new THREE.Group();
  private staticGroup = new THREE.Group();
  private trackGroup = new THREE.Group();
  private hintGroup = new THREE.Group();
  private markerGroup = new THREE.Group();
  readonly startTower = new THREE.Group();
  /** Scenery between the build camera and the grid: shown only during the ride. */
  readonly rideScenery = new THREE.Group();
  level!: LevelSpec;
  stage!: StageSpec;
  gridOpacity = 1;
  private gridMats: THREE.Material[] = [];
  private t = 0;
  private snowMat = std(COLORS.snow, { roughness: 0.75 });
  private woodMat = std(COLORS.wood, { roughness: 0.9 });

  constructor(private labels: Labels, private assets: Assets) {
    this.snowMat.userData.shared = true;
    this.woodMat.userData.shared = true;
    this.group.add(this.rideScenery, this.gridGroup, this.staticGroup, this.trackGroup, this.hintGroup, this.markerGroup, this.startTower);
  }

  load(level: LevelSpec, stage: StageSpec): void {
    this.level = level;
    this.stage = stage;
    for (const g of [this.gridGroup, this.staticGroup, this.trackGroup, this.hintGroup, this.markerGroup, this.rideScenery]) {
      for (const c of [...g.children]) {
        g.remove(c);
        disposeTree(c);
      }
    }
    this.labels.clear('c:');
    this.gridMats = [];
    this.buildGrid();
    this.buildObjects();
    this.buildScenery();
  }

  // ---------- grid ----------
  private buildGrid(): void {
    const { x0, x1, y0, y1 } = this.level.view;
    const minor: number[] = [];
    const major: number[] = [];
    const span = Math.max(x1 - x0, y1 - y0);
    const labelStep = span > 30 ? 4 : 2;
    for (let x = Math.ceil(x0); x <= x1; x++) (x % labelStep === 0 ? major : minor).push(x, y0, GRID_Z, x, y1, GRID_Z);
    for (let y = Math.ceil(y0); y <= y1; y++) (y % labelStep === 0 ? major : minor).push(x0, y, GRID_Z, x1, y, GRID_Z);
    const mk = (arr: number[], color: number, opacity: number) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
      m.userData.base = opacity;
      this.gridMats.push(m);
      return new THREE.LineSegments(g, m);
    };
    this.gridGroup.add(mk(minor, COLORS.grid, 0.22), mk(major, COLORS.grid, 0.55));
    // Axes, thicker via thin boxes.
    const axisMat = new THREE.MeshBasicMaterial({ color: 0xe9fbff, transparent: true, opacity: 0.95, depthWrite: false });
    axisMat.userData.base = 0.95;
    this.gridMats.push(axisMat);
    const ax = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 1.2, 0.12, 0.05), axisMat);
    ax.position.set((x0 + x1) / 2 + 0.6, y0, GRID_Z + 0.02);
    const ay = new THREE.Mesh(new THREE.BoxGeometry(0.12, y1 - y0 + 1.2, 0.05), axisMat);
    ay.position.set(x0, (y0 + y1) / 2 + 0.6, GRID_Z + 0.02);
    const arrowX = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 12), axisMat);
    arrowX.rotation.z = -Math.PI / 2;
    arrowX.position.set(x1 + 1.4, y0, GRID_Z + 0.02);
    const arrowY = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 12), axisMat);
    arrowY.position.set(x0, y1 + 1.4, GRID_Z + 0.02);
    this.gridGroup.add(ax, ay, arrowX, arrowY);
    // Cut-away cliff face behind the grid: the mountain sliced open so the cyan grid reads clearly.
    this.buildCliff(x0, x1, y0, y1);

    for (let x = Math.ceil(x0 / labelStep) * labelStep; x <= x1; x += labelStep) {
      this.labels.set(`c:gx${x}`, [x, y0 - 0.2, GRID_Z], ltr(num(x)), 'lbl axis-x');
    }
    for (let y = Math.ceil(y0 / labelStep) * labelStep; y <= y1; y += labelStep) {
      if (y === y0) continue;
      this.labels.set(`c:gy${y}`, [x0 - 0.3, y, GRID_Z], ltr(num(y)), 'lbl axis-y');
    }
    this.labels.set('c:ax', [x1 + 1.2, y0 - 2.6, GRID_Z], `${ltr('x →')} <span class="axis-note">גדל משמאל לימין</span>`, 'lbl axis-name');
    this.labels.set('c:ay', [x0 + 0.9, y1 + 1.6, GRID_Z], `${ltr('y')} <span class="axis-note">גובה (מ׳)</span>`, 'lbl axis-name');
  }

  private buildCliff(x0: number, x1: number, y0: number, y1: number): void {
    const left = x0 - 4.5, right = x1 + 4.5, bottom = Math.min(y0, 0) - 1.5, top = y1 + 1.6;
    const w = right - left, h = top - bottom;
    const tex = cliffFace().clone();
    tex.needsUpdate = true;
    tex.repeat.set(w / 40, 1);
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.05, emissive: 0x0a1d44, emissiveIntensity: 0.55, transparent: true, opacity: 1 });
    face.userData.base = 1;
    this.gridMats.push(face);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), face);
    wall.position.set((left + right) / 2, (bottom + top) / 2, GRID_Z - 1.25);
    wall.receiveShadow = true;
    this.gridGroup.add(wall);
    // Snow cap: a row of soft lumps along the top edge, slightly overhanging.
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf7fbff, roughness: 0.8, transparent: true, opacity: 1 });
    capMat.userData.base = 1;
    this.gridMats.push(capMat);
    const lump = new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const n = Math.ceil(w / 2.2);
    for (let i = 0; i <= n; i++) {
      const m = new THREE.Mesh(lump, capMat);
      const r = 1.3 + hash2(i, 3) * 0.9;
      m.scale.set(r * 1.2, 0.55 + hash2(i, 5) * 0.5, 1.7);
      m.position.set(left + (w * i) / n, top - 0.05, GRID_Z - 1.1);
      m.castShadow = true;
      this.gridGroup.add(m);
    }
    // Icicles hanging from the cap.
    const iceMat = new THREE.MeshStandardMaterial({ color: 0xcff3ff, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x2a7fb0, emissiveIntensity: 0.2 });
    iceMat.userData.base = 0.85;
    this.gridMats.push(iceMat);
    for (let i = 0; i < n * 1.5; i++) {
      if (hash2(i, 9) < 0.45) continue;
      const len = 0.5 + hash2(i, 11) * 1.4;
      const ic = new THREE.Mesh(new THREE.ConeGeometry(0.12, len, 6), iceMat);
      ic.rotation.x = Math.PI;
      ic.position.set(left + (w * i) / (n * 1.5), top - len / 2 - 0.05, GRID_Z - 0.05);
      this.gridGroup.add(ic);
    }
  }

  setGridOpacity(a: number): void {
    this.gridOpacity = a;
    for (const m of this.gridMats) {
      (m as THREE.Material & { opacity: number }).opacity = (m.userData.base as number) * a;
      m.visible = a > 0.01;
    }
  }

  // ---------- obstacles, gates, finish ----------
  private buildObjects(): void {
    const st = this.stage;
    const lv = this.level;
    for (const o of st.objects) {
      if (o.kind === 'gate') this.buildGate(o);
      else this.buildConstraint(o);
    }
    st.joints.forEach((j, i) => {
      const [z0, z1] = j.zone;
      const m = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.16, depthWrite: false });
      m.userData.base = 0.16;
      this.gridMats.push(m);
      const band = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.4, z1 - z0), lv.view.y1 - lv.view.y0), m);
      band.position.set((z0 + z1) / 2, (lv.view.y0 + lv.view.y1) / 2, GRID_Z + 0.03);
      this.gridGroup.add(band);
      const many = st.joints.length > 1;
      this.labels.set(`c:jz${i}`, [(z0 + z1) / 2, lv.view.y1 - 0.6 - (i % 2) * 2.2, GRID_Z], `🔩 ${many ? '' : 'אזור חיבור '}${ltr(`${num(z0)} ≤ x ≤ ${num(z1)}`)}`, 'lbl joint-zone');
    });
    this.buildFinish();
    if (st.rival) this.buildRival();
  }

  private buildGate(g: GateSpec): void {
    const holeR = 1.05;
    const top = g.y + 3.2;
    const shape = new THREE.Shape();
    shape.moveTo(-2.4, 0);
    shape.lineTo(2.4, 0);
    shape.lineTo(2.4, top);
    shape.lineTo(-2.4, top);
    shape.lineTo(-2.4, 0);
    const hole = new THREE.Path();
    hole.absarc(0, g.y + 0.35, holeR, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2, curveSegments: 24 });
    geo.rotateY(-Math.PI / 2);
    geo.translate(g.x + 0.35, 0, 0);
    const mat = std(COLORS.ice, { transparent: true, opacity: 0.5, roughness: 0.15, metalness: 0.1, emissive: 0x1b5f86, emissiveIntensity: 0.35 });
    const wall = new THREE.Mesh(geo, mat);
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData.gate = g.id;
    this.staticGroup.add(wall);
    // A glowing ring marks the target point on the grid.
    if (!g.hideLabel) {
      // A glowing ring marks the target point on the grid (not on transfer levels, where only the table gives it).
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.07, 8, 32), new THREE.MeshBasicMaterial({ color: COLORS.gold }));
      ring.position.set(g.x, g.y, GRID_Z + 0.06);
      this.gridGroup.add(ring);
    }
    if (g.look === 'flag' || g.look === 'meet') {
      for (const z of [-2.1, 2.1]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, top + 1.6, 6), std(0xdddddd));
        pole.position.set(g.x, (top + 1.6) / 2, z);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), std(g.look === 'meet' ? 0x3ee08f : COLORS.danger, { side: THREE.DoubleSide }));
        flag.position.set(g.x + 0.55, top + 1.2, z);
        this.staticGroup.add(pole, flag);
      }
    }
    if (g.look === 'cable') {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 80, 6), std(0x222222));
      cable.rotation.z = Math.PI / 2 + Math.atan(-0.12);
      cable.position.set(g.x, g.y + 4.6, -6);
      this.staticGroup.add(cable);
    }
    if (!g.hideLabel) this.labels.set(`c:g${g.id}`, [g.x, g.y + 1.0, GRID_Z], ltr(point(g.x, g.y)), 'lbl pt');
  }

  private buildConstraint(c: ConstraintSpec): void {
    const { y0, y1 } = this.level.view;
    const above = c.side === 'above';
    const steps = 24;
    // Shaded forbidden region exactly bounded by the inequality's line.
    const shape = new THREE.Shape();
    const edge = above ? y0 : y1;
    shape.moveTo(c.x0, edge);
    for (let i = 0; i <= steps; i++) {
      const x = c.x0 + ((c.x1 - c.x0) * i) / steps;
      shape.lineTo(x, c.m * x + c.b);
    }
    shape.lineTo(c.x1, edge);
    shape.lineTo(c.x0, edge);
    const color = above ? COLORS.danger : c.look === 'avalanche' ? 0xff8a7a : COLORS.ice;
    const rm = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
    rm.userData.base = 0.3;
    this.gridMats.push(rm);
    const region = new THREE.Mesh(new THREE.ShapeGeometry(shape), rm);
    region.position.z = GRID_Z + 0.04;
    this.gridGroup.add(region);
    // Dashed boundary line.
    const pts: number[] = [];
    const dash = 0.6;
    const len = Math.hypot(c.x1 - c.x0, (c.x1 - c.x0) * c.m);
    const n = Math.max(2, Math.floor(len / dash));
    for (let i = 0; i < n; i += 2) {
      const xa = c.x0 + ((c.x1 - c.x0) * i) / n;
      const xb = c.x0 + ((c.x1 - c.x0) * Math.min(n, i + 1)) / n;
      pts.push(xa, c.m * xa + c.b, GRID_Z + 0.08, xb, c.m * xb + c.b, GRID_Z + 0.08);
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const bm = new THREE.LineBasicMaterial({ color: above ? 0xffb0a8 : 0xd8f6ff, transparent: true, opacity: 1 });
    bm.userData.base = 1;
    this.gridMats.push(bm);
    this.gridGroup.add(new THREE.LineSegments(bg, bm));

    const op = above ? (c.strict ? '>' : '≥') : c.strict ? '<' : '≤';
    const rhs = equation(c.m, c.b).replace('y = ', '');
    const mid = (c.x0 + c.x1) / 2;
    this.labels.set(`c:k${c.id}`, [mid, c.m * mid + c.b + (above ? -1.3 : 1.3), GRID_Z], `${ltr(`y ${op} ${rhs}`)}`, `lbl ineq ${above ? 'ineq-above' : 'ineq-below'}`);

    // 3D props whose surfaces sit exactly on the boundary.
    if (c.look === 'rocks' || c.look === 'ridge') {
      const n2 = Math.max(2, Math.round((c.x1 - c.x0) / 2.2));
      for (let i = 0; i < n2; i++) {
        const x = c.x0 + ((c.x1 - c.x0) * (i + 0.5)) / n2;
        const topY = Math.min(c.m * (x - 1) + c.b, c.m * (x + 1) + c.b);
        const rock = this.assets.rock(Math.max(0.6, topY - y0), 2.0 + (i % 2) * 0.3);
        rock.position.set(x, y0, -0.9 - (i % 2) * 0.3);
        rock.rotation.y = i * 1.7;
        this.staticGroup.add(rock);
      }
    } else if (c.look === 'branch') {
      // A pine well behind the course with one long limb reaching over the track; the limb's underside is the boundary.
      const by = Math.max(c.m * c.x0 + c.b, c.m * c.x1 + c.b);
      const trunk = new THREE.Vector3(c.x0 - 1.2, by, -7);
      const pine = this.assets.pine(by + 4.5);
      pine.position.set(trunk.x, 0, trunk.z);
      this.staticGroup.add(pine);
      const tip = new THREE.Vector3((c.x0 + c.x1) / 2, by + 0.3, 0.6);
      const len = trunk.distanceTo(tip);
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.3, len, 7), this.woodMat);
      limb.position.copy(trunk).add(tip).multiplyScalar(0.5);
      limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().sub(trunk).normalize());
      limb.castShadow = true;
      const span = c.x1 - c.x0 + 1.2;
      const needles = new THREE.Mesh(new THREE.ConeGeometry(0.9, span, 7), std(COLORS.pine, { flatShading: true }));
      needles.rotation.z = Math.PI / 2;
      needles.position.set((c.x0 + c.x1) / 2, by + 0.95, 0);
      const snowTop = new THREE.Mesh(new THREE.BoxGeometry(span * 0.9, 0.25, 1.1), this.snowMat);
      snowTop.position.set((c.x0 + c.x1) / 2, by + 1.5, 0);
      needles.castShadow = true;
      this.staticGroup.add(limb, needles, snowTop);
    } else if (c.look === 'bridge' || c.look === 'cornice') {
      const yA = c.m * c.x0 + c.b;
      const yB = c.m * c.x1 + c.b;
      const L = Math.hypot(c.x1 - c.x0, yB - yA);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(L, 1.1, 5.2), std(c.look === 'bridge' ? COLORS.ice : COLORS.snow, { transparent: c.look === 'bridge', opacity: 0.85, roughness: 0.2, emissive: c.look === 'bridge' ? 0x1b5f86 : 0x000000, emissiveIntensity: 0.3 }));
      slab.position.set((c.x0 + c.x1) / 2, (yA + yB) / 2 + 0.55, 0);
      slab.rotation.z = Math.atan2(yB - yA, c.x1 - c.x0);
      slab.castShadow = true;
      this.staticGroup.add(slab);
      if (c.look === 'bridge') {
        for (const x of [c.x0, c.x1]) {
          for (const z of [-2.3, 2.3]) {
            const yy = c.m * x + c.b;
            const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, yy, 8), std(COLORS.ice, { transparent: true, opacity: 0.8, roughness: 0.2 }));
            pil.position.set(x, yy / 2, z);
            this.staticGroup.add(pil);
          }
        }
      }
    } else if (c.look === 'avalanche') {
      for (let i = 0; i < 9; i++) {
        const x = c.x0 + ((c.x1 - c.x0) * (i + 0.5)) / 9;
        const y = c.m * x + c.b + 2.2 + (i % 3);
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + (i % 2), 1), std(0xffffff, { flatShading: true }));
        puff.position.set(x, y, -2.5 + (i % 3));
        this.staticGroup.add(puff);
      }
    }
  }

  private buildFinish(): void {
    const f = this.stage.finish;
    const hut = this.assets.hut();
    hut.position.set(f.x + 4.2, f.y, f.y > 0.3 ? -4.6 : -2.6);
    hut.rotation.y = -0.35;
    this.staticGroup.add(hut);
    if (f.y > 0.3) {
      const plat = new THREE.Mesh(new THREE.BoxGeometry(12, f.y, 5), this.snowMat);
      plat.position.set(f.x + 5.5, f.y / 2, -4.6);
      plat.receiveShadow = true;
      this.staticGroup.add(plat);
    }
    const pile = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.snowMat);
    pile.scale.set(1.2, 0.35, 1.0);
    pile.position.set(f.x + 2.2, f.y, -3);
    this.staticGroup.add(pile);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 32), new THREE.MeshBasicMaterial({ color: COLORS.gold }));
    ring.position.set(f.x, f.y, GRID_Z + 0.06);
    this.gridGroup.add(ring);
    this.labels.set('c:finish', [f.x, f.y + 1.3, GRID_Z], `🏠 ${ltr(point(f.x, f.y))}`, 'lbl pt finish');
  }

  private buildRival(): void {
    const r = this.stage.rival!;
    const ya = r.m * r.x0 + r.b;
    const yb = r.m * r.x1 + r.b;
    const L = Math.hypot(r.x1 - r.x0, yb - ya);
    const color = r.who === 'ghost' ? 0x9fd8ff : 0xc79bff;
    const mat = std(color, { transparent: true, opacity: r.who === 'ghost' ? 0.45 : 0.9, emissive: color, emissiveIntensity: r.who === 'ghost' ? 0.6 : 0.15 });
    const rib = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 1.8), mat);
    rib.position.set((r.x0 + r.x1) / 2, (ya + yb) / 2 - 0.15, RIVAL_Z);
    rib.rotation.z = Math.atan2(yb - ya, r.x1 - r.x0);
    rib.castShadow = true;
    rib.userData.rival = true;
    this.staticGroup.add(rib);
    // The rival's line drawn on the grid (always readable — it is given data).
    // The rival's line on the grid: a bold dashed bar so it reads on the cliff face.
    const lm = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    lm.userData.base = 1;
    this.gridMats.push(lm);
    const n = Math.max(2, Math.floor(L / 1.1));
    for (let i = 0; i < n; i += 1) {
      if (i % 2) continue;
      const xa = r.x0 + ((r.x1 - r.x0) * i) / n;
      const xb = r.x0 + ((r.x1 - r.x0) * (i + 1)) / n;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(xb - xa, (xb - xa) * r.m), 0.2, 0.05), lm);
      seg.position.set((xa + xb) / 2, r.m * (xa + xb) / 2 + r.b, GRID_Z + 0.12);
      seg.rotation.z = Math.atan(r.m);
      this.gridGroup.add(seg);
    }
    const who = { dog: '🐕 הכלב', friend: 'החבר', ghost: '👻 מסלול הרוח', rival: 'היריב' }[r.who];
    const lx = r.x0 + (r.x1 - r.x0) * 0.72;
    const txt = r.graphOnly ? who : `${who}: ${ltr(equation(r.m, r.b))}`;
    this.labels.set('c:rival', [lx, r.m * lx + r.b + 1.0, GRID_Z], txt, 'lbl rival');
    if (r.graphOnly) {
      // Mark integer grid points on the ghost line so the graph is readable.
      let shown = 0;
      for (let x = Math.ceil(r.x0); x <= r.x1 && shown < 2; x++) {
        const y = r.m * x + r.b;
        if (Math.abs(y - Math.round(y)) < 1e-6 && (shown === 0 || x - r.x0 > (r.x1 - r.x0) * 0.4)) {
          const dot = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          dot.position.set(x, y, GRID_Z + 0.12);
          this.gridGroup.add(dot);
          shown++;
        }
      }
    }
  }

  // ---------- scenery ----------
  private buildScenery(): void {
    const { x0, x1 } = this.level.view;
    let seed = this.level.id * 97 + 13;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const back: THREE.Object3D[] = [];
    for (let i = 0; i < 46; i++) {
      const x = x0 - 30 + rnd() * (x1 - x0 + 90);
      const z = -34 - rnd() * 50;
      if (rnd() < 0.35) continue;
      const p = this.assets.pine(8 + rnd() * 9);
      p.position.set(x, 0, z);
      p.rotation.y = rnd() * 6;
      back.push(p);
    }
    // Side forest along the ride (seen from the chase camera), kept off the front of the build view.
    for (let i = 0; i < 26; i++) {
      const x = x0 - 10 + rnd() * (x1 - x0 + 40);
      const z = 9 + rnd() * 24;
      const p = this.assets.pine(5 + rnd() * 6);
      p.position.set(x, 0, z);
      this.rideScenery.add(p);
    }
    this.rideScenery.visible = false;
    for (let i = 0; i < 3; i++) {
      const py = this.assets.pylon();
      py.position.set(x0 + 6 + i * ((x1 - x0) / 2.2), 0, -62);
      back.push(py);
    }
    this.staticGroup.add(...back);
    // Cable between pylons.
    const cg = new THREE.BufferGeometry();
    const cp: number[] = [];
    for (let i = 0; i < 2; i++) {
      const a = x0 + 6 + i * ((x1 - x0) / 2.2);
      const b = a + (x1 - x0) / 2.2;
      cp.push(a, 15.5, -62, b, 15.5, -62);
    }
    cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
    this.staticGroup.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0x333a44 })));
  }

  // ---------- the player's track ----------
  drawTrack(track: Track, o: TrackDrawOpts): void {
    for (const c of [...this.trackGroup.children]) {
      this.trackGroup.remove(c);
      disposeTree(c);
    }
    this.labels.clear('c:t');
    const st = this.stage;
    track.pieces.forEach((p, i) => {
      const seg = st.segments[i];
      let xa = p.xa;
      let xb = p.xb;
      const fog = o.mode === 'build' && !o.fullPreview && !seg.given;
      if (fog) [xa, xb] = fogVisibleRange(st, track, i);
      // Given segments show their nominal stretch while building, so their ends don't reveal the joint.
      else if (o.mode === 'build' && seg.given) {
        // Run given segments through their joint zones so their ends never mark where the lines cross.
        xa = i > 0 ? Math.min(seg.x0, st.joints[i - 1].zone[0]) : seg.x0;
        xb = i < st.segments.length - 1 ? Math.max(seg.x1, st.joints[i].zone[1]) : seg.x1;
      }
      const color = o.badSeg === i ? COLORS.danger : SEG_COLORS[i % SEG_COLORS.length];
      const ghost = o.mode === 'build' && o.fullPreview && !seg.given;
      this.trackGroup.add(this.ribbon(p.line.m, p.line.b, xa, xb, color, ghost ? 0.55 : 1, o.selected === i && o.mode === 'build'));
      if (fog) {
        const mist = this.mist(p.line.m, p.line.b, xb, color);
        this.trackGroup.add(mist);
      }
      if (ghost) this.trackGroup.add(this.dashes(p.line.m, p.line.b, xa, xb));
      if (o.mode !== 'ride') {
        // Thin glowing line on the grid for the drawn part.
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute([xa, yAt(p.line, xa), GRID_Z + 0.14, xb, yAt(p.line, xb), GRID_Z + 0.14], 3));
        const lm = new THREE.LineBasicMaterial({ color, transparent: true, opacity: this.gridOpacity });
        this.trackGroup.add(new THREE.Line(g, lm));
        if (!seg.given && o.mode === 'build') {
          this.labels.set(`c:t${i}`, [xa + 0.4, yAt(p.line, xa) + 1.2, GRID_Z], `<span class="seg-tag" style="--c:${SEG_CSS[i % 4]}">${i + 1}</span>`, 'lbl tag');
        }
      }
      if (o.mode === 'ride') this.embankment(p.line.m, p.line.b, xa, xb, i);
    });
    if (o.mode === 'ride' && !st.segments[st.segments.length - 1].launch) {
      // Kicker at the hut: a short lip the sled pops off into the powder.
      const last = track.pieces[track.pieces.length - 1];
      const ye = yAt(last.line, last.xb);
      const kick = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, TRACK_W - 0.4), this.snowMat);
      kick.position.set(last.xb - 0.7, ye + 0.05, 0);
      kick.rotation.z = Math.atan(last.line.m) + 0.35;
      kick.castShadow = kick.receiveShadow = true;
      this.trackGroup.add(kick);
    }
    if (o.mode === 'replay' || o.mode === 'ride') {
      for (const j of track.joints) {
        if (j.ok) continue;
        // Broken joint: a jagged crack where the lines fail to meet.
        const crack = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), new THREE.MeshBasicMaterial({ color: COLORS.danger }));
        crack.position.set(j.x, (j.yLeft + j.yRight) / 2, 0);
        this.trackGroup.add(crack);
      }
    }
  }

  private ribbon(m: number, b: number, xa: number, xb: number, color: number, opacity: number, selected: boolean): THREE.Group {
    const g = new THREE.Group();
    const ya = m * xa + b;
    const yb = m * xb + b;
    const L = Math.max(0.01, Math.hypot(xb - xa, yb - ya));
    const ang = Math.atan2(yb - ya, xb - xa);
    const ghost = opacity < 1;
    // Groomed corduroy bed.
    const tex = corduroy().clone();
    tex.needsUpdate = true;
    tex.repeat.set(L / 2.2, 1);
    const bedMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, transparent: ghost, opacity });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(L, 0.42, TRACK_W - 0.5), bedMat);
    bed.position.y = -0.21;
    bed.castShadow = !ghost;
    bed.receiveShadow = true;
    g.add(bed);
    // Raised snow berms on both sides with a glowing rail along the inner lip.
    const bermMat = ghost ? new THREE.MeshStandardMaterial({ color: COLORS.snow, transparent: true, opacity }) : this.snowMat;
    const edgeMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: selected ? 2.4 : 1.5, transparent: ghost, opacity });
    for (const side of [-1, 1]) {
      const berm = new THREE.Mesh(new THREE.BoxGeometry(L, 0.62, 0.42), bermMat);
      berm.position.set(0, -0.12, side * (TRACK_W / 2 - 0.2));
      berm.castShadow = !ghost;
      berm.receiveShadow = true;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.07, 0.09), edgeMat);
      rail.position.set(0, 0.2, side * (TRACK_W / 2 - 0.42));
      g.add(berm, rail);
    }
    g.position.set((xa + xb) / 2, (ya + yb) / 2, 0);
    g.rotation.z = ang;
    return g;
  }

  /** Bright dashed preview line (tutorial levels only). */
  private dashes(m: number, b: number, xa: number, xb: number): THREE.Group {
    const g = new THREE.Group();
    const ang = Math.atan(m);
    const len = (xb - xa) / Math.cos(ang);
    const n = Math.floor(len / 1.4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x9ff3ff });
    for (let i = 0; i < n; i++) {
      const x = xa + ((i + 0.5) / n) * (xb - xa);
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.22, 0.22), mat);
      d.position.set(x, m * x + b + 0.35, GRID_Z + 0.4);
      d.rotation.z = ang;
      g.add(d);
    }
    return g;
  }

  private mist(m: number, b: number, x: number, color: number): THREE.Group {
    const g = new THREE.Group();
    const y = m * x + b;
    for (let i = 0; i < 5; i++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(1.1 + i * 0.25, 10, 8),
        new THREE.MeshBasicMaterial({ color: i === 0 ? color : 0xeaf3ff, transparent: true, opacity: 0.32 - i * 0.04, depthWrite: false }),
      );
      puff.position.set(x + 0.6 + i * 1.2, y + Math.sin(i * 1.9) * 0.4, (i % 2) * 0.6 - 0.3);
      puff.userData.mist = i;
      g.add(puff);
    }
    return g;
  }

  /** Solid snow embankment from the track down to y = 0: the course becomes a cut-away slice of mountain. */
  private embankment(m: number, b: number, xa: number, xb: number, segIndex: number): void {
    const ya = Math.max(0, m * xa + b - 0.42);
    const yb = Math.max(0, m * xb + b - 0.42);
    const hw = TRACK_W / 2 + 0.1;
    const spread = 0.55; // sides flare outward toward the ground
    const wa = hw + ya * spread;
    const wb = hw + yb * spread;
    // 8 corners: top (track underside) and base (ground).
    const v = [
      [xa, ya, -hw], [xb, yb, -hw], [xb, yb, hw], [xa, ya, hw],
      [xa, 0, -wa], [xb, 0, -wb], [xb, 0, wb], [xa, 0, wa],
    ];
    const quads = [[0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]];
    const pos: number[] = [];
    for (const [a, bq, c, d] of quads) for (const i of [a, bq, c, a, c, d]) pos.push(...v[i]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, this.bankMat);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.trackGroup.add(mesh);
    // Red/white chevron boards along the edge: cheap, strong speed cues in the chase camera.
    const len = xb - xa;
    const n = Math.floor(len / 7);
    for (let i = 1; i <= n; i++) {
      const x = xa + (len * i) / (n + 1);
      const y = m * x + b;
      const side = (i + segIndex) % 2 ? 1 : -1;
      const board = this.chevron.clone();
      board.position.set(x, y + 0.2, side * (TRACK_W / 2 + 0.9));
      this.trackGroup.add(board);
    }
  }

  private bankMat = (() => {
    const m = new THREE.MeshStandardMaterial({ color: 0xe8f0ff, roughness: 0.95, flatShading: true });
    m.userData.shared = true;
    return m;
  })();

  private chevron = (() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 64;
    const x = c.getContext('2d')!;
    x.fillStyle = '#e8322b';
    x.fillRect(0, 0, 128, 64);
    x.strokeStyle = '#fff';
    x.lineWidth = 12;
    for (const o of [30, 70]) {
      x.beginPath();
      x.moveTo(o + 20, 10);
      x.lineTo(o, 32);
      x.lineTo(o + 20, 54);
      x.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
    mat.userData.shared = true;
    const g = new THREE.Group();
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), mat);
    board.rotation.y = -Math.PI / 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 5), this.woodMat);
    post.position.y = -0.4;
    board.castShadow = true;
    g.add(board, post);
    return g;
  })();

  // ---------- hints and markers ----------
  showHint(on: boolean): void {
    for (const c of [...this.hintGroup.children]) {
      this.hintGroup.remove(c);
      disposeTree(c);
    }
    this.labels.clear('c:h');
    const h = this.stage.hint;
    if (!on || !h) return;
    (h.points ?? []).forEach(([x, y], i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.1, 8, 32), new THREE.MeshBasicMaterial({ color: 0xfff27a }));
      ring.position.set(x, y, GRID_Z + 0.2);
      ring.userData.pulse = true;
      this.hintGroup.add(ring);
      this.labels.set(`c:h${i}`, [x, y - 1.1, GRID_Z], `💡 ${ltr(point(x, y))}`, 'lbl hint-pt');
    });
    for (const id of h.boundaries ?? []) {
      const c = this.stage.objects.find((o) => o.id === id && o.kind === 'constraint') as ConstraintSpec | undefined;
      if (!c) continue;
      const ya = c.m * c.x0 + c.b;
      const yb = c.m * c.x1 + c.b;
      const L = Math.hypot(c.x1 - c.x0, yb - ya);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(L, 0.16, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff27a }));
      bar.position.set((c.x0 + c.x1) / 2, (ya + yb) / 2, GRID_Z + 0.2);
      bar.rotation.z = Math.atan2(yb - ya, c.x1 - c.x0);
      bar.userData.pulse = true;
      this.hintGroup.add(bar);
    }
  }

  showMarker(x: number, yTrack: number, yNeed: number | null): void {
    this.clearMarker();
    const mk = (y: number, color: number) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), new THREE.MeshBasicMaterial({ color }));
      s.position.set(x, y, GRID_Z + 0.25);
      this.markerGroup.add(s);
    };
    mk(yTrack, COLORS.danger);
    if (yNeed !== null) {
      mk(yNeed, 0xfff27a);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([x, yTrack, GRID_Z + 0.25, x, yNeed, GRID_Z + 0.25], 3));
      this.markerGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffffff })));
    }
    const vg = new THREE.BufferGeometry();
    const { y0, y1 } = this.level.view;
    vg.setAttribute('position', new THREE.Float32BufferAttribute([x, y0, GRID_Z + 0.22, x, y1, GRID_Z + 0.22], 3));
    this.markerGroup.add(new THREE.Line(vg, new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.4, gapSize: 0.3 })));
    (this.markerGroup.children[this.markerGroup.children.length - 1] as THREE.Line).computeLineDistances();
    this.labels.set('c:mx', [x, y0 - 1.2, GRID_Z], ltr(`x = ${num(x)}`), 'lbl marker-x');
  }

  clearMarker(): void {
    for (const c of [...this.markerGroup.children]) {
      this.markerGroup.remove(c);
      disposeTree(c);
    }
    this.labels.clear('c:mx');
  }

  /** Start tower under the sled's start point. */
  placeStart(x: number, y: number): void {
    for (const c of [...this.startTower.children]) {
      this.startTower.remove(c);
      disposeTree(c);
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 3.2), this.woodMat);
    deck.position.set(x - 1.2, y - 0.2, 0);
    deck.castShadow = deck.receiveShadow = true;
    this.startTower.add(deck);
    if (y > 0.5) {
      for (const dx of [-2.5, 0]) {
        for (const z of [-1.3, 1.3]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, y, 6), this.woodMat);
          post.position.set(x + dx, y / 2, z);
          post.castShadow = true;
          this.startTower.add(post);
        }
      }
    }
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), std(COLORS.gold, { side: THREE.DoubleSide }));
    flag.position.set(x - 2, y + 2.4, -1.4);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6), std(0xdddddd));
    pole.position.set(x - 2.6, y + 1.4, -1.4);
    this.startTower.add(flag, pole);
  }

  update(dt: number): void {
    this.t += dt;
    for (const c of this.hintGroup.children) {
      if (c.userData.pulse) c.scale.setScalar(1 + Math.sin(this.t * 5) * 0.12);
    }
    for (const g of this.trackGroup.children) {
      for (const c of g.children) {
        const i = c.userData.mist as number | undefined;
        if (i !== undefined) c.position.y += Math.sin(this.t * 1.5 + i) * dt * 0.25;
      }
    }
  }
}
