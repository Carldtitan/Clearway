import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const outputDirectory = path.join(process.cwd(), "output", "fallback-recording");
const publicDirectory = path.join(process.cwd(), "public", "demo");
const publicPath = path.join(publicDirectory, "packet-fallback.webm");

async function main() {
  await Promise.all([
    mkdir(outputDirectory, { recursive: true }),
    mkdir(publicDirectory, { recursive: true }),
  ]);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: outputDirectory,
      size: { width: 1280, height: 800 },
    },
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(process.env.DEMO_URL ?? "http://localhost:3000", {
    waitUntil: "networkidle",
  });

  await page.getByRole("button", { name: /load elena/i }).click();
  await page.waitForTimeout(600);
  await page
    .getByRole("button", { name: /continue to my story/i })
    .click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: /^demo answer$/i }).click();
  await page
    .getByRole("button", { name: /review captured facts/i })
    .waitFor();
  await page.waitForTimeout(900);
  await page
    .getByRole("button", { name: /review captured facts/i })
    .click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: /^confirm$/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /build my packet/i }).click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /generate packet/i }).click();
  await page.getByText("Packet ready").waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2_000);

  const video = page.video();
  await context.close();
  await video?.saveAs(publicPath);
  await browser.close();
  process.stdout.write(`${publicPath}\n`);
}

main().catch(() => {
  process.stderr.write(
    "Fallback recording failed without exposing case or service data.\n",
  );
  process.exitCode = 1;
});
