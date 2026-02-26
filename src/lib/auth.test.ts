/** @jest-environment node */

import {
  clearSessionCookie,
  createSessionToken,
  getAuthenticatedUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { getUserById } from "@/lib/repositories/users";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

jest.mock("@/lib/repositories/users", () => ({
  getUserById: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

const getUserByIdMock = getUserById as jest.MockedFunction<typeof getUserById>;
const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const compareMock = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const cookiesMock = cookies as jest.MockedFunction<typeof cookies>;

describe("auth helpers", () => {
  const oldSecret = process.env.SESSION_SECRET;
  const oldNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
    getUserByIdMock.mockReset();
    hashMock.mockReset();
    compareMock.mockReset();
    cookiesMock.mockReset();
  });

  afterAll(() => {
    process.env.SESSION_SECRET = oldSecret;
    process.env.NODE_ENV = oldNodeEnv;
  });

  it("hashes and verifies passwords through bcrypt", async () => {
    hashMock.mockResolvedValue("hashed" as never);
    compareMock.mockResolvedValue(true as never);
    await expect(hashPassword("pass")).resolves.toBe("hashed");
    await expect(verifyPassword("pass", "hashed")).resolves.toBe(true);
    expect(hashMock).toHaveBeenCalledWith("pass", 12);
    expect(compareMock).toHaveBeenCalledWith("pass", "hashed");
  });

  it("creates a session token and authenticates user", async () => {
    const token = await createSessionToken({ id: "u1", email: "a@b.com", username: "ben" });
    getUserByIdMock.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      username: "ben",
      passwordHash: "h",
      createdAt: 1,
      updatedAt: 1,
    });

    const request = {
      cookies: {
        get: () => ({ value: token }),
      },
    } as any;

    const user = await getAuthenticatedUser(request);
    expect(user?.id).toBe("u1");
  });

  it("returns null when token missing, invalid, or user missing", async () => {
    expect(await getAuthenticatedUser({ cookies: { get: () => undefined } } as any)).toBeNull();
    expect(await getAuthenticatedUser({ cookies: { get: () => ({ value: "bad-token" }) } } as any)).toBeNull();

    const token = await createSessionToken({ id: "u2", email: "x@y.com", username: "x" });
    getUserByIdMock.mockResolvedValue(null);
    expect(await getAuthenticatedUser({ cookies: { get: () => ({ value: token }) } } as any)).toBeNull();
  });

  it("returns null when token payload has no subject", async () => {
    const tokenWithoutSub = await new SignJWT({ email: "a@b.com", username: "ben" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("3600s")
      .sign(new TextEncoder().encode("test-secret"));

    const user = await getAuthenticatedUser({ cookies: { get: () => ({ value: tokenWithoutSub }) } } as any);
    expect(user).toBeNull();
  });

  it("throws without session secret", async () => {
    delete process.env.SESSION_SECRET;
    await expect(createSessionToken({ id: "u1", email: "a@b.com", username: "ben" })).rejects.toThrow(
      "Missing SESSION_SECRET environment variable"
    );
  });

  it("sets and clears cookies with expected options", async () => {
    const set = jest.fn();
    cookiesMock.mockReturnValue({ set } as any);

    await setSessionCookie("token");
    clearSessionCookie();

    expect(set).toHaveBeenNthCalledWith(
      1,
      "THIRTYDIFFERENT_SESSION",
      "token",
      expect.objectContaining({ httpOnly: true, maxAge: 604800, secure: false })
    );
    expect(set).toHaveBeenNthCalledWith(
      2,
      "THIRTYDIFFERENT_SESSION",
      "",
      expect.objectContaining({ maxAge: 0, secure: false })
    );
  });
});
