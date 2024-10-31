import { defineConfig, devices } from "@playwright/test";

// Apparently, Chromium browsers need to be explicitly told to use GPU acceleration in headless mode,
// and software rendering creates slightly different results for WebGL in noise and such,
// while WebGPU has no software fallback at all.
const chromiumHardware = {
    args: ["--enable-gpu"],
};

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
            name: "Firefox",
            use: {
                ...devices["Desktop Firefox"],
            },
        },
        {
            name: "Microsoft Edge",
            use: {
                ...devices["Desktop Edge"],
                channel: "msedge",
                launchOptions: chromiumHardware,
            },
        },
        {
            name: "Google Chrome",
            use: {
                ...devices["Desktop Chrome"],
                channel: "chrome",
                launchOptions: chromiumHardware,
            },
        },
        /* TODO: Test these as well */
        // {
        //     name: 'Chromium',
        //     use: {
        //       ...devices['Desktop Chrome'],
        //       launchOptions: chromiumHardware,
        //     },
        //   },
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
