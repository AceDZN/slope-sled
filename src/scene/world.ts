// The persistent 3D world: renderer, sky, Hermon backdrop, sun, falling snow.
import * as THREE from 'three';

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
  readonly backdrop = new THREE.Group();
  reducedMotion = false;

  constructor(readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'game-canvas';
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1200);
    this.scene.fog = new THREE.Fog(COLORS.horizon, 160, 620);

    // Sky dome with a vertical gradient and a sun glow.
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(COLORS.skyTop) },
        mid: { value: new THREE.Color(COLORS.sky) },
        bottom: { value: new THREE.Color(COLORS.horizon) },
        sunDir: { value: new THREE.Vector3(0.5, 0.6, 0.4).normalize() },
        sunColor: { value: new THREE.Color(0xfff3d6) },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor; varying vec3 vDir;
        void main(){ float h = vDir.y; vec3 c = h > 0.15 ? mix(mid, top, smoothstep(0.15, 0.8, h)) : mix(bottom, mid, smoothstep(-0.05, 0.15, h));
        float s = max(dot(normalize(vDir), sunDir), 0.0); c += sunColor * (pow(s, 64.0) * 0.9 + pow(s, 6.0) * 0.18); gl_FragColor = vec4(c, 1.0); }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(850, 32, 16), this.skyMat);
    sky.frustumCulled = false;
    this.sky = sky;
    this.scene.add(sky);

    this.hemi = new THREE.HemisphereLight(0xdbeaff, 0x8aa6d8, 1.25);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    const sc = this.sun.shadow.camera;
    sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 220;
    this.scene.add(this.sun, this.sun.target);
    this.lantern = new THREE.PointLight(0xffc27a, 0, 30, 1.6);
    this.scene.add(this.lantern);

    this.buildBackdrop();
    this.scene.add(this.backdrop);

    // Gentle falling snow around the camera.
    const N = 900;
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
    this.snowfall = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, opacity: 0.85, depthWrite: false }));
    this.snowfall.frustumCulled = false;
    this.scene.add(this.snowfall);

    this.setMood('day');
  }

  /** Distant Hermon massif, valley floor and forest. Purely decorative. */
  private buildBackdrop(): void {
    const snowMat = new THREE.MeshStandardMaterial({ color: COLORS.snow, roughness: 0.92, metalness: 0 });
    // Valley floor: a wide snow field at y = 0 with soft undulation away from the course.
    const floorGeo = new THREE.PlaneGeometry(700, 500, 120, 90);
    floorGeo.rotateX(-Math.PI / 2);
    const fp = floorGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fp.count; i++) {
      const x = fp.getX(i), z = fp.getZ(i);
      const away = Math.max(0, Math.abs(z) - 14) / 60;
      const h = Math.sin(x * 0.05) * Math.cos(z * 0.07) * 1.4 * Math.min(1, away) + Math.max(0, -z - 60) * 0.06;
      fp.setY(i, h - 0.05);
    }
    floorGeo.computeVertexNormals();
    const floor = new THREE.Mesh(floorGeo, snowMat);
    floor.receiveShadow = true;
    floor.position.set(20, 0, -60);
    this.backdrop.add(floor);

    // Mountain range: faceted cones with snow caps, far behind the course (−z).
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6f7f9c, roughness: 1, flatShading: true });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true });
    const peaks: Array<[number, number, number, number]> = [
      [-80, -330, 80, 95], [10, -360, 105, 140], [100, -340, 75, 100], [180, -370, 95, 120], [-160, -370, 85, 110], [260, -350, 70, 80],
    ];
    for (const [x, z, h, r] of peaks) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 3), rockMat);
      cone.position.set(x, h / 2 - 4, z);
      cone.rotation.y = x * 0.1;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.48, h * 0.48, 7, 1), capMat);
      cap.position.set(x, h - h * 0.24 - 4 + 0.5, z);
      cap.rotation.y = cone.rotation.y;
      this.backdrop.add(cone, cap);
    }
  }

  setMood(mood: Mood): void {
    const u = this.skyMat.uniforms;
    if (mood === 'night') {
      u.top.value.set(0x050a24); u.mid.value.set(0x0d1c4a); u.bottom.value.set(0x2a3b70); u.sunColor.value.set(0xc8d8ff);
      u.sunDir.value.set(-0.4, 0.5, 0.3).normalize();
      this.hemi.intensity = 0.35; this.hemi.color.set(0x8aa0ff);
      this.sun.intensity = 0.55; this.sun.color.set(0xa9c0ff);
      this.lantern.intensity = 60;
      (this.scene.fog as THREE.Fog).color.set(0x1a2550);
      this.renderer.toneMappingExposure = 1.15;
    } else if (mood === 'dusk') {
      u.top.value.set(0x2a2f7a); u.mid.value.set(0x9a5aa8); u.bottom.value.set(0xffb07a); u.sunColor.value.set(0xffb070);
      u.sunDir.value.set(0.7, 0.15, 0.3).normalize();
      this.hemi.intensity = 0.8; this.hemi.color.set(0xffc9b0);
      this.sun.intensity = 1.8; this.sun.color.set(0xffa864);
      this.lantern.intensity = 25;
      (this.scene.fog as THREE.Fog).color.set(0xd59a9a);
      this.renderer.toneMappingExposure = 1.0;
    } else {
      u.top.value.set(COLORS.skyTop); u.mid.value.set(COLORS.sky); u.bottom.value.set(COLORS.horizon); u.sunColor.value.set(0xfff3d6);
      u.sunDir.value.set(0.5, 0.6, 0.4).normalize();
      this.hemi.intensity = 1.9; this.hemi.color.set(0xe4f0ff);
      this.sun.intensity = 3.4; this.sun.color.set(0xfff1dc);
      this.lantern.intensity = 0;
      (this.scene.fog as THREE.Fog).color.set(COLORS.horizon);
      this.renderer.toneMappingExposure = 1.25;
    }
    const d = u.sunDir.value as THREE.Vector3;
    this.sunDir.copy(d);
  }

  private sunDir = new THREE.Vector3(0.5, 0.6, 0.4);

  /** Keep the sun's shadow frustum centred on what the camera looks at. */
  aimSun(target: THREE.Vector3): void {
    this.sun.target.position.copy(target);
    this.sun.position.copy(target).addScaledVector(this.sunDir, 90);
  }

  resize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
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
  }

  render(): void {
    this.sky.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
  }
}
