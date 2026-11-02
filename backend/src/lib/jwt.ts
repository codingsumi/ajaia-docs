import { createHmac, timingSafeEqual } from "node:crypto";

type JwtPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64url");
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createToken(
  user: { id: string; email: string },
  expiresInSeconds = 60 * 60 * 24 * 7,
): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      iat: now,
      exp: now + expiresInSeconds,
    } satisfies JwtPayload),
  );
  const body = `${header}.${payload}`;
  const signature = sign(body, getSecret());
  return `${body}.${signature}`;
}

export function verifyToken(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token");
  }

  const [header, payload, signature] = parts;
  const body = `${header}.${payload}`;
  const expected = sign(body, getSecret());
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    throw new Error("Invalid token signature");
  }

  const parsed = JSON.parse(base64UrlDecode(payload).toString("utf8")) as JwtPayload;
  if (!parsed.sub || !parsed.email || !parsed.exp) {
    throw new Error("Invalid token payload");
  }
  if (parsed.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return parsed;
}
