<!-- This file exists purely to assert type errors -->
<svelte:options runes />

<script>
    import { WebGpuShader } from "svader";
</script>

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
