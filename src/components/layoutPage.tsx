import { twMerge } from "tailwind-merge";
import Link from "next/link";

import Title from "./title";

function LayoutPage({
  children,
  preTitle,
  title,
  titleComponents,
}: {
  preTitle?: string;
  children: React.ReactNode;
  title: string;
  titleComponents?: React.ReactNode;
}) {
  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={title} />
      <header className="mb-4 flex flex-row items-center gap-4">
        <h1>
          {Boolean(preTitle) ? (
            <span className="text-secondary mr-2">{preTitle}</span>
          ) : null}
          {title}
        </h1>
        {titleComponents ? (
          <div className="flex-1">{titleComponents}</div>
        ) : null}
      </header>
      {children}
    </div>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-[1fr_3fr] gap-4">{children}</section>
  );
}

function List<
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
        <ul className="menu overflow-hidden rounded bg-base-100 w-full mt-4">
          {list.map((item) => (
            <li key={item.id}>
              <Link
                className={twMerge(
                  "flex w-full items-center justify-between p-2 rounded-md",
                  itemId === item.id && "border border-primary bg-primary/10",
                )}
                href={item.link}
              >
                {typeof item.name === "string" ? (
                  <span>{item.name}</span>
                ) : (
                  item.name
                )}
                {item.badgeText && (
                  <span className={`${item.badgeColor} badge`}>
                    {item.badgeText}
                  </span>
                )}
                {item.badgeIcon && <i className={item.badgeIcon} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

LayoutPage.List = List;
LayoutPage.Content = Content;
LayoutPage.Main = Main;

function Content({ children }: { children: React.ReactNode }) {
  return <article className="w-full">{children}</article>;
}

export { LayoutPage };
