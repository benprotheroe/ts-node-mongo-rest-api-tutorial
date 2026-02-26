/** @jest-environment node */

import { GET } from "@/app/api/catalog/route";
import { listCatalogEntries } from "@/lib/repositories/catalog";

jest.mock("@/lib/repositories/catalog", () => ({
  listCatalogEntries: jest.fn(),
}));

const listCatalogEntriesMock = listCatalogEntries as jest.MockedFunction<typeof listCatalogEntries>;

describe("catalog route", () => {
  beforeEach(() => {
    listCatalogEntriesMock.mockReset();
  });

  it("returns mapped catalog entries", async () => {
    listCatalogEntriesMock.mockResolvedValue([
      {
        id: "1",
        name: "Carrot",
        normalizedName: "carrot",
        ukName: "Carrot",
        normalizedAliases: [],
        colorName: "Carrot Orange",
        colorHex: "#F57C00",
        rainbowBand: "orange",
        type: "vegetable",
        nutrients: ["beta-carotene"],
        plainBenefit: "Supports eye health.",
        scienceNote: "Contains provitamin A carotenoids.",
      },
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.entries[0]).toMatchObject({
      id: "1",
      name: "Carrot",
      ukName: "Carrot",
      nutrients: ["beta-carotene"],
    });
  });

  it("returns 500 when repository fails", async () => {
    listCatalogEntriesMock.mockRejectedValue(new Error("boom"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
