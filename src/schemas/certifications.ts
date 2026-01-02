import { z } from "zod";

// ==================== CERTIFICATION SCHEMAS ====================

/**
 * Base certification schema
 */
export const certificationSchema = z.object({
  id: z.cuid2(),
  name: z.string(),
  obtainedIn: z.date(),
  documentUrl: z.string().optional(),
  userId: z.string(),
  modules: z.array(z.cuid2()),
  activityGroups: z.array(z.cuid2()),
});

/**
 * Schema for creating a certification
 */
export const createCertificationSchema = certificationSchema.omit({ id: true });

/**
 * Schema for updating a certification
 */
export const updateCertificationSchema = certificationSchema.partial();

/**
 * Schema for certification data stored in DB (DAL layer)
 */
export const certificationDbSchema = z.object({
  id: z.cuid2(),
  name: z.string(),
  obtainedIn: z.date(),
  coachId: z.string(),
  documentUrl: z.string().optional(),
});

export const createCertificationDbSchema = certificationDbSchema.omit({
  id: true,
});

export const updateCertificationDbSchema = certificationDbSchema.partial();

// ==================== ORGANISM SCHEMAS ====================

/**
 * Schema for certification organism
 */
export const organismSchema = z.object({
  id: z.cuid2(),
  name: z.string(),
});

export const createOrganismSchema = z.object({
  name: z.string(),
  modules: z.array(
    z.object({
      name: z.string(),
      activityIds: z.array(z.cuid2()),
    }),
  ),
});

export const updateOrganismSchema = z.object({
  id: z.cuid2(),
  name: z.string(),
  modules: z.array(
    z.object({
      name: z.string(),
      activityIds: z.array(z.cuid2()),
    }),
  ),
});

// ==================== MODULE SCHEMAS ====================

/**
 * Schema for certification module
 */
export const moduleSchema = z.object({
  id: z.cuid2(),
  name: z.string(),
  certificationOrganismId: z.cuid2(),
});

export const createModuleSchema = z.object({
  name: z.string(),
  organismId: z.cuid2(),
  activityIds: z.array(z.cuid2()),
});

export const updateModuleSchema = z.object({
  id: z.cuid2(),
  name: z.string(),
  activityIds: z.array(z.cuid2()),
});

export const createModuleDbSchema = z.object({
  name: z.string(),
  certificationOrganismId: z.cuid2(),
});

// ==================== INFERRED TYPES ====================

export type Certification = z.infer<typeof certificationSchema>;
export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>;

export type CertificationDb = z.infer<typeof certificationDbSchema>;
export type CreateCertificationDbInput = z.infer<typeof createCertificationDbSchema>;
export type UpdateCertificationDbInput = z.infer<typeof updateCertificationDbSchema>;

export type Organism = z.infer<typeof organismSchema>;
export type CreateOrganismInput = z.infer<typeof createOrganismSchema>;
export type UpdateOrganismInput = z.infer<typeof updateOrganismSchema>;

export type Module = z.infer<typeof moduleSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateModuleDbInput = z.infer<typeof createModuleDbSchema>;

