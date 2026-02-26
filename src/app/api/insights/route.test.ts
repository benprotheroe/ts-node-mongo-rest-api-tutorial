/** @jest-environment node */

import { GET } from "@/app/api/insights/route";
import { getAuthenticatedUser } from "@/lib/auth";
import { listItemsByUser } from "@/lib/repositories/items";
import { listCatalogEntries } from "@/lib/repositories/catalog";
import { buildInsights } from "@/lib/services/insights";

jest.mock("@/lib/auth", () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock("@/lib/repositories/items", () => ({
  listItemsByUser: jest.fn(),
}));

jest.mock("@/lib/repositories/catalog", () => ({
  listCatalogEntries: jest.fn(),
}));

jest.mock("@/lib/services/insights", () => ({
  buildInsights: jest.fn(),
}));

const getAuthenticatedUserMock = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
const listItemsByUserMock = listItemsByUser as jest.MockedFunction<typeof listItemsByUser>;
const listCatalogEntriesMock = listCatalogEntries as jest.MockedFunction<typeof listCatalogEntries>;
const buildInsightsMock = buildInsights as jest.MockedFunction<typeof buildInsights>;

function makeRequest(query = "") {
  return {
    nextUrl: new URL(`http://localhost/api/insights${query}`),
  } as any;
}

describe("insights route", () => {
  beforeEach(() => {
    getAuthenticatedUserMock.mockReset();
    listItemsByUserMock.mockReset();
    listCatalogEntriesMock.mockReset();
    buildInsightsMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthenticatedUserMock.mockResolvedValue(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("builds insights using 7d window", async () => {
    getAuthenticatedUserMock.mockResolvedValue({ id: "u1", email: "a@b.com", username: "ben" });
    listItemsByUserMock.mockResolvedValue([]);
    listCatalogEntriesMock.mockResolvedValue([]);
    buildInsightsMock.mockReturnValue({
      windowDays: 7,
      generatedAt: Date.now(),
      disclaimer: "d",
      totals: { itemsInWindow: 0, colorDiversity: 0 },
      colorCoverage: { countsByBand: { red: 0, orange: 0, yellow: 0, green: 0, blue: 0, indigo: 0, violet: 0 }, missingBands: [] },
      fruitVegBalance: { fruitCount: 0, vegetableCount: 0, dominant: "unknown" },
      suggestions: [],
      itemAdvice: [],
    });

    const response = await GET(makeRequest("?window=7d"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(buildInsightsMock).toHaveBeenCalledWith(expect.objectContaining({ windowDays: 7 }));
  });

  it("defaults to 30d window and handles failures", async () => {
    getAuthenticatedUserMock.mockResolvedValue({ id: "u1", email: "a@b.com", username: "ben" });
    listItemsByUserMock.mockRejectedValue(new Error("fail"));

    const response = await GET(makeRequest("?window=weird"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });

  it("defaults to 30d when window query is missing", async () => {
    getAuthenticatedUserMock.mockResolvedValue({ id: "u1", email: "a@b.com", username: "ben" });
    listItemsByUserMock.mockResolvedValue([]);
    listCatalogEntriesMock.mockResolvedValue([]);
    buildInsightsMock.mockReturnValue({
      windowDays: 30,
      generatedAt: Date.now(),
      disclaimer: "d",
      totals: { itemsInWindow: 0, colorDiversity: 0 },
      colorCoverage: { countsByBand: { red: 0, orange: 0, yellow: 0, green: 0, blue: 0, indigo: 0, violet: 0 }, missingBands: [] },
      fruitVegBalance: { fruitCount: 0, vegetableCount: 0, dominant: "unknown" },
      suggestions: [],
      itemAdvice: [],
    });

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    expect(buildInsightsMock).toHaveBeenCalledWith(expect.objectContaining({ windowDays: 30 }));
  });

  it("uses 30d fallback for unsupported window value", async () => {
    getAuthenticatedUserMock.mockResolvedValue({ id: "u1", email: "a@b.com", username: "ben" });
    listItemsByUserMock.mockResolvedValue([]);
    listCatalogEntriesMock.mockResolvedValue([]);
    buildInsightsMock.mockReturnValue({
      windowDays: 30,
      generatedAt: Date.now(),
      disclaimer: "d",
      totals: { itemsInWindow: 0, colorDiversity: 0 },
      colorCoverage: { countsByBand: { red: 0, orange: 0, yellow: 0, green: 0, blue: 0, indigo: 0, violet: 0 }, missingBands: [] },
      fruitVegBalance: { fruitCount: 0, vegetableCount: 0, dominant: "unknown" },
      suggestions: [],
      itemAdvice: [],
    });

    const response = await GET(makeRequest("?window=unexpected"));
    expect(response.status).toBe(200);
    expect(buildInsightsMock).toHaveBeenCalledWith(expect.objectContaining({ windowDays: 30 }));
  });
});
