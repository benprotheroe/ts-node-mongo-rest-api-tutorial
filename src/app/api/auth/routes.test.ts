/** @jest-environment node */

import { POST as registerPost } from "@/app/api/auth/register/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as meGet } from "@/app/api/auth/me/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
  verifyPassword,
  getAuthenticatedUser,
  clearSessionCookie,
} from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/repositories/users";

jest.mock("@/lib/repositories/users", () => ({
  createUser: jest.fn(),
  getUserByEmail: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  createSessionToken: jest.fn(),
  hashPassword: jest.fn(),
  setSessionCookie: jest.fn(),
  verifyPassword: jest.fn(),
  getAuthenticatedUser: jest.fn(),
  clearSessionCookie: jest.fn(),
}));

const createUserMock = createUser as jest.MockedFunction<typeof createUser>;
const getUserByEmailMock = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
const createSessionTokenMock = createSessionToken as jest.MockedFunction<typeof createSessionToken>;
const hashPasswordMock = hashPassword as jest.MockedFunction<typeof hashPassword>;
const setSessionCookieMock = setSessionCookie as jest.MockedFunction<typeof setSessionCookie>;
const verifyPasswordMock = verifyPassword as jest.MockedFunction<typeof verifyPassword>;
const getAuthenticatedUserMock = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
const clearSessionCookieMock = clearSessionCookie as jest.MockedFunction<typeof clearSessionCookie>;

function makeRequest(body: unknown) {
  return {
    json: async () => body,
  } as any;
}

describe("auth routes", () => {
  beforeEach(() => {
    createUserMock.mockReset();
    getUserByEmailMock.mockReset();
    createSessionTokenMock.mockReset();
    hashPasswordMock.mockReset();
    setSessionCookieMock.mockReset();
    verifyPasswordMock.mockReset();
    getAuthenticatedUserMock.mockReset();
    clearSessionCookieMock.mockReset();
  });

  it("register returns 400 for invalid body", async () => {
    const response = await registerPost(makeRequest({ email: "bad" }));
    expect(response.status).toBe(400);
  });

  it("register returns 409 when user exists", async () => {
    getUserByEmailMock.mockResolvedValue({
      id: "u",
      email: "a@b.com",
      username: "ben",
      passwordHash: "h",
      createdAt: 1,
      updatedAt: 1,
    });
    const response = await registerPost(
      makeRequest({ email: "a@b.com", username: "ben", password: "password123" })
    );
    expect(response.status).toBe(409);
  });

  it("register creates user and sets cookie", async () => {
    getUserByEmailMock.mockResolvedValue(null);
    hashPasswordMock.mockResolvedValue("hashed");
    createUserMock.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      username: "ben",
      passwordHash: "hashed",
      createdAt: 1,
      updatedAt: 1,
    });
    createSessionTokenMock.mockResolvedValue("token");

    const response = await registerPost(
      makeRequest({ email: "a@b.com", username: "ben", password: "password123" })
    );
    const json = await response.json();
    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(setSessionCookieMock).toHaveBeenCalledWith("token");
  });

  it("register handles thrown errors with 500", async () => {
    process.env.NODE_ENV = "production";
    getUserByEmailMock.mockRejectedValue(new Error("boom"));
    let response = await registerPost(
      makeRequest({ email: "a@b.com", username: "ben", password: "password123" })
    );
    expect(response.status).toBe(500);

    process.env.NODE_ENV = "development";
    getUserByEmailMock.mockRejectedValue(new Error("boom-dev"));
    response = await registerPost(makeRequest({ email: "a@b.com", username: "ben", password: "password123" }));
    const json = await response.json();
    expect(json.message).toContain("boom-dev");

    getUserByEmailMock.mockRejectedValue("not-an-error" as never);
    response = await registerPost(makeRequest({ email: "a@b.com", username: "ben", password: "password123" }));
    const jsonUnknown = await response.json();
    expect(jsonUnknown.message).toContain("Unknown error");
  });

  it("login returns 400 invalid payload", async () => {
    const response = await loginPost(makeRequest({ email: "bad" }));
    expect(response.status).toBe(400);
  });

  it("login rejects unknown user and bad password", async () => {
    getUserByEmailMock.mockResolvedValueOnce(null);
    let response = await loginPost(makeRequest({ email: "a@b.com", password: "password123" }));
    expect(response.status).toBe(401);

    getUserByEmailMock.mockResolvedValueOnce({
      id: "u1",
      email: "a@b.com",
      username: "ben",
      passwordHash: "hashed",
      createdAt: 1,
      updatedAt: 1,
    });
    verifyPasswordMock.mockResolvedValue(false);
    response = await loginPost(makeRequest({ email: "a@b.com", password: "password123" }));
    expect(response.status).toBe(401);
  });

  it("login succeeds and sets cookie", async () => {
    getUserByEmailMock.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      username: "ben",
      passwordHash: "hashed",
      createdAt: 1,
      updatedAt: 1,
    });
    verifyPasswordMock.mockResolvedValue(true);
    createSessionTokenMock.mockResolvedValue("token");
    const response = await loginPost(makeRequest({ email: "a@b.com", password: "password123" }));
    expect(response.status).toBe(200);
    expect(setSessionCookieMock).toHaveBeenCalledWith("token");
  });

  it("login handles thrown errors", async () => {
    getUserByEmailMock.mockRejectedValue(new Error("boom"));
    const response = await loginPost(makeRequest({ email: "a@b.com", password: "password123" }));
    expect(response.status).toBe(500);
  });

  it("me route returns auth state", async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce(null);
    let response = await meGet({} as any);
    expect(response.status).toBe(401);

    getAuthenticatedUserMock.mockResolvedValueOnce({ id: "u1", email: "a@b.com", username: "ben" });
    response = await meGet({} as any);
    expect(response.status).toBe(200);
  });

  it("logout clears cookie", async () => {
    const response = await logoutPost();
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(clearSessionCookieMock).toHaveBeenCalled();
  });
});
