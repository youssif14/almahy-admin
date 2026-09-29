// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { signSession, verifySessionToken } from "@/lib/auth/jwt";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-that-is-definitely-longer-than-32-chars";
});

describe("session tokens", () => {
  const user = { id: "usr-1", name: "Test", email: "t@almahy.demo", role: "lawyer" as const };

  it("round-trips a signed session", async () => {
    expect(await verifySessionToken(await signSession(user))).toEqual(user);
  });

  it("rejects a tampered token", async () => {
    const token = await signSession(user);
    const [h, , s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "usr-1", role: "admin", name: "x", email: "x" })).toString("base64url");
    expect(await verifySessionToken(`${h}.${forged}.${s}`)).toBeNull();
  });

  it("returns null for missing or garbage tokens", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });
});
