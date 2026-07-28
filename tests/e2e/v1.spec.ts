import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const artifactDirectory = path.join(process.cwd(), "output", "playwright");

async function reachDocuments(page: Page) {
  await page.goto("/?demo=1&stage=documents", {
    waitUntil: "networkidle",
  });
  await expect(
    page.getByRole("heading", {
      name: /review and download your application documents/i,
    }),
  ).toBeVisible();
}

test.beforeAll(async () => {
  await mkdir(artifactDirectory, { recursive: true });
});

for (const scenario of [
  {
    id: "English",
    locale: "en-US",
    languageButton: /English EN/i,
    nextQuestion: /What is your Social Security number/i,
    paused: "Paused",
    transcripts: ["I'm ready", "Ana López", "yes", "pause"],
    legalName: "Ana López",
    confirmation: "Your full legal name is Ana López. Is that right?",
  },
  {
    id: "Spanish",
    locale: "es-US",
    languageButton: /Español ES/i,
    nextQuestion: /Cuál es su número de Seguro Social/i,
    paused: "En pausa",
    transcripts: [
      "Estoy lista",
      "Mi nombre legal completo es Ana López.",
      "sí",
      "pausa",
    ],
    legalName: "Ana López",
    confirmation: "Su nombre legal completo es Ana López. ¿Es correcto?",
  },
  {
    id: "Mandarin",
    locale: "zh-CN",
    languageButton: /中文/,
    nextQuestion: /您的社会安全号码是什么/,
    paused: "已暂停",
    transcripts: ["我准备好了", "我的法定全名是王丽。", "是", "暂停"],
    legalName: "王丽",
    confirmation: "您的法定全名是王丽，对吗？",
  },
] as const) {
  test(`${scenario.id} voice-only handoff reaches the next required question`, async ({
    page,
  }) => {
    await installSyntheticMicrophone(page);
    const transcripts: string[] = [...scenario.transcripts];
    await page.route("**/api/speak", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Use browser speech in this test." }),
      }),
    );
    await page.route("**/api/transcribe", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          transcript: transcripts.shift() ?? scenario.transcripts[3],
        }),
      }),
    );
    await page.route("**/api/interview/extract", async (route) => {
      const request = route.request().postDataJSON() as { turnId: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          turnId: request.turnId,
          extraction: {
            summary: `The applicant’s legal name is ${scenario.legalName}.`,
            confirmationText: scenario.confirmation,
            followUpQuestion: "",
            providerListStatus: "unknown",
            facts: [
              {
                kind: "scalar",
                entityKey: "",
                field: "applicant.legalName",
                value: scenario.legalName,
                confidence: 0.99,
                evidenceText: scenario.legalName,
              },
            ],
          },
        }),
      });
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: scenario.languageButton })
      .click();

    await expect(
      page.getByRole("heading", { name: scenario.nextQuestion }),
    ).toBeVisible();
    await expect(
      page.getByText(scenario.paused, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Conversation language" }),
    ).toHaveValue(scenario.locale);
    expect(transcripts).toEqual([]);
  });
}

test("a rejected voice answer becomes a correction turn", async ({ page }) => {
  await installSyntheticMicrophone(page);
  const transcripts = [
    "I'm ready",
    "Alice Rivera",
    "No, don't save that",
    "Jane Rivera",
    "yes",
    "pause",
  ];
  const spokenPrompts: string[] = [];

  await page.route("**/api/speak", async (route) => {
    const request = route.request().postDataJSON() as { text: string };
    spokenPrompts.push(request.text);
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Use browser speech in this test." }),
    });
  });
  await page.route("**/api/transcribe", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ transcript: transcripts.shift() ?? "pause" }),
    }),
  );
  await page.route("**/api/interview/extract", async (route) => {
    const request = route.request().postDataJSON() as {
      turnId: string;
      transcript: string;
    };
    const legalName = request.transcript.includes("Jane")
      ? "Jane Rivera"
      : "Alice Rivera";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        turnId: request.turnId,
        extraction: {
          summary: `The applicant’s legal name is ${legalName}.`,
          confirmationText: `I heard ${legalName}. Is that correct?`,
          followUpQuestion: "",
          providerListStatus: "unknown",
          facts: [
            {
              kind: "scalar",
              entityKey: "",
              field: "applicant.legalName",
              value: legalName,
              confidence: 0.99,
              evidenceText: legalName,
            },
          ],
        },
      }),
    });
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /English EN/i }).click();

  await expect(
    page.getByRole("heading", {
      name: /What is your Social Security number/i,
    }),
  ).toBeVisible();
  await expect(page.getByText("Paused", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Jane Rivera", { exact: true }).first(),
  ).toBeVisible();
  expect(
    spokenPrompts.filter(
      (prompt) => prompt === "What is your full legal name?",
    ),
  ).toHaveLength(1);
  expect(spokenPrompts).toContain(
    "Thanks for catching that. I won’t save it. What should I put down instead?",
  );
  expect(transcripts).toEqual([]);
});

test("language is the first decision and removed workflow copy is absent", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(
    page.getByRole("heading", {
      name: "Which language would you like to use?",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /English EN/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Español ES/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /中文（普通话） 中文/i }),
  ).toBeVisible();

  for (const removed of [
    "Voice-first application",
    "Your voice can complete this application",
    "Start voice check",
    "Start voice interview",
    "Use one-question keyboard fallback",
    "Nothing is saved when this tab closes",
  ]) {
    await expect(page.getByText(removed)).toHaveCount(0);
  }

  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("Spanish selection immediately localizes preparation and fallback", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Español ES/i }).click();

  await expect(
    page.getByRole("heading", {
      name: /Diga “Estoy listo” o “Estoy lista”/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Le ayudaré a preparar su solicitud por discapacidad/i),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Su respuesta" })).toBeVisible();
  await expect(page.getByText("Permission denied")).toHaveCount(0);
});

test("Mandarin selection keeps the preparation step in Mandarin", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /中文/ }).click();

  await expect(
    page.getByRole("combobox", { name: "Conversation language" }),
  ).toHaveValue("zh-CN");
  await expect(page.getByText("请准备这些资料")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "您的回答" })).toBeVisible();
});

test("typed recovery continues to the first required question", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /English EN/i }).click();
  const answer = page.getByRole("textbox", { name: "Your answer" });
  await expect(answer).toBeVisible();
  await answer.fill("I'm ready");
  await page.getByRole("button", { name: "Send answer" }).click();

  await expect(
    page.getByRole("heading", { name: "What is your full legal name?" }),
  ).toBeVisible();
  await expect(page.getByText("Check")).toHaveCount(0);
  await expect(page.getByText("Review")).toHaveCount(0);
});

test("continuous voice generates Documents and updates Records", async ({
  page,
}) => {
  await installSyntheticMicrophone(page);
  const transcripts = [
    "yes",
    "yes",
    "yes",
    "mark received",
    "yes",
  ];
  await page.route("**/api/speak", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Use browser speech in this test." }),
    }),
  );
  await page.route("**/api/transcribe", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ transcript: transcripts.shift() ?? "status" }),
    }),
  );
  await page.route("**/api/packet/generate", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/pdf",
      headers: {
        "x-packet-documents": "5",
        "x-packet-pages": "39",
      },
      body: "synthetic packet",
    }),
  );

  await page.goto("/?demo=1&stage=documents&voice=1", {
    waitUntil: "networkidle",
  });

  await expect(
    page.getByRole("heading", { name: /keep the evidence moving/i }),
  ).toBeVisible();
  await expect(page.getByText("2 of 3 received")).toBeVisible();
  await expect(
    page.getByText("Mercy General Hospital is marked received."),
  ).toBeVisible();
  expect(transcripts).toEqual([]);
});

test("complete demo generates and downloads the real packet", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await reachDocuments(page);
  await page.screenshot({
    path: path.join(artifactDirectory, "documents-ready-desktop.png"),
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

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: /download packet/i }).click();
  const download = await downloadPromise;
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

  const recordsAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(recordsAudit.violations).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("Documents remains usable at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await reachDocuments(page);

  await expect(page.getByText("Bring with you")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /generate packet/i }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("document failure preserves progress and exposes the recorded fallback", async ({
  page,
}) => {
  await reachDocuments(page);
  await page.route("**/api/packet/generate", (route) =>
    route.fulfill({
      body: JSON.stringify({
        error:
          "Document generation is unavailable right now. Your answers are still here.",
      }),
      contentType: "application/json",
      status: 503,
    }),
  );

  await page.getByRole("button", { name: /generate packet/i }).click();

  await expect(page.getByText("Packet not generated")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: /watch the synthetic packet fallback/i,
    }),
  ).toHaveAttribute("href", "/demo/packet-fallback.webm");
});

async function installSyntheticMicrophone(page: Page) {
  await page.addInitScript(() => {
    const stream = {
      active: true,
      getTracks: () => [{ stop: () => undefined }],
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => stream,
      },
    });

    class SyntheticMediaRecorder extends EventTarget {
      static isTypeSupported() {
        return true;
      }

      mimeType = "audio/webm";
      state: "inactive" | "paused" | "recording" = "inactive";

      start() {
        this.state = "recording";
        window.setTimeout(() => {
          if (this.state !== "inactive") this.stop();
        }, 35);
      }

      stop() {
        this.state = "inactive";
        const dataEvent = new Event("dataavailable");
        Object.defineProperty(dataEvent, "data", {
          value: new Blob(["synthetic voice"], { type: this.mimeType }),
        });
        this.dispatchEvent(dataEvent);
        this.dispatchEvent(new Event("stop"));
      }

      pause() {
        this.state = "paused";
      }

      resume() {
        this.state = "recording";
      }
    }

    class SyntheticUtterance {
      lang = "en-US";
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      pitch = 1;
      rate = 1;

      constructor(public text: string) {}
    }

    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: SyntheticMediaRecorder,
    });
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: SyntheticUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel: () => undefined,
        speak: (utterance: SyntheticUtterance) => {
          window.queueMicrotask(() => utterance.onend?.());
        },
      },
    });
  });
}
