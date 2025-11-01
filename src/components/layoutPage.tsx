import { twMerge } from "tailwind-merge";
import Link from "next/link";

import { Fragment } from "react";

import Title from "./title";

function LayoutPage({
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
    <div className={twMerge("container mx-auto my-2 space-y-2 p-2", className)}>
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

function Main({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={twMerge("grid grid-cols-[1fr_3fr] gap-4", className)}>
      {children}
    </section>
  );
}

function List<
  T extends {
    id: string;
    name: string | React.ReactNode;
    link?: string;
    onClick?: () => void;
    badgeColor?: string;
    badgeText?: string | React.ReactNode;
    badgeIcon?: string;
  },
>({
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
          <p>{noItemsText}</p>
        </div>
      ) : (
        <ul className="menu overflow-hidden rounded bg-base-100 w-full">
          {list.map((item) => (
            <li key={item.id}>
              <Link
                className={twMerge(
                  "flex w-full items-center justify-between p-2 rounded-md",
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
                      <span className={`${item.badgeColor} badge`}>
                        {item.badgeText}
                      </span>
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

function Lists<
  T extends {
    id: string;
    name: string | React.ReactNode;
    link: string;
    badgeColor?: string;
    badgeText?: string;
    badgeIcon?: string;
  },
>({
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
          <p>{noItemsText}</p>
        </div>
      ) : (
        <ul className="menu overflow-hidden rounded bg-base-100 w-full">
          {lists.map((group) => (
            <Fragment key={group.name}>
              <h2>{group.name}</h2>
              {group.items.map((item) => (
                <li key={item.id}>
                  <Link
                    className={twMerge(
                      "flex w-full items-center justify-between p-2 rounded-md",
                      itemId === item.id &&
                        "border border-primary bg-primary/10",
                    )}
                    href={item.link}
                  >
                    {typeof item.name === "string" ? (
                      <span>{item.name}</span>
                    ) : (
                      item.name
                    )}
                    <div className="flex items-center gap-2">
                      {item.badgeText && (
                        <span className={`${item.badgeColor} badge`}>
                          {item.badgeText}
                        </span>
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

LayoutPage.List = List;
LayoutPage.Lists = Lists;
LayoutPage.Content = Content;
LayoutPage.Main = Main;

function Content({ children }: { children: React.ReactNode }) {
  return <article className="w-full">{children}</article>;
}

export { LayoutPage };
