import { z } from "zod";

import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE, SIZE_IDS } from "@/constants/catalog";
import { normalizePhone } from "@/utils/text";

/** Pakistani mobile numbers: 03XXXXXXXXX, +923XXXXXXXXX or 00923XXXXXXXXX. */
export const PK_MOBILE_PATTERN = /^(?:\+92|0092|0)3\d{9}$/;

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80, "Please keep your name under 80 characters."),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => PK_MOBILE_PATTERN.test(normalizePhone(value)),
      "Please enter a valid mobile number, e.g. 0300 1234567.",
    ),
  email: z.union([z.literal(""), z.email("Please enter a valid email address.").max(120)]).optional(),
  city: z.string().trim().min(2, "Please enter your city.").max(60, "Please keep the city under 60 characters."),
  address: z
    .string()
    .trim()
    .min(8, "Please enter your full delivery address.")
    .max(300, "Please keep the address under 300 characters."),
  notes: z.string().trim().max(500, "Please keep notes under 500 characters.").optional(),
});

export const inquiryItemSchema = z.object({
  varietySlug: z.string().trim().min(1).max(60),
  sizeId: z.enum(SIZE_IDS),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});

export const inquirySchema = customerSchema.extend({
  items: z
    .array(inquiryItemSchema)
    .min(1, "Your hive is empty — add at least one jar.")
    .max(MAX_CART_LINES, `Please order at most ${MAX_CART_LINES} different jars at once.`),
  idempotencyKey: z.uuid(),
  /** Honeypot: real visitors never see or fill this field. */
  website: z.string().max(200).optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type InquiryItemInput = z.infer<typeof inquiryItemSchema>;
export type InquiryInput = z.infer<typeof inquirySchema>;
