import { createItem, listItemsByUser } from "@/lib/repositories/items";
import { getDb } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  getDb: jest.fn(),
}));

const getDbMock = getDb as jest.MockedFunction<typeof getDb>;

describe("items repository", () => {
  beforeEach(() => {
    getDbMock.mockReset();
  });

  it("listItemsByUser maps and sorts modern items", async () => {
    const get = jest.fn().mockResolvedValue({
      docs: [
        {
          id: "a",
          data: () => ({
            name: "Apple",
            colorName: "Apple Red",
            colorHex: "#C62828",
            rainbowBand: "red",
            userId: "u1",
            createdAt: 1,
            updatedAt: 1,
          }),
        },
        {
          id: "b",
          data: () => ({
            name: "Carrot",
            colorName: "Carrot Orange",
            colorHex: "#F57C00",
            rainbowBand: "orange",
            userId: "u1",
            createdAt: 2,
            updatedAt: 2,
          }),
        },
      ],
    });
    const where = jest.fn().mockReturnValue({ get });
    const collection = jest.fn().mockReturnValue({ where });
    getDbMock.mockReturnValue({ collection } as any);

    const items = await listItemsByUser("u1");
    expect(items[0].id).toBe("b");
    expect(where).toHaveBeenCalledWith("userId", "==", "u1");
  });

  it("listItemsByUser normalizes legacy items", async () => {
    const get = jest.fn().mockResolvedValue({
      docs: [{ id: "x", data: () => ({ name: "Legacy", color: "purple", userId: "u1" }) }],
    });
    const where = jest.fn().mockReturnValue({ get });
    const collection = jest.fn().mockReturnValue({ where });
    getDbMock.mockReturnValue({ collection } as any);

    const items = await listItemsByUser("u1");
    expect(items[0].rainbowBand).toBe("violet");
    expect(items[0].colorHex).toBe("#8e24aa");
  });

  it("createItem persists payload", async () => {
    const set = jest.fn().mockResolvedValue(undefined);
    const doc = jest.fn().mockReturnValue({ id: "i1", set });
    const collection = jest.fn().mockReturnValue({ doc });
    getDbMock.mockReturnValue({ collection } as any);

    const created = await createItem({
      name: "Carrot",
      colorName: "Carrot Orange",
      colorHex: "#F57C00",
      rainbowBand: "orange",
      userId: "u1",
    });

    expect(created.id).toBe("i1");
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Carrot",
        userId: "u1",
      })
    );
  });
});
