import { z } from "zod";

export const brandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Brand name is required")
    .max(50, "Brand name cannot exceed 50 characters"),

  description: z
    .string()
    .trim()
    .max(250, "Description cannot exceed 250 characters")
    .optional()
    .or(z.literal("")),

  status: z.enum(["ACTIVE", "INACTIVE"], {
    message: "Please select a valid status",
  }),
});
