varying vec2 vUv;
uniform vec3 color1;
uniform vec3 color2;
uniform float time;

void main() {
  vec3 colorMix = mix(color1, color2, vUv.x);
  vec3 colorMix2 = mix(color1, color2, vUv.y);
  vec3 varyingColorMix = vec3((colorMix.r * sin(time / 2.0)) + 3.0, colorMix.g, colorMix.b);
  vec3 varyingColorMix2 = vec3((colorMix2.r * sin(time / 3.0)) + 2.0, colorMix2.g, colorMix2.b);

  gl_FragColor = vec4(mix(colorMix, varyingColorMix2, vUv.y * (sin(time) + 1.0)), 1.0);
  // gl_FragColor = vec4(mix(colorMix, colorMix2, vUv.x * (sin(time) + 1.0)), 1.0);
}
