<script>
    import { pixelScale, clamp } from "./utils.js";
    import { intersectionObserver } from "./intersectionObserver.js";
    import { onDestroy, onMount } from "svelte";
    import { devicePixelResizeObserver } from "./devicePixelResizeObserver.js";

    /**
     * The width of the canvas element.
     *
     * If not set, the width will be set to 100%.
     *
     * @type {string | undefined}
     */
    export let width;
    /**
     * The height of the canvas element.
     *
     * If not set, the height will be set to 100%.
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
     * Whether the shader should rerender every frame.
     *
     * @type {boolean}
     */
    export let rerenderEveryFrame;
    export let forceAnimation;
    function prefersReducedMotion() {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    if (!forceAnimation && prefersReducedMotion()) rerenderEveryFrame = false;

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
     * The handle returned by {@linkcode requestAnimationFrame}.
     * `null` if no render pass has been requested.
     *
     * @type {number | null}
     */
    let requestHandle = null;
    /** @type {(() => void)[]} */
    const renderCallbacks = [];
    /**
     * Requests a render pass to be executed on the GPU at the next animation frame.
     */
    export function requestRender() {
        if (!canRender) return;

        if (requestHandle !== null) return;

        requestHandle = requestAnimationFrame(() => {
            renderCallbacks.forEach(callback => callback());
            renderCallbacks.length = 0;

            if (rerenderEveryFrame)
                updateTime(performance.now() / 1000 - mountTime);

            render();

            requestHandle = null;

            if (rerenderEveryFrame) requestRender();
        });
    }
    /**
     * Cancel any requested render pass.
     */
    function cancelRender() {
        if (requestHandle !== null) {
            cancelAnimationFrame(requestHandle);
            requestHandle = null;
        }
    }

    /**
     * @param {import("./devicePixelResizeObserver.js").DevicePixelResizeEvent} event
     */
    function updateCanvasSizeInner(event) {
        // Resizing must happen right before the next render pass.
        renderCallbacks.push(() => {
            const canvasWidth = event.detail.width;
            const canvasHeight = event.detail.height;

            canvasElement.width = canvasWidth;
            canvasElement.height = canvasHeight;

            updateCanvasSize(canvasWidth, canvasHeight);
        });

        requestRender();
    }

    /**
     * @param {import("./devicePixelResizeObserver.js").DevicePixelResizeEvent} event
     */
    function updateContainerSizeInner(event) {
        const canvasWidth = event.detail.width;
        const canvasHeight = event.detail.height;

        updateContainerSize(canvasWidth, canvasHeight);
    }

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

    onDestroy(cancelRender);
</script>

{#if canRender}
    <div
        bind:this={containerElement}
        use:devicePixelResizeObserver
        on:devicepixelresize={updateContainerSizeInner}
        use:intersectionObserver
        on:intersectionchanged={updateCanvasCutout}
        style:--width={width}
        style:--height={height}
    >
        <canvas
            bind:this={canvasElement}
            use:devicePixelResizeObserver
            on:devicepixelresize={updateCanvasSizeInner}
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
    <slot></slot>
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

        top: var(--offset-y);
    }
    canvas.offset-from-bottom {
        top: unset;
        bottom: var(--offset-y);
    }
</style>
