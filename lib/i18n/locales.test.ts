import { describe, expect, it } from "vitest";

import {
  copy,
  localeDefinition,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/locales";

describe("locale registry", () => {
  it("offers exactly the three V1 languages in native labels", () => {
    expect(SUPPORTED_LOCALES.map((entry) => entry.nativeLabel)).toEqual([
      "English",
      "Español",
      "中文（普通话）",
    ]);
  });

  it("never assigns the English-only medical model to Spanish or Mandarin", () => {
    expect(localeDefinition("en-US").deepgramModel).toBe("nova-3-medical");
    expect(localeDefinition("es-US").deepgramModel).toBe("nova-3");
    expect(localeDefinition("zh-CN").deepgramModel).toBe("nova-3");
  });

  it("introduces the product as Formless in every supported language", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(copy.introduction[locale.id]).toContain("Formless");
    }
  });
});
