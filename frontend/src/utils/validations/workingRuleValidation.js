import { z } from "zod";

const validDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const workingRuleSchema = z
  .object({
    brandId: z.string().min(1, "Please select a brand"),

    processId: z.string().min(1, "Please select a process"),

    operatingDays: z
      .array(z.enum(validDays))
      .min(1, "Select at least one operating day"),

    operatesOnPublicHolidays: z.boolean(),

    minimumStaffing: z.array(
      z.object({
        day: z.enum(validDays),
        requiredEmployees: z
          .number()
          .int("Employee count must be a whole number")
          .min(0, "Employee count cannot be negative"),
      }),
    ),

    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .superRefine((data, ctx) => {
    const staffingDays = data.minimumStaffing.map((item) => item.day);

    if (new Set(staffingDays).size !== staffingDays.length) {
      ctx.addIssue({
        code: "custom",
        path: ["minimumStaffing"],
        message: "Duplicate staffing days are not allowed",
      });
    }

    data.minimumStaffing.forEach((item, index) => {
      if (!data.operatingDays.includes(item.day)) {
        ctx.addIssue({
          code: "custom",
          path: ["minimumStaffing", index, "day"],
          message: "Staffing day must be an operating day",
        });
      }
    });
  });
