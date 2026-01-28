import { z } from "zod";

import { roleEnum } from "@/db/schema/enums";
import { ZodUserId } from "@/db/types";

// ==================== USER FILTER SCHEMAS ====================

/**
 * Schema for filtering users in admin queries
 */
export const userFilterSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    internalRole: z.enum(roleEnum.enumValues),
    dueDate: z.date(),
    dateOperation: z.enum(["gt", "lt"]),
  })
  .partial();

// ==================== USER UPDATE SCHEMAS ====================

/**
 * Schema for updating a user
 */
export const updateUserSchema = z.object({
  id: ZodUserId,
  name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  internalRole: z.enum(roleEnum.enumValues),
  pricingId: z.cuid2().optional(),
  monthlyPayment: z.boolean().optional(),
  cancelationDate: z.date().optional(),
  profileImageUrl: z.string().optional(),
  // coach data
  longitude: z.number().optional(),
  latitude: z.number().optional(),
  searchAddress: z.string().optional(),
  range: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  publicName: z.string().optional(),
  aboutMe: z.string().optional(),
  coachingActivities: z.array(z.string()).optional(),
});

/**
 * Schema for user DB updates (DAL layer)
 */
export const updateUserDbSchema = z.object({
  id: ZodUserId,
  name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  internalRole: z.enum(roleEnum.enumValues).optional(),
  pricingId: z.string().optional(),
  monthlyPayment: z.boolean().optional(),
  cancelationDate: z.date().optional(),
  image: z.string().optional(),
});

// ==================== USER QUERY OPTIONS ====================

/**
 * Schema for getUserById options
 */
export const getUserByIdOptionsSchema = z
  .object({
    withImage: z.boolean().optional().default(true),
    withMemberData: z.boolean().optional().default(false),
    withFeatures: z.boolean().optional().default(false),
    withPricing: z.boolean().optional().default(false),
  })
  .optional();

// ==================== PAGINATION SCHEMAS ====================

/**
 * Schema for paginated user queries
 */
export const userPaginationSchema = z.object({
  filter: userFilterSchema,
  skip: z.number().default(0),
  take: z.number().min(1).max(100).default(50),
});

// ==================== INFERRED TYPES ====================

export type UserFilter = z.infer<typeof userFilterSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserDbInput = z.infer<typeof updateUserDbSchema>;
export type GetUserByIdOptions = z.infer<typeof getUserByIdOptionsSchema>;
export type UserPaginationInput = z.infer<typeof userPaginationSchema>;
