"use client";

import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";

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
      <Badge variant="info">{t("document-ok")}</Badge>

      <ButtonIcon
        iconComponent={<Eye className="h-5 w-5" />}
        title={t("view-document")}
        buttonSize="md"
        buttonVariant="Icon-Outlined-Primary"
        onClick={handleViewDocument}
      />
    </>
  ) : (
    <>
      <Badge variant="warning">{t("document-nok")}</Badge>
    </>
  );
}
