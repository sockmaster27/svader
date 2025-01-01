#version 300 es

precision highp float;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_scale;
uniform float u_value;


// Pick a pseudo-random number for the given `pos`.
float random(vec2 pos) {
    return fract(sin(dot(pos, vec2(12.9898, 78.233))) * 43758.5453);
}


void main() {
    vec2 pos = gl_FragCoord.xy + u_offset;

    // Set up the tweakable parameters.
    float thumb_radius = 30.0 * u_scale;
    float track_radius = 2.0 * u_scale;
    float filled_track_radius = 4.0 * u_scale;
    float thumb_weight = mix(1.5, 8.0, u_value) * u_scale;
    float gloop_factor = 0.4;

    vec4 filled_color = vec4(0.84, 0.32, 0.0, 1.0);
    vec4 unfilled_color = vec4(1.0, 0.84, 0.73, 1.0);
    vec4 glow_color = vec4(1.0, 0.83, 0.5, 1.0);

    // Draw the thumb "cloud", meaning a fuzzy shape with a value of 1.0 at the center of the thumb and 0.5 at the edge.
    // This allows us to let the thumb and the track "melt" into each other.
    vec2 thumb_center = vec2(thumb_radius + (u_value * (u_resolution.x - 2.0 * thumb_radius)), u_resolution.y / 2.0);
    float thumb_dist = distance(pos, thumb_center);
    float thumb_norm_dist = pow(thumb_dist, gloop_factor) / (2.0 * pow(thumb_weight, gloop_factor)); 
    float thumb_cloud = clamp(1.0 - thumb_norm_dist, 0.0, 1.0);

    // Draw a cloud shape for the whole track and the filled part of the track (the part left of the thumb).
    float track_min_x = thumb_radius;
    float track_max_x = u_resolution.x - thumb_radius;
    float track_dist = distance(pos, vec2(clamp(pos.x, track_min_x, track_max_x), u_resolution.y / 2.0));
    float filled_track_dist = distance(pos, vec2(clamp(pos.x, track_min_x, thumb_center.x), u_resolution.y / 2.0));
    float track_norm_dist = pow(track_dist, gloop_factor) / (2.0 * pow(track_radius, gloop_factor));
    float filled_track_norm_dist = pow(filled_track_dist, gloop_factor) / (2.0 * pow(filled_track_radius, gloop_factor));
    float track_cloud = clamp(1.0 - track_norm_dist, 0.0, 1.0);
    float filled_track_cloud = clamp(1.0 - filled_track_norm_dist, 0.0, 1.0);

    float rand = random(pos);

    // Mix the shapes.
    float filled = step(0.5 + rand * 0.06, thumb_cloud + filled_track_cloud);
    float unfilled = smoothstep(0.5, 0.52, track_cloud);
    float glow = step(mix(0.5 + rand * 0.06, 0.2 + rand * 0.2, u_value), thumb_cloud + filled_track_cloud);

    // Draw the shapes.
    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
    color = mix(color, unfilled_color, unfilled);
    color = mix(color, glow_color, glow);
    color = mix(color, filled_color, filled);

    fragColor = color;
}
