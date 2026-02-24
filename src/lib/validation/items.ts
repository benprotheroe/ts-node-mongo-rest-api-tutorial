import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.string().trim().min(1).max(40).optional(),
});
