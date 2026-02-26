/** @jest-environment node */

import { GET, POST } from "@/app/api/items/route";
import { getAuthenticatedUser } from "@/lib/auth";
import { listItemsByUser, createItem } from "@/lib/repositories/items";
import { getCatalogEntryByName } from "@/lib/repositories/catalog";

jest.mock("@/lib/auth", () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock("@/lib/repositories/items", () => ({
  listItemsByUser: jest.fn(),
  createItem: jest.fn(),
}));

jest.mock("@/lib/repositories/catalog", () => ({
  getCatalogEntryByName: jest.fn(),
}));

const getAuthenticatedUserMock = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
const listItemsByUserMock = listItemsByUser as jest.MockedFunction<typeof listItemsByUser>;
const createItemMock = createItem as jest.MockedFunction<typeof createItem>;
const getCatalogEntryByNameMock = getCatalogEntryByName as jest.MockedFunction<typeof getCatalogEntryByName>;

function makeRequest(body?: unknown) {
  return {
    json: async () => body,
  } as any;
}

describe("items route", () => {
  beforeEach(() => {
    getAuthenticatedUserMock.mockReset();
    listItemsByUserMock.mockReset();
    createItemMock.mockReset();
    getCatalogEntryByNameMock.mockReset();
  });

  it("GET returns 401 for unauthenticated user", async () => {
    getAuthenticatedUserMock.mockResolvedValue(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("GET returns mapped items", async () => {
    getAuthenticatedUserMock.mockResolvedValue({ id: "u1", email: "e", username: "u" });
    listItemsByUserMock.mockResolvedValue([
      {
        id: "i1",
        name: "Carrot",
        colorName: "Carrot Orange",
        colorHex: "#F57C00",
        rainbowBand: "orange",
        userId: "u1",
        createdAt: 1,
        updatedAt: 1,
      },
    ]);

    const response = await GET(makeRequest());
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(1);
  });

  it("POST validates payload and requires colors for unknown items", async () => {
    getAuthenticatedUserMock.mockResolvedValue({ id: "u1", email: "e", username: "u" });
    getCatalogEntryByNameMock.mockResolvedValue(null);

    const response = await POST(makeRequest({ name: "Custom item" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("POST returns 401 for unauthenticated user", async () => {
    getAuthenticatedUserMock.mockResolvedValue(null);
    const response = await POST(makeRequest({ name: "Carrot" }));
    expect(response.status).toBe(401);
  });

  it("POST returns 400 for invalid payload", async () => {
    getAuthenticatedUserMock.mockResolvedValue({ id: "u1", email: "e", username: "u" });
    const response = await POST(makeRequest({ name: "" }));
    expect(response.status).toBe(400);
  });

  it("POST uses catalog values when matched", async () => {
    getAuthenticatedUserMock.mockResolvedValue({ id: "u1", email: "e", username: "u" });
    getCatalogEntryByNameMock.mockResolvedValue({
      id: "c1",
      name: "Carrot",
      normalizedName: "carrot",
      ukName: "Carrot",
      normalizedAliases: [],
      colorName: "Carrot Orange",
      colorHex: "#F57C00",
      rainbowBand: "orange",
      type: "vegetable",
      nutrients: [],
      plainBenefit: "",
      scienceNote: "",
    });
    createItemMock.mockResolvedValue({
      id: "i1",
      name: "Carrot",
      colorName: "Carrot Orange",
      colorHex: "#F57C00",
      rainbowBand: "orange",
      userId: "u1",
      createdAt: 1,
      updatedAt: 1,
    });

    const response = await POST(makeRequest({ name: "Carrot" }));
    expect(response.status).toBe(201);
    expect(createItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ colorName: "Carrot Orange", colorHex: "#F57C00", rainbowBand: "orange" })
    );
  });
});
