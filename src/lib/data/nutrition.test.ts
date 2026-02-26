import { getProduceMeta } from "@/lib/data/nutrition";

describe("getProduceMeta", () => {
  it("returns produce-specific override metadata", () => {
    const meta = getProduceMeta("Carrot", "orange");
    expect(meta.nutrition?.nutrients).toContain("beta-carotene");
    expect(meta.nutrition?.plainBenefit.toLowerCase()).toContain("eye");
  });

  it("returns UK aliases where provided", () => {
    const meta = getProduceMeta("Courgette", "green");
    expect(meta.aliases).toContain("zucchini");
  });

  it("falls back to rainbow band nutrition defaults", () => {
    const meta = getProduceMeta("Unknown Produce", "green");
    expect(meta.nutrition?.nutrients).toEqual(
      expect.arrayContaining(["folate", "vitamin K", "fiber"])
    );
  });
});
