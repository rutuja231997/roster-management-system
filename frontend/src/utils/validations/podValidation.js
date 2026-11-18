import { z } from "zod";

export const podSchema = z.object({
  name: z.string().trim().min(1, "Pod name is required"),

  description: z.string().trim().optional().or(z.literal("")),
});
