// The persistent 3D world: renderer + post-processing, sky, Hermon massif, terrain, clouds, falling snow.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { fbm, snowBump, cloudPuff } from './textures.ts';

export const COLORS = {
  snow: 0xf4f8ff,
  shadow: 0x9db8e8,
  sky: 0x2f6fd6,
  skyTop: 0x1b4fb0,
  horizon: 0xbfdcff,
  pine: 0x1f4d3a,
  pineDark: 0x163a2b,
  jacket: 0xff7a1a,
  grid: 0x7fe7ff,
  danger: 0xff5a4e,
  ice: 0x9fe3ff,
  gold: 0xffc93c,
  wood: 0x8a5a33,
  basalt: 0x3a3f4a,
};

export type Mood = 'day' | 'night' | 'dusk';

/** Final grade: gentle vignette, a touch of warmth in highlights, cool shadows. Runs before tone mapping. */
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, vignette: { value: 0.32 }, warmth: { value: 0.04 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vignette; uniform float warmth; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb += vec3(warmth, warmth * 0.4, -warmth) * smoothstep(0.5, 1.4, l);
      c.rgb += vec3(-0.01, 0.0, 0.025) * (1.0 - smoothstep(0.0, 0.5, l));
      vec2 d = vUv - 0.5; float v = 1.0 - dot(d, d) * vignette * 2.2;
      c.rgb *= clamp(v, 0.0, 1.0);
      gl_FragColor = c; }`,
};

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly lantern: THREE.PointLight;
  private skyMat: THREE.ShaderMaterial;
  private snowfall: THREE.Points;
  private sky!: THREE.Mesh;
  private snowVel: Float32Array;
  private clouds: THREE.Sprite[] = [];
  readonly backdrop = new THREE.Group();
  reducedMotion = false;
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private grade: ShaderPass | null = null;
  /** 'high' = bloom + grade; 'low' = plain render at DPR 1 (chosen automatically when frames are slow). */
  quality: 'high' | 'low' = 'high';
  /** Off while tests step time manually (frame gaps there say nothing about the device). */
  autoQuality = true;
  private frameTimes: number[] = [];
  private lastFrame = 0;
  readonly snowMat: THREE.MeshStandardMaterial;

  constructor(readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'game-canvas';
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1400);
    this.scene.fog = new THREE.Fog(COLORS.horizon, 180, 720);

    this.snowMat = new THREE.MeshStandardMaterial({
      color: COLORS.snow,
      roughness: 0.82,
      metalness: 0,
      vertexColors: true,
      bumpMap: snowBump(),
      bumpScale: 0.6,
    });

    // Sky dome: gradient, sun disc + halo, faint high-altitude band.
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color(COLORS.skyTop) },
        mid: { value: new THREE.Color(COLORS.sky) },
        bottom: { value: new THREE.Color(COLORS.horizon) },
        sunDir: { value: new THREE.Vector3(0.5, 0.6, 0.4).normalize() },
        sunColor: { value: new THREE.Color(0xfff3d6) },
        stars: { value: 0 },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor; uniform float stars; varying vec3 vDir;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){ vec3 d = normalize(vDir); float h = d.y;
          vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.85, h)) : mix(bottom, mid, smoothstep(-0.04, 0.12, h));
          float s = max(dot(d, sunDir), 0.0);
          c += sunColor * (smoothstep(0.9993, 0.9998, s) * 2.5 + pow(s, 48.0) * 0.55 + pow(s, 5.0) * 0.16);
          if (stars > 0.0) { vec2 g = floor(d.xz / (d.y + 0.35) * 260.0); float st = step(0.9975, h21(g)) * smoothstep(0.05, 0.4, h); c += vec3(st) * stars; }
          gl_FragColor = vec4(c, 1.0); }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), this.skyMat);
    sky.frustumCulled = false;
    sky.renderOrder = -10;
    this.sky = sky;
    this.scene.add(sky);

    this.hemi = new THREE.HemisphereLight(0xdbeaff, 0x8aa6d8, 1.25);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    const sc = this.sun.shadow.camera;
    sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 240;
    this.scene.add(this.sun, this.sun.target);
    this.lantern = new THREE.PointLight(0xffc27a, 0, 30, 1.6);
    this.scene.add(this.lantern);

    this.buildBackdrop();
    this.scene.add(this.backdrop);

    // Gentle falling snow around the camera.
    const N = 1100;
    const pos = new Float32Array(N * 3);
    this.snowVel = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = Math.random() * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      this.snowVel[i] = 0.6 + Math.random() * 1.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.snowfall = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0.9, depthWrite: false }));
    this.snowfall.frustumCulled = false;
    this.scene.add(this.snowfall);

    this.setupComposer();
    this.setMood('day');
  }

  private setupComposer(): void {
    try {
      const composer = new EffectComposer(this.renderer);
      composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.28, 0.5, 3.4);
      composer.addPass(this.bloom);
      this.grade = new ShaderPass(GradeShader);
      composer.addPass(this.grade);
      composer.addPass(new OutputPass());
      this.composer = composer;
    } catch {
      this.composer = null;
      this.quality = 'low';
    }
  }

  /** Height of the decorative terrain at (x, z). Flat ledge around the course (|z| < 14), hills beyond. */
  static terrainY(x: number, z: number): number {
    const away = Math.min(1, Math.max(0, Math.abs(z) - 12) / 40);
    const hills = (fbm(x * 0.012 + 3, z * 0.012 + 7, 4) - 0.45) * 26;
    const rise = z < -40 ? Math.pow((-z - 40) / 140, 1.6) * 70 : 0;
    const dip = z > 30 ? -Math.min(8, (z - 30) * 0.12) : 0;
    return Math.max(-6, hills * away + rise + dip) - 0.06;
  }

  /** Terrain, Hermon massif and clouds. Purely decorative. */
  private buildBackdrop(): void {
    const geo = new THREE.PlaneGeometry(900, 700, 180, 140);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(p.count * 3);
    const cx = 20, cz = -80;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + cx, z = p.getZ(i) + cz;
      const y = World.terrainY(x, z);
      p.setY(i, y);
      // Soft blue in hollows, bright on crests.
      const hollow = THREE.MathUtils.clamp(0.5 - (fbm(x * 0.03, z * 0.03, 3) - 0.5) * 2.2, 0, 1);
      const c = new THREE.Color(0xffffff).lerp(new THREE.Color(0xc9dbf6), hollow * 0.55);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, this.snowMat);
    ground.position.set(cx, 0, cz);
    ground.receiveShadow = true;
    this.backdrop.add(ground);

    // Hermon massif: displaced cones with snow above a ragged snowline and blue-grey rock below.
    const peaks: Array<[number, number, number, number]> = [
      [-120, -470, 130, 170], [20, -520, 175, 230], [170, -490, 120, 160], [300, -540, 150, 210], [-260, -540, 140, 190], [430, -500, 100, 150], [-380, -480, 90, 140],
    ];
    peaks.forEach(([x, z, h, r], idx) => {
      const g2 = new THREE.ConeGeometry(r, h, 40, 18);
      const pp = g2.attributes.position as THREE.BufferAttribute;
      const cc = new Float32Array(pp.count * 3);
      for (let i = 0; i < pp.count; i++) {
        const vx = pp.getX(i), vy = pp.getY(i), vz = pp.getZ(i);
        const t = (vy + h / 2) / h; // 0 base → 1 tip
        const ang = Math.atan2(vz, vx);
        const n = fbm(ang * 2.2 + idx * 5, t * 4, 4);
        const ridge = 1 + (n - 0.5) * 0.55;
        pp.setX(i, vx * ridge);
        pp.setZ(i, vz * ridge);
        pp.setY(i, vy + (n - 0.5) * h * 0.12 * (1 - t));
        const snowline = 0.42 + (fbm(ang * 3 + 11, idx, 3) - 0.5) * 0.35;
        const isSnow = t > snowline || (n > 0.62 && t > snowline - 0.2);
        const c = isSnow ? new THREE.Color(0xf7faff).lerp(new THREE.Color(0xc8d8f2), (1 - t) * 0.4) : new THREE.Color(0x5e6e8e).lerp(new THREE.Color(0x8696b4), n);
        cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b;
      }
      g2.setAttribute('color', new THREE.BufferAttribute(cc, 3));
      g2.computeVertexNormals();
      const m = new THREE.Mesh(g2, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }));
      m.position.set(x, h / 2 - 10, z);
      this.backdrop.add(m);
    });

    // Clouds drifting high above.
    const tex = cloudPuff();
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.75, depthWrite: false, fog: false }));
      s.position.set(-300 + i * 70 + Math.random() * 40, 110 + Math.random() * 70, -260 - Math.random() * 220);
      s.scale.set(140 + Math.random() * 80, 50 + Math.random() * 30, 1);
      this.clouds.push(s);
      this.backdrop.add(s);
    }
  }

  setMood(mood: Mood): void {
    const u = this.skyMat.uniforms;
    u.stars.value = 0;
    if (mood === 'night') {
      u.top.value.set(0x040820); u.mid.value.set(0x0c1a46); u.bottom.value.set(0x2a3b70); u.sunColor.value.set(0xc8d8ff);
      u.sunDir.value.set(-0.4, 0.5, 0.3).normalize();
      u.stars.value = 1;
      this.hemi.intensity = 0.45; this.hemi.color.set(0x8aa0ff); this.hemi.groundColor.set(0x3a4a80);
      this.sun.intensity = 0.7; this.sun.color.set(0xa9c0ff);
      this.lantern.intensity = 60;
      (this.scene.fog as THREE.Fog).color.set(0x1a2550);
      this.renderer.toneMappingExposure = 1.15;
      if (this.grade) this.grade.uniforms.warmth.value = -0.02;
    } else if (mood === 'dusk') {
      // Alpenglow: violet-blue sky and cold blue snow, with only the sunlit faces warm pink.
      u.top.value.set(0x1d2466); u.mid.value.set(0x6a5aa8); u.bottom.value.set(0xffa38a); u.sunColor.value.set(0xff9a7a);
      u.sunDir.value.set(0.7, 0.14, 0.3).normalize();
      this.hemi.intensity = 1.05; this.hemi.color.set(0xb4c2ff); this.hemi.groundColor.set(0x5a6aa8);
      this.sun.intensity = 1.7; this.sun.color.set(0xffa48a);
      this.lantern.intensity = 25;
      (this.scene.fog as THREE.Fog).color.set(0x8a86c0);
      this.renderer.toneMappingExposure = 1.05;
      if (this.grade) this.grade.uniforms.warmth.value = 0.03;
    } else {
      u.top.value.set(COLORS.skyTop); u.mid.value.set(COLORS.sky); u.bottom.value.set(COLORS.horizon); u.sunColor.value.set(0xfff3d6);
      u.sunDir.value.set(0.5, 0.6, 0.4).normalize();
      this.hemi.intensity = 1.8; this.hemi.color.set(0xe4f0ff); this.hemi.groundColor.set(0x8aa6d8);
      this.sun.intensity = 3.3; this.sun.color.set(0xfff1dc);
      this.lantern.intensity = 0;
      (this.scene.fog as THREE.Fog).color.set(COLORS.horizon);
      this.renderer.toneMappingExposure = 1.18;
      if (this.grade) this.grade.uniforms.warmth.value = 0.04;
    }
    this.sunDir.copy(u.sunDir.value as THREE.Vector3);
  }

  private sunDir = new THREE.Vector3(0.5, 0.6, 0.4);

  /** Keep the sun's shadow frustum centred on what the camera looks at. */
  aimSun(target: THREE.Vector3): void {
    this.sun.target.position.copy(target);
    this.sun.position.copy(target).addScaledVector(this.sunDir, 110);
  }

  resize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.bloom?.resolution.set(w / 2, h / 2);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number): void {
    const p = this.snowfall.geometry.attributes.position as THREE.BufferAttribute;
    const c = this.camera.position;
    const k = this.reducedMotion ? 0.3 : 1;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - this.snowVel[i] * dt * k;
      let x = p.getX(i) + Math.sin(y * 0.3 + i) * dt * 0.3 * k;
      if (y < c.y - 30) y += 60;
      if (y > c.y + 30) y -= 60;
      if (x < c.x - 60) x += 120;
      if (x > c.x + 60) x -= 120;
      let z = p.getZ(i);
      if (z < c.z - 50) z += 80;
      if (z > c.z + 30) z -= 80;
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true;
    for (const s of this.clouds) {
      s.position.x += dt * 2.2 * k;
      if (s.position.x > 520) s.position.x -= 840;
    }
  }

  /** Drop to plain rendering if frames are consistently slow (keeps phones and old laptops smooth). */
  private watchFrameRate(): void {
    const now = performance.now();
    const gap = now - this.lastFrame;
    if (this.lastFrame && this.autoQuality && gap < 250) {
      this.frameTimes.push(gap);
      if (this.frameTimes.length > 90) this.frameTimes.shift();
      if (this.quality === 'high' && this.frameTimes.length === 90) {
        const avg = this.frameTimes.reduce((a, b) => a + b, 0) / 90;
        if (avg > 38) {
          this.quality = 'low';
          this.renderer.setPixelRatio(1);
          this.resize();
        }
      }
    }
    this.lastFrame = now;
  }

  render(): void {
    this.sky.position.copy(this.camera.position);
    this.watchFrameRate();
    if (this.quality === 'high' && this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}
