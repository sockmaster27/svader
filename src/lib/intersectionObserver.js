import { clamp } from "./utils.js";
/**
 * @template T
 * @template {Record<string, any>} A
 * @typedef {import("svelte/action").ActionReturn<T, A>} ActionReturn<T, A>
 */

/**
 * @typedef {CustomEvent<IntersectionObserverEntry>} IntersectionEvent
 * @typedef {{ "on:intersectionchanged"?: (e: IntersectionEvent) => void }} Attributes
 */

/**
 * Observe all changes to the intersection of the given element with the target element, (by default the viewport).
 *
 * @param {Element} node
 * @param {{ root?: Element | Document | null, rootMargin?: string }} [params]
 * @returns {ActionReturn<void, Attributes>}
 */
export function intersectionObserver(node, params) {
    let previousThreshold = 0;
    /** @type {IntersectionObserverInit} */
    const observerParams = {
        ...params,
        threshold: previousThreshold,
    };

    let observer = new IntersectionObserver(callback, observerParams);
    observer.observe(node);

    /** @param {IntersectionObserverEntry[]} entries */
    function callback(entries) {
        const entry = entries[0];

        if (entry.intersectionRatio === previousThreshold) return;

        node.dispatchEvent(
            new CustomEvent("intersectionchanged", { detail: entry }),
        );

        previousThreshold = entry.intersectionRatio;
        observer.disconnect();

        // Epsilon is necessary to ensure that the callback is triggered even with weird scaling.
        const epsilon = 0.00001;
        const threshold = [
            previousThreshold - epsilon,
            previousThreshold,
            previousThreshold + epsilon,
        ].map(t => clamp(0, t, 1));

        const observerParams = {
            ...params,
            threshold,
        };
        observer = new IntersectionObserver(callback, observerParams);
        observer.observe(node);
    }

    return {
        destroy() {
            observer.disconnect();
        },
    };
}
