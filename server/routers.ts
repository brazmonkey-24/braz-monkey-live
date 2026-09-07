import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { insertBlackbookEntry, getBlackbookEntries, insertCmsContent, getLatestCmsContent } from "./db";

const ADMIN_PASSWORD = "braz2026";

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

  admin: router({
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        return { ok: input.password === ADMIN_PASSWORD };
      }),
  }),

  content: router({
    latest: publicProcedure.query(async () => {
      const [quote, prediction, vinyl] = await Promise.all([
        getLatestCmsContent("quote"),
        getLatestCmsContent("prediction"),
        getLatestCmsContent("vinyl"),
      ]);
      return { quote, prediction, vinyl };
    }),
    save: publicProcedure
      .input(
        z.object({
          password: z.string(),
          type: z.enum(["quote", "prediction", "vinyl"]),
          body: z.string().min(1),
          title: z.string().max(256).optional(),
          artist: z.string().max(256).optional(),
          imageFileName: z.string().max(256).optional(),
          imageData: z.string().optional(),
          imageMime: z.string().max(64).optional(),
        })
      )
      .mutation(async ({ input }) => {
        if (input.password !== ADMIN_PASSWORD) throw new Error("Unauthorized");
        let imageUrl: string | undefined;
        let imageKey: string | undefined;
        if (input.imageData && input.imageFileName && input.imageMime) {
          const buffer = Buffer.from(input.imageData, "base64");
          const relKey = `cms/${Date.now()}-${input.imageFileName}`;
          const stored = await storagePut(relKey, buffer, input.imageMime);
          imageUrl = stored.url;
          imageKey = stored.key;
        }
        await insertCmsContent({
          type: input.type,
          body: input.body,
          title: input.title,
          artist: input.artist,
          imageUrl,
          imageKey,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
