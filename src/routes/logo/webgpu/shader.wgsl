@group(0) @binding(0) var<uniform> resolution: vec2f;
@group(0) @binding(1) var<uniform> offset: vec2f;
@group(0) @binding(2) var<uniform> scale: f32;


const pi = 3.14159265359;


// Pick a pseudo-random number for the given `pos`.
fn random(pos: vec2f) -> f32 {
    let st = pos / resolution;
    return fract(sin(dot(st, vec2f(12.9898, 78.233))) * 43758.5453);
}


// Create a 2-dimensional vector with a length of 1 and a pseudo-random angle.
fn random_gradient(pos: vec2f) -> vec2f {
    let angle = random(pos) * pi * 2.0;
    return vec2f(cos(angle), sin(angle));
}


// Interpolate the value of `x` between 0 and 1 by using a cubic function.
// When drawn on a graph, this creates an S-shaped curve between 0 and 1.
fn cubic_s(x: f32) -> f32 {
    return x * x * (3.0 - x * 2.0);
}


// Create Perline noise: https://en.wikipedia.org/wiki/Perlin_noise
fn perlin_noise(pos: vec2f) -> f32 {
    let cell_size = 100.0 * scale;

    let grid_st = fract(pos / cell_size);
    let grid_square_coord = floor(pos / cell_size);

    let corner_bot_left = vec2f(0.0, 0.0);
    let corner_bot_right = vec2f(1.0, 0.0);
    let corner_top_left = vec2f(0.0, 1.0);
    let corner_top_right = vec2f(1.0, 1.0);

    let offset_bot_left = grid_st - corner_bot_left;
    let offset_bot_right = grid_st - corner_bot_right;
    let offset_top_left = grid_st - corner_top_left;
    let offset_top_right = grid_st - corner_top_right;

    let gradient_bot_left = random_gradient((grid_square_coord + corner_bot_left) * cell_size);
    let gradient_bot_right = random_gradient((grid_square_coord + corner_bot_right) * cell_size);
    let gradient_top_left = random_gradient((grid_square_coord + corner_top_left) * cell_size);
    let gradient_top_right = random_gradient((grid_square_coord + corner_top_right) * cell_size);

    let dot_bot_left = dot(offset_bot_left, gradient_bot_left);
    let dot_bot_right = dot(offset_bot_right, gradient_bot_right);
    let dot_top_left = dot(offset_top_left, gradient_top_left);
    let dot_top_right = dot(offset_top_right, gradient_top_right);

    let x = cubic_s(grid_st.x);
    let y = cubic_s(grid_st.y);
    let bot = mix(dot_bot_left, dot_bot_right, x);
    let top = mix(dot_top_left, dot_top_right, x);
    return mix(bot, top, y);
}


@fragment
fn fragmentMain(@builtin(position) raw_pos: vec4f) -> @location(0) vec4f {
    let pos = raw_pos.xy + offset;

    // Multiply the noise with the vignette to create a darker spot towards the middle.
    let noise = perlin_noise(pos);
    let vignette = cubic_s(distance(pos / resolution, vec2f(0.5, 0.5)));
    let r = step(0.4 - random(pos) * 0.4, vignette * noise) * 0.8;
    
    return vec4(vec3(r), 1.0);
}
