<!-- This file exists purely to assert type errors -->
<svelte:options runes />

<script>
    import { WebGlShader, WebGpuShader } from "svader";
</script>

<WebGlShader
    // @ts-expect-error: forceAnimation must be a boolean
    forceAnimation="yeah"
    // @ts-expect-error: width must be a string
    width={100}
    // @ts-expect-error: height must be a string
    height={100}
    // @ts-expect-error: code is not a string
    code={42}
    parameters={[
        // @ts-expect-error: missing name property
        {
            type: "float",
            value: 42,
        },
        // @ts-expect-error: missing type property
        {
            name: "value1",
            value: 42,
        },
        // @ts-expect-error: missing value property
        {
            name: "value2",
            type: "float",
        },
        {
            name: "value3",
            // @ts-expect-error: type should not be present with built-in value
            type: "float",
            value: "resolution",
        },
        {
            name: "value4",
            // @ts-expect-error: misspelled type
            type: "flote",
            value: 42,
        },
        {
            name: "value5",
            // @ts-expect-error: misspelled built-in value
            value: "resoltion",
        },
        {
            // @ts-expect-error: name must be a string
            name: 6,
            type: "float",
            value: 42,
        },
        {
            name: "value7",
            // @ts-expect-error: type must be a string
            type: 7,
            value: 42,
        },
        {
            name: "value8",
            type: "float",
            // @ts-expect-error: float corresponds to number
            value: [0, 0],
        },
        {
            name: "value9",
            type: "int",
            // @ts-expect-error: int corresponds to number
            value: [0, 0],
        },
        {
            name: "value10",
            type: "uint",
            // @ts-expect-error: uint corresponds to number
            value: [0, 0],
        },
        // @ts-expect-error: vec2 corresponds to [number, number]
        {
            name: "value11",
            type: "vec2",
            value: 0,
        },
        // @ts-expect-error: ivec2 corresponds to [number, number]
        {
            name: "value12",
            type: "ivec2",
            value: 0,
        },
        // @ts-expect-error: uvec2 corresponds to [number, number]
        {
            name: "value13",
            type: "uvec2",
            value: 0,
        },
        // @ts-expect-error: vec3 corresponds to [number, number, number]
        {
            name: "value14",
            type: "vec3",
            value: [0, 0],
        },
        // @ts-expect-error: ivec3 corresponds to [number, number, number]
        {
            name: "value15",
            type: "ivec3",
            value: [0, 0],
        },
        // @ts-expect-error: uvec3 corresponds to [number, number, number]
        {
            name: "value16",
            type: "uvec3",
            value: [0, 0],
        },
        // @ts-expect-error: vec4 corresponds to [number, number, number, number]
        {
            name: "value17",
            type: "vec4",
            value: [0, 0, 0],
        },
        // @ts-expect-error: ivec4 corresponds to [number, number, number, number]
        {
            name: "value18",
            type: "ivec4",
            value: [0, 0, 0],
        },
        // @ts-expect-error: uvec4 corresponds to [number, number, number, number]
        {
            name: "value19",
            type: "uvec4",
            value: [0, 0, 0],
        },
        // @ts-expect-error: mat2 corresponds to
        // [number, number,
        //  number, number]
        {
            name: "value20",
            type: "mat2",
            value: [0, 0, 0],
        },
        // @ts-expect-error: mat3 corresponds to
        // [number, number, number,
        //  number, number, number,
        //  number, number, number]
        {
            name: "value21",
            type: "mat3",
            value: [0, 0, 0, 0],
        },
        // @ts-expect-error: mat4 corresponds to
        // [number, number, number, number,
        //  number, number, number, number,
        //  number, number, number, number,
        //  number, number, number, number]
        {
            name: "value22",
            type: "mat4",
            value: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
    ]}
></WebGlShader>

<WebGpuShader
    // @ts-expect-error: forceAnimation must be a boolean
    forceAnimation="yeah"
    // @ts-expect-error: width must be a string
    width={100}
    // @ts-expect-error: height must be a string
    height={100}
    // @ts-expect-error: code is not a string
    code={42}
    parameters={[
        // @ts-expect-error: missing label property
        {
            binding: 0,
            value: "resolution",
        },
        // @ts-expect-error: missing binding property
        {
            label: "Value1",
            value: "resolution",
        },
        // @ts-expect-error: missing value property
        {
            label: "Value2",
            binding: 2,
        },
        {
            // @ts-expect-error: label must be a string
            label: 3,
            binding: 3,
            value: "resolution",
        },
        {
            label: "Value4",
            // @ts-expect-error: binding must be a number
            binding: "4",
            value: "resolution",
        },
        {
            label: "Value5",
            binding: 5,
            // @ts-expect-error: value must be a buffer
            value: 42,
        },
        {
            label: "Value6",
            binding: 6,
            // @ts-expect-error: misspelled built-in value
            value: "resoltion",
        },
        {
            label: "Value7",
            binding: 7,
            value: new Float32Array([42]),
            // @ts-expect-error: storage must be a boolean
            storage: "read-only",
        },
    ]}
></WebGpuShader>
