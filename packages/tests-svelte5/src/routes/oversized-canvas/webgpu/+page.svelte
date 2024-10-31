<script>
    import { WebGpuShader } from "svader";
    import shaderCode from "./shader.wgsl?raw";
</script>

<WebGpuShader
    width="10000px"
    height="10000px"
    code={shaderCode}
    parameters={[
        {
            label: "Resolution",
            binding: 0,
            value: "resolution",
        },
        {
            label: "Offset",
            binding: 1,
            value: "offset",
        },
    ]}
>
    <div class="fallback">WebGPU not supported in this environment.</div>
</WebGpuShader>
