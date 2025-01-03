import { test, expect, TestInfo, Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    page.on("pageerror", msg => {
        expect.soft(false, `Error thrown:\n${msg.message}`).toBeTruthy();
    });
});

/**
 * Takes a screenshot of the current page and compares it to a reference, as indexed by the given arguments.
 * If a reference screenshot does not exist, it will be created and used for future assertions.
 *
 * @param page
 * @param info
 * @param browserName
 * @param name A name that identifies this test.
 * @param api The API used in the test, either `"webgl"` or `"webgpu"`.
 * @param number A number identifying the specific screeenshot within the test, if multiple are included.
 */
async function assertScreenshot(
    page: Page,
    info: TestInfo,
    browserName: string,
    name: string,
    api: "webgl" | "webgpu",
    number?: number,
) {
    const projectName = info.project.name;

    const isWebGpu = api === "webgpu";
    const isWebGpuUnsupported = projectName.includes("<No WebGPU>");
    const unsupportedString =
        isWebGpu && isWebGpuUnsupported ? "-unsupported" : "";

    const engineString = `-${browserName}`;

    const isMobile = info.project.use.isMobile ?? false;
    const mobileString = isMobile ? "-mobile" : "";

    const numberString = number !== undefined ? `-${number}` : "";

    const fileName = `${name}-${api}${unsupportedString}${engineString}${mobileString}${numberString}.png`;

    await expect.soft(page).toHaveScreenshot(fileName, {
        threshold: 0.1,
    });
}

const apis = ["webgl", "webgpu"] as const;
const builds = [
    { name: "svelte4", port: 4173 },
    { name: "svelte5", port: 4174 },
] as const;

builds.forEach(({ name, port }) => {
    test.describe(name, () => {
        test.use({ baseURL: `http://localhost:${port}` });

        apis.forEach(api => {
            test.describe(api, () => {
                test("Hello world", async ({ page, browserName }, info) => {
                    const pageName = "hello-world";

                    await page.goto(`/${pageName}/${api}`);
                    await assertScreenshot(
                        page,
                        info,
                        browserName,
                        pageName,
                        api,
                    );
                });

                test("Remounting canvas", async ({
                    page,
                    browserName,
                }, info) => {
                    const pageName = "remount";

                    await page.goto(`/${pageName}/${api}`);
                    const show = page.getByLabel("Show");
                    await show.uncheck();
                    await assertScreenshot(
                        page,
                        info,
                        browserName,
                        pageName,
                        api,
                        1,
                    );
                    for (let i = 0; i < 10; i++) {
                        await show.check();
                        await show.uncheck();
                    }
                    await show.check();
                    await assertScreenshot(
                        page,
                        info,
                        browserName,
                        pageName,
                        api,
                        2,
                    );
                });

                test("Oversized canvas", async ({
                    page,
                    browserName,
                }, info) => {
                    const pageName = "oversized-canvas";

                    await page.goto(`/${pageName}/${api}`);
                    await assertScreenshot(
                        page,
                        info,
                        browserName,
                        pageName,
                        api,
                        1,
                    );
                    // Scroll to bottom-right corner
                    await page.evaluate(() =>
                        window.scrollBy(
                            document.body.scrollWidth,
                            document.body.scrollHeight,
                        ),
                    );
                    await assertScreenshot(
                        page,
                        info,
                        browserName,
                        pageName,
                        api,
                        2,
                    );
                });

                test("Landing page with bubbles", async ({
                    page,
                    browserName,
                }, info) => {
                    const pageName = "landing-page-bubbles";

                    await page.goto(`/${pageName}/${api}`);
                    await assertScreenshot(
                        page,
                        info,
                        browserName,
                        pageName,
                        api,
                    );
                });

                test("Landing page with a halo", async ({
                    page,
                    browserName,
                }, info) => {
                    const pageName = "landing-page-halo";

                    await page.goto(`/${pageName}/${api}`);
                    await assertScreenshot(
                        page,
                        info,
                        browserName,
                        pageName,
                        api,
                    );
                });

                test("Slider component", async ({
                    page,
                    browserName,
                }, info) => {
                    const pageName = "slider";

                    await page.goto(`/${pageName}/${api}`);
                    const slider = page.getByRole("slider");
                    await assertScreenshot(
                        page,
                        info,
                        browserName,
                        pageName,
                        api,
                        1,
                    );
                    await slider.fill("1");
                    await assertScreenshot(
                        page,
                        info,
                        browserName,
                        pageName,
                        api,
                        2,
                    );
                    await slider.fill("0");
                    await assertScreenshot(
                        page,
                        info,
                        browserName,
                        pageName,
                        api,
                        3,
                    );
                });
            });
        });
    });
});
