import { createUser, getUserByEmail, getUserById } from "@/lib/repositories/users";
import { getDb } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  getDb: jest.fn(),
}));

const getDbMock = getDb as jest.MockedFunction<typeof getDb>;

describe("users repository", () => {
  beforeEach(() => {
    getDbMock.mockReset();
  });

  it("getUserByEmail returns null when not found", async () => {
    const get = jest.fn().mockResolvedValue({ empty: true, docs: [] });
    const limit = jest.fn().mockReturnValue({ get });
    const where = jest.fn().mockReturnValue({ limit });
    const collection = jest.fn().mockReturnValue({ where });
    getDbMock.mockReturnValue({ collection } as any);

    const user = await getUserByEmail("A@B.COM");
    expect(user).toBeNull();
    expect(where).toHaveBeenCalledWith("email", "==", "a@b.com");
  });

  it("getUserByEmail returns mapped user", async () => {
    const get = jest.fn().mockResolvedValue({
      empty: false,
      docs: [{ id: "u1", data: () => ({ email: "a@b.com", username: "ben", passwordHash: "h", createdAt: 1, updatedAt: 1 }) }],
    });
    const limit = jest.fn().mockReturnValue({ get });
    const where = jest.fn().mockReturnValue({ limit });
    const collection = jest.fn().mockReturnValue({ where });
    getDbMock.mockReturnValue({ collection } as any);

    const user = await getUserByEmail("a@b.com");
    expect(user?.id).toBe("u1");
  });

  it("getUserById returns null or user", async () => {
    const docGet = jest.fn().mockResolvedValueOnce({ exists: false }).mockResolvedValueOnce({
      exists: true,
      id: "u1",
      data: () => ({ email: "a@b.com", username: "ben", passwordHash: "h", createdAt: 1, updatedAt: 1 }),
    });
    const doc = jest.fn().mockReturnValue({ get: docGet });
    const collection = jest.fn().mockReturnValue({ doc });
    getDbMock.mockReturnValue({ collection } as any);

    expect(await getUserById("x")).toBeNull();
    expect((await getUserById("u1"))?.email).toBe("a@b.com");
  });

  it("createUser lowercases email and persists data", async () => {
    const set = jest.fn().mockResolvedValue(undefined);
    const doc = jest.fn().mockReturnValue({ id: "u2", set });
    const collection = jest.fn().mockReturnValue({ doc });
    getDbMock.mockReturnValue({ collection } as any);

    const created = await createUser({ email: "A@B.COM", username: "Ben", passwordHash: "hash" });

    expect(created.email).toBe("a@b.com");
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "a@b.com",
        username: "Ben",
        passwordHash: "hash",
      })
    );
  });
});
