"use client";

import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";

import ButtonIcon from "@/components/ui/buttonIcon";
import { Badge } from "@/components/ui/shadcn/badge";

export default function DocButton({ documentUrl }: { documentUrl: string }) {
  const t = useTranslations("coach");

  const handleViewDocument = () => {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
    }
  };

  return documentUrl ? (
    <>
      <Badge variant="info" className="mx-auto my-4" size="xl">
        {t("document-ok")}
      </Badge>

      <ButtonIcon
        iconComponent={<Eye className="h-5 w-5" />}
        title={t("view-document")}
        size="icon"
        variant="outlines"
        onClick={handleViewDocument}
      />
    </>
  ) : (
    <>
      <Badge variant="warning" className="mx-auto my-4" size="xl">
        {t("document-nok")}
      </Badge>
    </>
  );
}
