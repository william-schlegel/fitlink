"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import ButtonIcon from "@/components/ui/buttonIcon";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import { toast } from "@/lib/toast";

export default function DocButton({ documentId }: { documentId: string }) {
  const t = useTranslations("coach");
  const [docId, setDocId] = useState(documentId);
  const queryDoc = trpc.files.getDocumentUrlById.useQuery(docId, {
    enabled: isCUID(docId),
  });
  useEffect(() => {
    if (queryDoc.data) {
      if (queryDoc.data.url)
        if (queryDoc.data.fileType === "application/pdf") {
          setDocId("");
          window.open(queryDoc.data.url, "_blank");
        } else {
          toast.error(t("type-invalid"));
        }
    }
  }, [queryDoc.data, t]);

  return documentId ? (
    <>
      <div className="rounded-full bg-info px-4 py-1 text-center text-info-content">
        {t("document-ok")}
      </div>

      <button onClick={() => setDocId(documentId ?? "")}>
        <ButtonIcon
          iconComponent={<i className="bx bx-show bx-sm" />}
          title={t("view-document")}
          buttonSize="md"
          buttonVariant="Icon-Outlined-Primary"
        />
      </button>
    </>
  ) : (
    <>
      <div className="rounded-full bg-warning px-4 py-1 text-center text-warning-content">
        {t("document-nok")}
      </div>
    </>
  );
}
