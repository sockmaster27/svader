<script>
    import { WebGlShader } from "$lib/index.js";
    import shaderCode from "./shader.frag?raw";
</script>

<WebGlShader
    width="10000px"
    height="10000px"
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
