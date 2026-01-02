import { and, eq, inArray } from "drizzle-orm";

import {
  coachCertification,
  selectedModuleForCoach,
  certificationOrganism,
  certificationModule,
  certificationModuleActivityGroups,
  certificationOrganismModules,
} from "@/db/schema/coach";
import { userCoach } from "@/db/schema/user";
import { db, TxClient } from "@/db";

// ==================== CERTIFICATIONS ====================

export async function getCertificationById(id: string) {
  return db.query.coachCertification.findFirst({
    where: eq(coachCertification.id, id),
    with: {
      selectedModuleForCoach: {
        with: {
          module: {
            with: {
              activityGroups: {
                with: { activityGroup: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getCertificationsForCoach(coachUserId: string) {
  return db.query.coachCertification.findMany({
    where: eq(coachCertification.coachId, coachUserId),
  });
}

export async function getCoachWithCertifications(userId: string) {
  return db.query.userCoach.findFirst({
    where: eq(userCoach.userId, userId),
    columns: {
      id: true,
      userId: true,
      publicName: true,
      description: true,
      aboutMe: true,
      searchAddress: true,
      latitude: true,
      longitude: true,
      range: true,
      facebookLink: true,
      twitterLink: true,
      youtubeLink: true,
      instagramLink: true,
      rating: true,
      pageStyle: true,
    },
  });
}

export async function getSelectedModulesForCertifications(
  coachId: string,
  certificationIds: string[],
) {
  if (certificationIds.length === 0) return [];
  return db.query.selectedModuleForCoach.findMany({
    where: and(
      eq(selectedModuleForCoach.coachId, coachId),
      inArray(selectedModuleForCoach.certificationId, certificationIds),
    ),
    with: {
      module: {
        with: {
          activityGroups: {
            with: { activityGroup: true },
          },
        },
      },
    },
  });
}

export async function createCertification(
  data: {
    name: string;
    obtainedIn: Date;
    coachId: string;
    documentUrl?: string;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;
  return client
    .insert(coachCertification)
    .values({
      name: data.name,
      obtainedIn: data.obtainedIn,
      coachId: data.coachId,
      documentUrl: data.documentUrl,
    })
    .returning();
}

export async function updateCertification(
  data: {
    id: string;
    name?: string;
    obtainedIn?: Date;
    coachId?: string;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;
  return client
    .update(coachCertification)
    .set({
      name: data.name,
      obtainedIn: data.obtainedIn,
      coachId: data.coachId,
    })
    .where(eq(coachCertification.id, data.id))
    .returning();
}

export async function deleteCertification(id: string) {
  return db.delete(coachCertification).where(eq(coachCertification.id, id));
}

// ==================== SELECTED MODULES FOR COACH ====================

export async function getCoachId(userId: string, tx?: TxClient) {
  const client = tx ?? db;
  return client.query.userCoach.findFirst({
    where: eq(userCoach.userId, userId),
    columns: { id: true },
  });
}

export async function getModulesByIds(moduleIds: string[], tx?: TxClient) {
  const client = tx ?? db;
  return client.query.certificationModule.findMany({
    where: inArray(certificationModule.id, moduleIds),
    columns: { id: true, certificationOrganismId: true },
  });
}

export async function insertSelectedModulesForCoach(
  modules: Array<{
    coachId: string;
    certificationId: string;
    certificationModuleId: string;
    certificationOrganismId: string;
  }>,
  tx?: TxClient,
) {
  const client = tx ?? db;
  return client.insert(selectedModuleForCoach).values(modules);
}

export async function deleteSelectedModulesForCertification(
  certificationId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;
  return client
    .delete(selectedModuleForCoach)
    .where(eq(selectedModuleForCoach.certificationId, certificationId));
}

// ==================== CERTIFICATION ORGANISMS ====================

export async function getCertificationOrganisms() {
  return db.query.certificationOrganism.findMany({
    with: {
      modules: {
        with: {
          module: {
            with: {
              activityGroups: {
                with: { activityGroup: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getCertificationOrganismById(id: string) {
  return db.query.certificationOrganism.findFirst({
    where: eq(certificationOrganism.id, id),
    with: {
      modules: {
        with: {
          module: {
            with: {
              activityGroups: {
                with: { activityGroup: true },
              },
            },
          },
        },
      },
      selectedModulesForCoach: {
        with: {
          coach: {
            with: {
              user: { columns: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
}

export async function createOrganism(name: string, tx?: TxClient) {
  const client = tx ?? db;
  return client.insert(certificationOrganism).values({ name }).returning();
}

export async function updateOrganism(id: string, name: string, tx?: TxClient) {
  const client = tx ?? db;
  return client
    .update(certificationOrganism)
    .set({ name })
    .where(eq(certificationOrganism.id, id))
    .returning();
}

export async function deleteOrganism(id: string) {
  return db
    .delete(certificationOrganism)
    .where(eq(certificationOrganism.id, id))
    .returning();
}

// ==================== CERTIFICATION MODULES ====================

export async function createModule(
  data: {
    name: string;
    certificationOrganismId: string;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;
  return client
    .insert(certificationModule)
    .values({
      name: data.name,
      certificationOrganismId: data.certificationOrganismId,
    })
    .returning();
}

export async function updateModule(id: string, name: string) {
  return db
    .update(certificationModule)
    .set({ name })
    .where(eq(certificationModule.id, id))
    .returning();
}

export async function deleteModule(id: string) {
  return db
    .delete(certificationModule)
    .where(eq(certificationModule.id, id))
    .returning();
}

export async function linkModuleToOrganism(
  organismId: string,
  moduleId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;
  return client.insert(certificationOrganismModules).values({
    certificationOrganismId: organismId,
    certificationModuleId: moduleId,
  });
}

export async function deleteOrganismModuleLinks(
  organismId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;
  return client
    .delete(certificationOrganismModules)
    .where(
      eq(certificationOrganismModules.certificationOrganismId, organismId),
    );
}

// ==================== MODULE ACTIVITY GROUPS ====================

export async function updateActivitiesForModule(
  moduleId: string,
  activityIds: string[],
) {
  await db
    .delete(certificationModuleActivityGroups)
    .where(
      eq(certificationModuleActivityGroups.certificationModuleId, moduleId),
    );

  if (activityIds.length > 0) {
    await db.insert(certificationModuleActivityGroups).values(
      activityIds.map((id) => ({
        certificationModuleId: moduleId,
        activityGroupId: id,
      })),
    );
  }
}

export async function insertModuleActivityGroups(
  moduleId: string,
  activityIds: string[],
  tx?: TxClient,
) {
  if (activityIds.length === 0) return;
  const client = tx ?? db;
  return client.insert(certificationModuleActivityGroups).values(
    activityIds.map((id) => ({
      certificationModuleId: moduleId,
      activityGroupId: id,
    })),
  );
}

export async function deleteModuleActivityGroups(moduleId: string) {
  return db
    .delete(certificationModuleActivityGroups)
    .where(
      eq(certificationModuleActivityGroups.certificationModuleId, moduleId),
    );
}
