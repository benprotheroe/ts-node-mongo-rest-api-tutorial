import { createItemSchema } from "@/lib/validation/items";

describe("item validation", () => {
  it("accepts catalog-style payload with explicit color fields", () => {
    const parsed = createItemSchema.safeParse({
      name: "Carrot",
      colorName: "Carrot Orange",
      colorHex: "#F57C00",
      rainbowBand: "orange",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts minimal payload with only name", () => {
    const parsed = createItemSchema.safeParse({
      name: "Custom Produce",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid hex color values", () => {
    const parsed = createItemSchema.safeParse({
      name: "Custom Produce",
      colorName: "Bad color",
      colorHex: "orange",
      rainbowBand: "orange",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects unsupported rainbow bands", () => {
    const parsed = createItemSchema.safeParse({
      name: "Custom Produce",
      rainbowBand: "pink",
    });

    expect(parsed.success).toBe(false);
  });
});
