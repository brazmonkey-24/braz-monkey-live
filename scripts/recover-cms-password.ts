import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ENV } from "../server/_core/env";
import { upsertCmsAdminCredential } from "../server/db";

function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!input.isTTY || typeof input.setRawMode !== "function") {
      reject(new Error("Password recovery requires an interactive terminal"));
      return;
    }

    output.write(prompt);
    let value = "";
    const onData = (chunk: Buffer) => {
      const key = chunk.toString("utf8");
      if (key === "\u0003") {
        input.setRawMode?.(false);
        input.off("data", onData);
        output.write("\n");
        reject(new Error("Cancelled"));
        return;
      }
      if (key === "\r" || key === "\n") {
        input.setRawMode?.(false);
        input.off("data", onData);
        output.write("\n");
        resolve(value);
        return;
      }
      if (key === "\u007f") {
        value = value.slice(0, -1);
        return;
      }
      if (key.length === 1) value += key;
    };

    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

async function main() {
  const rl = createInterface({ input, output });
  try {
    const username = (await rl.question(`CMS username [${ENV.adminUsername || "admin"}]: `)).trim() || ENV.adminUsername || "admin";
    const password = await readHidden("New CMS password: ");
    const confirmation = await readHidden("Confirm new CMS password: ");

    if (!password || password.length < 12) {
      throw new Error("Password must be at least 12 characters long");
    }
    if (password !== confirmation) {
      throw new Error("Passwords do not match");
    }

    const passwordSalt = randomBytes(24).toString("hex");
    const passwordHash = scryptSync(password, passwordSalt, 64).toString("hex");

    await upsertCmsAdminCredential({ username, passwordHash, passwordSalt });
    console.log(`CMS password reset successfully for username: ${username}`);
    console.log("The password was not written to logs or source files.");
  } finally {
    rl.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Password recovery failed";
  console.error(`CMS password recovery failed: ${message}`);
  process.exitCode = 1;
});
