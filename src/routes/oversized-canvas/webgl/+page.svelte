<script>
    import { WebGlFragmentShader } from "$lib/index.js";
    import shaderCode from "./shader.frag?raw";
</script>

<WebGlFragmentShader
    width="10000px"
    height="10000px"
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
