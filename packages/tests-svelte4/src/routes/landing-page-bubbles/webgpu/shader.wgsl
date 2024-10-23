@group(0) @binding(0) var<uniform> offset: vec2f;
@group(0) @binding(1) var<uniform> scale: f32;
@group(0) @binding(2) var<uniform> time: f32;
@group(0) @binding(3) var<uniform> color: vec3f;


// Determine the value of the pixel at `pos`, if we want to draw a circle at `center` with a the given `radius`.
fn circle(pos: vec2f, center: vec2f, radius: f32) -> f32 {
    return 1.0 - smoothstep(radius - 1.5, radius, distance(pos, center));
}


// Determine the value of the pixel at `pos`, if we want to draw a 'bubble' (wobbly circle) at `center` with a the given `radius`.
// The `random_seed` is used to make all bubbles wobble a bit differently.
fn bubble(pos: vec2f, center: vec2f, radius: f32, random_seed: f32) -> f32 {
    let pi = 3.1415926535897932384626433832795;

    // Determine the angle between `pos` and `center`.
    let angle = atan2(pos.y - center.y, pos.x - center.x) / pi;

    // Create wobble by layering multiple sine waves.
    // One with a frequency of 1, one with a frequency of 2, etc. up to 6.
    var wobble = 0.0;
    for (var i = 1.0; i <= 6.0; i += 1.0) {
        let random_offset = sin(random_seed) * pi * pow(i, 2.0);
        let speed = pow(i, 2.0) * 0.05;
        let amplitude = 0.05 / i;
        wobble += sin(angle * i * pi + time * speed + random_offset) * amplitude;
    }

    let wobbly_radius = radius * (wobble + 1.0);
    return circle(pos, center, wobbly_radius);
}


@fragment
fn main(@builtin(position) raw_pos: vec4f) -> @location(0) vec4f {
    let pos = raw_pos.xy + offset;

    // Break the screen into square tiles with a width of 300 CSS pixels each.
    let tile_width = 300.0 * scale;
    let tile_center = vec2f(tile_width / 2.0);
    let tile_coords = (pos + tile_center) % tile_width;

    // Determine which tile we're in and use that as a random seed.
    let which_tile = floor((pos + tile_center) / tile_width);
    let tile_index = which_tile.x + which_tile.y * 10.0; // Assume at most 10 tiles in width
    let random_seed = tile_index;

    let bubble_gap = 20.0 * scale;
    let radius = tile_width / 2.0 - bubble_gap;

    let v = bubble(tile_coords, tile_center, radius, random_seed);

    return vec4f(color * v, v);
}
