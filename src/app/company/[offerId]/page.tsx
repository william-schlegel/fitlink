import { notFound } from "next/navigation";

import { CoachOfferPage } from "@/components/sections/coachOffer";
import { isCUID } from "@/lib/utils";

export default async function OfferPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  if (!isCUID(offerId)) return notFound();
  return (
    <div>
      <section className="bg-background py-12">
        <CoachOfferPage offerId={offerId} withContact />
      </section>
    </div>
  );
}
