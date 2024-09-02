#version 300 es

precision mediump float;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_scale;


// Determine the value of the pixel at `pos`, if we want to draw a halo at `center` with a the given `radius`.
float halo(vec2 pos, vec2 center, float radius) {
    float halo_solid_feather = 3.0 * u_scale;
    float halo_thickness = 4.5 * u_scale;
    float halo_glow_spread = 50.0 * u_scale;

    // Create a distance field from the center.
    float center_d = distance(pos, center);
    // Create a distence field for the halo.
    float halo_d = abs(center_d - radius);
    // Draw the 'solid' part of the halo.
    float halo_solid = smoothstep(halo_d, halo_d + halo_solid_feather, halo_thickness);
    // Draw the subtle glow around the halo.
    float halo_glow = pow(1.0 - clamp(halo_d / halo_glow_spread, 0.0, 1.0), 3.0) * 0.2;

    return halo_solid + halo_glow;
}


void main() {
    vec2 pos = gl_FragCoord.xy + u_offset;

    vec2 screen_center = u_resolution / 2.0;

    // Draw 5 halos to create a sense of depth.
    float v = 0.0;
    for (float i = 0.0; i < 5.0; i++) {
        // As the halos get further back they:
        // - Are placed slightly higher up
        vec2 center = screen_center + vec2(0.0, i * 3.0 * u_scale);
        // - Get smaller
        float radius = 140.0 / (i * 0.15 + 1.0) * u_scale;
        // - Gradually fade out
        float fade_factor = i * 15.0 + 1.0;

        v += halo(pos, center, radius) / fade_factor;
    }

    // Give the halos a yellowish color.
    vec3 color = vec3(1.0, 1.0, 0.8);

    fragColor = vec4(color * v, v);
}
