"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "next/navigation";

import { trpc } from "@/lib/trpc/client";
import { toast } from "@/lib/toast";

export default function PublishPageButton({
  userId,
  checked,
  pageId,
}: {
  userId: string;
  checked: boolean;
  pageId: string;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const publishPage = trpc.pages.updatePagePublication.useMutation({
    onSuccess(data) {
      utils.pages.getPageForCoach.invalidate({ userId });
      router.refresh();
      toast.success(
        t(data[0].published ? "page-published" : "page-unpublished"),
      );
    },
  });

  return (
    <div className="form-control">
      <label className="label cursor-pointer gap-4">
        <span className="label-text">{t("publish-page")}</span>
        <input
          type="checkbox"
          className="checkbox-primary checkbox"
          checked={checked}
          onChange={(e) =>
            publishPage.mutate({
              pageId,
              published: e.target.checked,
            })
          }
        />
      </label>
    </div>
  );
}
