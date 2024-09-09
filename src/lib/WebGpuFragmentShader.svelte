<script context="module">
    /**
     * The commonly used data that the component can pass to the shader.
     *
     * - **resolution**: A `vec2f` of the canvas width and height in physical device pixels.
     *
     * - **offset**: A `vec2f` to be added to the `@builtin(position)` of the fragment shader,
     *               to compensate for cases where the size of the canvas is capped by hardware limitations.
     *
     * - **scale**: An `f32` of the current scale factor, i.e. zoom level.
     *
     * - **time**: An `f32` of the current time in seconds.
     *
     * @typedef {"resolution" | "offset" | "scale" | "time"} BuiltinData
     */

    /**
     * @typedef {{
     *     label: string,
     *     binding: number,
     *     type: "uniform" | "storage",
     *     data: BuiltinData,
     * }} BuiltinParameter
     *
     * @typedef {{
     *     label: string,
     *     binding: number,
     *     type: "uniform" | "storage",
     *     data: BufferSource,
     * }} NonBuiltinParameter
     *
     * @typedef {BuiltinParameter | NonBuiltinParameter} Parameter
     */
</script>

<script>
    import { zip } from "./utils.js";
    import BaseFragmentShader from "./BaseFragmentShader.svelte";
    import { onMount } from "svelte";

    const maxTextureSize = 4096;

    /** @type {() => Promise<void>} */
    let requestRender;

    /** @type {HTMLCanvasElement} */
    let canvasElement;

    const canRender =
        typeof navigator !== "undefined" &&
        typeof navigator.gpu !== "undefined";

    /**
     * The width of the canvas element.
     *
     * If not set, the width will be set to 100% of the parent element.
     *
     * @type {string | undefined}
     */
    export let width = undefined;
    /**
     * The height of the canvas element.
     *
     * If not set, the height will be set to 100% of the parent element.
     *
     * @type {string | undefined}
     */
    export let height = undefined;

    let hide = true;
    export let fadeInDuration = 0;

    /**
     * The WGSL source code of the fragment shader to load. The entry point is `fragmentMain`.
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
     * with the exception of the `data` property.
     * However, the `data` property cannot change its type,
     * or transition between different types of builtin data.
     *
     * @type {Parameter[]}
     */
    export let parameters = [];

    const hasTimeParameter = parameters.some(
        parameter => parameter.data === "time",
    );

    /** @typedef {{
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
            if (!canRender) return;
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) throw new Error("No WebGPU adapter found.");
            const device = await adapter.requestDevice();

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
                /** @type {number} */
                let byteLength;
                if (isBuiltinParameter(parameter))
                    switch (parameter.data) {
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
                                `Unknown builtin data: ${parameter.data}`,
                            );
                    }
                else byteLength = parameter.data.byteLength;

                return device.createBuffer({
                    label: `${parameter.label} Parameter`,
                    size: byteLength,
                    usage:
                        GPUBufferUsage.COPY_DST |
                        {
                            uniform: GPUBufferUsage.UNIFORM,
                            storage: GPUBufferUsage.STORAGE,
                        }[parameter.type],
                });
            });

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
                label: "Vertex Shader",
                code: await code,
            });
            const pipeline = device.createRenderPipeline({
                label: "Pipeline",
                layout: "auto",
                vertex: {
                    module: vertexShaderModule,
                    entryPoint: "vertexMain",
                    buffers: [vertexBufferLayout],
                },
                fragment: {
                    module: fragmentShaderModule,
                    entryPoint: "fragmentMain",
                    targets: [{ format: canvasFormat }],
                },
            });

            const bindGroup = device.createBindGroup({
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

            requestIdleCallback(() => (hide = false));
            resolve({
                device,
                context,
                pipeline,
                vertexBuffer,
                parameterBuffers,
                bindGroup,
            });
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
            (_, i) => parameters[i].data === "resolution",
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
            (_, i) => parameters[i].data === "offset",
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
            (_, i) => parameters[i].data === "scale",
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
            (_, i) => parameters[i].data === "time",
        );
        if (timeBuffer !== undefined) {
            const scaleArray = new Float32Array([time]);
            device.queue.writeBuffer(timeBuffer, 0, scaleArray);

            // If the time is passed to the shader, it will rerender every frame, so no need to request a render pass.
        }
    }

    /**
     * Checks if the given parameter represents a builtin type of data, such as `"resolution"`.
     *
     * @param {Parameter} parameter
     * @returns {parameter is BuiltinParameter}
     */
    function isBuiltinParameter(parameter) {
        const shouldBeBuiltin = typeof parameter.data === "string";
        if (!shouldBeBuiltin) return false;

        switch (parameter.data) {
            case "resolution":
            case "offset":
            case "scale":
            case "time":
                return true;
            default:
                throw new Error(
                    // @ts-expect-error: Match should be exhaustive, but non-TS users should get a helpful runtime-error.
                    `Unknown builtin parameter: ${parameter.data}`,
                );
        }
    }

    /**
     * @param {Parameter[]} parameters
     */
    async function updateParameters(parameters) {
        const { device, parameterBuffers } = await configPromise;

        for (const [parameter, buffer] of zip(parameters, parameterBuffers))
            if (!isBuiltinParameter(parameter))
                device.queue.writeBuffer(buffer, 0, parameter.data);

        requestRender();
    }
    $: updateParameters(parameters);
</script>

<BaseFragmentShader
    {width}
    {height}
    {hide}
    {fadeInDuration}
    {canRender}
    maxSize={maxTextureSize}
    {hasTimeParameter}
    {render}
    {updateContainerSize}
    {updateOffset}
    {updateScale}
    {updateTime}
    bind:canvasElement
    bind:requestRender
    {...$$restProps}
>
    <slot></slot>
</BaseFragmentShader>
