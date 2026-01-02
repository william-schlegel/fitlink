"use client";

import { Fragment } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/shadcn/badge";
import { cn } from "@/lib/utils";
import Title from "./title";

export function LayoutPage({
  children,
  preTitle,
  title,
  titleComponents,
  variant = "main",
  className,
}: {
  preTitle?: string;
  children: React.ReactNode;
  title: string;
  titleComponents?: React.ReactNode;
  variant?: "main" | "section";
  className?: string;
}) {
  return (
    <div className={cn("container mx-auto my-2 space-y-2 p-2", className)}>
      {variant === "main" ? <Title title={title} /> : null}
      <header className="mb-4 flex flex-row flex-wrap items-center gap-4">
        {variant === "main" ? (
          <h1>
            {Boolean(preTitle) ? (
              <span className="text-secondary mr-2">{preTitle}</span>
            ) : null}
            {title}
          </h1>
        ) : (
          <h2>{title}</h2>
        )}
        {titleComponents ? (
          <div className="flex-1">{titleComponents}</div>
        ) : null}
      </header>
      {children}
    </div>
  );
}

export function LayoutPageMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid grid-cols-2 md:grid-cols-[300px_1fr] gap-4",
        className,
      )}
    >
      {children}
    </section>
  );
}

type ListItem = {
  id: string;
  name: string | React.ReactNode;
  link?: string;
  onClick?: () => void;
  badgeColor?: string;
  badgeText?: string | React.ReactNode;
  badgeIcon?: string;
};

export function LayoutPageList<T extends ListItem>({
  children,
  list,
  itemId,
  noItemsText,
}: {
  children?: React.ReactNode;
  list: T[];
  itemId?: string;
  noItemsText: string;
}) {
  return (
    <aside>
      {children}
      {list.length === 0 ? (
        <div className="text-center">
          <p className="text-[hsl(var(--foreground)/0.7)]">{noItemsText}</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-md border border-shadcn bg-shadcn-card w-full">
          {list.map((item) => (
            <li key={item.id}>
              <Link
                className={cn(
                  "flex w-full items-center justify-between p-3 rounded-md transition-colors hover:bg-shadcn-muted",
                  itemId === item.id && "border border-primary bg-primary/10",
                )}
                href={item.link ?? ""}
                onClick={item.onClick}
              >
                {typeof item.name === "string" ? (
                  <span>{item.name}</span>
                ) : (
                  item.name
                )}
                <div className="flex items-center gap-2">
                  {item.badgeText &&
                    (typeof item.badgeText === "string" ? (
                      <Badge variant="outline" className={item.badgeColor}>
                        {item.badgeText}
                      </Badge>
                    ) : (
                      <>{item.badgeText}</>
                    ))}

                  {item.badgeIcon && <i className={item.badgeIcon} />}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export function LayoutPageLists<T extends ListItem>({
  children,
  lists,
  itemId,
  noItemsText,
}: {
  children?: React.ReactNode;
  lists: {
    name: string;
    items: T[];
  }[];
  itemId?: string;
  noItemsText: string;
}) {
  return (
    <aside>
      {children}
      {lists.length === 0 ? (
        <div className="text-center">
          <p className="text-[hsl(var(--foreground)/0.7)]">{noItemsText}</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-md border border-shadcn bg-shadcn-card w-full">
          {lists.map((group) => (
            <Fragment key={group.name}>
              <h2 className="px-3 py-2 text-sm font-semibold text-[hsl(var(--foreground)/0.7)] bg-shadcn-muted">
                {group.name}
              </h2>
              {group.items.map((item) => (
                <li key={item.id}>
                  <Link
                    className={cn(
                      "flex w-full items-center justify-between p-3 rounded-md transition-colors hover:bg-shadcn-muted",
                      itemId === item.id &&
                        "border border-primary bg-primary/10",
                    )}
                    href={item.link ?? ""}
                    onClick={item.onClick}
                  >
                    {typeof item.name === "string" ? (
                      <span>{item.name}</span>
                    ) : (
                      item.name
                    )}
                    <div className="flex items-center gap-2">
                      {item.badgeText && (
                        <Badge variant="outline" className={item.badgeColor}>
                          {item.badgeText}
                        </Badge>
                      )}
                      {item.badgeIcon && <i className={item.badgeIcon} />}
                    </div>
                  </Link>
                </li>
              ))}
            </Fragment>
          ))}
        </ul>
      )}
    </aside>
  );
}

export function LayoutPageContent({ children }: { children: React.ReactNode }) {
  return <article className="w-full">{children}</article>;
}

// Re-export with namespace for backwards compatibility
export const LayoutPageCompound = {
  Root: LayoutPage,
  Main: LayoutPageMain,
  List: LayoutPageList,
  Lists: LayoutPageLists,
  Content: LayoutPageContent,
};
