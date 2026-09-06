import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { insertBlackbookEntry, getBlackbookEntries } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  blackbook: router({
    list: publicProcedure.query(async () => {
      return getBlackbookEntries();
    }),
    upload: publicProcedure
      .input(
        z.object({
          tagName: z.string().min(1).max(128),
          caption: z.string().max(500).optional(),
          fileName: z.string().min(1).max(256),
          fileData: z.string(), // base64-encoded file bytes
          mimeType: z.string().min(1).max(64),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const relKey = `blackbook/${Date.now()}-${input.fileName}`;
        const { key, url } = await storagePut(relKey, buffer, input.mimeType);
        await insertBlackbookEntry({
          tagName: input.tagName,
          caption: input.caption,
          fileKey: key,
          fileUrl: url,
          fileName: input.fileName,
          mimeType: input.mimeType,
        });
        return { key, url };
      }),
    tag: publicProcedure
      .input(
        z.object({
          tagName: z.string().min(1).max(128),
          caption: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await insertBlackbookEntry({
          tagName: input.tagName,
          caption: input.caption,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
