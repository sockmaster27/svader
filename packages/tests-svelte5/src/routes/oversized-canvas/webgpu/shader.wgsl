@group(0) @binding(0) var<uniform> resolution: vec2f;
@group(0) @binding(1) var<uniform> offset: vec2f;

@fragment
fn main(@builtin(position) raw_pos: vec4f) -> @location(0) vec4f {
    let pos = raw_pos.xy + offset;
    let st = pos / resolution;
    return vec4f(st, 0.0, 1.0);
}
