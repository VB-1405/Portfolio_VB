import * as THREE from "three";

// David Heckhoff–style holographic scan lines (portfolio-2025, MIT-style open reference).
export const hologramUniforms = {
  uTime: { value: 0 },
  uColor: { value: new THREE.Color("#22d3ee") },
  uIntensity: { value: 0.55 },
};

export const hologramVertexShader = /* glsl */ `
#include <skinning_pars_vertex>

varying vec3 vHoloNormal;
varying vec3 vHoloWorldPos;

void main() {
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>

  vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
  vHoloNormal = normalize(mat3(modelMatrix) * normal);
  vHoloWorldPos = worldPosition.xyz;
}
`;

export const hologramFragmentShader = /* glsl */ `
varying vec3 vHoloNormal;
varying vec3 vHoloWorldPos;

uniform vec3 uColor;
uniform float uTime;
uniform float uIntensity;

void main() {
  vec3 normal = normalize(vHoloNormal);
  if (!gl_FrontFacing) normal *= -1.0;

  float stripes = mod((vHoloWorldPos.y - uTime * 0.1) * 25.0, 1.0);
  stripes = pow(stripes, 3.0);

  vec3 viewDir = normalize(cameraPosition - vHoloWorldPos);
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.0);
  float falloff = smoothstep(0.85, 0.35, fresnel);

  float holographic = stripes * fresnel + fresnel * 0.65 + stripes * 0.05;
  holographic *= falloff;
  if (!gl_FrontFacing) holographic *= 0.4;

  gl_FragColor = vec4(uColor, min(holographic * uIntensity, 0.42));
}
`;

export function createHologramMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: hologramVertexShader,
    fragmentShader: hologramFragmentShader,
    uniforms: THREE.UniformsUtils.clone(hologramUniforms),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}
