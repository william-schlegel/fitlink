"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import Link from "next/link";

import { useRouter } from "next/navigation";

import { ExternalLink } from "lucide-react";

import Head from "next/head";

import {
  Badge,
  Button,
  Checkbox,
  Field,
  FieldLabel,
} from "@/components/ui/shadcn";
import { ActivityGroupCreation } from "@/components/sections/activities";
import { DeletePage, UpdatePage } from "@/components/modals/managePage";
import { ButtonGroup } from "@/components/ui/shadcn/button-group";
import { PlanningCreation } from "@/components/sections/planning";
import { ActivityCreation } from "@/components/sections/activity";
import { usePageSection } from "@/lib/sections/useGetSection";
import { OfferCreation } from "@/components/sections/offers";
import { TitleCreation } from "@/components/sections/title";
import { HeroCreation } from "@/components/sections/hero";
import { PageSectionModel } from "@/lib/sections/data";
import Spinner from "@/components/ui/spinner";
import createLink from "@/lib/createLink";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import { toast } from "sonner";

type PageContentProps = {
  pageId: string;
  clubId: string;
  section?: PageSectionModel;
};

export default function PageContent({
  pageId,
  clubId,
  section,
}: PageContentProps) {
  const queryPage = trpc.pages.getPageById.useQuery(pageId, {
    enabled: isCUID(pageId),
    refetchOnWindowFocus: false,
  });
  const { getSectionName, getSections, defaultSection } = usePageSection();
  const router = useRouter();

  const sections = useMemo(() => {
    if (!queryPage.data?.target) return [];
    return getSections(queryPage.data.target);
  }, [queryPage.data, getSections]);

  const t = useTranslations("pages");
  const utils = trpc.useUtils();

  const publishPage = trpc.pages.updatePagePublication.useMutation({
    onSuccess(data) {
      utils.pages.getPageById.invalidate(pageId);
      utils.pages.getPagesForClub.invalidate(clubId);
      toast.success(
        t(data[0].published ? "page-published" : "page-unpublished"),
      );
    },
  });

  if (queryPage.isLoading) return <Spinner />;
  const target = queryPage.data?.target ?? "HOME";

  return (
    <article className="flex grow flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2> {queryPage.data?.name}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="xl">
            <Field orientation="horizontal">
              <FieldLabel>{t("publish-page")}</FieldLabel>
              <Checkbox
                checked={queryPage.data?.published ?? false}
                onCheckedChange={(checked) =>
                  publishPage.mutate({
                    pageId,
                    published: checked === true,
                  })
                }
              />
            </Field>
          </Badge>
          <Button asChild>
            <Link
              href={`/presentation-page/club/${clubId}/${pageId}`}
              target="_blank"
              referrerPolicy="no-referrer"
            >
              {t("page-preview")}
              <ExternalLink className="size-4" />
            </Link>
          </Button>

          <UpdatePage clubId={clubId} pageId={pageId} />
          <DeletePage clubId={clubId} pageId={pageId} />
        </div>
      </div>
      <ButtonGroup>
        {sections.map((sec) => (
          <Button
            key={sec}
            variant={
              sec === (section ?? defaultSection(target))
                ? "default"
                : "outline"
            }
            size="lg"
            onClick={() =>
              router.push(createLink({ clubId, pageId, section: sec }))
            }
          >
            {getSectionName(sec)}
          </Button>
        ))}
      </ButtonGroup>
      <div className="w-full">
        {section === "HERO" && <HeroCreation clubId={clubId} pageId={pageId} />}
        {section === "TITLE" && (
          <TitleCreation clubId={clubId} pageId={pageId} />
        )}
        {section === "PLANNINGS" && (
          <PlanningCreation clubId={clubId} pageId={pageId} />
        )}
        {section === "ACTIVITY_GROUPS" && (
          <ActivityGroupCreation clubId={clubId} pageId={pageId} />
        )}
        {section === "ACTIVITIES" && (
          <ActivityCreation clubId={clubId} pageId={pageId} />
        )}
        {section === "OFFERS" && (
          <OfferCreation clubId={clubId} pageId={pageId} />
        )}
      </div>
    </article>
  );
}
