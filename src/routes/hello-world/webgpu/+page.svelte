<script>
    import { WebGpuShader } from "$lib/index.js";
    import shaderCode from "./shader.wgsl?raw";
</script>

<WebGpuShader
    width="500px"
    height="500px"
    code={shaderCode}
    parameters={[
        {
            label: "Resolution",
            binding: 0,
            data: "resolution",
        },
        {
            label: "Offset",
            binding: 1,
            data: "offset",
        },
    ]}
>
    <div class="fallback">WebGPU not supported in this environment.</div>
</WebGpuShader>
