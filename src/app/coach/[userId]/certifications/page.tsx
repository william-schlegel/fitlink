import { getTranslations } from "next-intl/server";
import { redirect, RedirectType } from "next/navigation";

import {
  CreateCertification,
  DeleteCertification,
  UpdateCertification,
} from "@/components/modals/manageCertification";
import Title from "@/components/title";
import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
} from "@/components/ui/shadcn";
import { getActualUser } from "@/lib/auth/server";
import createLink from "@/lib/createLink";
import { getHref } from "@/lib/getHref";
import { createTrpcCaller } from "@/lib/trpc/caller";
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
  if (
    !user ||
    !user.internalRole ||
    !["COACH", "ADMIN", "MANAGER_COACH"].includes(user.internalRole)
  )
    return (
      <div className="alert alert-error">
        {t("common.navigation.insufficient-plan")}
      </div>
    );

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
            <Card key={certification.id}>
              <CardHeader>
                <CardTitle>
                  <h2>{certification.name}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3>{t("coach.modules")}</h3>
                <div className="flex flex-wrap gap-2">
                  {certification.modules.map((mod) => (
                    <Badge key={mod.id} size="xl">
                      {mod.name}
                    </Badge>
                  ))}
                </div>
                <h3>{t("coach.activities")}</h3>
                <div className="flex flex-wrap gap-2">
                  {certification.activityGroups.map((act) => (
                    <Badge key={act.id} size="xl">
                      {act.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <Separator />
              <DocButton documentUrl={certification.documentUrl ?? ""} />
              <CardFooter className="flex justify-end gap-2">
                <UpdateCertification
                  userId={userId}
                  certificationId={certification.id}
                  buttonSize="default"
                />
                <DeleteCertification
                  userId={userId}
                  certificationId={certification.id}
                  buttonSize="default"
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
