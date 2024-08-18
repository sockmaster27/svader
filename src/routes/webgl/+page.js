/** @type {import('./$types').PageLoad} */
export const load = async event => {
    const response = await event.fetch("debug.frag");
    const shaderCode = await response.text();
    return {
        shaderCode,
    };
};
