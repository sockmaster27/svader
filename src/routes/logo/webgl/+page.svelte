<script>
    import { WebGlShader } from "$lib/index.js";
    import shaderCode from "./shader.frag?raw";
    import logo from "../logoDark.png";
</script>

<!-- Import 'Kanit' font from Google Fonts -->
<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
    <link
        href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,400;1,800&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<main>
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
            ]}
        ></WebGlShader>
    </div>

    <div class="text">
        <img src={logo} alt="S" />
        <h1>SVADER</h1>
    </div>
</main>

<style>
    main {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;

        width: 1280px;
        height: 640px;
    }

    .canvas-container {
        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;

        width: 100%;
        height: 100%;
    }

    .text {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        color: white;
        font-family: "Kanit";
    }

    img {
        height: 200px;
        width: 200px;

        margin: -40px -50px;
    }

    h1 {
        margin: 0;
        font-size: 80px;
        font-style: italic;
    }
</style>
