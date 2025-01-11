#version 300 es

precision highp float;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_offset;


// Pick a pseudo-random number for the given `pos`.
float random(vec2 pos) {
    vec2 st = pos / u_resolution;
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}


// Determine the value of the pixel at `pos`, if we want to draw a halo at `center` with a the given `radius`.
// The `side_length` represents the smaller dimension of the canvas, and is used to scale all values accordingly.
float halo(vec2 pos, vec2 center, float radius, float side_length) {
    float halo_solid_feather = 0.02 * side_length;
    float halo_thickness = 0.017 * side_length;
    float halo_glow_spread = 0.3 * side_length;

    // Create a distance field from the center.
    float center_d = distance(pos, center);
    // Create a distence field for the halo.
    float halo_d = abs(center_d - radius);
    // Draw the 'solid' part of the halo.
    // By multiplying by 5.0 we generate a value greater than 1.0,
    // which will make the color saturate into a whiter nuance and give the halo sharper edges.
    float halo_solid = smoothstep(halo_d, halo_d + halo_solid_feather, halo_thickness) * 5.0;
    // Draw the glow around the halo.
    float halo_glow = pow(1.0 - clamp(halo_d / halo_glow_spread, 0.0, 1.0), 5.0) * 0.4 * (0.85 + random(pos) * 0.3);

    return halo_solid + halo_glow;
}


void main() {
    vec2 pos = gl_FragCoord.xy + u_offset;

    vec2 screen_center = u_resolution / 2.0;

    // This shader automatically scales to fit the smallest dimension of the canvas.
    float side_length = min(u_resolution.x, u_resolution.y);

    // Draw 5 halos to create a sense of depth.
    float v = 0.0;
    for (float i = 0.0; i < 5.0; i++) {
        // As the halos get further back they:
        // - Are placed slightly higher up
        vec2 center = screen_center + vec2(0.0, i * 0.005 * side_length);
        // - Get smaller
        float radius = (side_length * 0.4) / (i * 0.15 + 1.0);
        // - Gradually fade out
        float fade_factor = pow(0.3, i);

        v += halo(pos, center, radius, side_length) * fade_factor;
    }

    // Give the halos a yellowish color.
    float gradient_length = 0.5 * side_length;
    float gradient_value = clamp((-pos.y + (u_resolution.y + gradient_length) * 0.5) / gradient_length, 0.0, 1.0);
    vec4 warm_color = vec4(1.0, 0.69, 0.37, 1.0);
    vec4 cool_color = vec4(0.67, 0.82, 1.0, 1.0);
    vec4 color = mix(warm_color, cool_color, gradient_value);

    fragColor = color * v;
}
