#version 300 es

precision mediump float;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_scale;


const float pi = 3.14159265359;


// Pick a pseudo-random number for the given `pos`.
float random(vec2 pos) {
    vec2 st = pos / u_resolution;
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}


// Create a 2-dimensional vector with a length of 1 and a pseudo-random angle.
vec2 random_gradient(vec2 pos) {
    float angle = random(pos) * pi * 2.0;
    return vec2(cos(angle), sin(angle));
}


// Interpolate the value of `x` between 0 and 1 by using a cubic function.
// When drawn on a graph, this creates an S-shaped curve between 0 and 1.
float cubic_s(float x) {
    return x * x * (3.0 - x * 2.0);
}


// Create Perlin noise: https://en.wikipedia.org/wiki/Perlin_noise
float perlin_noise(vec2 pos) {
    float cell_size = 100.0 * u_scale;

    vec2 grid_st = fract(pos / cell_size);
    vec2 grid_square_coord = floor(pos / cell_size);

    vec2 corner_bot_left = vec2(0.0, 0.0);
    vec2 corner_bot_right = vec2(1.0, 0.0);
    vec2 corner_top_left = vec2(0.0, 1.0);
    vec2 corner_top_right = vec2(1.0, 1.0);

    vec2 offset_bot_left = grid_st - corner_bot_left;
    vec2 offset_bot_right = grid_st - corner_bot_right;
    vec2 offset_top_left = grid_st - corner_top_left;
    vec2 offset_top_right = grid_st - corner_top_right;

    vec2 gradient_bot_left = random_gradient((grid_square_coord + corner_bot_left) * cell_size);
    vec2 gradient_bot_right = random_gradient((grid_square_coord + corner_bot_right) * cell_size);
    vec2 gradient_top_left = random_gradient((grid_square_coord + corner_top_left) * cell_size);
    vec2 gradient_top_right = random_gradient((grid_square_coord + corner_top_right) * cell_size);

    float dot_bot_left = dot(offset_bot_left, gradient_bot_left);
    float dot_bot_right = dot(offset_bot_right, gradient_bot_right);
    float dot_top_left = dot(offset_top_left, gradient_top_left);
    float dot_top_right = dot(offset_top_right, gradient_top_right);

    float x = cubic_s(grid_st.x);
    float y = cubic_s(grid_st.y);
    float bot = mix(dot_bot_left, dot_bot_right, x);
    float top = mix(dot_top_left, dot_top_right, x);
    return mix(bot, top, y);
}


void main() {
    vec2 pos = gl_FragCoord.xy + u_offset;

    // Mirror the y-axis to create the exact same image as the WebGPU version.
    pos.y = u_resolution.y - pos.y;

    // Multiply the noise with the vignette to create a darker spot towards the middle.
    float noise = perlin_noise(pos);
    float vignette = cubic_s(distance(pos / u_resolution, vec2(0.5, 0.5)));
    float r = step(0.4 - random(pos) * 0.4, vignette * noise) * 0.8;
    
    fragColor = vec4(vec3(r), 1.0);
}
