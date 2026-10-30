// DOM labels pinned to 3D points (crisp Hebrew/LTR text over the WebGL canvas).
import * as THREE from 'three';

interface Label {
  el: HTMLElement;
  pos: THREE.Vector3;
  visible: boolean;
}

export class Labels {
  private items = new Map<string, Label>();
  readonly layer: HTMLDivElement;
  private v = new THREE.Vector3();
  hidden = false;

  constructor(parent: HTMLElement) {
    this.layer = document.createElement('div');
    this.layer.className = 'label-layer';
    parent.appendChild(this.layer);
  }

  set(id: string, pos: THREE.Vector3 | [number, number, number], html: string, cls = 'lbl'): HTMLElement {
    let l = this.items.get(id);
    if (!l) {
      const el = document.createElement('div');
      this.layer.appendChild(el);
      l = { el, pos: new THREE.Vector3(), visible: true };
      this.items.set(id, l);
    }
    if (Array.isArray(pos)) l.pos.set(pos[0], pos[1], pos[2]);
    else l.pos.copy(pos);
    if (l.el.className !== cls) l.el.className = cls;
    if (l.el.innerHTML !== html) l.el.innerHTML = html;
    l.visible = true;
    return l.el;
  }

  hide(id: string): void {
    const l = this.items.get(id);
    if (l) l.visible = false;
  }

  clear(prefix = ''): void {
    for (const [id, l] of this.items) {
      if (id.startsWith(prefix)) {
        l.el.remove();
        this.items.delete(id);
      }
    }
  }

  update(camera: THREE.Camera, w: number, h: number): void {
    this.layer.style.display = this.hidden ? 'none' : '';
    if (this.hidden) return;
    for (const l of this.items.values()) {
      this.v.copy(l.pos).project(camera);
      const on = l.visible && this.v.z < 1 && Math.abs(this.v.x) < 1.2 && Math.abs(this.v.y) < 1.2;
      l.el.style.display = on ? '' : 'none';
      if (!on) continue;
      const x = (this.v.x * 0.5 + 0.5) * w;
      const y = (-this.v.y * 0.5 + 0.5) * h;
      l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }
}
