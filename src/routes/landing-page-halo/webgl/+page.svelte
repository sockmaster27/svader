<script>
    import { WebGlFragmentShader } from "$lib/index.js";
    import shaderCode from "./shader.frag?raw";
</script>

<!-- Import 'Handjet' font from Google Fonts -->
<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
    <link
        href="https://fonts.googleapis.com/css2?family=Handjet&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<main>
    <div class="canvas-container">
        <WebGlFragmentShader
            code={shaderCode}
            parameters={[
                {
                    name: "u_resolution",
                    data: "resolution",
                },
                {
                    name: "u_offset",
                    data: "offset",
                },
            ]}
        ></WebGlFragmentShader>
    </div>

    <h1>SVADER</h1>
</main>

<style>
    main {
        display: flex;
        align-items: center;
        justify-content: center;

        position: relative;
        width: 100vw;
        height: 100vh;
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
        font-family: "Handjet", sans-serif;
        font-size: 8rem;

        color: rgb(250, 250, 250);

        margin: 0;
    }

    @media (max-width: 700px) or (max-height: 700px) {
        h1 {
            font-size: 3.5rem;
        }
    }
</style>
