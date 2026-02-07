import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const GITHUB_TOKEN_COOKIE_NAME = "gh_provider_token";
// Demo UX: reduce forced re-auth during rehearsal/recording sessions.
const TOKEN_TTL_SECONDS = 8 * 60 * 60;

interface TokenEnvelope {
  token: string;
  exp: number;
}

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function encryptGitHubToken(token: string, secret: string): string {
  const iv = randomBytes(12);
  const key = deriveKey(secret);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const envelope: TokenEnvelope = {
    token,
    exp: Date.now() + TOKEN_TTL_SECONDS * 1_000
  };
  const plaintext = Buffer.from(JSON.stringify(envelope), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptGitHubToken(sealedToken: string, secret: string): string | null {
  const [ivPart, tagPart, dataPart] = sealedToken.split(".");
  if (!ivPart || !tagPart || !dataPart) {
    return null;
  }

  try {
    const iv = Buffer.from(ivPart, "base64url");
    const tag = Buffer.from(tagPart, "base64url");
    const ciphertext = Buffer.from(dataPart, "base64url");
    const key = deriveKey(secret);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const parsed = JSON.parse(plaintext.toString("utf8")) as TokenEnvelope;

    if (!parsed.token || typeof parsed.token !== "string") {
      return null;
    }

    if (!parsed.exp || typeof parsed.exp !== "number" || parsed.exp <= Date.now()) {
      return null;
    }

    return parsed.token;
  } catch {
    return null;
  }
}

export function getGitHubTokenCookieMaxAge(): number {
  return TOKEN_TTL_SECONDS;
}
