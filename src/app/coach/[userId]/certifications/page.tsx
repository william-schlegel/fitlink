import Title from "@/components/title";
import { getActualUser } from "@/lib/auth/server";
import { getUserById } from "@/server/api/routers/users";
import { getTranslations } from "next-intl/server";
import { redirect, RedirectType } from "next/navigation";
import DocButton from "./docButton";
import { getCertificationsForCoach } from "@/server/api/routers/coachs";
import {
  CreateCertification,
  DeleteCertification,
  UpdateCertification,
} from "@/components/modals/manageCertification";

export default async function ManageCertifications({
  params,
  searchParams,
}: {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<{
    certificationId: string;
  }>;
}) {
  const { userId } = await params;
  const t = await getTranslations();
  const { certificationId } = await searchParams;
  const user = await getActualUser();
  if (!user || (user.internalRole !== "COACH" && user.internalRole !== "ADMIN"))
    return <div className="alert alert-error">{t("coach.coach-only")}</div>;

  const certificationQuery = await getCertificationsForCoach(userId);
  if (
    certificationQuery &&
    !certificationId &&
    certificationQuery.certifications.length > 0
  ) {
    redirect(
      `${userId}/certifications?certificationId=${certificationQuery.certifications[0].id}`,
      RedirectType.replace
    );
  }

  const { features } = await getUserById(userId, { withFeatures: true });

  if (!features.includes("COACH_CERTIFICATION"))
    return (
      <div className="alert alert-error">
        {t("common.navigation.insufficient-plan")}
      </div>
    );

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title
        title={t("coach.manage-my-certifications", {
          count: certificationQuery?.certifications?.length ?? 0,
        })}
      />
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>
          {t("coach.manage-my-certifications", {
            count: certificationQuery?.certifications?.length ?? 0,
          })}
        </h1>
        <CreateCertification userId={userId} />
      </div>
      <div className="flex gap-4">
        <div className="flex flex-wrap gap-4">
          {certificationQuery?.certifications.map((certification) => (
            <div
              key={certification.id}
              className="card w-96 bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title">{certification.name}</h2>
                <h3>{t("coach.modules")}</h3>
                <div className="flex flex-wrap gap-2">
                  {certification.modules.map((mod) => (
                    <div key={mod.id} className="pill">
                      {mod.name}
                    </div>
                  ))}
                </div>
                <h3>{t("coach.activities")}</h3>
                <div className="flex flex-wrap gap-2">
                  {certification.activityGroups.map((act) => (
                    <div key={act.id} className="pill">
                      {act.name}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-base-200 pt-4">
                  <DocButton documentId={certification.documentId ?? ""} />
                </div>
                <div className="card-actions justify-end">
                  <UpdateCertification
                    userId={userId}
                    certificationId={certification.id}
                  />
                  <DeleteCertification
                    userId={userId}
                    certificationId={certification.id}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
