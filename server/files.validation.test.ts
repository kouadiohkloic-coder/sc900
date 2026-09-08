import { describe, expect, it } from "vitest";
import { appRouter, ALLOWED_TYPES, MAX_FILE_BYTES, safeFileName } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("study file validation", () => {
  it("accepts the supported document and image types only", () => {
    expect(ALLOWED_TYPES.has("application/pdf")).toBe(true);
    expect(ALLOWED_TYPES.has("text/markdown")).toBe(true);
    expect(ALLOWED_TYPES.has("image/webp")).toBe(true);
    expect(ALLOWED_TYPES.has("application/zip")).toBe(false);
  });

  it("normalizes a file name before using it in a storage key", () => {
    expect(safeFileName("../../Mes notes SC-900.pdf")).toBe("Mes-notes-SC-900.pdf");
    expect(safeFileName("   ")).toBe("document");
    expect(safeFileName("révision-éè.md")).toBe("r-vision-.md");
  });

  it("keeps the upload size limit explicit", () => {
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe("files authorization", () => {
  it("protects the file listing from anonymous callers", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.files.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
