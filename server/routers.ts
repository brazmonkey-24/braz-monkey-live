import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { insertBlackbookEntry, getBlackbookEntries, insertCmsContent, getLatestCmsContent, listCmsContent, updateCmsContent, deleteCmsContent, listCmsNavigation, insertCmsNavigation, updateCmsNavigation, deleteCmsNavigation, listCmsTransmissionMedia, insertCmsTransmissionMedia, deleteCmsTransmissionMedia, getCmsAdminCredential, upsertCmsAdminCredential } from "./db";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_MS,
  createAdminSessionToken,
  hasValidAdminSession,
} from "./adminSession";

const ADMIN_PASSWORD_SALT = "9f82df8585520f28b675c58b954655de";

function isAdminPassword(value: string) {
  if (!ENV.adminPassword) return false;
  const candidate = scryptSync(value, ADMIN_PASSWORD_SALT, 64);
  const expected = scryptSync(ENV.adminPassword, ADMIN_PASSWORD_SALT, 64);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function isHashMatch(value: string, hash: string, salt: string) {
  const candidate = scryptSync(value, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function isAdminRecoveryToken(value: string) {
  if (!ENV.adminRecoveryToken || !value) return false;
  const candidate = Buffer.from(value);
  const expected = Buffer.from(ENV.adminRecoveryToken);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function createCmsPasswordHash(password: string, passwordSalt = randomBytes(24).toString("hex")) {
  return { passwordHash: scryptSync(password, passwordSalt, 64).toString("hex"), passwordSalt };
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
      .input(z.object({ username: z.string().min(1).max(128), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const validUsername = Boolean(ENV.adminUsername) && input.username === ENV.adminUsername;
        if (!validUsername) return { ok: false };
        const stored = await getCmsAdminCredential(input.username);
        const validPassword = stored ? isHashMatch(input.password, stored.passwordHash, stored.passwordSalt) : isAdminPassword(input.password);
        if (!validPassword) return { ok: false };

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
    changePassword: publicProcedure
      .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(256) }))
      .mutation(async ({ input, ctx }) => {
        await requireAdminSession(ctx.req);
        if (!ENV.adminUsername) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Admin username is not configured" });
        const stored = await getCmsAdminCredential(ENV.adminUsername);
        const validCurrent = stored ? isHashMatch(input.currentPassword, stored.passwordHash, stored.passwordSalt) : isAdminPassword(input.currentPassword);
        if (!validCurrent) throw new TRPCError({ code: "BAD_REQUEST", message: "Current password is incorrect" });
        const { passwordHash, passwordSalt } = createCmsPasswordHash(input.newPassword);
        await upsertCmsAdminCredential({ username: ENV.adminUsername, passwordHash, passwordSalt });
        return { ok: true };
      }),
    recoverPassword: publicProcedure
      .input(z.object({ username: z.string().min(1).max(320), recoveryToken: z.string().min(1).max(512), newPassword: z.string().min(12).max(256) }))
      .mutation(async ({ input }) => {
        const validRequest = Boolean(ENV.adminUsername) && input.username === ENV.adminUsername && isAdminRecoveryToken(input.recoveryToken);
        if (!validRequest) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Recovery details are invalid." });
        }
        const { passwordHash, passwordSalt } = createCmsPasswordHash(input.newPassword);
        await upsertCmsAdminCredential({ username: ENV.adminUsername, passwordHash, passwordSalt });
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

  navigation: router({
    list: publicProcedure.query(async () => listCmsNavigation()),
    save: publicProcedure.input(z.object({
      section: z.string().min(1).max(64),
      label: z.string().min(1).max(128),
      path: z.string().min(1).max(256),
      sortOrder: z.number().int().min(0).max(999),
    })).mutation(async ({ input, ctx }) => {
      await requireAdminSession(ctx.req);
      await insertCmsNavigation(input);
      return { success: true };
    }),
    update: publicProcedure.input(z.object({
      id: z.number(),
      section: z.string().min(1).max(64),
      label: z.string().min(1).max(128),
      path: z.string().min(1).max(256),
      sortOrder: z.number().int().min(0).max(999),
    })).mutation(async ({ input, ctx }) => {
      await requireAdminSession(ctx.req);
      await updateCmsNavigation(input.id, input);
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await requireAdminSession(ctx.req);
      await deleteCmsNavigation(input.id);
      return { success: true };
    }),
  }),

  transmissionMedia: router({
    list: publicProcedure.query(async () => listCmsTransmissionMedia()),
    save: publicProcedure.input(z.object({
      slot: z.enum(["monday", "wednesday", "friday"]),
      mediaType: z.enum(["image", "video"]),
      title: z.string().max(256).optional(),
      caption: z.string().max(2000).optional(),
      fileName: z.string().min(1).max(256),
      fileData: z.string().min(1),
      mimeType: z.string().min(1).max(128),
    })).mutation(async ({ input, ctx }) => {
      await requireAdminSession(ctx.req);
      const buffer = Buffer.from(input.fileData, "base64");
      const relKey = `transmissions/${input.slot}/${Date.now()}-${input.fileName}`;
      const stored = await storagePut(relKey, buffer, input.mimeType);
      await insertCmsTransmissionMedia({
        slot: input.slot,
        mediaType: input.mediaType,
        title: input.title,
        caption: input.caption,
        fileUrl: stored.url,
        fileKey: stored.key,
        fileName: input.fileName,
        mimeType: input.mimeType,
      });
      return { success: true, url: stored.url };
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await requireAdminSession(ctx.req);
      await deleteCmsTransmissionMedia(input.id);
      return { success: true };
    }),
  }),

  ai: router({
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().min(1).max(500),
        })).min(1).max(20),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are Braz Monkey's visitor agent for braz-monkey.com. Speak in concise, dry, curious Signal Zine voice. Explain that Braz Monkey is an alien weekly transmission: Monday quotes and alien jokes, Wednesday bets and lotto predictions presented as entertainment only, Friday vinyl and old-school stories, plus the Blackbook graffiti sketchbook and archive. Help visitors navigate the site. Never claim to know private analytics, guarantee gambling outcomes, or provide professional advice. If asked something unrelated, answer briefly and steer back to the site. Use plain text or light markdown. Keep replies under 90 words.",
            },
            ...input.messages,
          ],
          max_tokens: 220,
        });
        const raw = response.choices[0]?.message?.content;
        const content = Array.isArray(raw)
          ? raw.filter((part): part is { type: "text"; text: string } => part.type === "text").map((part) => part.text).join("\n")
          : raw;
        return { content: content || "The signal arrived empty. Try again." };
      }),
  }),
});

export type AppRouter = typeof appRouter;
