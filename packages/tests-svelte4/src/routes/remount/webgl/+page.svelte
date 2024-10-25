<script>
    import { WebGlShader } from "svader";
    import shaderCode from "./shader.frag?raw";

    let show = true;
</script>

<label for="show">Show</label>
<input id="show" type="checkbox" bind:checked={show} />
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
