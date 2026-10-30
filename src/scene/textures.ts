// Procedural canvas textures (no downloads): snow surface detail, groomed track corduroy,
// the cut-away cliff face behind the grid, and soft cloud puffs.
import * as THREE from 'three';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** Deterministic value noise. */
export function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function noise2(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, oct = 5): number {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * noise2(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

const cache = new Map<string, THREE.Texture>();

function remember(key: string, make: () => THREE.Texture): THREE.Texture {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

/** Wind-blown snow: soft ripples + fine grain, used as a bump map. */
export function snowBump(): THREE.Texture {
  return remember('snowBump', () => {
    const N = 256;
    const [c, x] = canvas(N, N);
    const img = x.createImageData(N, N);
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const u = i / N, v = j / N;
        // Tileable: sample noise on a torus-ish wrap.
        const ripple = Math.sin((u * 6 + fbm(u * 4, v * 4, 3) * 1.6) * Math.PI * 2) * 0.5 + 0.5;
        const grain = hash2(i * 1.7, j * 2.3);
        const val = 150 + ripple * 60 + (grain - 0.5) * 50;
        const k = (j * N + i) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = val;
        img.data[k + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(40, 40);
    return t;
  });
}

/** Groomed piste corduroy along the track (u runs along the track). */
export function corduroy(): THREE.Texture {
  return remember('corduroy', () => {
    // Stripes run across the track; u (canvas x) runs along it.
    const [c, x] = canvas(256, 64);
    x.fillStyle = '#f5f9ff';
    x.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 256; i += 8) {
      x.fillStyle = 'rgba(150,180,225,0.38)';
      x.fillRect(i, 0, 3, 64);
      x.fillStyle = 'rgba(255,255,255,0.9)';
      x.fillRect(i + 3, 0, 2, 64);
    }
    for (let k = 0; k < 220; k++) {
      x.fillStyle = `rgba(170,195,235,${0.15 + Math.random() * 0.2})`;
      x.fillRect(Math.random() * 256, Math.random() * 64, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  });
}

/** The cut-away mountain face behind the grid: snow cap on top, layered ice and dark rock strata below. */
export function cliffFace(): THREE.Texture {
  return remember('cliff', () => {
    const W = 1024, H = 512;
    const [c, x] = canvas(W, H);
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2c4f86');
    g.addColorStop(0.5, '#1d3a6b');
    g.addColorStop(1, '#122650');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    // Strata bands with wavy edges.
    for (let b = 0; b < 14; b++) {
      const y0 = (b / 14) * H;
      x.beginPath();
      x.moveTo(0, y0);
      for (let i = 0; i <= W; i += 16) x.lineTo(i, y0 + Math.sin(i * 0.013 + b) * 6 + fbm(i * 0.01, b) * 14);
      x.lineTo(W, y0 + 22);
      x.lineTo(0, y0 + 22);
      x.closePath();
      x.fillStyle = b % 3 === 0 ? 'rgba(160,210,255,0.10)' : b % 3 === 1 ? 'rgba(10,20,50,0.18)' : 'rgba(120,170,230,0.07)';
      x.fill();
    }
    // Ice cracks and specks.
    x.strokeStyle = 'rgba(190,230,255,0.10)';
    x.lineWidth = 1.5;
    for (let k = 0; k < 40; k++) {
      let px = Math.random() * W, py = Math.random() * H;
      x.beginPath();
      x.moveTo(px, py);
      for (let s = 0; s < 6; s++) {
        px += (Math.random() - 0.5) * 50;
        py += Math.random() * 30;
        x.lineTo(px, py);
      }
      x.stroke();
    }
    for (let k = 0; k < 900; k++) {
      x.fillStyle = `rgba(200,235,255,${Math.random() * 0.12})`;
      x.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

/** Soft cloud puff for billboards. */
export function cloudPuff(): THREE.Texture {
  return remember('cloud', () => {
    const [c, x] = canvas(256, 128);
    for (let k = 0; k < 26; k++) {
      const cx = 40 + Math.random() * 176, cy = 64 + (Math.random() - 0.5) * 30;
      const r = 18 + Math.random() * 34;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.beginPath();
      x.arc(cx, cy, r, 0, Math.PI * 2);
      x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}
