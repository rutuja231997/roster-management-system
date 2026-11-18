import { z } from "zod";

export const employeeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name cannot exceed 50 characters"),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),

  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),

  employeeCode: z
    .string()
    .trim()
    .min(1, "Employee code is required")
    .max(20, "Employee code cannot exceed 20 characters"),

  status: z.enum(["ACTIVE", "INACTIVE"], {
    message: "Please select a valid status",
  }),

  podId: z.string().nullable(),
});
