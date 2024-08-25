<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/sockmaster27/svader/v0.1.0/resources/logoDark.png">
    <img width="150" alt="Svader Logo" src="https://raw.githubusercontent.com/sockmaster27/svader/v0.1.0/resources/logoLight.png">
  </picture>
</p>

# Svader

Easily create fragment shaders for Svelte apps using WebGL and WebGPU.

## What is a fragment shader?

A _fragment shader_ can be written as a function that takes the coordinates of a pixel on the screen, and returns the color that this pixel should have.
This function can then be executed on the GPU, ensuring massive parallelism and speed.

To learn more about how to write fragment shaders, check out [The Book of Shaders](https://thebookofshaders.com/).

## WebGL vs WebGPU

**For practical applications, default to using WebGL.**

WebGL and WebGPU are both rendering APIs, that allow web applications to render GPU-accelerated graphics.

WebGL is the older of the two, and is supported by [all modern browsers](https://caniuse.com/webgl).

WebGPU is still in the experimental stage, and is only supported in a [few browsers](https://caniuse.com/webgpu).
However, it supports certain features that WebGL does not. For example, as of writing, WebGL in Google Chrome only supports having 8 canvases active in the document at once, while WebGPU supports a practically unlimited number.
