"use client";

import { Fragment, useMemo, useRef } from "react";
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
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const selectedIndex = useMemo(() => {
    if (!itemId) {
      return -1;
    }
    return list.findIndex((item) => item.id === itemId);
  }, [itemId, list]);
  const defaultIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (list.length === 0) {
      return;
    }

    const currentIndex = itemRefs.current.findIndex(
      (el) => el === document.activeElement,
    );
    const startIndex = currentIndex >= 0 ? currentIndex : defaultIndex;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (startIndex + 1) % list.length;
      itemRefs.current[nextIndex]?.focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = (startIndex - 1 + list.length) % list.length;
      itemRefs.current[nextIndex]?.focus();
      return;
    }

    if (event.key === " " || event.key === "Spacebar") {
      if (startIndex >= 0) {
        event.preventDefault();
        itemRefs.current[startIndex]?.click();
      }
    }
  };

  return (
    <aside>
      {children}
      {list.length === 0 ? (
        <div className="text-center bg-muted">
          <p className="text-muted-foreground]">{noItemsText}</p>
        </div>
      ) : (
        <ul
          className="overflow-hidden rounded-md border border-border w-full p-1 space-y-1"
          onKeyDown={handleKeyDown}
        >
          {list.map((item, index) => (
            <li key={item.id}>
              <Link
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className={cn(
                  "flex w-full items-center justify-between p-3 rounded-md transition-colors hover:bg-muted",
                  itemId === item.id && "border border-primary bg-primary/10",
                )}
                href={item.link ?? ""}
                onClick={item.onClick}
                tabIndex={index === defaultIndex ? 0 : -1}
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
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const flatItems = useMemo(
    () => lists.flatMap((group) => group.items),
    [lists],
  );
  const selectedIndex = useMemo(() => {
    if (!itemId) {
      return -1;
    }
    return flatItems.findIndex((item) => item.id === itemId);
  }, [flatItems, itemId]);
  const defaultIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (flatItems.length === 0) {
      return;
    }

    const currentIndex = itemRefs.current.findIndex(
      (el) => el === document.activeElement,
    );
    const startIndex = currentIndex >= 0 ? currentIndex : defaultIndex;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (startIndex + 1) % flatItems.length;
      itemRefs.current[nextIndex]?.focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = (startIndex - 1 + flatItems.length) % flatItems.length;
      itemRefs.current[nextIndex]?.focus();
      return;
    }

    if (event.key === " " || event.key === "Spacebar") {
      if (startIndex >= 0) {
        event.preventDefault();
        itemRefs.current[startIndex]?.click();
      }
    }
  };

  return (
    <aside>
      {children}
      {lists.length === 0 ? (
        <div className="text-center">
          <p className="text-muted-foreground">{noItemsText}</p>
        </div>
      ) : (
        <ul
          className="overflow-hidden rounded-md border border-border w-full p-1 space-y-1"
          onKeyDown={handleKeyDown}
        >
          {(() => {
            let runningIndex = 0;
            return lists.map((group) => (
              <Fragment key={group.name}>
                <h2 className="px-3 py-2 text-sm font-semibold text-muted-foreground bg-muted">
                  {group.name}
                </h2>
                {group.items.map((item) => (
                  <li key={item.id}>
                    {(() => {
                      const index = runningIndex;
                      runningIndex += 1;
                      return (
                        <Link
                          ref={(el) => {
                            itemRefs.current[index] = el;
                          }}
                          className={cn(
                            "flex w-full items-center justify-between p-3 rounded-md transition-colors hover:bg-muted",
                            itemId === item.id &&
                              "border border-primary bg-primary/10",
                          )}
                          href={item.link ?? ""}
                          onClick={item.onClick}
                          tabIndex={index === defaultIndex ? 0 : -1}
                        >
                          {typeof item.name === "string" ? (
                            <span>{item.name}</span>
                          ) : (
                            item.name
                          )}
                          <div className="flex items-center gap-2">
                            {item.badgeText && (
                              <Badge
                                variant="outline"
                                className={item.badgeColor}
                              >
                                {item.badgeText}
                              </Badge>
                            )}
                            {item.badgeIcon && <i className={item.badgeIcon} />}
                          </div>
                        </Link>
                      );
                    })()}
                  </li>
                ))}
              </Fragment>
            ));
          })()}
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
