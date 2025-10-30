import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  CreateCertification,
  DeleteCertification,
  UpdateCertification,
} from "@/components/modals/manageCertification";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import createLink from "@/lib/createLink";
import { getHref } from "@/lib/getHref";
import Title from "@/components/title";
import DocButton from "./docButton";

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
  const searchParamsValue = await searchParams;
  const certificationId = searchParamsValue?.certificationId;
  const t = await getTranslations();
  const user = await getActualUser();
  if (!user || (user.internalRole !== "COACH" && user.internalRole !== "ADMIN"))
    return <div className="alert alert-error">{t("coach.coach-only")}</div>;

  const caller = await createTrpcCaller();
  if (!caller) return null;

  const certificationQuery =
    await caller.coachs.getCertificationsForCoach(userId);
  if (
    certificationQuery &&
    !certificationId &&
    certificationQuery.certifications.length > 0
  ) {
    const href = await getHref();
    redirect(
      createLink(
        { certificationId: certificationQuery.certifications[0].id },
        href,
      ),
      RedirectType.replace,
    );
  }

  const { features } = await caller.users.getUserById({
    id: userId,
    options: { withFeatures: true },
  });

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
          {(certificationQuery?.certifications ?? []).map((certification) => (
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
                  <DocButton documentUrl={certification.documentUrl ?? ""} />
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
