import type { RainbowBand } from "@/lib/data/produce-catalog";

export type NutritionMeta = {
  nutrients: string[];
  plainBenefit: string;
  scienceNote: string;
};

export type ProduceMeta = {
  ukName?: string;
  aliases?: string[];
  nutrition?: NutritionMeta;
};

const BAND_NUTRITION: Record<RainbowBand, NutritionMeta> = {
  red: {
    nutrients: ["lycopene", "vitamin C", "polyphenols"],
    plainBenefit: "Red produce often supports heart health and recovery from daily oxidative stress.",
    scienceNote: "Compounds like lycopene and anthocyanin-type pigments are studied for cardiovascular support.",
  },
  orange: {
    nutrients: ["beta-carotene", "vitamin C", "potassium"],
    plainBenefit: "Orange produce is commonly linked to eye health, skin health, and immune support.",
    scienceNote: "Beta-carotene is converted into vitamin A, which contributes to normal vision and immunity.",
  },
  yellow: {
    nutrients: ["vitamin C", "folate", "flavonoids"],
    plainBenefit: "Yellow produce can help immune function and healthy energy metabolism.",
    scienceNote: "Vitamin C and citrus flavonoids are associated with immune and antioxidant pathways.",
  },
  green: {
    nutrients: ["folate", "vitamin K", "lutein", "fiber"],
    plainBenefit: "Green produce supports gut health, bone health, and overall micronutrient intake.",
    scienceNote: "Leafy greens provide folate and vitamin K, while fiber supports digestive regularity.",
  },
  blue: {
    nutrients: ["anthocyanins", "vitamin C", "manganese"],
    plainBenefit: "Blue foods are linked with healthy aging and immune support.",
    scienceNote: "Anthocyanins are flavonoid pigments with antioxidant and anti-inflammatory research interest.",
  },
  indigo: {
    nutrients: ["anthocyanins", "polyphenols", "fiber"],
    plainBenefit: "Indigo produce contributes antioxidant compounds and supports dietary variety.",
    scienceNote: "Dark blue-indigo pigments are rich in polyphenol families often studied in immune resilience.",
  },
  violet: {
    nutrients: ["anthocyanins", "polyphenols", "fiber"],
    plainBenefit: "Violet produce can support vascular health and a diverse antioxidant profile.",
    scienceNote: "Purple pigments often contain anthocyanins, linked in research to vascular function support.",
  },
};

const PRODUCE_OVERRIDES: Record<string, ProduceMeta> = {
  aubergine: {
    nutrition: {
      nutrients: ["nasunin", "fiber", "manganese"],
      plainBenefit: "Aubergine adds fiber and antioxidant compounds that support gut and cell health.",
      scienceNote: "Its purple skin contains nasunin, an anthocyanin researched for antioxidant activity.",
    },
  },
  "bell pepper (green)": {
    ukName: "Green pepper",
  },
  "bell pepper (red)": {
    ukName: "Red pepper",
  },
  "bell pepper (yellow)": {
    ukName: "Yellow pepper",
  },
  blueberry: {
    nutrition: {
      nutrients: ["anthocyanins", "vitamin C", "fiber"],
      plainBenefit: "Blueberries are rich in anthocyanins that can help support immune function.",
      scienceNote: "Anthocyanins are flavonoids linked in research to antioxidant and immune-support pathways.",
    },
  },
  carrot: {
    nutrition: {
      nutrients: ["beta-carotene", "fiber", "potassium"],
      plainBenefit: "Carrots are high in beta-carotene, which supports normal eye function.",
      scienceNote: "Beta-carotene is a provitamin A carotenoid important for vision and immune health.",
    },
  },
  courgette: {
    aliases: ["zucchini"],
  },
  "date": {
    aliases: ["dates"],
  },
  "fig": {
    aliases: ["fresh fig"],
  },
  "grape (green)": {
    ukName: "Green grapes",
  },
  "grape (red)": {
    ukName: "Red grapes",
  },
  "mushroom": {
    aliases: ["button mushroom", "chestnut mushroom"],
    nutrition: {
      nutrients: ["beta-glucans", "selenium", "B vitamins"],
      plainBenefit: "Mushrooms can support immune health and energy metabolism.",
      scienceNote: "They provide beta-glucan fibers and B vitamins involved in normal metabolic function.",
    },
  },
  "onion (red)": {
    ukName: "Red onion",
  },
  "onion (white)": {
    ukName: "White onion",
  },
  sweetcorn: {
    aliases: ["corn"],
  },
};

export function getProduceMeta(name: string, band: RainbowBand): ProduceMeta {
  const key = name.trim().toLowerCase();
  const override = PRODUCE_OVERRIDES[key] ?? {};
  return {
    ...override,
    nutrition: override.nutrition ?? BAND_NUTRITION[band],
  };
}
