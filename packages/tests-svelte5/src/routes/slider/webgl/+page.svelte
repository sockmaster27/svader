<svelte:options runes />

<script>
    import { WebGlShader } from "svader";
    import shaderCode from "./shader.frag?raw";

    let val = $state(0.75);
</script>

<main>
    <h1>SLIDE ME</h1>

    <span>
        <div class="canvas-container">
            <WebGlShader
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
                    {
                        name: "u_scale",
                        value: "scale",
                    },
                    {
                        name: "u_value",
                        type: "float",
                        value: val,
                    },
                ]}
            ></WebGlShader>
        </div>
        <input type="range" min="0" max="1" step="0.01" bind:value={val} />
    </span>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 5rem;
    }

    h1 {
        font-family: sans-serif;
        font-style: italic;
        margin-bottom: 0;
    }

    span {
        display: inline-block;
        position: relative;
    }

    .canvas-container {
        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;

        width: 100%;
        height: 100%;
    }

    input {
        opacity: 0;
        margin: 0;
        width: 200px;
        height: 60px;
        margin: 0 20px;

        cursor: ew-resize;
    }
</style>
