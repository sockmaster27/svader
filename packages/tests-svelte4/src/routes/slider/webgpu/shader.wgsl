@group(0) @binding(0) var<uniform> resolution: vec2f;
@group(0) @binding(1) var<uniform> offset: vec2f;
@group(0) @binding(2) var<uniform> scale: f32;
@group(0) @binding(3) var<uniform> value: f32;


// Pick a pseudo-random number for the given `pos`.
fn random(pos: vec2f) -> f32 {
    return fract(sin(dot(pos, vec2f(12.9898, 78.233))) * 43758.5453);
}


@fragment
fn main(@builtin(position) raw_pos: vec4f) -> @location(0) vec4f {
    let pos = raw_pos.xy + offset;

    // Set up the tweakable parameters.
    let thumb_radius = 30.0 * scale;
    let track_radius = 2.0 * scale;
    let filled_track_radius = 4.0 * scale;
    let thumb_weight = mix(1.5, 8.0, value) * scale;
    let gloop_factor = 0.4;

    let filled_color = vec4f(0.84, 0.32, 0.0, 1.0);
    let unfilled_color = vec4f(1.0, 0.84, 0.73, 1.0);
    let glow_color = vec4f(1.0, 0.83, 0.5, 1.0);

    // Draw the thumb "cloud", meaning a fuzzy shape with a value of 1.0 at the center of the thumb and 0.5 at the edge.
    // This allows us to let the thumb and the track "melt" into each other.
    let thumb_center = vec2f(thumb_radius + (value * (resolution.x - 2.0 * thumb_radius)), resolution.y / 2.0);
    let thumb_dist = distance(pos, thumb_center);
    let thumb_norm_dist = pow(thumb_dist, gloop_factor) / (2.0 * pow(thumb_weight, gloop_factor)); 
    let thumb_cloud = clamp(1.0 - thumb_norm_dist, 0.0, 1.0);

    // Draw a cloud shape for the whole track and the filled part of the track (the part left of the thumb).
    let track_min_x = thumb_radius;
    let track_max_x = resolution.x - thumb_radius;
    let track_dist = distance(pos, vec2f(clamp(pos.x, track_min_x, track_max_x), resolution.y / 2.0));
    let filled_track_dist = distance(pos, vec2f(clamp(pos.x, track_min_x, thumb_center.x), resolution.y / 2.0));
    let track_norm_dist = pow(track_dist, gloop_factor) / (2.0 * pow(track_radius, gloop_factor));
    let filled_track_norm_dist = pow(filled_track_dist, gloop_factor) / (2.0 * pow(filled_track_radius, gloop_factor));
    let track_cloud = clamp(1.0 - track_norm_dist, 0.0, 1.0);
    let filled_track_cloud = clamp(1.0 - filled_track_norm_dist, 0.0, 1.0);

    let rand = random(pos);

    // Mix the shapes.
    let filled = step(0.5 + rand * 0.06, thumb_cloud + filled_track_cloud);
    let unfilled = smoothstep(0.5, 0.52, track_cloud);
    let glow = step(mix(0.5 + rand * 0.06, 0.2 + rand * 0.2, value), thumb_cloud + filled_track_cloud);

    // Draw the shapes.
    var color = vec4f(0.0, 0.0, 0.0, 0.0);
    color = mix(color, unfilled_color, unfilled);
    color = mix(color, glow_color, glow);
    color = mix(color, filled_color, filled);

    return color;
}
