<script>
    import { WebGpuShader } from "svader";
    import shaderCode from "./shader.wgsl?raw";

    let show = true;
</script>

<label for="show">Show</label>
<input id="show" type="checkbox" bind:checked={show} />
{#if show}
    <WebGpuShader
        width="500px"
        height="500px"
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
{/if}
