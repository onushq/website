export const vertexShader = /* glsl */ `
uniform float uT;
uniform float uTime;
uniform float uStagger;
uniform float uArc;
uniform vec3 uScaleA;
uniform vec3 uScaleB;
uniform float uLenA;
uniform float uLenB;
uniform vec4 uFlowA;
uniform vec4 uFlowB;
uniform vec3 uInk;
uniform vec3 uSignal;
uniform vec3 uRed;
uniform vec3 uGreen;
uniform float uFogDensity;

attribute vec4 aFrom;
attribute vec4 aTo;
attribute vec2 aCode;
attribute vec2 aMeta; // line length, seed

varying vec3 vNormal;
varying vec3 vColor;
varying float vGlow;
varying float vFog;

vec3 flowed(vec3 p, float moving, vec4 f) {
  if (moving < 0.5) return p;
  if (f.x > 0.5 && f.x < 1.5) {
    float range = f.z - f.y;
    p.z = f.y + mod(p.z - f.y + uTime * f.w, range);
  } else if (f.x > 1.5) {
    float a = uTime * f.w;
    float c = cos(a);
    float s = sin(a);
    p.xz = mat2(c, -s, s, c) * p.xz;
  }
  return p;
}

vec3 colorOf(float idx, float seed) {
  if (idx < 0.5) return uInk * (0.34 + 0.46 * fract(seed * 13.7));
  if (idx < 1.5) return uSignal;
  if (idx < 2.5) return uRed * 0.8;
  return uGreen * 0.75;
}

void main() {
  float seed = aMeta.y;
  float t = clamp((uT - seed * uStagger) / (1.0 - uStagger), 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);

  float movingA = step(9.5, aCode.x);
  float movingB = step(9.5, aCode.y);
  float colA = aCode.x - 10.0 * movingA;
  float colB = aCode.y - 10.0 * movingB;

  vec3 a = flowed(aFrom.xyz, movingA, uFlowA);
  vec3 b = flowed(aTo.xyz, movingB, uFlowB);
  vec3 center = mix(a, b, t);
  vec3 dir = normalize(vec3(sin(seed * 41.0), cos(seed * 29.0), sin(seed * 17.0 + 1.0)));
  center += dir * sin(t * 3.14159265) * uArc;

  vec3 sA = uScaleA * vec3(mix(1.0, aMeta.x, uLenA), 1.0, 1.0) * aFrom.w;
  vec3 sB = uScaleB * vec3(mix(1.0, aMeta.x, uLenB), 1.0, 1.0) * aTo.w;
  vec3 world = center + position * mix(sA, sB, t);

  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;

  vNormal = normalize(normalMatrix * normal);
  vColor = mix(colorOf(colA, seed), colorOf(colB, seed), t);
  vGlow = mix(float(colA > 0.5 && colA < 1.5), float(colB > 0.5 && colB < 1.5), t);
  float d = -mv.z * uFogDensity;
  vFog = 1.0 - exp(-d * d);
}
`;

export const fragmentShader = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uLight;
uniform float uGlowBoost;

varying vec3 vNormal;
varying vec3 vColor;
varying float vGlow;
varying float vFog;

void main() {
  vec3 n = normalize(vNormal);
  float diffuse = max(dot(n, normalize(uLight)), 0.0);
  float rim = pow(1.0 - abs(n.z), 2.0) * 0.25;
  vec3 lit = vColor * (0.42 + 0.7 * diffuse + rim);
  vec3 col = mix(lit, vColor * uGlowBoost, vGlow);
  col = mix(col, uBg, vFog * (1.0 - vGlow * 0.6));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
