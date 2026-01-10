import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";

import Link from "next/link";

import type { ComponentType, SVGProps } from "react";
import type { LucideIcon } from "lucide-react";

type CardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>> | LucideIcon;
  link?: string;
};

type CardGroupProps = CardProps[];
type CardGroupSizes = "lg" | "md" | "sm";

export default function CardGroup({
  cards,
  maxWidth,
  size = "lg",
}: {
  cards: CardGroupProps;
  maxWidth?: number;
  size?: CardGroupSizes;
  link?: string;
}) {
  return (
    <section
      className="grid gap-2 "
      style={{
        gridTemplateColumns: `repeat(auto-fit,minmax(${maxWidth ?? 200}px,1fr))`,
      }}
    >
      {cards.map((card) =>
        card.link ? (
          <Link key={card.title} href={card.link}>
            <CardComponent key={card.title} card={card} size={size} />
          </Link>
        ) : (
          <CardComponent key={card.title} card={card} size={size} />
        ),
      )}
    </section>
  );
}

function CardComponent({
  card,
  size,
}: {
  card: CardProps;
  size: CardGroupSizes;
}) {
  return (
    <Card key={card.title} className="relative w-full bg-primary/10">
      {card.icon ? (
        <div className="absolute top-1/2 -translate-y-1/2 right-6">
          <div className="flex items-center justify-center text-accent/40 w-full h-full">
            <card.icon
              width={size === "md" ? 60 : size === "sm" ? 40 : 80}
              height={size === "md" ? 60 : size === "sm" ? 40 : 80}
              aria-hidden="true"
            />
          </div>
        </div>
      ) : null}
      <CardHeader
        className={cn(size === "md" && "p-4", size === "sm" && "p-2")}
      >
        <CardTitle>
          <h2
            className={cn(
              "text-3xl font-bold my-0 py-0",
              size === "md" && "text-2xl",
              size === "sm" && "text-xl",
            )}
          >
            {card.title}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(size === "md" && "p-4", size === "sm" && "p-2")}
      >
        <p
          className={cn(
            "text-5xl font-bold text-accent",
            size === "md" && "text-3xl",
            size === "sm" && "text-2xl",
          )}
        >
          {card.value}
        </p>
        {card.description && (
          <CardDescription>{card.description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
