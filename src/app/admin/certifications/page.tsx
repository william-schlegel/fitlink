import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";

import Link from "next/link";

import {
  CreateCertificationOrganism,
  DeleteCertificationGroup,
  UpdateCertificationGroup,
} from "@/components/modals/manageCertification";
import createLink, { createHref } from "@/lib/createLink";
import {
  LayoutPage,
  LayoutPageMain,
  LayoutPageList,
  LayoutPageContent,
} from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import { getHref } from "@/lib/getHref";
import { isCUID } from "@/lib/utils";

export default async function CertificationsManagement({
  searchParams,
}: {
  searchParams: Promise<{ cgId: string }>;
}) {
  const user = await getActualUser();
  if (!user) redirect("/");
  const t = await getTranslations("admin");
  if (user?.internalRole !== "ADMIN") return <div>{t("admin-only")}</div>;

  const { cgId } = await searchParams;

  const caller = await createTrpcCaller();
  if (!caller) return null;
  const cgQuery = await caller.coachs.getCertificationOrganisms();

  const href = await getHref();
  if (!cgId && cgQuery.length > 0)
    redirect(createLink({ cgId: cgQuery[0]?.id }, href), RedirectType.replace);

  const cgList = cgQuery.map((cg) => ({
    id: cg.id,
    name: cg.name,
    link: createLink({ cgId: cg.id }, href),
  }));

  return (
    <LayoutPage
      title={t("certification.manage-cg")}
      titleComponents={<CreateCertificationOrganism />}
    >
      <LayoutPageMain>
        <LayoutPageList
          list={cgList}
          itemId={cgId}
          noItemsText={t("certification.no-cg")}
        />

        {cgId === "" ? null : <CGContent cgId={cgId} />}
      </LayoutPageMain>
    </LayoutPage>
  );
}

type CGContentProps = {
  cgId: string;
};

async function CGContent({ cgId }: CGContentProps) {
  const caller = await createTrpcCaller();
  if (!caller || !isCUID(cgId)) return null;
  const cgQuery = await caller.coachs.getCertificationOrganismById(cgId);
  const t = await getTranslations("admin");
  const href = await getHref();

  if (!cgQuery) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2>{cgQuery?.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <UpdateCertificationGroup groupId={cgId} />
          <DeleteCertificationGroup groupId={cgId} />
        </div>
      </div>
      <section className="grid max-h-screen grid-cols-2 gap-2 overflow-y-auto overflow-x-hidden">
        <article className="flex flex-col gap-2 rounded-md border border-primary p-2">
          <h3>{t("certification.group-modules")}</h3>
          <div className="flex flex-row flex-wrap gap-2">
            {cgQuery?.modules?.map((module) => (
              <div key={module.id} className="pill">
                <span>{module.name}</span>
                <span className="badge-primary badge">
                  {module.activities.length}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="flex flex-col gap-2 rounded-md border border-primary p-2">
          <h3>{t("certification.group-coachs")}</h3>
          <div className="flex flex-row flex-wrap gap-2">
            {cgQuery?.coaches?.map((coach) => (
              <Link
                href={createHref(href, ["admin", "users"], {
                  userId: coach.id,
                })}
                key={coach.id}
                className="pill"
              >
                <span>{coach.name}</span>
                <span className="badge-primary badge">{coach.count}</span>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
