// Every bar in the scene is a line of code. Each chapter of the page arranges the same
// bars into a different formation; the shader morphs between neighbours as you scroll.
//
// Per instance and per formation we store:
//   pos  (x, y, z, size): size 0 hides the bar in that formation
//   code (color + 10 * flow): 0 ink, 1 signal, 2 removed (red), 3 added (green); +10 = moves with the flow

export const INK = 0;
export const SIGNAL = 1;
export const RED = 2;
export const GREEN = 3;
const FLOW = 10;

export interface Label {
  text: string;
  pos: [number, number, number];
  signal?: boolean;
  align?: "center" | "left" | "right";
}

export interface Formation {
  name: string;
  pos: Float32Array; // N * 4
  code: Float32Array; // N
  scale: [number, number, number];
  useLen: number; // 1: the bar's x scale follows its line length
  flow: [number, number, number, number]; // mode (0 none, 1 z-flow, 2 spin), min, max, speed
  labels: Label[];
  camera: { pos: [number, number, number]; target: [number, number, number] };
}

export interface Field {
  count: number;
  len: Float32Array; // line length 0..1
  seed: Float32Array; // 0..1, staggers the morph
  formations: Formation[];
  frame: { x: number; y: number; w: number; h: number; z: number };
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inSphere(r: () => number, radius: number): [number, number, number] {
  const u = r();
  const v = r();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const rad = radius * Math.cbrt(r());
  return [rad * Math.sin(phi) * Math.cos(theta), rad * Math.sin(phi) * Math.sin(theta), rad * Math.cos(phi)];
}

function diffCode(r: () => number) {
  const x = r();
  return x < 0.13 ? GREEN : x < 0.17 ? RED : INK;
}

export function buildField(count: number): Field {
  const r = rng(20260928);
  const len = new Float32Array(count);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    len[i] = r() < 0.08 ? 0.15 : 0.3 + r() * 0.7;
    seed[i] = r();
  }

  const make = (name: string): Formation => ({
    name,
    pos: new Float32Array(count * 4),
    code: new Float32Array(count),
    scale: [1, 1, 1],
    useLen: 0,
    flow: [0, 0, 0, 0],
    labels: [],
    camera: { pos: [0, 0, 10], target: [0, 0, 0] },
  });
  const set = (f: Formation, i: number, x: number, y: number, z: number, size: number, code: number) => {
    f.pos[i * 4] = x;
    f.pos[i * 4 + 1] = y;
    f.pos[i * 4 + 2] = z;
    f.pos[i * 4 + 3] = size;
    f.code[i] = code;
  };

  const formations: Formation[] = [];

  // 0. The flood: sheets of code (pull requests) streaming toward the viewer.
  {
    const f = make("flood");
    const rows = 64;
    const L = 3.2;
    f.scale = [L, 0.034, 0.034];
    f.useLen = 1;
    f.flow = [1, -84, 2.5, 2.4];
    f.camera = { pos: [0, 0, 9], target: [0, 0, -10] };
    let i = 0;
    while (i < count) {
      const sx = (r() - 0.5) * 28;
      const sy = (r() - 0.5) * 16;
      const sz = -84 + r() * 86.5;
      let ind = 0;
      for (let row = 0; row < rows && i < count; row++, i++) {
        const q = r();
        if (q < 0.2 && ind < 4) ind++;
        else if (q < 0.4 && ind > 0) ind--;
        const x = sx - L / 2 + ind * 0.2 + (len[i] * L) / 2;
        const y = sy + (rows / 2 - row) * 0.085;
        set(f, i, x, y, sz, 1, diffCode(r) + FLOW);
      }
    }
    formations.push(f);
  }

  // 1. The wall: the same lines laid flat, far wider and taller than the screen.
  const cols = 48;
  const perCol = Math.ceil(count / cols);
  const colW = 0.68;
  const pitch = 17 / perCol;
  const wallZ = -2;
  {
    const f = make("wall");
    const L = 0.5;
    f.scale = [L, pitch * 0.55, 0.02];
    f.useLen = 1;
    f.camera = { pos: [0, 0, 9.5], target: [0.4, 0, wallZ] };
    const x0 = (-cols * colW) / 2;
    for (let c = 0; c < cols; c++) {
      let ind = 0;
      for (let row = 0; row < perCol; row++) {
        const i = c * perCol + row;
        if (i >= count) break;
        const q = r();
        if (q < 0.2 && ind < 4) ind++;
        else if (q < 0.4 && ind > 0) ind--;
        const x = x0 + c * colW + 0.04 + ind * 0.04 + (len[i] * L) / 2;
        const y = 8.5 - row * pitch;
        set(f, i, x, y, wallZ + r() * 0.04, 1, diffCode(r));
      }
    }
    formations.push(f);
  }
  // The attention frame: what one careful review covers, about 400 lines (4 columns x 100 rows).
  const frameRows = Math.min(100, perCol);
  const r0 = Math.floor((perCol - frameRows) / 2);
  const c0 = 22;
  const x0 = (-cols * colW) / 2;
  const frame = {
    x: x0 + c0 * colW - 0.05,
    y: 8.5 - r0 * pitch + pitch * 0.6,
    w: 4 * colW + 0.04,
    h: frameRows * pitch + pitch * 0.2,
    z: wallZ + 0.08,
  };
  formations[1].labels.push({ text: "One careful review: about 400 lines", pos: [frame.x, frame.y + 0.32, frame.z], signal: true, align: "left" });

  // 2. Signal from noise: four slabs, one per change in meaning. The first needs a person.
  {
    const f = make("meaning");
    const W = 8.4;
    const H = 0.92;
    const ys = [2.1, 0.7, -0.7, -2.1];
    const kinds = ["New external dependency", "Contract change, additive", "New event consumer", "Internal"];
    const per = Math.floor(count / 4);
    const gx = Math.round(Math.sqrt((per * W) / H));
    const gy = Math.ceil(per / gx);
    const cw = W / gx;
    const ch = H / gy;
    f.scale = [cw * 1.5, ch * 0.5, 0.1];
    f.useLen = 1;
    f.camera = { pos: [0, 0, 15], target: [0, 0, 0] };
    for (let i = 0; i < count; i++) {
      const s = Math.floor(i / per);
      if (s > 3) {
        set(f, i, 0, 0, 0, 0, INK);
        continue;
      }
      const k = i % per;
      const cx = k % gx;
      const cy = Math.floor(k / gx);
      const x = -W / 2 + (cx + 0.5) * cw;
      const y = ys[s] + H / 2 - (cy + 0.5) * ch;
      set(f, i, x, y, (r() - 0.5) * 0.12, 1, s === 0 ? SIGNAL : INK);
    }
    ys.forEach((y, s) => f.labels.push({ text: kinds[s], pos: [W / 2, y + H / 2 + 0.22, 0], signal: s === 0, align: "right" }));
    formations.push(f);
  }

  // 3. The map: components as clusters, dependencies as trails. The new edge leads to the SMS provider.
  {
    const f = make("map");
    f.scale = [0.064, 0.064, 0.064];
    f.camera = { pos: [-0.7, 1.5, 21.5], target: [-0.7, 0, 0] };
    const nodes: Record<string, { p: [number, number, number]; label: string; signal?: boolean }> = {
      orders: { p: [-5, 2.4, -0.5], label: "orders" },
      prefs: { p: [1.6, 2.9, -1.2], label: "user-preferences" },
      notifications: { p: [-2.2, -1.2, 0.8], label: "notifications" },
      billing: { p: [5.2, 0.2, -0.6], label: "billing" },
      sms: { p: [1.4, -3.4, 1.2], label: "SMS provider (new)", signal: true },
    };
    const edges: [string, string, boolean][] = [
      ["orders", "notifications", false],
      ["notifications", "prefs", false],
      ["billing", "prefs", false],
      ["notifications", "sms", true],
    ];
    const names = Object.keys(nodes);
    const clusterShare = 0.55;
    const perNode = Math.floor((count * clusterShare) / names.length);
    const perEdge = Math.floor((count - perNode * names.length) / edges.length);
    let i = 0;
    for (const n of names) {
      const node = nodes[n];
      for (let k = 0; k < perNode; k++, i++) {
        const [dx, dy, dz] = inSphere(r, 0.95);
        set(f, i, node.p[0] + dx, node.p[1] + dy, node.p[2] + dz, 1, node.signal ? SIGNAL : INK);
      }
      f.labels.push({ text: node.label, pos: [node.p[0], node.p[1] + 1.35, node.p[2]], signal: node.signal });
    }
    for (const [a, b, signal] of edges) {
      const A = nodes[a].p;
      const B = nodes[b].p;
      for (let k = 0; k < perEdge && i < count; k++, i++) {
        const u = r();
        const j = () => (r() + r() + r() - 1.5) * 0.06;
        set(f, i, A[0] + (B[0] - A[0]) * u + j(), A[1] + (B[1] - A[1]) * u + j(), A[2] + (B[2] - A[2]) * u + j(), 0.75, signal ? SIGNAL : INK);
      }
    }
    for (; i < count; i++) set(f, i, 0, 0, 0, 0, INK);
    formations.push(f);
  }

  // 4. Lanes: four runways lined with lights. Changes glide toward approval; the human lane
  //    carries amber packets; the blocked lane stops at a red barrier.
  {
    const f = make("lanes");
    f.scale = [0.13, 0.05, 0.2];
    f.flow = [1, -60, 7, -2.4];
    f.camera = { pos: [0, 2.4, 13.5], target: [0, -1.4, -14] };
    const lanes = [
      { x: -3.2, name: "Auto-merge", code: INK },
      { x: -0.6, name: "Judge", code: INK },
      { x: 2.0, name: "Human", code: SIGNAL },
      { x: 4.6, name: "Blocked", code: INK },
    ];
    const floor = -1.8;
    let i = 0;
    // Edge lights.
    for (const lane of lanes) {
      for (const side of [-1.15, 1.15]) {
        for (let z = 6; z > -60 && i < count; z -= 0.9, i++) {
          set(f, i, lane.x + side, floor, z, 0.8, lane.name === "Blocked" ? RED : INK);
        }
      }
      f.labels.push({ text: lane.name, pos: [lane.x, floor + 0.75, 0.5], signal: lane.code === SIGNAL });
    }
    // Packets: small blocks of lines, like documents.
    for (const lane of lanes) {
      const blocked = lane.name === "Blocked";
      const packets = blocked ? 6 : 22;
      for (let p = 0; p < packets; p++) {
        const pz = blocked ? -8.6 + p * 1.1 : -60 + p * 3 + r() * 1.5;
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 3; col++) {
            if (i >= count) break;
            const x = lane.x - 0.3 + col * 0.3;
            const y = floor + 0.12 + row * 0.11;
            const code = blocked ? INK : lane.code + FLOW;
            set(f, i++, x, y, pz + (r() - 0.5) * 0.05, 1, code);
          }
        }
      }
      if (blocked) {
        // The barrier.
        for (let k = 0; k < 90 && i < count; k++, i++) {
          set(f, i, lane.x - 1.0 + (k % 15) * 0.14, floor + 0.1 + Math.floor(k / 15) * 0.12, -10, 1, RED);
        }
      }
    }
    for (; i < count; i++) set(f, i, 0, floor, -30, 0, INK);
    formations.push(f);
  }

  // 5. Track records: weeks of changes stacked by lane. Auto-merge grows as an agent's
  //    record does; an incident takes auto-merge away again.
  {
    const f = make("record");
    f.scale = [0.085, 0.045, 0.085];
    f.camera = { pos: [1.4, 0.9, 13.5], target: [1.4, 0.2, 0] };
    // Bottom to top: H a person, J the judge, A auto-merge, R an incident.
    const weeks = ["HHHJ", "HHJJ", "HHJJJ", "HJJJJA", "HJJJAA", "HJJAAA", "HJJAAAR", "HHHJJJ", "HJJJAAA", "HJJAAAAA"];
    const codes: Record<string, number> = { H: SIGNAL, J: INK, A: GREEN, R: RED };
    const x0 = -1.0;
    const dx = 0.68;
    const base = -2.3;
    const cols = 5;
    const rows = 4;
    const cw = 0.1;
    const ch = 0.062;
    const gap = 0.07;
    const blockH = rows * ch + gap;
    let i = 0;
    weeks.forEach((week, w) => {
      const x = x0 + w * dx;
      [...week].forEach((kind, b) => {
        const y = base + b * blockH;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols && i < count; col++, i++) {
            set(f, i, x - (cols * cw) / 2 + (col + 0.5) * cw, y + (row + 0.5) * ch, (r() - 0.5) * 0.05, 1, codes[kind]);
          }
        }
      });
      const top = base + week.length * blockH;
      if (w === 0) f.labels.push({ text: "A person reviews", pos: [x - 0.3, top + 0.3, 0], signal: true, align: "left" });
      if (w === 6) f.labels.push({ text: "Incident: auto-merge lost", pos: [x, top + 0.3, 0], signal: true });
      if (w === weeks.length - 1) f.labels.push({ text: "Auto-merge, earned", pos: [x + 0.3, top + 0.3, 0], align: "right" });
    });
    // A baseline under the weeks.
    for (let k = 0; k < 160 && i < count; k++, i++) {
      set(f, i, x0 - 0.4 + (k / 159) * (dx * (weeks.length - 1) + 0.8), base - 0.12, 0, 0.7, INK);
    }
    for (; i < count; i++) set(f, i, 1.4, base, -2, 0, INK);
    formations.push(f);
  }

  // 6. A quiet field: the system running in the background.
  {
    const f = make("field");
    f.scale = [0.05, 0.05, 0.05];
    f.flow = [2, 0, 0, 0.025];
    f.camera = { pos: [0, 0, 12], target: [0, 0, 0] };
    for (let i = 0; i < count; i++) {
      const u = r();
      const v = r();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const rad = 9 + r() * 14;
      set(f, i, rad * Math.sin(phi) * Math.cos(theta), rad * Math.sin(phi) * Math.sin(theta) * 0.6, rad * Math.cos(phi), 0.7, INK + FLOW);
    }
    formations.push(f);
  }

  // 7. The point: everything resolved into one thing to look at.
  {
    const f = make("point");
    f.scale = [0.03, 0.03, 0.03];
    f.flow = [2, 0, 0, 0.16];
    f.camera = { pos: [-1.1, 0, 7], target: [-1.1, 0, 0] };
    const core = Math.floor(count * 0.14);
    for (let i = 0; i < count; i++) {
      if (i < core) {
        const [x, y, z] = inSphere(r, 0.34);
        set(f, i, x, y, z, 1.3, SIGNAL + FLOW);
      } else {
        const u = r();
        const v = r();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const rad = 1.05 + (r() - 0.5) * 0.06;
        set(f, i, rad * Math.sin(phi) * Math.cos(theta), rad * Math.sin(phi) * Math.sin(theta), rad * Math.cos(phi), 0.8, INK + FLOW);
      }
    }
    formations.push(f);
  }

  return { count, len, seed, formations, frame };
}
