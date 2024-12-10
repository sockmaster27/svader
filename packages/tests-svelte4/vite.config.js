import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
    // @ts-expect-error: Because we're using vite-plugin-svelte 3 and vite 6,
    // these types are not entriely compatible, but in practice it works.
    plugins: [sveltekit()],
    preview: {
        port: 4173,
        strictPort: true,
    },
});
