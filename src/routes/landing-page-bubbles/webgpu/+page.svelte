<script>
    import { WebGpuShader } from "$lib/index.js";
    import shaderCode from "./shader.wgsl?raw";

    const color = /** @type {const} */ ([0.8, 0.3, 0.0]);

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    function rgbString(r, g, b) {
        return `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
    }
</script>

<!-- Import 'SUSE' font from Google Fonts -->
<svelte:head
    ><link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
    <link
        href="https://fonts.googleapis.com/css2?family=SUSE:wght@800&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<main>
    <div class="canvas-container">
        <WebGpuShader
            code={shaderCode}
            parameters={[
                {
                    label: "Offset",
                    binding: 0,
                    value: "offset",
                },
                {
                    label: "Scale",
                    binding: 1,
                    value: "scale",
                },
                {
                    label: "Time",
                    binding: 2,
                    value: "time",
                },
                {
                    label: "Color",
                    binding: 3,
                    value: new Float32Array(color),
                },
            ]}
        ></WebGpuShader>
    </div>

    <h1 style:--color={rgbString(...color)}>SVADER</h1>
</main>

<style>
    main {
        position: relative;
        width: 100vw;
        height: 100vh;

        /* Prevent margin collapsing */
        overflow: hidden;
    }

    .canvas-container {
        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;

        width: 100%;
        height: 100%;

        background-color: black;
    }

    h1 {
        font-family: "SUSE", sans-serif;
        font-size: 12rem;

        mix-blend-mode: difference;
        color: var(--color);

        margin: 10rem 0 0 10rem;
    }

    @media (max-width: 1000px) {
        h1 {
            font-size: 4rem;
            margin: 2rem;
        }
    }
</style>
