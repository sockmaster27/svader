<script>
    import { WebGpuFragmentShader } from "$lib/index.js";
    import shaderCode from "./shader.wgsl?raw";

    let val = 0.75;
</script>

<main>
    <h1>SLIDE ME</h1>

    <span>
        <div class="canvas-container">
            <WebGpuFragmentShader
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
                    {
                        label: "Scale",
                        binding: 2,
                        data: "scale",
                    },
                    {
                        label: "Value",
                        binding: 3,
                        data: new Float32Array([val]),
                    },
                ]}
            ></WebGpuFragmentShader>
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
