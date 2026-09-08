import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { deleteStudyFileForUser, insertStudyFile, listStudyFiles } from "./db";
import { storagePut } from "./storage";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function safeFileName(fileName: string) {
  const normalized = fileName.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  return normalized.slice(0, 180) || "document";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  files: router({
    list: protectedProcedure.query(({ ctx }) => listStudyFiles(ctx.user.id)),
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string().min(1).max(255),
        contentType: z.string().min(1).max(120),
        sizeBytes: z.number().int().positive().max(MAX_FILE_BYTES),
        base64: z.string().min(1).max(14_000_000),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ALLOWED_TYPES.has(input.contentType)) {
          throw new Error("Type de fichier non pris en charge. Utilisez PDF, TXT, Markdown ou une image.");
        }
        const data = Buffer.from(input.base64, "base64");
        if (data.byteLength > MAX_FILE_BYTES || data.byteLength !== input.sizeBytes) {
          throw new Error("La taille du fichier ne correspond pas aux métadonnées ou dépasse 10 Mo.");
        }
        const stored = await storagePut(`users/${ctx.user.id}/study-files/${safeFileName(input.fileName)}`, data, input.contentType);
        return insertStudyFile({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey: stored.key,
          url: stored.url,
          contentType: input.contentType,
          sizeBytes: data.byteLength,
        });
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => ({ deleted: await deleteStudyFileForUser(input.id, ctx.user.id) })),
  }),
});

export type AppRouter = typeof appRouter;
