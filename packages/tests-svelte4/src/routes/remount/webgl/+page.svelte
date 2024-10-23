<script>
    import { WebGlShader } from "svader";
    import shaderCode from "./shader.frag?raw";

    // Mount and dismount the component every tick
    const tickInterval = 500;
    let ticks = 0;
    setInterval(() => {
        ticks += 1;
    }, tickInterval);
    $: show = ticks % 2 === 0;
</script>

{#if show}
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
{/if}
