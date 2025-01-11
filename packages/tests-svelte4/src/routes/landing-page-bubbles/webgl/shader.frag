#version 300 es

precision highp float;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_scale;
uniform float u_time;
uniform vec3 u_color;


// Determine the value of the pixel at `pos`, if we want to draw a circle at `center` with a the given `radius`.
float circle(vec2 pos, vec2 center, float radius) {
    return 1.0 - smoothstep(radius - 1.5, radius, distance(pos, center));
}


// Determine the value of the pixel at `pos`, if we want to draw a 'bubble' (wobbly circle) at `center` with a the given `radius`.
// The `random_seed` is used to make all bubbles wobble a bit differently.
float bubble(vec2 pos, vec2 center, float radius, float random_seed) {
    const float pi = 3.1415926535897932384626433832795;

    // Determine the angle between `pos` and `center`.
    float angle = atan(pos.y - center.y, pos.x - center.x) / pi;

    // Create wobble by layering multiple sine waves.
    // One with a frequency of 1, one with a frequency of 2, etc. up to 6.
    float wobble = 0.0;
    for (float i = 1.0; i <= 6.0; i++) {
        float random_offset = sin(random_seed) * pi * pow(i, 2.0);
        float speed = pow(i, 2.0) * 0.05;
        float amplitude = 0.05 / i;
        wobble += sin(angle * i * pi + u_time * speed + random_offset) * amplitude;
    }

    float wobbly_radius = radius * (wobble + 1.0);
    return circle(pos, center, wobbly_radius);
}


void main() {
    vec2 pos = gl_FragCoord.xy + u_offset;

    // Mirror the y-axis so that the origin is in the top-left corner.
    pos.y = u_resolution.y - pos.y;

    // Break the screen into square tiles with a width of 300 CSS pixels each.
    float tile_width = 300.0 * u_scale;
    vec2 tile_center = vec2(tile_width / 2.0);
    vec2 tile_coords = mod(pos + tile_center, tile_width);

    // Determine which tile we're in and use that as a random seed.
    vec2 which_tile = floor((pos + tile_center) / tile_width);
    float tile_index = which_tile.x + which_tile.y * 10.0; // Assume at most 10 tiles in width
    float random_seed = tile_index;

    float bubble_gap = 20.0 * u_scale;
    float radius = tile_width / 2.0 - bubble_gap;

    float v = bubble(tile_coords, tile_center, radius, random_seed);

    fragColor = vec4(u_color * v, v);
}
