<script context="module">
    /**
     * The commonly used parameter values that the component can pass to the shader.
     *
     * - **resolution**: A `vec2` of the canvas width and height in physical device pixels.
     *
     * - **offset**: A `vec2` to be added to the `gl_FragCoord.xy` of the fragment shader,
     *               to compensate for cases where the size of the canvas is capped by hardware limitations.
     *
     * - **scale**: A `float` of the current scale factor, i.e. zoom level.
     *
     * - **time**: A `float` of the current time in seconds.
     *             NOTE: When the `"time"` parameter is passed to the shader, it will rerender every frame.
     *             If the user agent has reduced motion enabled, the time parameter will always be equal to 0.0.
     *
     * @typedef {"resolution" | "offset" | "scale" | "time"} BuiltinValue
     */

    /**
     * @typedef {{
     *     name: string,
     *     value: BuiltinValue,
     * }} BuiltinParameter
     *
     * @typedef {{
     *     name: string,
     * } & (
     * | {
     *     type: "float" | "int" | "uint",
     *     value: number,
     * }
     * | {
     *     type: "vec2" | "ivec2" | "uvec2",
     *     value: readonly [number, number],
     * }
     * | {
     *     type: "vec3" | "ivec3" | "uvec3",
     *     value: readonly [number, number, number],
     * }
     * | {
     *     type: "vec4" | "ivec4" | "uvec4",
     *     value: readonly [number, number, number, number],
     * }
     * | {
     *     type: "vec4" | "ivec4" | "uvec4",
     *     value: readonly [number, number, number, number],
     * }
     * | {
     *     type: "mat2",
     *     value: readonly [
     *         number, number,
     *         number, number,
     *     ],
     * }
     * | {
     *     type: "mat3",
     *     value: readonly [
     *         number, number, number,
     *         number, number, number,
     *         number, number, number,
     *     ],
     * }
     * | {
     *     type: "mat4",
     *     value: readonly [
     *         number, number, number, number,
     *         number, number, number, number,
     *         number, number, number, number,
     *         number, number, number, number,
     *     ],
     * }
     * )} NonBuiltinParameter
     *
     * @typedef {BuiltinParameter | NonBuiltinParameter} Parameter
     */
</script>

<script>
    import { onMount } from "svelte";

    import BaseShader from "./BaseShader.svelte";

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
     * The GLSL ES source code of the fragment shader to load.
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

    let canRender = typeof WebGL2RenderingContext !== "undefined";

    /** @typedef {{
     *     gl: WebGL2RenderingContext,
     *     shaderProgram: WebGLProgram,
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
                if (!canRender) return;

                if (canvasElement === null) return;
                const gl = canvasElement.getContext("webgl2");
                if (gl === null)
                    throw new Error("Failed to get WebGL2 context.");
                const shaderProgram = gl.createProgram();
                if (shaderProgram === null)
                    throw new Error("Failed to create WebGL shader program.");

                /**
                 * Load a shader into the shader program.
                 *
                 * @param {string} source
                 * @param {number} type
                 */
                const loadShader = (source, type) => {
                    const shader = gl.createShader(type);
                    if (shader === null)
                        throw new Error("Failed to create texture.");
                    gl.shaderSource(shader, source);
                    gl.compileShader(shader);

                    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                        throw new Error(
                            `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
                        );

                    gl.attachShader(shaderProgram, shader);
                };

                // Simple identity function
                const vertexShaderSource = `#version 300 es
                    in vec4 pos;
                    void main() {
                        gl_Position = pos;
                    }
                `;
                loadShader(vertexShaderSource, gl.VERTEX_SHADER);
                loadShader(await code, gl.FRAGMENT_SHADER);

                gl.linkProgram(shaderProgram);
                gl.useProgram(shaderProgram);

                // Create a rectangle covering the canvas
                const vertexAttributePosition = gl.getAttribLocation(
                    shaderProgram,
                    "pos",
                );
                const positionBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    new Float32Array(positions),
                    gl.STATIC_DRAW,
                );
                const numComponents = 2; // Pull out 2 values per iteration
                const type = gl.FLOAT; // The data in the buffer is 32bit floats
                const normalize = false; // Don't normalize
                const stride = 0; // How many bytes to get from one set of values to the next. 0 = use type and numComponents above
                const offset = 0; // How many bytes inside the buffer to start from
                gl.vertexAttribPointer(
                    vertexAttributePosition,
                    numComponents,
                    type,
                    normalize,
                    stride,
                    offset,
                );
                gl.enableVertexAttribArray(vertexAttributePosition);

                resolve({ gl, shaderProgram });
            } catch (e) {
                console.warn(e);
                canRender = false;
            }
        }),
    );

    async function render() {
        const { gl } = await configPromise;
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    /**
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    async function updateCanvasSize(canvasWidth, canvasHeight) {
        const { gl } = await configPromise;
        gl.viewport(0, 0, canvasWidth, canvasHeight);
    }

    /**
     * @param {number} containerWidth
     * @param {number} containerHeight
     */
    async function updateContainerSize(containerWidth, containerHeight) {
        const { gl, shaderProgram } = await configPromise;

        const resolutionParam = parameters.find(
            parameter => parameter.value === "resolution",
        );
        if (resolutionParam !== undefined) {
            const uniformPosition = gl.getUniformLocation(
                shaderProgram,
                resolutionParam.name,
            );
            gl.uniform2fv(uniformPosition, [containerWidth, containerHeight]);

            // If the resolution is not passed to the shader, rerendering cannot change the output.
            requestRender();
        }
    }

    /**
     * @param {number} offsetX
     * @param {number} offsetY
     */
    async function updateOffset(offsetX, offsetY) {
        const { gl, shaderProgram } = await configPromise;

        const offsetParam = parameters.find(
            parameter => parameter.value === "offset",
        );
        if (offsetParam !== undefined) {
            const uniformPosition = gl.getUniformLocation(
                shaderProgram,
                offsetParam.name,
            );
            gl.uniform2fv(uniformPosition, [offsetX, offsetY]);

            // If the offset is not passed to the shader, rerendering cannot change the output.
            requestRender();
        }
    }

    /**
     * @param {number} scale
     */
    async function updateScale(scale) {
        const { gl, shaderProgram } = await configPromise;

        const scaleParam = parameters.find(
            parameter => parameter.value === "scale",
        );
        if (scaleParam !== undefined) {
            const uniformPosition = gl.getUniformLocation(
                shaderProgram,
                scaleParam.name,
            );
            gl.uniform1f(uniformPosition, scale);

            // If the scale is not passed to the shader, rerendering cannot change the output.
            requestRender();
        }
    }

    /**
     * @param {number} time
     */
    async function updateTime(time) {
        const { gl, shaderProgram } = await configPromise;

        const timeParam = parameters.find(
            parameter => parameter.value === "time",
        );
        if (timeParam !== undefined) {
            const uniformPosition = gl.getUniformLocation(
                shaderProgram,
                timeParam.name,
            );
            gl.uniform1f(uniformPosition, time);

            // If the time is passed to the shader, it will rerender every frame, so no need to request a render pass.
        }
    }

    /**
     * Checks if the given parameter has a value that is built-in.
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
        const { gl, shaderProgram } = await configPromise;

        for (const parameter of parameters) {
            if (parameter.value === undefined)
                throw new Error(
                    "One or more parameters had an undefined value field.",
                );

            if (!isBuiltinParameter(parameter)) {
                const uniformPosition = gl.getUniformLocation(
                    shaderProgram,
                    parameter.name,
                );
                switch (parameter.type) {
                    case "float":
                        gl.uniform1f(uniformPosition, parameter.value);
                        break;
                    case "vec2":
                        gl.uniform2fv(uniformPosition, parameter.value);
                        break;
                    case "vec3":
                        gl.uniform3fv(uniformPosition, parameter.value);
                        break;
                    case "vec4":
                        gl.uniform4fv(uniformPosition, parameter.value);
                        break;
                    case "int":
                        gl.uniform1i(uniformPosition, parameter.value);
                        break;
                    case "ivec2":
                        gl.uniform2iv(uniformPosition, parameter.value);
                        break;
                    case "ivec3":
                        gl.uniform3iv(uniformPosition, parameter.value);
                        break;
                    case "ivec4":
                        gl.uniform4iv(uniformPosition, parameter.value);
                        break;
                    case "uint":
                        gl.uniform1ui(uniformPosition, parameter.value);
                        break;
                    case "uvec2":
                        gl.uniform2uiv(uniformPosition, parameter.value);
                        break;
                    case "uvec3":
                        gl.uniform3uiv(uniformPosition, parameter.value);
                        break;
                    case "uvec4":
                        gl.uniform4uiv(uniformPosition, parameter.value);
                        break;
                    case "mat2":
                        gl.uniformMatrix2fv(
                            uniformPosition,
                            false,
                            parameter.value,
                        );
                        break;
                    case "mat3":
                        gl.uniformMatrix3fv(
                            uniformPosition,
                            false,
                            parameter.value,
                        );
                        break;
                    case "mat4":
                        gl.uniformMatrix4fv(
                            uniformPosition,
                            false,
                            parameter.value,
                        );
                        break;
                    default:
                        throw new Error(
                            // @ts-expect-error: Match should be exhaustive, but non-TS users should get a helpful runtime-error.
                            `Unknown parameter type: ${parameter.type}`,
                        );
                }
            }
        }
        requestRender();
    }
    $: updateParameters(parameters);
</script>

<BaseShader
    {width}
    {height}
    {canRender}
    maxSize={maxTextureSize}
    offsetFromBottom
    {rerenderEveryFrame}
    {forceAnimation}
    {render}
    {updateCanvasSize}
    {updateContainerSize}
    {updateOffset}
    {updateScale}
    {updateTime}
    bind:canvasElement
    bind:requestRender
>
    <slot></slot>
</BaseShader>
