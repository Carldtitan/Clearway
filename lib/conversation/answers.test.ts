import { describe, expect, it } from "vitest";

import {
  explicitNone,
  parseLocalizedYesNo,
  readyAnswer,
} from "@/lib/conversation/answers";

describe("localized conversation answers", () => {
  it("recognizes accented and unaccented Spanish confirmations", () => {
    expect(parseLocalizedYesNo("sí", "es-US")).toMatchObject({
      ok: true,
      value: true,
    });
    expect(parseLocalizedYesNo("Si, es correcto.", "es-US")).toMatchObject({
      ok: true,
      value: true,
    });
  });

  it("normalizes Spanish readiness and collection exhaustion", () => {
    expect(readyAnswer("Estoy lista", "es-US")).toBe(true);
    expect(explicitNone("No hay más proveedores", "es-US")).toBe(true);
  });

  it("recognizes Mandarin readiness and confirmations", () => {
    expect(readyAnswer("我准备好了", "zh-CN")).toBe(true);
    expect(parseLocalizedYesNo("是", "zh-CN")).toMatchObject({
      ok: true,
      value: true,
    });
  });
});
