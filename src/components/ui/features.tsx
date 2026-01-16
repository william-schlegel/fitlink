"use client";

import { type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";

type FeatureProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

type FeatureContainerProps = {
  children: ReactNode;
};

export function FeatureContainer({ children }: FeatureContainerProps) {
  return (
    <div className="flex flex-wrap items-stretch justify-center py-12">
      {children}
    </div>
  );
}

export function Feature({ title, description, icon }: FeatureProps) {
  return (
    <div className="w-full p-4 lg:w-1/2 xl:w-1/4">
      <Card className="h-full bg-muted">
        <CardHeader className="place-content-center text-primary/60">
          {icon}
        </CardHeader>
        <CardContent className="items-center text-center">
          <CardTitle className="text-3xl font-bold mb-4">{title}</CardTitle>
          {description.split("|").map((desc, id) => (
            <p key={`p-${id}`} className="text-base-content/80">
              {desc}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
