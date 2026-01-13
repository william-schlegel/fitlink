"use client";

import { siYoutube, siX, siFacebook } from "simple-icons";
import { useTranslations } from "next-intl";
import { Stars } from "lucide-react";
import { format } from "date-fns";

export default function Footer() {
  const t = useTranslations("common");
  return (
    <footer className="bg-neutral text-neutral-content mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 p-10">
        <div className="flex items-center gap-4">
          <Stars size={60} />
          <p className="text-sm">
            <span className="font-semibold">Fitlink</span>
            <br />
            {t("tag-line")}
            <br />
            &copy; {format(new Date(), "yyyy")}
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-wider opacity-70">
            {t("social")}
          </span>
          <div className="flex gap-4">
            <a
              className="fill-neutral-content h-5 w-5 hover:opacity-80 transition-opacity cursor-pointer"
              dangerouslySetInnerHTML={{ __html: siX.svg }}
            ></a>
            <a
              className="fill-neutral-content h-5 w-5 hover:opacity-80 transition-opacity cursor-pointer"
              dangerouslySetInnerHTML={{ __html: siYoutube.svg }}
            ></a>
            <a
              className="fill-neutral-content h-5 w-5 hover:opacity-80 transition-opacity cursor-pointer"
              dangerouslySetInnerHTML={{ __html: siFacebook.svg }}
            ></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
