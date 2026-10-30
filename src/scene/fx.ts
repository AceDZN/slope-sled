// Particles: powder spray from the runners, crash bursts, finish sparkles.
import * as THREE from 'three';

interface P {
  alive: boolean;
  life: number;
  max: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  size: number;
}

class Pool {
  readonly points: THREE.Points;
  private ps: P[] = [];
  private pos: Float32Array;
  private sizes: Float32Array;
  private alphas: Float32Array;
  constructor(n: number, color: number, private gravity: number, additive = false) {
    this.pos = new Float32Array(n * 3);
    this.sizes = new Float32Array(n);
    this.alphas = new Float32Array(n);
    for (let i = 0; i < n; i++) this.ps.push({ alive: false, life: 0, max: 1, pos: new THREE.Vector3(), vel: new THREE.Vector3(), size: 1 });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { color: { value: new THREE.Color(color) }, scale: { value: 300 } },
      vertexShader: `attribute float size; attribute float alpha; varying float vA; uniform float scale;
        void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 color; varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; gl_FragColor = vec4(color, vA * smoothstep(0.5, 0.15, d)); }`,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
  }
  emit(at: THREE.Vector3, vel: THREE.Vector3, spread: number, life: number, size: number): void {
    const p = this.ps.find((q) => !q.alive);
    if (!p) return;
    p.alive = true;
    p.life = 0;
    p.max = life * (0.7 + Math.random() * 0.6);
    p.pos.copy(at);
    p.vel.set(vel.x + (Math.random() - 0.5) * spread, vel.y + Math.random() * spread * 0.8, vel.z + (Math.random() - 0.5) * spread);
    p.size = size * (0.6 + Math.random() * 0.8);
  }
  update(dt: number): void {
    this.ps.forEach((p, i) => {
      if (p.alive) {
        p.life += dt;
        if (p.life >= p.max) p.alive = false;
        p.vel.y -= this.gravity * dt;
        p.vel.multiplyScalar(1 - 1.5 * dt);
        p.pos.addScaledVector(p.vel, dt);
      }
      const k = p.alive ? 1 - p.life / p.max : 0;
      this.pos[i * 3] = p.pos.x;
      this.pos[i * 3 + 1] = p.pos.y;
      this.pos[i * 3 + 2] = p.pos.z;
      this.sizes[i] = p.alive ? p.size * (0.6 + 0.6 * (1 - k)) : 0;
      this.alphas[i] = k * 0.9;
    });
    const g = this.points.geometry;
    (g.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;
  }
}

export class Fx {
  readonly group = new THREE.Group();
  private snow = new Pool(700, 0xffffff, 6);
  private sparkle = new Pool(260, 0xffe27a, 1.5, true);
  private v = new THREE.Vector3();
  reduced = false;

  constructor() {
    this.group.add(this.snow.points, this.sparkle.points);
  }

  /** Powder spray from the sled runners; intensity grows with speed. */
  spray(at: THREE.Vector3, forward: THREE.Vector3, speed: number, dt: number, lean: number): void {
    const n = Math.min(14, speed * dt * (this.reduced ? 8 : 26));
    for (let i = 0; i < n; i++) {
      this.v.copy(forward).multiplyScalar(-speed * 0.25);
      this.v.y += 1.5 + speed * 0.12;
      this.v.z += (Math.random() < 0.5 ? -1 : 1) * (1 + speed * 0.1) + lean * 3;
      this.snow.emit(at, this.v, 1.4, 0.7, 0.45 + speed * 0.02);
    }
  }

  burst(at: THREE.Vector3, power = 1): void {
    const n = this.reduced ? 60 : 220;
    for (let i = 0; i < n * power; i++) {
      this.v.set((Math.random() - 0.5) * 10, 3 + Math.random() * 7, (Math.random() - 0.5) * 10).multiplyScalar(power);
      this.snow.emit(at, this.v, 2, 1.6, 0.9);
    }
  }

  sparkles(at: THREE.Vector3): void {
    for (let i = 0; i < (this.reduced ? 40 : 140); i++) {
      this.v.set((Math.random() - 0.5) * 7, 4 + Math.random() * 6, (Math.random() - 0.5) * 7);
      this.sparkle.emit(at, this.v, 1.5, 1.8, 0.5);
    }
  }

  update(dt: number): void {
    this.snow.update(dt);
    this.sparkle.update(dt);
  }
}
