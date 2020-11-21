uniform sampler2D textures[3];

varying float posiY;
// varying float vTexIndex;

void main() {
    // vec4 startColor = vec4(vColor, 1.0);
    vec4 finalColor;

    if (posiY < 20.0) {
      finalColor = texture2D(textures[0], gl_PointCoord);
    } else if (posiY > 40.0) {
      finalColor = texture2D(textures[1], gl_PointCoord);
    } else {
      finalColor = texture2D(textures[2], gl_PointCoord);
    }

    gl_FragColor = finalColor;
}
