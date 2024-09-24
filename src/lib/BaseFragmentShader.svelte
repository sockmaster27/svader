<script>
    import { pixelScale, clamp } from "./utils.js";
    import { intersectionObserver } from "./intersectionObserver.js";
    import { onMount } from "svelte";

    /**
     * The width of the canvas element.
     *
     * If not set, the width will be set to 100% of the parent element.
     *
     * @type {string | undefined}
     */
    export let width;
    /**
     * The height of the canvas element.
     *
     * If not set, the height will be set to 100% of the parent element.
     *
     * @type {string | undefined}
     */
    export let height;

    /** @type {boolean} */
    export let canRender;

    /** @type {number} */
    export let maxSize;

    /** @type {() => void} */
    export let render;

    /**
     * Whether the shader takes time as a parameter.
     * This will cause the shader to rerender every frame.
     *
     * @type {boolean}
     */
    export let hasTimeParameter;

    /**
     * Timestamp of when the component was mounted. In seconds.
     *
     * @type {number}
     */
    let mountTime;
    onMount(() => {
        mountTime = performance.now() / 1000;
    });

    /**
     * In WGSL, the fragment shader is rendered from the bottom-left corner of the canvas instead of the top-left.
     *
     * @type {boolean}
     */
    export let offsetFromBottom = false;

    /** @type {(canvasWidth: number, canvasHeight: number) => void} */
    export let updateCanvasSize = () => {};
    /** @type {(containerWidth: number, containerHeight: number) => void} */
    export let updateContainerSize;
    /** @type {(offsetX: number, offsetY: number) => void} */
    export let updateOffset;
    /** @type {(scale: number) => void} */
    export let updateScale;
    /** @type {(time: number) => void} */
    export let updateTime;

    /** @type {HTMLElement} */
    let containerElement;
    /** @type {HTMLCanvasElement} */
    export let canvasElement;

    /**
     * Size of the containing element in physical device pixels, as reported by `devicePixelContentBoxSize`.
     *
     * @type {ResizeObserverSize[]}
     */
    let containerSize;
    /**
     * Width of the containing element in physical device pixels.
     */
    $: containerWidth = containerSize?.[0]?.inlineSize;
    /**
     * Height of the containing element in physical device pixels.
     */
    $: containerHeight = containerSize?.[0]?.blockSize;

    /**
     * Size of the canvas in physical device pixelss, as reported by `devicePixelContentBoxSize`.
     *
     * @type {ResizeObserverSize[]}
     */
    let canvasSize;
    /**
     * Width of the canvas in physical device pixels.
     */
    $: canvasWidth = canvasSize?.[0]?.inlineSize;
    /**
     * Height of the canvas in physical device pixels.
     */
    $: canvasHeight = canvasSize?.[0]?.blockSize;

    let renderRequested = false;
    /** @type {(() => void)[]} */
    const renderCallbacks = [];
    /**
     * Requests a render pass to be executed on the GPU at the next animation frame.
     */
    export async function requestRender() {
        if (!canRender) return;

        if (renderRequested) return;
        renderRequested = true;

        requestAnimationFrame(async () => {
            renderCallbacks.forEach(callback => callback());
            renderCallbacks.length = 0;

            if (hasTimeParameter)
                updateTime(performance.now() / 1000 - mountTime);

            render();

            renderRequested = false;

            if (hasTimeParameter) requestRender();
        });
    }

    /**
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    async function updateCanvasSizeInner(canvasWidth, canvasHeight) {
        // Resizing must happen right before the next render pass.
        renderCallbacks.push(() => {
            canvasElement.width = canvasWidth;
            canvasElement.height = canvasHeight;

            updateCanvasSize(canvasWidth, canvasHeight);
        });

        requestRender();
    }

    $: if (canvasWidth !== undefined && canvasHeight !== undefined)
        updateCanvasSizeInner(canvasWidth, canvasHeight);

    $: if (containerWidth !== undefined && containerHeight !== undefined)
        updateContainerSize(containerWidth, containerHeight);

    $: if (offsetX !== undefined && offsetY !== undefined)
        updateOffset(offsetX, offsetY);

    $: updateScale($pixelScale);

    let offsetX = 0;
    let offsetY = 0;
    function updateCanvasCutout() {
        const containerRect = containerElement.getBoundingClientRect();

        const windowSizeX = window.innerWidth;
        const canvasSizeX = canvasElement.offsetWidth;
        const containerSizeX = containerElement.offsetWidth;
        const containerOvershootX = -containerRect.left;
        offsetX =
            clamp(
                0,
                containerOvershootX - (canvasSizeX - windowSizeX) / 2,
                containerSizeX - canvasSizeX,
            ) * $pixelScale;

        const windowSizeY = window.innerHeight;
        const canvasSizeY = canvasElement.offsetHeight;
        const containerSizeY = containerElement.offsetHeight;
        const containerOvershootY = offsetFromBottom
            ? containerRect.top + containerSizeY - windowSizeY
            : -containerRect.top;
        offsetY =
            clamp(
                0,
                containerOvershootY - (canvasSizeY - windowSizeY) / 2,
                containerSizeY - canvasSizeY,
            ) * $pixelScale;
    }
</script>

{#if canRender}
    <div
        bind:this={containerElement}
        bind:devicePixelContentBoxSize={containerSize}
        use:intersectionObserver
        on:intersectionchanged={updateCanvasCutout}
        style:--width={width}
        style:--height={height}
        {...$$restProps}
    >
        <canvas
            bind:this={canvasElement}
            bind:devicePixelContentBoxSize={canvasSize}
            use:intersectionObserver={{ rootMargin: "100px" }}
            on:intersectionchanged={updateCanvasCutout}
            class:offset-from-bottom={offsetFromBottom}
            style:--max-size="{maxSize / $pixelScale}px"
            style:--offset-x="{offsetX / $pixelScale}px"
            style:--offset-y="{offsetY / $pixelScale}px"
        >
            <slot></slot>
        </canvas>
    </div>
{:else}
    <slot {...$$restProps}></slot>
{/if}

<style>
    div {
        /* box-sizing: border-box; */
        position: relative;
        width: var(--width, 100%);
        height: var(--height, 100%);
    }

    canvas {
        /* Fix bottom spacing */
        display: block;

        width: 100%;
        height: 100%;
        max-width: var(--max-size);
        max-height: var(--max-size);

        position: absolute;
        left: var(--offset-x);
    }
    canvas:not(.offset-from-bottom) {
        top: var(--offset-y);
    }
    canvas.offset-from-bottom {
        bottom: var(--offset-y);
    }
</style>
