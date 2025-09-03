import {
  CreateCertificationGroup,
  DeleteCertificationGroup,
  UpdateCertificationGroup,
} from "@/components/modals/manageCertification";
import Title from "@/components/title";
import { getActualUser } from "@/lib/auth/server";
import {
  getCertificationGroupById,
  getCertificationGroups,
} from "@/server/api/routers/coachs";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  const cgQuery = await getCertificationGroups();

  if (!cgId && cgQuery.length > 0)
    redirect(`/admin/certifications?cgId=${cgQuery[0]?.id}`);

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("certification.manage-cg")} />
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("certification.manage-cg")}</h1>
        <CreateCertificationGroup />
      </div>
      <div className="flex gap-4">
        <div className="w-1/4 ">
          <h3>{t("certification.groups")}</h3>
          <ul className="menu overflow-hidden rounded bg-base-100">
            {cgQuery?.map((cg) => (
              <li key={cg.id}>
                <Link
                  className={`flex w-full items-center justify-between text-center ${
                    cgId === cg.id ? "active" : ""
                  }`}
                  href={`/admin/certifications?cgId=${cg.id}`}
                >
                  <span>{cg.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {cgId === "" ? null : <CGContent cgId={cgId} />}
      </div>
    </div>
  );
}

type CGContentProps = {
  cgId: string;
};

export async function CGContent({ cgId }: CGContentProps) {
  const cgQuery = await getCertificationGroupById(cgId);
  console.log("cgQuery :>> ", cgQuery);
  const t = await getTranslations("admin");

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
                  {"??"}
                  {/* {module.activityGroups?.flatMap((a) => a.activities)?.length} */}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="flex flex-col gap-2 rounded-md border border-primary p-2">
          <h3>{t("certification.group-coachs")}</h3>
        </article>
      </section>
    </div>
  );
}
