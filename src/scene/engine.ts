import * as THREE from "three";
import { buildField, type Field } from "./formations";
import { fragmentShader, vertexShader } from "./shaders";

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  labelLayer: HTMLElement;
  quality: "high" | "low";
  reducedMotion: boolean;
  colors: { bg: string; ink: string; signal: string; red: string; green: string };
}

interface PlacedLabel {
  el: HTMLElement;
  pos: THREE.Vector3;
  formation: number;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class OnusScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(40, 1, 0.1, 220);
  private field: Field;
  private material: THREE.ShaderMaterial;
  private aFrom: THREE.InstancedBufferAttribute;
  private aTo: THREE.InstancedBufferAttribute;
  private aCode: THREE.InstancedBufferAttribute;
  private frame: THREE.Group;
  private frameMaterial: THREE.MeshBasicMaterial;
  private labels: PlacedLabel[] = [];
  private segment = -1;
  private phase = 0;
  private phaseTarget = 0;
  private pointer = new THREE.Vector2();
  private pointerTarget = new THREE.Vector2();
  private time = 0;
  private last = 0;
  private raf = 0;
  private width = 1;
  private height = 1;
  private lensShift = 0;
  private distanceScale = 1;
  private onFrame: ((dt: number) => void) | null = null;
  private tmp = new THREE.Vector3();
  private camPos = new THREE.Vector3();
  private camTarget = new THREE.Vector3();

  constructor(private opts: SceneOptions) {
    const high = opts.quality === "high";
    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(new THREE.Color(opts.colors.bg), 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.field = buildField(high ? 14000 : 6000);
    const n = this.field.count;

    const box = new THREE.BoxGeometry(1, 1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = box.index;
    geometry.setAttribute("position", box.getAttribute("position"));
    geometry.setAttribute("normal", box.getAttribute("normal"));
    geometry.instanceCount = n;
    this.aFrom = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    this.aTo = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    this.aCode = new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2);
    const meta = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      meta[i * 2] = this.field.len[i];
      meta[i * 2 + 1] = this.field.seed[i];
    }
    geometry.setAttribute("aFrom", this.aFrom);
    geometry.setAttribute("aTo", this.aTo);
    geometry.setAttribute("aCode", this.aCode);
    geometry.setAttribute("aMeta", new THREE.InstancedBufferAttribute(meta, 2));

    const c = (hex: string) => new THREE.Color(hex);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uT: { value: 0 },
        uTime: { value: 0 },
        uStagger: { value: 0.42 },
        uArc: { value: high ? 1.4 : 0.9 },
        uScaleA: { value: new THREE.Vector3(1, 1, 1) },
        uScaleB: { value: new THREE.Vector3(1, 1, 1) },
        uLenA: { value: 0 },
        uLenB: { value: 0 },
        uFlowA: { value: new THREE.Vector4() },
        uFlowB: { value: new THREE.Vector4() },
        uInk: { value: c(opts.colors.ink) },
        uSignal: { value: c(opts.colors.signal) },
        uRed: { value: c(opts.colors.red) },
        uGreen: { value: c(opts.colors.green) },
        uBg: { value: c(opts.colors.bg) },
        uLight: { value: new THREE.Vector3(0.4, 0.8, 1.0) },
        uGlowBoost: { value: 1.12 },
        uFogDensity: { value: 0.04 },
      },
    });
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    // The attention frame on the wall.
    this.frameMaterial = new THREE.MeshBasicMaterial({
      color: c(opts.colors.signal),
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    this.frame = new THREE.Group();
    const { x, y, w, h, z } = this.field.frame;
    const t = 0.035;
    const edges: [number, number, number, number][] = [
      [x + w / 2, y, w + t, t],
      [x + w / 2, y - h, w + t, t],
      [x, y - h / 2, t, h],
      [x + w, y - h / 2, t, h],
    ];
    for (const [ex, ey, ew, eh] of edges) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(ew, eh, t), this.frameMaterial);
      m.position.set(ex, ey, z);
      this.frame.add(m);
    }
    this.scene.add(this.frame);

    this.buildLabels();
    this.resize();
    this.applySegment(0);
  }

  private buildLabels() {
    this.field.formations.forEach((f, index) => {
      for (const l of f.labels) {
        const el = document.createElement("span");
        el.className = `scene-label${l.signal ? " is-signal" : ""}${l.align && l.align !== "center" ? ` is-${l.align}` : ""}`;
        el.textContent = l.text;
        this.opts.labelLayer.appendChild(el);
        this.labels.push({ el, pos: new THREE.Vector3(...l.pos), formation: index });
      }
    });
  }

  private applySegment(k: number) {
    const fs = this.field.formations;
    const a = fs[k];
    const b = fs[k + 1];
    (this.aFrom.array as Float32Array).set(a.pos);
    (this.aTo.array as Float32Array).set(b.pos);
    const codes = this.aCode.array as Float32Array;
    for (let i = 0; i < this.field.count; i++) {
      codes[i * 2] = a.code[i];
      codes[i * 2 + 1] = b.code[i];
    }
    this.aFrom.needsUpdate = true;
    this.aTo.needsUpdate = true;
    this.aCode.needsUpdate = true;
    const u = this.material.uniforms;
    u.uScaleA.value.set(...a.scale);
    u.uScaleB.value.set(...b.scale);
    u.uLenA.value = a.useLen;
    u.uLenB.value = b.useLen;
    u.uFlowA.value.set(...a.flow);
    u.uFlowB.value.set(...b.flow);
    this.segment = k;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.height = h;
    const high = this.opts.quality === "high";
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 1.75 : 1.5));
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.aspect = aspect;
    // Wide screens compose the scene to the right of the text column; narrow screens center it and step back.
    this.lensShift = aspect > 1.15 ? 0.17 : 0;
    this.distanceScale = aspect < 1 ? 1 + (1 - aspect) * 1.15 : 1;
    this.camera.setViewOffset(w, h, -this.lensShift * w, 0, w, h);
    this.camera.updateProjectionMatrix();
  }

  setPhaseTarget(p: number) {
    const max = this.field.formations.length - 1;
    this.phaseTarget = Math.min(max, Math.max(0, p));
  }

  setPointer(x: number, y: number) {
    this.pointerTarget.set(x, y);
  }

  onTick(fn: (dt: number) => void) {
    this.onFrame = fn;
  }

  start() {
    const loop = (now: number) => {
      const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0.016);
      this.last = now;
      this.onFrame?.(dt);
      this.update(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  private update(dt: number) {
    const reduced = this.opts.reducedMotion;
    const fs = this.field.formations;
    if (reduced) {
      this.phase = Math.round(this.phaseTarget);
    } else {
      this.phase += (this.phaseTarget - this.phase) * (1 - Math.exp(-dt * 5));
      if (Math.abs(this.phaseTarget - this.phase) < 0.0005) this.phase = this.phaseTarget;
      this.time += dt;
    }

    let k = Math.floor(this.phase);
    let t = this.phase - k;
    if (k >= fs.length - 1) {
      k = fs.length - 2;
      t = 1;
    }
    if (k !== this.segment) this.applySegment(k);
    const u = this.material.uniforms;
    u.uT.value = t;
    u.uTime.value = this.time;

    // Camera: ease between the two formations' keyframes, plus a little pointer parallax.
    const e = ease(t);
    const A = fs[k].camera;
    const B = fs[k + 1].camera;
    this.camTarget.set(
      A.target[0] + (B.target[0] - A.target[0]) * e,
      A.target[1] + (B.target[1] - A.target[1]) * e,
      A.target[2] + (B.target[2] - A.target[2]) * e,
    );
    this.camPos.set(
      A.pos[0] + (B.pos[0] - A.pos[0]) * e,
      A.pos[1] + (B.pos[1] - A.pos[1]) * e,
      A.pos[2] + (B.pos[2] - A.pos[2]) * e,
    );
    this.camPos.sub(this.camTarget).multiplyScalar(this.distanceScale).add(this.camTarget);
    if (!reduced) {
      this.pointer.lerp(this.pointerTarget, 1 - Math.exp(-dt * 3));
      this.camPos.x += this.pointer.x * 0.45;
      this.camPos.y += this.pointer.y * 0.3;
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);

    this.frameMaterial.opacity = Math.max(0, 1 - Math.abs(this.phase - 1) * 2.4);
    this.frame.visible = this.frameMaterial.opacity > 0.01;

    this.camera.updateMatrixWorld();
    for (const l of this.labels) {
      const o = Math.max(0, 1 - Math.abs(this.phase - l.formation) * 3);
      if (o < 0.02) {
        if (l.el.style.opacity !== "0") l.el.style.opacity = "0";
        continue;
      }
      this.tmp.copy(l.pos).project(this.camera);
      const x = ((this.tmp.x + 1) / 2) * this.width;
      const y = ((1 - this.tmp.y) / 2) * this.height;
      l.el.style.opacity = String(o);
      l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
