"use client";

import { useTranslations } from "next-intl";

import ButtonIcon from "@/components/ui/buttonIcon";

export default function DocButton({ documentUrl }: { documentUrl: string }) {
  const t = useTranslations("coach");

  const handleViewDocument = () => {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
    }
  };

  return documentUrl ? (
    <>
      <div className="rounded-full bg-info px-4 py-1 text-center text-info-content">
        {t("document-ok")}
      </div>

      <button onClick={handleViewDocument}>
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
