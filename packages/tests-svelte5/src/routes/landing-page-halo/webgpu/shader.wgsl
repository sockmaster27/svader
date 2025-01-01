@group(0) @binding(0) var<uniform> resolution: vec2f;
@group(0) @binding(1) var<uniform> offset: vec2f;
@group(0) @binding(2) var<uniform> scale: f32;


// Pick a pseudo-random number for the given `pos`.
fn random(pos: vec2f) -> f32 {
    let st = pos / resolution;
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}


// Determine the value of the pixel at `pos`, if we want to draw a halo at `center` with a the given `radius`.
// The `side_length` represents the smaller dimension of the canvas, and is used to scale all values accordingly.
fn halo(pos: vec2f, center: vec2f, radius: f32, side_length: f32) -> f32 { 
    let halo_solid_feather = 0.02 * side_length;
    let halo_thickness = 0.017 * side_length;
    let halo_glow_spread = 0.3 * side_length;

    // Create a distance field from the center.
    let center_d = distance(pos, center);
    // Create a distence field for the halo.
    let halo_d = abs(center_d - radius);
    // Draw the 'solid' part of the halo.
    // By multiplying by 5.0 we generate a value greater than 1.0,
    // which will make the color saturate into a whiter nuance and give the halo sharper edges.
    let halo_solid = smoothstep(halo_d, halo_d + halo_solid_feather, halo_thickness) * 5.0;
    // Draw the glow around the halo.
    let halo_glow = pow(1.0 - clamp(halo_d / halo_glow_spread, 0.0, 1.0), 5.0) * 0.4 * (0.85 + random(pos) * 0.3);

    return halo_solid + halo_glow;
}


@fragment
fn main(@builtin(position) raw_pos: vec4f) -> @location(0) vec4f {
    let pos = raw_pos.xy + offset;

    let screen_center = resolution / 2.0;

    // This shader automatically scales to fit the smallest dimension of the canvas.
    let side_length = min(resolution.x, resolution.y);

    // Draw 5 halos to create a sense of depth.
    var v = 0.0;
    for (var i = 0.0; i < 5.0; i += 1.0) {
        // As the halos get further back they:
        // - Are placed slightly higher up
        let center = screen_center - vec2(0.0, i * 0.005 * side_length);
        // - Get smaller
        let radius = (side_length * 0.4) / (i * 0.15 + 1.0);
        // - Gradually fade out
        let fade_factor = pow(0.3, i);

        v += halo(pos, center, radius, side_length) * fade_factor;
    }

    // Give the halos a yellowish color.
    let gradient_length = 0.5 * side_length;
    let gradient_value = clamp((pos.y - (resolution.y - gradient_length) * 0.5) / gradient_length, 0.0, 1.0);
    let warm_color = vec4(1.0, 0.69, 0.37, 1.0);
    let cool_color = vec4(0.67, 0.82, 1.0, 1.0);
    let color = mix(warm_color, cool_color, gradient_value);

    return color * v;
}
