import { test, expect } from "@playwright/test";

// A canned, deterministic "bot" reply (includes markdown to verify rendering).
const MOCK_REPLY = "Sure! Ken wrote **Mockito Made Clear** — see [the book](https://www.kousenit.com/publications/mockito-made-clear/).";

// Intercept /api/ask so tests never hit OpenAI. A plain-text body is fine — the
// widget reads the response body as a stream and renders it.
async function mockAsk(page) {
  await page.route("**/api/ask", (route) =>
    route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: MOCK_REPLY })
  );
}

test.describe("chat widget", () => {
  test.beforeEach(async ({ page }) => {
    await mockAsk(page);
    await page.goto("/");
  });

  test("launch pill opens the panel with seeded questions", async ({ page }) => {
    await expect(page.locator("#kic-launch")).toBeVisible();
    await page.locator("#kic-launch").click();
    await expect(page.locator("#kic-panel")).toBeVisible();
    await expect(page.locator(".kic-seed")).toHaveCount(4);
  });

  test("clicking a starter question shows the answer with rendered markdown", async ({ page }) => {
    await page.locator("#kic-launch").click();
    await page.locator(".kic-seed").first().click();
    // user bubble + streamed/mocked bot bubble
    await expect(page.locator(".kic-user")).toHaveCount(1);
    const bot = page.locator(".kic-bot").last();
    await expect(bot.locator("strong")).toHaveText("Mockito Made Clear");
    await expect(bot.locator('a[href="https://www.kousenit.com/publications/mockito-made-clear/"]')).toBeVisible();
  });

  test("typing a question and sending works", async ({ page }) => {
    await page.locator("#kic-launch").click();
    await page.locator("#kic-input").fill("Who is Ken?");
    await page.locator("#kic-send").click();
    await expect(page.locator(".kic-user")).toContainText("Who is Ken?");
    await expect(page.locator(".kic-bot").last()).toContainText("Mockito Made Clear");
  });

  test("💡 brings back the suggested questions after they vanish", async ({ page }) => {
    await page.locator("#kic-launch").click();
    await page.locator(".kic-seed").first().click(); // seeds disappear after first query
    await expect(page.locator(".kic-seed")).toHaveCount(0);
    await page.locator("#kic-suggest").click();
    await expect(page.locator(".kic-seed")).toHaveCount(4);
  });

  test("Escape closes the panel", async ({ page }) => {
    await page.locator("#kic-launch").click();
    await expect(page.locator("#kic-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#kic-panel")).toBeHidden();
  });
});

test("llms.txt is served for agents", async ({ page }) => {
  const res = await page.request.get("/llms.txt");
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("# Ken Kousen");
});
