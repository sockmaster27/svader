<script context="module">
    /**
     * The commonly used parameter values that the component can pass to the shader.
     *
     * - **resolution**: A `vec2f` of the canvas width and height in physical device pixels.
     *
     * - **offset**: A `vec2f` to be added to the `@builtin(position)` of the fragment shader,
     *               to compensate for cases where the size of the canvas is capped by hardware limitations.
     *
     * - **scale**: An `f32` of the current scale factor, i.e. zoom level.
     *
     * - **time**: An `f32` of the current time in seconds.
     *             NOTE: When the `"time"` parameter is passed to the shader, it will rerender every frame.
     *             If the user agent has reduced motion enabled, the time parameter will always be equal to 0.0.
     *
     * @typedef {"resolution" | "offset" | "scale" | "time"} BuiltinValue
     */

    /**
     * @typedef {{
     *     label: string,
     *     binding: number,
     *     value: BuiltinValue,
     *     storage?: boolean,
     * }} BuiltinParameter
     *
     * @typedef {{
     *     label: string,
     *     binding: number,
     *     value: BufferSource,
     *     storage?: boolean,
     * }} NonBuiltinParameter
     *
     * @typedef {BuiltinParameter | NonBuiltinParameter} Parameter
     */

    let canRenderGlobal =
        typeof navigator !== "undefined" &&
        typeof navigator.gpu !== "undefined";

    /**
     * @typedef {{
     *     device: GPUDevice,
     *     vertexBuffer: GPUBuffer,
     *     vertexBufferLayout: GPUVertexBufferLayout,
     * }} GlobalConfig
     */

    /**
     * A promise that resolves when the necessary global initialization has happened.
     * Resolves to `null` iff {@linkcode canRenderGlobal} is `false`.
     *
     * @type {Promise<GlobalConfig | null>}
     */
    const globalConfigPromise = globalInit();
    async function globalInit() {
        try {
            if (!canRenderGlobal) return null;
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) throw new Error("Failed to get WebGPU adapter.");

            const device = await adapter.requestDevice();

            const vertices = new Float32Array([
                -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
            ]);
            const vertexBuffer = device.createBuffer({
                label: "ScreenQuad Vertex Buffer",
                size: vertices.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(vertexBuffer, 0, vertices);
            /** @type {GPUVertexBufferLayout} */
            const vertexBufferLayout = {
                arrayStride: 8,
                attributes: [
                    {
                        format: "float32x2",
                        offset: 0,
                        shaderLocation: 0,
                    },
                ],
            };

            return {
                device,
                vertexBuffer,
                vertexBufferLayout,
            };
        } catch (e) {
            console.warn(e);
            canRenderGlobal = false;
            return null;
        }
    }

    /**
     * A map between source code and the corresponding render pipeline,
     * preventing a new compilation of the shader for each mounted element.
     *
     * @type {Map<string, GPURenderPipeline>}
     */
    const cachedPipelines = new Map();
</script>

<script>
    import { zip } from "./utils.js";
    import BaseShader from "./BaseShader.svelte";
    import { onDestroy, onMount } from "svelte";

    /**
     * The width of the canvas element.
     *
     * If not set, the width will be set to 100%.
     *
     * @type {string | undefined}
     */
    export let width = undefined;
    /**
     * The height of the canvas element.
     *
     * If not set, the height will be set to 100%.
     *
     * @type {string | undefined}
     */
    export let height = undefined;

    /**
     * The WGSL source code of the fragment shader to load. The entry point is the `main` function.
     *
     * Can optionally be a promise that resolves to the source code.
     *
     * @type {string | Promise<string>}
     */
    export let code;

    /**
     * Optional list of parameters to be passed to the shader.
     *
     * The list must not be updated after the component is initially mounted,
     * with the exception of the {@linkcode Parameter.value} property.
     * However, the {@linkcode Parameter.value} property cannot change its type,
     * or transition between different types of built-in values.
     *
     * @type {readonly Parameter[]}
     */
    export let parameters = [];
    const rerenderEveryFrame = parameters.some(
        parameter => parameter.value === "time",
    );

    /**
     * Whether a shader with a `"time"` parameter should ignore the user agent's reduced motion setting.
     *
     * Defaults to `false`.
     */
    export let forceAnimation = false;

    const maxTextureSize = 4096;

    /** @type {() => void} */
    let requestRender;

    /** @type {HTMLCanvasElement} */
    let canvasElement;

    let canRender = canRenderGlobal;

    /**
     * @typedef {{
     *     device: GPUDevice,
     *     context: GPUCanvasContext,
     *     pipeline: GPURenderPipeline,
     *     vertexBuffer: GPUBuffer,
     *     parameterBuffers: GPUBuffer[],
     *     bindGroup: GPUBindGroup,
     * }} Config
     */

    /**
     * A promise that resolves when the canvas has been mounted and configured.
     *
     * @type {Promise<Config>}
     */
    const configPromise = new Promise(resolve =>
        onMount(async () => {
            try {
                const globalConfig = await globalConfigPromise;
                if (globalConfig === null) return;
                const { device, vertexBuffer, vertexBufferLayout } =
                    globalConfig;

                if (canvasElement === null) return;
                const context = canvasElement.getContext("webgpu");
                if (!context) throw new Error("Failed to get WebGPU context.");
                const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
                context.configure({
                    device,
                    format: canvasFormat,
                    alphaMode: "premultiplied",
                });

                /** @type {GPUBuffer[]} */
                const parameterBuffers = parameters.map(parameter => {
                    if (parameter.value === undefined)
                        throw new Error(
                            "One or more parameters had an undefined value field.",
                        );

                    /** @type {number} */
                    let byteLength;
                    if (isBuiltinParameter(parameter))
                        switch (parameter.value) {
                            case "resolution":
                            case "offset":
                                byteLength = new Float32Array(2).byteLength;
                                break;
                            case "scale":
                            case "time":
                                byteLength = new Float32Array(1).byteLength;
                                break;
                            default:
                                throw new Error(
                                    // @ts-expect-error: Ensure exhaustive match
                                    `Unknown built-in value: ${parameter.value}`,
                                );
                        }
                    else byteLength = parameter.value.byteLength;

                    return device.createBuffer({
                        label: `${parameter.label} Parameter`,
                        size: byteLength,
                        usage:
                            GPUBufferUsage.COPY_DST |
                            ((parameter.storage ?? false)
                                ? GPUBufferUsage.STORAGE
                                : GPUBufferUsage.UNIFORM),
                    });
                });

                /** @type {GPURenderPipeline} */
                let pipeline;
                const fragmentCode = await code;
                const cachedPipeline = cachedPipelines.get(fragmentCode);
                if (cachedPipeline !== undefined) {
                    pipeline = cachedPipeline;
                } else {
                    const vertexShaderModule = device.createShaderModule({
                        label: "Vertex Shader",
                        // No-op vertex shader
                        code: `
                        @vertex
                        fn vertexMain(
                            @location(0) pos: vec2f,
                        ) -> @builtin(position) vec4<f32> {
                            return vec4<f32>(pos, 0.0, 1.0);
                        }
                    `,
                    });
                    const fragmentShaderModule = device.createShaderModule({
                        label: "Fragment Shader",
                        code: await code,
                    });
                    pipeline = device.createRenderPipeline({
                        label: "Pipeline",
                        layout: "auto",
                        vertex: {
                            module: vertexShaderModule,
                            entryPoint: "vertexMain",
                            buffers: [vertexBufferLayout],
                        },
                        fragment: {
                            module: fragmentShaderModule,
                            entryPoint: "main",
                            targets: [{ format: canvasFormat }],
                        },
                    });
                    cachedPipelines.set(fragmentCode, pipeline);
                }

                const bindGroup = createBindGroup(
                    device,
                    pipeline,
                    parameterBuffers,
                );

                resolve({
                    device,
                    context,
                    pipeline,
                    vertexBuffer,
                    parameterBuffers,
                    bindGroup,
                });
            } catch (e) {
                console.warn(e);
                canRender = false;
            }
        }),
    );

    async function render() {
        const { device, context, pipeline, vertexBuffer, bindGroup } =
            await configPromise;

        const encoder = device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
        });
        renderPass.setPipeline(pipeline);
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setBindGroup(0, bindGroup);
        renderPass.draw(6);
        renderPass.end();
        device.queue.submit([encoder.finish()]);
    }

    /**
     * @param {number} containerWidth
     * @param {number} containerHeight
     */
    async function updateContainerSize(containerWidth, containerHeight) {
        const { device, parameterBuffers } = await configPromise;

        const resolutionBuffer = parameterBuffers.find(
            (_, i) => parameters[i].value === "resolution",
        );
        if (resolutionBuffer !== undefined) {
            const resolutionArray = new Float32Array([
                containerWidth,
                containerHeight,
            ]);
            device.queue.writeBuffer(resolutionBuffer, 0, resolutionArray);

            // If the resolution is not passed to the shader, rerendering cannot change the output.
            requestRender();
        }
    }

    /**
     * @param {number} offsetX
     * @param {number} offsetY
     */
    async function updateOffset(offsetX, offsetY) {
        const { device, parameterBuffers } = await configPromise;

        const offsetBuffer = parameterBuffers.find(
            (_, i) => parameters[i].value === "offset",
        );
        if (offsetBuffer !== undefined) {
            const offsetArray = new Float32Array([offsetX, offsetY]);
            device.queue.writeBuffer(offsetBuffer, 0, offsetArray);

            // If the offset is not passed to the shader, rerendering cannot change the output.
            requestRender();
        }
    }

    /**
     * @param {number} scale
     */
    async function updateScale(scale) {
        const { device, parameterBuffers } = await configPromise;

        const scaleBuffer = parameterBuffers.find(
            (_, i) => parameters[i].value === "scale",
        );
        if (scaleBuffer !== undefined) {
            const scaleArray = new Float32Array([scale]);
            device.queue.writeBuffer(scaleBuffer, 0, scaleArray);

            // If the scale is not passed to the shader, rerendering cannot change the output.
            requestRender();
        }
    }

    /**
     * @param {number} time
     */
    async function updateTime(time) {
        const { device, parameterBuffers } = await configPromise;

        const timeBuffer = parameterBuffers.find(
            (_, i) => parameters[i].value === "time",
        );
        if (timeBuffer !== undefined) {
            const scaleArray = new Float32Array([time]);
            device.queue.writeBuffer(timeBuffer, 0, scaleArray);

            // If the time is passed to the shader, it will rerender every frame, so no need to request a render pass.
        }
    }

    /**
     * Checks if the given parameter has a built-in value.
     *
     * @param {Parameter} parameter
     * @returns {parameter is BuiltinParameter}
     */
    function isBuiltinParameter(parameter) {
        const shouldBeBuiltin = typeof parameter.value === "string";
        if (!shouldBeBuiltin) return false;

        switch (parameter.value) {
            case "resolution":
            case "offset":
            case "scale":
            case "time":
                return true;
            default:
                throw new Error(
                    // @ts-expect-error: Match should be exhaustive, but non-TS users should get a helpful runtime-error.
                    `Unknown built-in value: ${parameter.value}`,
                );
        }
    }

    /**
     * @param {readonly Parameter[]} parameters
     */
    async function updateParameters(parameters) {
        const config = await configPromise;
        const { device, pipeline, parameterBuffers } = config;

        let shouldUpdateBindGroup = false;
        parameters.forEach((parameter, i) => {
            if (isBuiltinParameter(parameter)) return;

            const isStorage = parameter.storage ?? false;
            const storageBufferSizeChanged =
                isStorage &&
                parameter.value.byteLength !== parameterBuffers[i].size;
            if (storageBufferSizeChanged) {
                parameterBuffers[i].destroy();
                parameterBuffers[i] = createParameterBuffer(
                    device,
                    parameter,
                    parameter.value.byteLength,
                );
                shouldUpdateBindGroup = true;
            }

            device.queue.writeBuffer(parameterBuffers[i], 0, parameter.value);
        });

        if (shouldUpdateBindGroup) {
            config.bindGroup = createBindGroup(
                device,
                pipeline,
                parameterBuffers,
            );
        }

        requestRender();
    }
    $: updateParameters(parameters);

    /**
     * @param {GPUDevice} device
     * @param {Parameter} parameter
     * @param {number} byteLength
     */
    function createParameterBuffer(device, parameter, byteLength) {
        return device.createBuffer({
            label: `${parameter.label} Parameter`,
            size: byteLength,
            usage:
                GPUBufferUsage.COPY_DST |
                ((parameter.storage ?? false)
                    ? GPUBufferUsage.STORAGE
                    : GPUBufferUsage.UNIFORM),
        });
    }

    /**
     * @param {GPUDevice} device
     * @param {GPURenderPipeline} pipeline
     * @param {GPUBuffer[]} parameterBuffers
     */
    function createBindGroup(device, pipeline, parameterBuffers) {
        return device.createBindGroup({
            label: "Shader Bind Group",
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                ...zip(parameters, parameterBuffers).map(
                    ([parameter, buffer]) => ({
                        binding: parameter.binding,
                        resource: {
                            buffer,
                        },
                    }),
                ),
            ],
        });
    }

    onDestroy(async () => {
        const { context, parameterBuffers } = await configPromise;
        context.unconfigure();
        parameterBuffers.forEach(b => b.destroy());
    });
</script>

<BaseShader
    {width}
    {height}
    {canRender}
    maxSize={maxTextureSize}
    {rerenderEveryFrame}
    {forceAnimation}
    {render}
    {updateContainerSize}
    {updateOffset}
    {updateScale}
    {updateTime}
    bind:canvasElement
    bind:requestRender
>
    <slot></slot>
</BaseShader>
