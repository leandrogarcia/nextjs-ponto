import { describe, expect, it } from "vitest";
import { checkInstallSecret } from "@/lib/server/install";

describe("checkInstallSecret", () => {
  it("compara o segredo", () => {
    expect(checkInstallSecret("abc", "abc")).toBe(true);
    expect(checkInstallSecret("abd", "abc")).toBe(false);
    expect(checkInstallSecret("abcd", "abc")).toBe(false);
  });
  it("recusa quando o segredo não está configurado", () => {
    expect(checkInstallSecret("", undefined)).toBe(false);
    expect(checkInstallSecret("", "")).toBe(false);
  });
});
