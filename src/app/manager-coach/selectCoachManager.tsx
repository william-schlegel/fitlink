import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

export default async function SelectCoachManager({
  hrefCoach,
  hrefManager,
}: {
  hrefCoach: string;
  hrefManager: string;
}) {
  const t = await getTranslations("dashboard");
  return (
    <div className="grid grid-cols-2 gap-4">
      <Link href={hrefCoach} className="card bg-card w-96 shadow-sm">
        <figure>
          <Image
            src="/images/coach-f.jpeg"
            alt="coach"
            width={400}
            height={300}
          />
        </figure>
        <div className="card-body items-center text-center">
          <p className="card-title">{t("manager-coach.continue-as-coach")}</p>
        </div>
      </Link>
      <Link href={hrefManager} className="card bg-card w-96 shadow-sm">
        <figure>
          <Image
            src="/images/manager-f.jpeg"
            alt="coach"
            width={400}
            height={300}
          />
        </figure>
        <div className="card-body items-center text-center">
          <p className="card-title">{t("manager-coach.continue-as-manager")}</p>
        </div>
      </Link>
    </div>
  );
}
