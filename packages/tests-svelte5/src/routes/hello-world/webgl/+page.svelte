<svelte:options runes />

<script>
    import { WebGlShader } from "svader";
    import shaderCode from "./shader.frag?raw";
</script>

<WebGlShader
    width="500px"
    height="500px"
    code={shaderCode}
    parameters={[
        {
            name: "u_resolution",
            value: "resolution",
        },
        {
            name: "u_offset",
            value: "offset",
        },
    ]}
>
    <div class="fallback">WebGL not supported in this environment.</div>
</WebGlShader>
