import { CoachOfferPage } from "@/components/sections/coachOffer";
import { isCUID } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function OfferPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  if (!isCUID(offerId)) return notFound();
  return (
    <div>
      <section className="bg-base-100 py-48">
        <div className="container mx-auto">
          <CoachOfferPage offerId={offerId} />
        </div>
      </section>
    </div>
  );
}
