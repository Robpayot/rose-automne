attribute vec3 color;
attribute float texIndex;

varying float posiY;
// varying float vTexIndex;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // vColor = color;
    // vTexIndex = texIndex;

    gl_PointSize = 60.0;
    gl_Position = projectionMatrix * mvPosition;
    posiY = gl_Position.y;
}
