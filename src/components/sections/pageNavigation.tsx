"use client";
import Link from "next/link";

import { PageSectionModel, PageTarget } from "@/lib/sections/data";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { Fragment, useEffect, useState } from "react";

import { PageButton } from "../ui/page/button";
import { Button, Collapsible, CollapsibleContent } from "../ui/shadcn";

type PageProps = {
  id: string;
  target: PageTarget | null;
  name: string;
  sections: {
    id: string;
    model: PageSectionModel;
    title: string | null;
  }[];
};

type Props = {
  clubId: string;
  logoUrl: string | undefined;
  pages: PageProps[];
};

const PageNavigation = ({ clubId, logoUrl, pages }: Props) => {
  const homePageId = pages.find((p) => p.target === "HOME")?.id ?? "";
  const [openNav, setOpenNav] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setOpenNav(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <nav className="bg-(--page-color-base-100)/50 sticky top-0 z-10 mx-auto w-full max-w-7xl rounded-lg border px-4 py-2 shadow-sm">
      <div className="flex items-center">
        <Link
          className="max-h-full"
          href={`/presentation-page/club/${clubId}/${homePageId}`}
        >
          {logoUrl ? (
            <Image
              className="h-12"
              src={logoUrl}
              alt=""
              width={48}
              height={48}
            />
          ) : (
            <span className="h-12">Logo</span>
          )}
        </Link>

        <div className="hidden lg:mr-2 lg:ml-auto lg:block">
          <PageMenu menus={pages} clubId={clubId} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpenNav(!openNav)}
          className="ml-auto lg:hidden"
        >
          {openNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>
      <Collapsible open={openNav}>
        <CollapsibleContent>
          <PageMenu menus={pages} clubId={clubId} />
        </CollapsibleContent>
      </Collapsible>
    </nav>
  );
};

export default PageNavigation;

function PageMenu({ menus, clubId }: { menus: PageProps[]; clubId: string }) {
  return (
    <ul className="m-2 flex flex-col gap-x-3 gap-y-1 lg:m-0 lg:flex-row lg:items-center">
      {menus.map((menu) => {
        if (menu.target === "HOME") {
          return (
            <Fragment key={menu.id}>
              {menu.sections
                .filter((s) => s.title)
                .map((s) => (
                  <PageButton asChild key={s.id}>
                    <li key={s.id}>
                      <Link
                        href={`/presentation-page/club/${clubId}/${menu.id}#${s.model}`}
                      >
                        {s.title}
                      </Link>
                    </li>
                  </PageButton>
                ))}
            </Fragment>
          );
        }
        return (
          <PageButton asChild key={menu.id}>
            <li key={menu.id}>
              <Link href={`/presentation-page/club/${clubId}/${menu.id}`}>
                {menu.name}
              </Link>
            </li>
          </PageButton>
        );
      })}
    </ul>
  );
}
