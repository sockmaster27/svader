import { readable } from "svelte/store";

/** Ratio between CSS pixels and actual physical pixels */
export const pixelScale =
    typeof window !== "undefined"
        ? readable(window.devicePixelRatio, set => {
              let removePrevious = () => {};

              function updatePixelRatio() {
                  removePrevious();
                  const queryString = `(resolution: ${window.devicePixelRatio}dppx)`;
                  const media = matchMedia(queryString);
                  media.addEventListener("change", updatePixelRatio);
                  removePrevious = () =>
                      media.removeEventListener("change", updatePixelRatio);

                  set(window.devicePixelRatio);
              }

              updatePixelRatio();
          })
        : readable(1);

/**
 * Zip two arrays together, returning an array of pairs.
 *
 * ```ts
 * zip([1, 2, 3], ["a", "b", "c"]) // [[1, "a"], [2, "b"], [3, "c"]]
 * ```
 *
 * @template A
 * @template B
 * @param {readonly A[]} a
 * @param {readonly B[]} b
 * @returns {[A, B][]}
 */
export function zip(a, b) {
    if (a.length !== b.length)
        throw new Error(
            `Arrays must be of equal length: a.length = ${a.length}, b.length = ${b.length}`,
        );

    return a.map((e, i) => [e, b[i]]);
}

/**
 * Clamp a value between a minimum and maximum.
 *
 * ```ts
 * clamp(0,  5, 10) ===  5
 * clamp(0, -5, 10) ===  0
 * clamp(0, 15, 10) === 10
 * ```
 *
 * @param {number} min
 * @param {number} value
 * @param {number} max
 * @returns {number}
 */
export function clamp(min, value, max) {
    return Math.min(Math.max(value, min), max);
}
