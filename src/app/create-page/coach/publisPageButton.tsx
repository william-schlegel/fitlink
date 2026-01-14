"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Check, X } from "lucide-react";

import { Badge, Checkbox, Field, FieldLabel } from "@/components/ui/shadcn";
import { trpc } from "@/lib/trpc/client";

export default function PublishPageButton({
  id,
  checked,
  pageId,
  target,
}: {
  id: string;
  checked: boolean;
  pageId: string;
  target: "coach" | "club";
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const publishPage = trpc.pages.updatePagePublication.useMutation({
    onSuccess(data) {
      if (target === "coach") {
        utils.pages.getPageForCoach.invalidate({ userId: id });
      } else {
        utils.pages.getPagesForClub.invalidate(id);
      }
      router.refresh();
      toast.success(
        t(data[0].published ? "page-published" : "page-unpublished"),
      );
    },
  });

  return (
    <div>
      <Field orientation="horizontal">
        <Badge size="xl" variant="outline">
          <FieldLabel htmlFor="publish-page">
            {t("publish-page")}
            {checked ? (
              <Check className="size-4 text-success" />
            ) : (
              <X className="size-4 text-destructive" />
            )}
          </FieldLabel>
          <Checkbox
            className="hidden"
            id="publish-page"
            checked={checked}
            onCheckedChange={(checked) =>
              publishPage.mutate({
                pageId,
                published: checked === true,
              })
            }
          />
        </Badge>
      </Field>
    </div>
  );
}
