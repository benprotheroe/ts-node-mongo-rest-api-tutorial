import { z } from "zod";

const rainbowBandSchema = z.enum(["red", "orange", "yellow", "green", "blue", "indigo", "violet"]);

export const createItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  colorName: z.string().trim().min(1).max(60).optional(),
  colorHex: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{6})$/)
    .optional(),
  rainbowBand: rainbowBandSchema.optional(),
});
