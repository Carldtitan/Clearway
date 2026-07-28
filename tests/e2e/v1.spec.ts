import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const artifactDirectory = path.join(process.cwd(), "output", "playwright");

async function reachPacket(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  const demoButton = page.getByRole("button", { name: /load elena/i });
  await expect(demoButton).toBeVisible();
  await demoButton.click();
  await page.getByRole("button", { name: /continue to my story/i }).click();
  await page.getByRole("button", { name: /^demo answer$/i }).click();
  await page
    .getByRole("button", { name: /review captured facts/i })
    .click();
  await page.getByRole("button", { name: /^confirm$/i }).click();
  await page.getByRole("button", { name: /build my packet/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /turn one review into a filing packet/i,
    }),
  ).toBeVisible();
}

test.beforeAll(async () => {
  await mkdir(artifactDirectory, { recursive: true });
});

test("complete three-minute path generates and downloads the real packet", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await reachPacket(page);
  await page.screenshot({
    path: path.join(artifactDirectory, "packet-ready-desktop.png"),
    fullPage: true,
  });

  const packetAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(packetAudit.violations).toEqual([]);

  await page.getByRole("button", { name: /generate packet/i }).click();
  await expect(page.getByText("Packet ready")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/39 pages · 5 documents/i)).toBeVisible();
  await page.screenshot({
    path: path.join(artifactDirectory, "packet-complete-desktop.png"),
    fullPage: true,
  });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: /download packet/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "ssdi-application-working-packet.pdf",
  );
  const downloadPath = path.join(
    artifactDirectory,
    download.suggestedFilename(),
  );
  await download.saveAs(downloadPath);
  expect((await stat(downloadPath)).size).toBeGreaterThan(200_000);

  await page
    .getByRole("button", { name: /track medical records/i })
    .click();
  await expect(
    page.getByRole("heading", { name: /keep the evidence moving/i }),
  ).toBeVisible();
  await expect(page.getByText("Deadline passed")).toBeVisible();
  await expect(page.getByText("Day 40")).toBeVisible();
  await page
    .getByRole("button", { name: /dr\. simon owens/i })
    .click();
  await expect(page.getByText(/HIPAA Right of Access/i)).toBeVisible();
  await expect(page.getByText(/30-day response period/i)).toBeVisible();
  await page.screenshot({
    path: path.join(artifactDirectory, "records-desktop.png"),
    fullPage: true,
  });

  const recordsAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(recordsAudit.violations).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("packet workspace remains usable at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await reachPacket(page);

  await expect(page.getByText("Bring with you")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /generate packet/i }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: path.join(artifactDirectory, "packet-ready-mobile.png"),
    fullPage: true,
  });

  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});
