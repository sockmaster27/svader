/**
 * @template T
 * @template {Record<string, any>} A
 * @typedef {import("svelte/action").ActionReturn<T, A>} ActionReturn<T, A>
 */

/**
 * @typedef {CustomEvent<{ width: number, height: number }>} DevicePixelResizeEvent
 * @typedef {{ "on:devicepixelresize"?: (e: DevicePixelResizeEvent) => void }} Attributes
 */

/**
 * Check if "devicePixelContentBoxSize" is supported (it's not in Safari).
 *
 * @returns {Promise<boolean>}
 */
async function checkDevicePixelContentBox() {
    return new Promise(resolve => {
        const observer = new ResizeObserver(entries => {
            resolve(
                entries.every(entry => "devicePixelContentBoxSize" in entry),
            );
            observer.disconnect();
        });
        observer.observe(document.body, { box: "device-pixel-content-box" });
    }).catch(() => false);
}
const hasDevicePixelContentBoxPromise = checkDevicePixelContentBox();
let hasDevicePixelContentBox = false;

/**
 * Observe all changes to the device-pixel-content-box of a node.
 *
 * @param {Element} node
 * @returns {ActionReturn<void, Attributes>}
 */
export function devicePixelResizeObserver(node) {
    let observer = new ResizeObserver(callback);

    /** @param {ResizeObserverEntry[]} entries */
    function callback(entries) {
        const entry = entries[0];

        const detail = hasDevicePixelContentBox
            ? {
                  width: entry.devicePixelContentBoxSize[0].inlineSize,
                  height: entry.devicePixelContentBoxSize[0].blockSize,
              }
            : {
                  // Not perfect, but it's the best we can do in this case.
                  width:
                      entry.contentBoxSize[0].inlineSize *
                      window.devicePixelRatio,
                  height:
                      entry.contentBoxSize[0].blockSize *
                      window.devicePixelRatio,
              };

        node.dispatchEvent(new CustomEvent("devicepixelresize", { detail }));
    }

    hasDevicePixelContentBoxPromise.then(r => {
        hasDevicePixelContentBox = r;
        observer.observe(node, {
            box: hasDevicePixelContentBox
                ? "device-pixel-content-box"
                : "content-box",
        });
    });

    return {
        destroy() {
            observer.disconnect();
        },
    };
}
