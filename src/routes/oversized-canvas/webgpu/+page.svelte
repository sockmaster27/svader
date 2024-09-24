<script>
    import { WebGpuFragmentShader } from "$lib/index.js";
    import shaderCode from "./shader.wgsl?raw";
</script>

<WebGpuFragmentShader
    width="10000px"
    height="10000px"
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
</WebGpuFragmentShader>
