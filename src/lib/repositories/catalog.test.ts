import { getCatalogEntryByName, listCatalogEntries } from "@/lib/repositories/catalog";
import { getDb } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  getDb: jest.fn(),
}));

const getDbMock = getDb as jest.MockedFunction<typeof getDb>;

describe("catalog repository", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("lists entries and normalizes legacy records", async () => {
    const batchSet = jest.fn();
    const commit = jest.fn().mockResolvedValue(undefined);
    const batch = jest.fn().mockReturnValue({ set: batchSet, commit });

    const get = jest.fn().mockResolvedValue({
      docs: [
        {
          id: "carrot",
          data: () => ({
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
            scienceNote: "science",
          }),
        },
        {
          id: "legacy",
          data: () => ({ name: "Legacy Food", color: "pink", type: "fruit" }),
        },
      ],
    });

    const collection = jest.fn().mockImplementation(() => ({
      doc: jest.fn().mockImplementation((id?: string) => ({ id: id ?? "new-id" })),
      get,
      where: jest.fn(),
    }));

    getDbMock.mockReturnValue({ batch, collection } as any);

    const entries = await listCatalogEntries();
    expect(entries[0].name).toBe("Carrot");
    expect(entries.some((entry) => entry.rainbowBand === "red")).toBe(true);
    expect(commit).toHaveBeenCalled();
  });

  it("gets catalog entry by canonical name, alias, or null", async () => {
    const batch = jest.fn().mockReturnValue({ set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) });
    const byNameGet = jest
      .fn()
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "carrot",
            data: () => ({
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
            }),
          },
        ],
      })
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    const aliasGet = jest
      .fn()
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "courgette",
            data: () => ({
              name: "Courgette",
              normalizedName: "courgette",
              ukName: "Courgette",
              normalizedAliases: ["zucchini"],
              colorName: "Courgette Green",
              colorHex: "#4C8B43",
              rainbowBand: "green",
              type: "vegetable",
              nutrients: [],
              plainBenefit: "",
              scienceNote: "",
            }),
          },
        ],
      })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    const where = jest
      .fn()
      .mockImplementation((field: string) => {
        if (field === "normalizedName") {
          return { limit: () => ({ get: byNameGet }) };
        }
        return { limit: () => ({ get: aliasGet }) };
      });

    const collection = jest.fn().mockImplementation(() => ({
      doc: jest.fn().mockImplementation((id?: string) => ({ id: id ?? "new-id" })),
      get: jest.fn().mockResolvedValue({ docs: [] }),
      where,
    }));

    getDbMock.mockReturnValue({ batch, collection } as any);

    const byName = await getCatalogEntryByName("Carrot");
    const byAlias = await getCatalogEntryByName("zucchini");
    const none = await getCatalogEntryByName("not-real");

    expect(byName?.name).toBe("Carrot");
    expect(byAlias?.name).toBe("Courgette");
    expect(none).toBeNull();
  });
});
