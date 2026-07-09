import * as THREE from "three";

export function createFigurineMaterial(idleMap, waveMap) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uIdleMap: { value: idleMap },
      uWaveMap: { value: waveMap },
      uMix: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform sampler2D uIdleMap;
      uniform sampler2D uWaveMap;
      uniform float uMix;

      void main() {
        vec4 idle = texture2D(uIdleMap, vUv);
        vec4 wave = texture2D(uWaveMap, vUv);
        vec4 tex = mix(idle, wave, uMix);
        if (tex.a < 0.04) discard;
        gl_FragColor = tex;
      }
    `,
  });
}
