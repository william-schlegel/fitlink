import { siYoutube, siX, siFacebook } from "simple-icons";
import { useTranslations } from "next-intl";
import { Stars } from "lucide-react";
import { format } from "date-fns";

export default function Footer() {
  const t = useTranslations("common");
  return (
    <footer className="footer footer-horizontal bg-neutral text-neutral-content mt-auto gap-4 p-10">
      <div className="flex items-center gap-4">
        <Stars size={60} />
        <p>
          Fitlink
          <br />
          {t("tag-line")}
          <br />
          &copy; {format(new Date(Date.now()), "yyyy")}
        </p>
      </div>
      <div>
        <span className="footer-title">{t("social")}</span>
        <div className="grid grid-flow-col gap-4">
          <a
            className="fill-neutral-content h-5 w-5"
            dangerouslySetInnerHTML={{ __html: siX.svg }}
          ></a>
          <a
            className="fill-neutral-content h-5 w-5"
            dangerouslySetInnerHTML={{ __html: siYoutube.svg }}
          ></a>
          <a
            className="fill-neutral-content h-5 w-5"
            dangerouslySetInnerHTML={{ __html: siFacebook.svg }}
          ></a>
        </div>
      </div>
    </footer>
  );
}
