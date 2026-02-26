import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HomeClient, { getBandProgress, hexToHue } from "@/components/home-client";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: jest.fn(),
  }),
}));

function mockJson(data: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: async () => data,
  });
}

describe("HomeClient", () => {
  beforeEach(() => {
    pushMock.mockReset();
    (global.fetch as any) = jest.fn();
  });

  it("covers color utility branches", () => {
    expect(hexToHue("invalid")).toBeNull();
    expect(hexToHue("#777777")).toBe(0);
    expect(hexToHue("#00ff00")).toBe(120);
    expect(hexToHue("#0000ff")).toBe(240);

    expect(getBandProgress("invalid", "green")).toBe(0.5);
    expect(getBandProgress("#ff0000", "red")).toBeGreaterThanOrEqual(0);
    expect(getBandProgress("#00ff00", "green")).toBeGreaterThanOrEqual(0);
  });

  it("renders logged-out state and navigation actions", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/auth/me") {
        return mockJson({ success: false }, true);
      }
      return mockJson({ success: false }, false, 500);
    });

    render(<HomeClient />);

    await waitFor(() => expect(screen.getByText("Create account")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Create account"));
    fireEvent.click(screen.getByText("Log in"));
    expect(pushMock).toHaveBeenCalledWith("/signup");
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("renders authenticated data, adds item, refreshes insights and logs out", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementation((url: string, options?: { method?: string; body?: string }) => {
      if (url === "/api/auth/me") {
        return mockJson({ success: true, user: { id: "u1", email: "a@b.com", username: "Ben" } });
      }
      if (url === "/api/catalog") {
        return mockJson({
          success: true,
          entries: [
            {
              id: "c1",
              name: "Carrot",
              ukName: "Carrot",
              normalizedAliases: [],
              colorName: "Carrot Orange",
              colorHex: "#F57C00",
              rainbowBand: "orange",
              type: "vegetable",
              nutrients: ["beta-carotene"],
              plainBenefit: "Supports eye health.",
              scienceNote: "science",
            },
          ],
        });
      }
      if (url === "/api/items" && (!options || options.method === undefined)) {
        return mockJson({
          success: true,
          items: [
            {
              id: "i1",
              name: "Carrot",
              colorName: "Carrot Orange",
              colorHex: "#F57C00",
              rainbowBand: "orange",
              createdAt: Date.now(),
            },
          ],
        });
      }
      if (url === "/api/insights?window=30d") {
        return mockJson({
          success: true,
          insights: {
            windowDays: 30,
            disclaimer: "Nutrition guidance is general information and not medical advice.",
            totals: { itemsInWindow: 1, colorDiversity: 1 },
            colorCoverage: {
              countsByBand: { red: 0, orange: 1, yellow: 0, green: 0, blue: 0, indigo: 0, violet: 0 },
              missingBands: ["red", "yellow"],
            },
            fruitVegBalance: { fruitCount: 0, vegetableCount: 1, dominant: "vegetable" },
            suggestions: [
              {
                kind: "missing_band",
                title: "Add more red foods",
                reason: "Missing red.",
                foods: [{ name: "Tomato", ukName: "Tomato", type: "fruit", rainbowBand: "red", colorHex: "#D32F2F", plainBenefit: "benefit" }],
              },
            ],
            itemAdvice: [
              {
                foodName: "Carrot",
                nutrientFocus: ["beta-carotene"],
                plainBenefit: "Supports eye health.",
                scienceNote: "science",
              },
            ],
          },
        });
      }
      if (url === "/api/items" && options?.method === "POST") {
        return mockJson({ success: true, item: { id: "i2" } }, true, 201);
      }
      if (url === "/api/auth/logout") {
        return mockJson({ success: true });
      }
      return mockJson({ success: false, message: "Unhandled" }, false, 500);
    });

    render(<HomeClient />);
    await waitFor(() => expect(screen.getByText("Welcome back, Ben")).toBeInTheDocument());
    expect(screen.getByText("30-day diet insights")).toBeInTheDocument();
    expect(screen.getByText("Carrot Orange (#F57C00)")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("e.g. Strawberry"), { target: { value: "Carrot" } });
    fireEvent.click(screen.getByText("Add item"));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/items",
        expect.objectContaining({ method: "POST" })
      )
    );

    fireEvent.click(screen.getByText("Refresh insights"));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/insights?window=30d", { cache: "no-store" })
    );

    fireEvent.click(screen.getByText("Log out"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" }));
  });

  it("shows fallback error when API call fails", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/auth/me") {
        return mockJson({ success: true, user: { id: "u1", email: "a@b.com", username: "Ben" } });
      }
      if (url === "/api/catalog") {
        return mockJson({ success: false, message: "Unable to load fruit and veg catalog." }, false, 500);
      }
      if (url === "/api/items") {
        return mockJson({ success: true, items: [] });
      }
      if (url === "/api/insights?window=30d") {
        return mockJson({ success: false, message: "Unable to load insights." }, false, 500);
      }
      return mockJson({ success: false }, false, 500);
    });

    render(<HomeClient />);
    await waitFor(() => expect(screen.getByText("Unable to load insights.")).toBeInTheDocument());
  });

  it("shows session load error when initialize throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));
    render(<HomeClient />);
    await waitFor(() => expect(screen.getByText("Unable to load session.")).toBeInTheDocument());
  });

  it("supports manual custom entry and shows add-item fallback error", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementation((url: string, options?: { method?: string; body?: string }) => {
      if (url === "/api/auth/me") {
        return mockJson({ success: true, user: { id: "u1", email: "a@b.com", username: "Ben" } });
      }
      if (url === "/api/catalog") {
        return mockJson({ success: true, entries: [] });
      }
      if (url === "/api/items" && (!options || options.method === undefined)) {
        return mockJson({
          success: true,
          items: [
            { id: "i1", name: "Mystery", colorName: "Mystery", colorHex: "badhex", rainbowBand: "red", createdAt: 1 },
            { id: "i2", name: "Tomato", colorName: "Tomato Red", colorHex: "#D32F2F", rainbowBand: "red", createdAt: 2 },
            { id: "i3", name: "Spinach", colorName: "Spinach Green", colorHex: "#2E7D32", rainbowBand: "green", createdAt: 3 },
          ],
        });
      }
      if (url === "/api/insights?window=30d") {
        return mockJson({
          success: true,
          insights: {
            windowDays: 30,
            disclaimer: "Nutrition guidance is general information and not medical advice.",
            totals: { itemsInWindow: 3, colorDiversity: 3 },
            colorCoverage: {
              countsByBand: { red: 2, orange: 0, yellow: 0, green: 1, blue: 0, indigo: 0, violet: 0 },
              missingBands: ["orange"],
            },
            fruitVegBalance: { fruitCount: 2, vegetableCount: 1, dominant: "fruit" },
            suggestions: [],
            itemAdvice: [],
          },
        });
      }
      if (url === "/api/items" && options?.method === "POST") {
        return mockJson({ success: false }, false, 500);
      }
      if (url === "/api/auth/logout") {
        return mockJson({ success: true });
      }
      return mockJson({ success: false }, false, 500);
    });

    render(<HomeClient />);
    await waitFor(() => expect(screen.getByText("Welcome back, Ben")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("e.g. Strawberry"), { target: { value: "Custom Mix" } });
    fireEvent.change(screen.getByPlaceholderText("Color name e.g. Kale Green"), { target: { value: "Custom Green" } });
    fireEvent.change(screen.getByLabelText("Choose RGB color"), { target: { value: "#4caf50" } });
    fireEvent.change(screen.getByLabelText("Choose rainbow band"), { target: { value: "green" } });
    fireEvent.click(screen.getByText("Add item"));

    await waitFor(() => expect(screen.getByText("Unable to add item.")).toBeInTheDocument());
  });

  it("falls back to item refresh error message", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementation((url: string, options?: { method?: string }) => {
      if (url === "/api/auth/me") {
        return mockJson({ success: true, user: { id: "u1", email: "a@b.com", username: "Ben" } });
      }
      if (url === "/api/catalog") {
        return mockJson({ success: true, entries: [] });
      }
      if (url === "/api/items" && (!options || options.method === undefined)) {
        return mockJson({ success: false }, false, 500);
      }
      if (url === "/api/insights?window=30d") {
        return mockJson({
          success: true,
          insights: {
            windowDays: 30,
            disclaimer: "d",
            totals: { itemsInWindow: 0, colorDiversity: 0 },
            colorCoverage: { countsByBand: { red: 0, orange: 0, yellow: 0, green: 0, blue: 0, indigo: 0, violet: 0 }, missingBands: [] },
            fruitVegBalance: { fruitCount: 0, vegetableCount: 0, dominant: "unknown" },
            suggestions: [],
            itemAdvice: [],
          },
        });
      }
      return mockJson({ success: true });
    });

    render(<HomeClient />);
    await waitFor(() => expect(screen.getByText("Unable to load items.")).toBeInTheDocument());
  });
});
