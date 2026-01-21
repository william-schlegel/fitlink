"use client";

import {
  Building2,
  Dumbbell,
  ExternalLink,
  Gift,
  Home,
  MapPin,
  Star,
  Users,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { formatMoney } from "@/lib/formatNumber";

import type {
  ClubResult,
  CoachResult,
  CompanyOfferResult,
} from "@/lib/llm/assistant";

type ClubCardProps = {
  club: ClubResult;
};

export function ClubResultCard({ club }: ClubCardProps) {
  const t = useTranslations("assistant");

  const profileUrl = club.pagePublished
    ? `/presentation-page/club/${club.clubId}/${club.pageId}`
    : null;

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              {club.clubName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{club.siteName}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            <MapPin className="mr-1 h-3 w-3" />
            {club.distance.toFixed(1)} km
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {club.activityGroups.slice(0, 4).map((activity) => (
            <Badge key={activity} variant="outline" className="text-xs">
              {activity}
            </Badge>
          ))}
          {club.activityGroups.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{club.activityGroups.length - 4}
            </Badge>
          )}
        </div>
        {profileUrl && (
          <Link href={profileUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
              <Users className="h-4 w-4" />
              {t("view-profile")}
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

type CoachCardProps = {
  coach: CoachResult;
};

export function CoachResultCard({ coach }: CoachCardProps) {
  const t = useTranslations("assistant");

  const profileUrl = coach.pagePublished
    ? `/presentation-page/coach/${coach.userId}/${coach.pageId}`
    : null;

  const displayName = coach.publicName || coach.userName || t("coach");

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              {displayName}
            </CardTitle>
            {coach.rating !== null && coach.rating > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {coach.rating.toFixed(1)}
              </div>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">
            <MapPin className="mr-1 h-3 w-3" />
            {coach.distance.toFixed(1)} km
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {coach.coachingActivities && coach.coachingActivities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {coach.coachingActivities.slice(0, 4).map((activity) => (
              <Badge key={activity} variant="outline" className="text-xs">
                {activity}
              </Badge>
            ))}
            {coach.coachingActivities.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{coach.coachingActivities.length - 4}
              </Badge>
            )}
          </div>
        )}
        {profileUrl && (
          <Link href={profileUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
              <Dumbbell className="h-4 w-4" />
              {t("view-profile")}
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

type CompanyOfferCardProps = {
  offer: CompanyOfferResult;
};

export function CompanyOfferResultCard({ offer }: CompanyOfferCardProps) {
  const t = useTranslations("assistant");

  const offerUrl = `/company/${offer.id}`;

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              {offer.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("by")} {offer.coachName}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            <MapPin className="mr-1 h-3 w-3" />
            {offer.distance.toFixed(1)} km
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Options badges */}
        <div className="flex flex-wrap gap-1">
          {offer.physical && (
            <Badge variant="outline" className="text-xs gap-1">
              <Building2 className="h-3 w-3" />
              {t("physical")}
            </Badge>
          )}
          {offer.webcam && (
            <Badge variant="outline" className="text-xs gap-1">
              <Video className="h-3 w-3" />
              {t("webcam")}
            </Badge>
          )}
          {offer.inHouse && (
            <Badge variant="outline" className="text-xs gap-1">
              <Home className="h-3 w-3" />
              {t("in-house")}
            </Badge>
          )}
          {offer.freeHours && offer.freeHours > 0 && (
            <Badge variant="info" className="text-xs gap-1">
              <Gift className="h-3 w-3" />
              {offer.freeHours}h {t("free")}
            </Badge>
          )}
        </div>

        {/* Prices */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {offer.perHourPhysical && (
            <span>{formatMoney(offer.perHourPhysical)}/h</span>
          )}
          {offer.perDayPhysical && (
            <span>
              {formatMoney(offer.perDayPhysical)}/{t("day")}
            </span>
          )}
        </div>

        <Link href={offerUrl} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
            <Building2 className="h-4 w-4" />
            {t("view-offer")}
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
