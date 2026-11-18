import { z } from "zod";

export const allocationSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  brandId: z.string().min(1, "Please select a brand"),
  processId: z.string().min(1, "Please select a process"),
  isActive: z.boolean(),
});
