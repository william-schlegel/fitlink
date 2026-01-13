import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/shadcn";

export default async function SelectCoachManager({
  hrefCoach,
  hrefManager,
}: {
  hrefCoach: string;
  hrefManager: string;
}) {
  const t = await getTranslations("dashboard");
  return (
    <div className="flex gap-4 mx-auto justify-center items-center w-full">
      <Link href={hrefCoach} className="w-1/4">
        <Card>
          <CardHeader>
            <figure>
              <Image
                src="/images/coach-f.jpeg"
                alt="coach"
                width={400}
                height={300}
              />
            </figure>
          </CardHeader>
          <CardFooter className="justify-center">
            <p className="font-bold text-xl text-primary ">
              {t("manager-coach.continue-as-coach")}
            </p>
          </CardFooter>
        </Card>
      </Link>

      <Link href={hrefManager} className="w-1/4">
        <Card>
          <CardHeader>
            <figure>
              <Image
                src="/images/manager-f.jpeg"
                alt="coach"
                width={400}
                height={300}
              />
            </figure>
          </CardHeader>
          <CardFooter className="justify-center">
            <p className="font-bold text-xl text-primary ">
              {t("manager-coach.continue-as-manager")}
            </p>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}
