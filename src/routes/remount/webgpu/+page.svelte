<script>
    import { WebGpuShader } from "$lib/index.js";
    import shaderCode from "./shader.wgsl?raw";

    // Mount and dismount the component every tick
    const tickInterval = 500;
    let ticks = 0;
    setInterval(() => {
        ticks += 1;
    }, tickInterval);
    $: show = ticks % 2 === 0;
</script>

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
