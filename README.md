<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/sockmaster27/svader/master/resources/logoDark.png">
    <img width="150" alt="Svader Logo" src="https://raw.githubusercontent.com/sockmaster27/svader/master/resources/logoLight.png">
  </picture>
</p>

# Svader

Easily create fragment shaders for Svelte apps using WebGL and WebGPU.

## Installation

```bash
# npm
npm i -D svader

# pnpm
pnpm i -D svader

# Bun
bun i -D svader

# Yarn
yarn add -D svader
```

## What is a fragment shader?

A _fragment shader_ can be written as a function that takes the coordinates of a pixel on the screen and returns the color that this pixel should have.
This function can then be executed on the GPU, ensuring massive parallelism and speed.

To learn more about how to write fragment shaders, check out [The Book of Shaders](https://thebookofshaders.com/).

## Usage

To use a fragment shader component, you first need to decide whether to use WebGL or WebGPU.
If you're unsure about what to use, see the [WebGL vs. WebGPU](#webgl-vs-webgpu) section.

### WebGL

The following is a minimal example of a WebGL fragment shader component.

```svelte
<script>
    import { WebGlFragmentShader } from "svader";

    const shaderCode = `#version 300 es

        precision mediump float;

        out vec4 fragColor;

        uniform vec2 u_resolution;
        uniform vec2 u_offset;

        void main() {
            vec2 pos = gl_FragCoord.xy + u_offset;
            vec2 st = pos / u_resolution;
            fragColor = vec4(st, 0.0, 1.0);
        }
    `;
</script>

<WebGlFragmentShader
    code={shaderCode}
    parameters={[
        {
            name: "u_resolution",
            data: "resolution",
        },
        {
            name: "u_offset",
            data: "offset",
        },
    ]}
>
    <div class="fallback">WebGL not supported in this environment.</div>
</WebGlFragmentShader>
```

Here, the `shaderCode` variable is a string containing the [GLES](https://en.wikipedia.org/wiki/OpenGL_ES) shader code.
For simplicity, this is stored as a string, but it would typically be stored in a separate `myShader.frag` file.
When loading the shader from a file, it might be useful to know that the `code` property accepts both a `string` and a `Promise<string>`.

What this code does is:

1. Add the given `u_offset` uniform to the 2D coordinates of the pixel given by `gl_FragCoord.xy`.
2. Divide the resulting coordinates entrywise by the `u_resolution` uniform to normalize the coordinates between 0 and 1.
3. Return the normalized coordinates as the color of the pixel, such that the `x` coordinate becomes the red channel and the `y` coordinate becomes the green channel. The blue channel is always set to 0, and the alpha (opacity) channel is always set to 1 (fully opaque).

In GLES, _uniforms_ are inputs to the function, that are the same for every pixel on the screen.
These need to be passed in via the `parameters` property of the `<WebGlFragmentShader>` component.
In this case, we need to pass in two uniforms: `u_resolution` and `u_offset`.
Since these specific parameters are very commonly used, they are specially implemented in Svader
such that the `data` property of each parameter can simply be set to `"resolution"` and `"offset"` respectively.

Lastly, the `<WebGlFragmentShader>` component accepts a fallback slot, which is rendered when the browser cannot render the shader.

### WebGPU

The following is a minimal example of a WebGPU fragment shader component.

```svelte
<script>
    import { WebGpuFragmentShader } from "svader";

    const shaderCode = `
        @group(0) @binding(0) var<uniform> resolution: vec2f;
        @group(0) @binding(1) var<uniform> offset: vec2f;

        @fragment
        fn fragmentMain(@builtin(position) raw_pos: vec4f) -> @location(0) vec4f {
            let pos = raw_pos.xy + offset;
            let st = pos / resolution;
            return vec4f(st, 0.0, 1.0);
        }
    `;
</script>

<WebGpuFragmentShader
    code={shaderCode}
    parameters={[
        {
            label: "Resolution",
            binding: 0,
            type: "uniform",
            data: "resolution",
        },
        {
            label: "Offset",
            binding: 1,
            type: "uniform",
            data: "offset",
        },
    ]}
>
    <div class="fallback">WebGPU not supported in this environment.</div>
</WebGpuFragmentShader>
```

Here, the `shaderCode` variable is a string containing the [WGSL](https://google.github.io/tour-of-wgsl/) shader code.
For simplicity, this is stored as a string, but it would typically be stored in a separate `myShader.wgsl` file.
When loading the shader from a file, it might be useful to know that the `code` property accepts both a `string` and a `Promise<string>`.

What this code does is:

1. Add the given `offset` uniform variable to the 2D coordinates of the pixel given by `raw_pos.xy`.
2. Divide the resulting coordinates entrywise by the `resolution` uniform to normalize the coordinates between 0 and 1.
3. Return the normalized coordinates as the color of the pixel, such that the `x` coordinate becomes the red channel and the `y` coordinate becomes the green channel. The blue channel is always set to 0, and the alpha (opacity) channel is always set to 1 (fully opaque).

In WGSL, these `var<uniform>`s are the primary way to pass in parameters to the shader.
These need to be passed in via the `parameters` property of the `<WebGpuFragmentShader>` component.
Each of these parameters is an object with the following properties:

-   `label`: The label of the parameter that is used in error messages to make debugging easier.
-   `binding`: An integer used to match the parameter to the variable in the shader code.
-   `type`: Whether the parameter is a `"uniform"` or a `"storage"` variable.
-   `data`: The value of the parameter.

In this case, we need to pass in two uniforms: `resolution` and `offset`.
Since these specific parameters are very commonly used, they are specially implemented in Svader
such that the `data` property of each parameter can simply be set to `"resolution"` and `"offset"` respectively.

Lastly, the `<WebGpuFragmentShader>` component accepts a fallback slot, which is rendered when the browser cannot render the shader.

## WebGL vs. WebGPU

**For practical applications, default to using WebGL.**

WebGL and WebGPU are both rendering APIs that allow web applications to render GPU-accelerated graphics.

WebGL is the older of the two and is supported by [all modern browsers](https://caniuse.com/webgl).

WebGPU is still in the experimental stage and is only supported in a [few browsers](https://caniuse.com/webgpu).
However, it supports certain features that WebGL does not. For example, as of writing, WebGL in Google Chrome only supports having 8 canvases active in the document at once, while WebGPU supports a practically unlimited number.

## License

Svader is licensed under the [MIT License](https://github.com/sockmaster27/svader/blob/master/LICENSE).
