"use client";

import { Button } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/utils";

type Props = {
  count: number;
  actualPage: number;
  onPageClick?: (page: number) => void;
  perPage: number;
};

function Pagination({ count, actualPage, onPageClick, perPage }: Props) {
  const nbPage = Math.ceil(count / perPage);
  if (nbPage < 2) return null;

  return (
    <div className="inline-flex rounded-md shadow-sm">
      {Array.from({ length: nbPage }, (_, k) => k).map((pg, index) => (
        <Button
          key={`page-${pg}`}
          variant={pg === actualPage ? "default" : "outline"}
          size="sm"
          className={cn(
            "min-w-10",
            index === 0 && "rounded-r-none",
            index === nbPage - 1 && "rounded-l-none",
            index > 0 && index < nbPage - 1 && "rounded-none",
            index > 0 && "-ml-px",
          )}
          onClick={() => onPageClick?.(pg)}
        >
          {pg + 1}
        </Button>
      ))}
    </div>
  );
}

export default Pagination;
