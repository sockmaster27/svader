@group(0) @binding(0) var<uniform> resolution: vec2f;
@group(0) @binding(1) var<uniform> offset: vec2f;
@group(0) @binding(2) var<uniform> scale: f32;


// Determine the value of the pixel at `pos`, if we want to draw a halo at `center` with a the given `radius`.
fn halo(pos: vec2f, center: vec2f, radius: f32) -> f32 { 
    let halo_solid_feather = 3.0 * scale;
    let halo_thickness = 4.5 * scale;
    let halo_glow_spread = 50.0 * scale;

    // Create a distance field from the center.
    let center_d = distance(pos, center);
    // Create a distence field for the halo.
    let halo_d = abs(center_d - radius);
    // Draw the 'solid' part of the halo.
    let halo_solid = smoothstep(halo_d, halo_d + halo_solid_feather, halo_thickness);
    // Draw the subtle glow around the halo.
    let halo_glow = pow(1.0 - clamp(halo_d / halo_glow_spread, 0.0, 1.0), 3.0) * 0.2;

    return halo_solid + halo_glow;
}

@fragment
fn fragmentMain(@builtin(position) raw_pos: vec4f) -> @location(0) vec4f {
    let pos = raw_pos.xy + offset;

    let screen_center = resolution / 2.0;

    // Draw 5 halos to create a sense of depth.
    var v = 0.0;
    for (var i = 0.0; i < 5.0; i += 1.0) {
        // As the halos get further back they:
        // - Are placed slightly higher up
        let center = screen_center - vec2(0.0, i * 3.0 * scale);
        // - Get smaller
        let radius = 140.0 / (i * 0.15 + 1.0) * scale;
        // - Gradually fade out
        let fade_factor = i * 15.0 + 1.0;

        v += halo(pos, center, radius) / fade_factor;
    }

    // Give the halos a yellowish color.
    let color = vec3(1.0, 1.0, 0.8);

    return vec4(color * v, v);
}
