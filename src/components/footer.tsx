"use client";

import { siYoutube, siX, siFacebook } from "simple-icons";
import { useTranslations } from "next-intl";
import { Stars } from "lucide-react";
import { format } from "date-fns";

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "./ui/shadcn/item";
import { Button } from "./ui/shadcn";

export default function Footer() {
  const t = useTranslations("common");
  return (
    <footer className="bg-card text-card-foreground mt-auto">
      <h3 className="text-center">{t("footer-title")}</h3>
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Item>
          <ItemMedia>
            <Stars size={60} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Fitlink</ItemTitle>
            <ItemDescription>{t("tag-line")}</ItemDescription>
            <ItemFooter>&copy; {format(new Date(), "yyyy")}</ItemFooter>
          </ItemContent>
        </Item>
        <Item className="w-fit justify-center">
          <ItemHeader>
            <ItemTitle>{t("social")}</ItemTitle>
          </ItemHeader>

          <ItemContent className="flex flex-row items-center gap-2">
            <Button asChild variant="ghost">
              <a
                className="size-5 fill-card-foreground"
                dangerouslySetInnerHTML={{ __html: siX.svg }}
              ></a>
            </Button>
            <Button asChild variant="ghost">
              <a
                className="size-5 fill-card-foreground"
                dangerouslySetInnerHTML={{ __html: siYoutube.svg }}
              ></a>
            </Button>
            <Button asChild variant="ghost">
              <a
                className="size-5 fill-card-foreground"
                dangerouslySetInnerHTML={{ __html: siFacebook.svg }}
              ></a>
            </Button>
          </ItemContent>
        </Item>
      </div>
    </footer>
  );
}
