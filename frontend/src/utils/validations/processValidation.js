import { z } from "zod";

export const processSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Process name is required")
    .max(50, "Process name cannot exceed 50 characters"),

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
