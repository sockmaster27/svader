/** @type {import('./$types').PageLoad} */
export const load = async event => {
    const response = await event.fetch("debug.wgsl");
    const shaderCode = await response.text();
    return {
        shaderCode,
    };
};
