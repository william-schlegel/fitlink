"use client";

import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { createContext, useContext, useMemo } from "react";

import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
  UniqueIdentifier,
} from "@dnd-kit/core";
import type { CSSProperties, PropsWithChildren } from "react";

interface Props {
  id: UniqueIdentifier;
  className?: string;
}

interface Context {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  ref(node: HTMLElement | null): void;
}

const SortableItemContext = createContext<Context>({
  attributes: {} as DraggableAttributes,
  listeners: undefined,
  ref() {},
});

export function SortableItem({
  children,
  id,
  className,
}: PropsWithChildren<Props>) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  const context = useMemo(
    () => ({
      attributes,
      listeners,
      ref: setActivatorNodeRef,
    }),
    [attributes, listeners, setActivatorNodeRef],
  );
  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <SortableItemContext.Provider value={context}>
      <li
        className={cn(
          "flex grow items-center justify-between rounded-md border border-border bg-card px-4 py-2 text-[hsl(var(--foreground))] shadow-sm",
          className,
        )}
        ref={setNodeRef}
        style={style}
      >
        {children}
      </li>
    </SortableItemContext.Provider>
  );
}

type DragHandleProps = {
  className?: string;
};

export function DragHandle({ className }: DragHandleProps) {
  const { attributes, listeners, ref } = useContext(SortableItemContext);

  return (
    <button
      className={cn(
        "flex cursor-grab touch-none items-center justify-center rounded-md border-none bg-transparent p-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing",
        className,
      )}
      {...attributes}
      {...listeners}
      ref={ref}
    >
      <GripVertical className="h-5 w-5 text-base-content/70" />
    </button>
  );
}
