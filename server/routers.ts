import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { storagePut } from "./storage";
import { insertBlackbookEntry, getBlackbookEntries, insertCmsContent, getLatestCmsContent, listCmsContent, updateCmsContent, deleteCmsContent } from "./db";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_MS,
  createAdminSessionToken,
  hasValidAdminSession,
} from "./adminSession";

const ADMIN_PASSWORD_SALT = "9f82df8585520f28b675c58b954655de";
const ADMIN_PASSWORD_HASH = "eb370360a44947fa4ab2eef968840187982e54405409a183a5facfab9d21e133110d1e94cf814254d11457f0bf071305bb1bbd9eeb21864a4a96741ddf13f632";

function isAdminPassword(value: string) {
  const candidate = scryptSync(value, ADMIN_PASSWORD_SALT, 64);
  const expected = Buffer.from(ADMIN_PASSWORD_HASH, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

async function requireAdminSession(req: Parameters<typeof hasValidAdminSession>[0]) {
  if (!(await hasValidAdminSession(req))) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin session expired. Log opnieuw in.",
    });
  }
}

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
      .mutation(async ({ input, ctx }) => {
        if (!isAdminPassword(input.password)) return { ok: false };

        const token = await createAdminSessionToken();
        ctx.res.cookie(ADMIN_SESSION_COOKIE, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: ADMIN_SESSION_MAX_AGE_MS,
        });
        return { ok: true };
      }),
    session: publicProcedure.query(async ({ ctx }) => ({
      ok: await hasValidAdminSession(ctx.req),
    })),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ADMIN_SESSION_COOKIE, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
      return { ok: true };
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
    list: publicProcedure.query(async () => {
      return listCmsContent();
    }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          body: z.string().min(1),
          title: z.string().max(256).optional(),
          artist: z.string().max(256).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireAdminSession(ctx.req);
        await updateCmsContent(input.id, { body: input.body, title: input.title, artist: input.artist });
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireAdminSession(ctx.req);
        await deleteCmsContent(input.id);
        return { success: true };
      }),
    save: publicProcedure
      .input(
        z.object({
          type: z.enum(["quote", "prediction", "vinyl"]),
          body: z.string().min(1),
          title: z.string().max(256).optional(),
          artist: z.string().max(256).optional(),
          imageFileName: z.string().max(256).optional(),
          imageData: z.string().optional(),
          imageMime: z.string().max(64).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireAdminSession(ctx.req);
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
