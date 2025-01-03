import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: "./tests",
    snapshotPathTemplate:
        "{testDir}/.generated-screenshots/{testFilePath}/{arg}{ext}",
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : 4,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: "html",
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",

        contextOptions: {
            // Disable animations so screenshots are comparable
            reducedMotion: "reduce",
        },
    },

    projects: [
        {
            name: "Firefox <No WebGPU>",
            use: {
                ...devices["Desktop Firefox"],
            },
        },
        /* TODO: Test this once Firefox supports WebGPU in stable */
        // {
        //     name: "Firefox",
        //     use: {
        //         ...devices["Desktop Firefox"],
        //         launchOptions: {
        //             firefoxUserPrefs: {
        //                 "dom.webgpu.enabled": true,
        //             },
        //         },
        //     },
        // },
        {
            name: "Chromium <No WebGPU>",
            use: {
                ...devices["Desktop Chrome"],
                channel: "chromium",
            },
        },
        {
            name: "Chromium",
            use: {
                ...devices["Desktop Chrome"],
                channel: "chromium",
                launchOptions: {
                    args: ["--enable-unsafe-webgpu"],
                },
            },
        },
        /* TODO: Test these as well */
        // {
        //   name: 'WebKit',
        //   use: { ...devices['Desktop Safari'] },
        // },
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },
    ],

    webServer: [
        {
            command: "npm run preview:v4",
            port: 4173,
            reuseExistingServer: !process.env.CI,
        },
        {
            command: "npm run preview:v5",
            port: 4174,
            reuseExistingServer: !process.env.CI,
        },
    ],
});
