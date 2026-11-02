import "dotenv/config";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { after, before, describe, test } from "node:test";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { hashPassword } from "../lib/password.js";

process.env.JWT_SECRET ??= "test-jwt-secret-for-api";

const app = createApp();
let server: Server;
let baseUrl = "";

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body };
}

before(async () => {
  const password = await hashPassword("password123");

  await prisma.user.upsert({
    where: { email: "alice@example.com" },
    create: { name: "Alice Demo", email: "alice@example.com", password },
    update: { password },
  });
  await prisma.user.upsert({
    where: { email: "bob@example.com" },
    create: { name: "Bob Demo", email: "bob@example.com", password },
    update: { password },
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Failed to bind test server");
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await prisma.$disconnect();
});

describe("document permissions API", () => {
  test("VIEW share cannot edit; EDIT share and owner can", async () => {
    const aliceLogin = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "alice@example.com", password: "password123" }),
    });
    assert.equal(aliceLogin.status, 200);
    assert.ok(aliceLogin.body.token);
    assert.equal(aliceLogin.body.user.email, "alice@example.com");
    assert.equal(aliceLogin.body.user.password, undefined);

    const bobLogin = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "bob@example.com", password: "password123" }),
    });
    assert.equal(bobLogin.status, 200);

    const aliceToken = aliceLogin.body.token as string;
    const bobToken = bobLogin.body.token as string;

    const created = await request("/documents", {
      method: "POST",
      headers: { authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({
        title: "Shared notes",
        content: { type: "doc", content: [] },
      }),
    });
    assert.equal(created.status, 201);
    const documentId = created.body.document.id as string;

    const shared = await request(`/documents/${documentId}/shares`, {
      method: "POST",
      headers: { authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ email: "bob@example.com", permission: "VIEW" }),
    });
    assert.equal(shared.status, 201);
    assert.equal(shared.body.share.permission, "VIEW");

    const viewEditAttempt = await request(`/documents/${documentId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${bobToken}` },
      body: JSON.stringify({ title: "Hacked" }),
    });
    assert.equal(viewEditAttempt.status, 403);

    const upgrade = await request(`/documents/${documentId}/shares`, {
      method: "POST",
      headers: { authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ email: "bob@example.com", permission: "EDIT" }),
    });
    assert.equal(upgrade.status, 201);
    assert.equal(upgrade.body.share.permission, "EDIT");

    const editOk = await request(`/documents/${documentId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${bobToken}` },
      body: JSON.stringify({
        title: "Bob edited",
        content: { type: "doc", content: [{ type: "paragraph" }] },
      }),
    });
    assert.equal(editOk.status, 200);
    assert.equal(editOk.body.document.title, "Bob edited");

    const bobDelete = await request(`/documents/${documentId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${bobToken}` },
    });
    assert.equal(bobDelete.status, 403);

    const aliceDelete = await request(`/documents/${documentId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${aliceToken}` },
    });
    assert.equal(aliceDelete.status, 204);
  });
});
