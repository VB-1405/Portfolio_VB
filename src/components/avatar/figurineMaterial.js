import * as THREE from "three";

export const figurineUniforms = {
  uIdleMap: { value: null },
  uWaveMap: { value: null },
  uMix: { value: 0 },
  uTime: { value: 0 },
  uHoloLegs: { value: 0.38 },
};

export const figurineVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const figurineFragmentShader = /* glsl */ `
varying vec2 vUv;

uniform sampler2D uIdleMap;
uniform sampler2D uWaveMap;
uniform float uMix;
uniform float uTime;
uniform float uHoloLegs;

void main() {
  vec4 idle = texture2D(uIdleMap, vUv);
  vec4 wave = texture2D(uWaveMap, vUv);
  vec4 tex = mix(idle, wave, uMix);
  if (tex.a < 0.04) discard;

  float legMask = 1.0 - smoothstep(uHoloLegs - 0.06, uHoloLegs + 0.04, vUv.y);
  float rings = sin((vUv.y - uTime * 0.15) * 55.0) * 0.5 + 0.5;
  float lines = sin(vUv.x * 90.0) * 0.5 + 0.5;
  vec3 holo = vec3(0.15, 0.82, 0.95) * (0.35 + rings * 0.45 + lines * 0.2);

  vec3 color = mix(tex.rgb, holo, legMask * 0.72);
  float alpha = tex.a * (1.0 - legMask * 0.15);

  gl_FragColor = vec4(color, alpha);
}
`;

export function createFigurineMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: figurineVertexShader,
    fragmentShader: figurineFragmentShader,
    uniforms: THREE.UniformsUtils.clone(figurineUniforms),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
}
