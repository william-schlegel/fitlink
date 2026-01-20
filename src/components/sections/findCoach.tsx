"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source, useMap } from "react-map-gl/mapbox";
import { useHover, useLocalStorage } from "usehooks-ts";
import { useTranslations } from "next-intl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

import { inferProcedureOutput } from "@trpc/server";

import { ExternalLink, MapPin, Search } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/shadcn/table";
import {
  Badge,
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldLabel,
} from "../ui/shadcn";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/shadcn/input-group";
import AddressSearch, { AddressData } from "../ui/addressSearch";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { cssVarToHex } from "@/lib/colorConversion";
import { type TThemes } from "../themeSelector";
import { AppRouter } from "@/server/api/root";
import ButtonIcon from "../ui/buttonIcon";
import { trpc } from "@/lib/trpc/client";
import generateCircle from "./utils";
import Rating from "../ui/rating";
import { cn } from "@/lib/utils";
import { env } from "@/env";

type FindCoachProps = {
  address?: string;
  onSelect?: (coachDataId: string) => void;
  onSelectMultiple?: (coachDataIds: string[]) => void;
  className?: string;
};

type TCoachItem = inferProcedureOutput<
  AppRouter["coachs"]["getCoachsFromDistance"]
>[number];

function FindCoach({
  address = "",
  onSelect,
  onSelectMultiple,
  className,
}: FindCoachProps) {
  const t = useTranslations("home");
  const [myAddress, setMyAddress] = useState<AddressData>({
    address: "",
    lat: LATITUDE,
    lng: LONGITUDE,
  });
  const [range, setRange] = useState(10);
  const [hoveredId, setHoveredId] = useState("");
  const coachSearch = trpc.coachs.getCoachsFromDistance.useQuery(
    {
      locationLat: myAddress.lat,
      locationLng: myAddress.lng,
      range,
    },
    { enabled: false, refetchOnWindowFocus: false },
  );
  const [theme] = useLocalStorage<TThemes>("theme", "cupcake");

  const handleSearch = () => {
    setSelectedCoachs(new Set());
    coachSearch.refetch();
  };
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const map = useMap();
  const handleResize = useCallback(() => {
    if (map.current) map.current.resize();
  }, [map]);

  useEffect(() => {
    if (mapContainerRef.current)
      new ResizeObserver(handleResize).observe(mapContainerRef.current);
  }, [handleResize]);

  useEffect(() => {
    setMyAddress({
      address,
      lat: LATITUDE,
      lng: LONGITUDE,
    });
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);
  const circle = useMemo(() => {
    return generateCircle(myAddress.lng, myAddress.lat, range);
  }, [myAddress.lat, myAddress.lng, range]);
  const [selectedCoachs, setSelectedCoachs] = useState(new Set<string>());

  const withSelect = typeof onSelect === "function";
  const withSelectMultiple = typeof onSelectMultiple === "function";

  function handleSelect(id: string, checked: boolean) {
    const selected = new Set(selectedCoachs);
    if (checked) selected.add(id);
    else selected.delete(id);
    setSelectedCoachs(selected);
  }

  function CoachRow({
    coach,
    onHover,
  }: {
    coach: TCoachItem;
    onHover: (id: string) => void;
  }) {
    const ref = useRef<HTMLTableRowElement>(null);
    const isHovered = useHover(ref as React.RefObject<HTMLElement>);

    useEffect(() => {
      if (isHovered) onHover(coach.id);
    }, [isHovered, onHover, coach]);

    return (
      <TableRow className={cn("hover", className)} ref={ref}>
        <TableCell>{coach.publicName}</TableCell>
        <TableCell>{coach.distance.toFixed(0)}&nbsp;km</TableCell>
        <TableCell>
          <Rating note={coach.rating ?? 0} />
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {coach.coachingActivities?.length ? (
              coach.coachingActivities.map((activity, idx) => (
                <Badge key={`${idx}-${activity}`} variant="info">
                  {activity}
                </Badge>
              ))
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          {coach?.page?.published ? (
            <Link
              href={`/presentation-page/coach/${coach.userId}/${coach.page.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <ButtonIcon
                title={t("page-coach", { name: coach.publicName ?? "" })}
                iconComponent={<ExternalLink />}
                size="icon"
                variant="outlines"
              />
            </Link>
          ) : (
            <span>&nbsp;</span>
          )}
        </TableCell>
        {withSelect ? (
          <TableCell>
            <Button onClick={() => onSelect(coach.userId)}>
              {t("select")}
            </Button>
          </TableCell>
        ) : null}
        {withSelectMultiple ? (
          <TableCell>
            <Checkbox
              checked={selectedCoachs.has(coach.userId)}
              onCheckedChange={(checked) =>
                handleSelect(coach.userId, Boolean(checked))
              }
            />
          </TableCell>
        ) : null}
      </TableRow>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-2">
      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-sm text-start">
          <AddressSearch
            label={t("my-address")}
            onSearch={(adr) => setMyAddress(adr)}
            defaultAddress={myAddress.address}
            className="w-full"
          />
        </div>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="range">{t("search-radius")}</FieldLabel>
          <FieldContent>
            <InputGroup>
              <InputGroupAddon align="inline-end">km</InputGroupAddon>
              <InputGroupInput
                id="range"
                type="number"
                value={range}
                onChange={(e) => setRange(e.target.valueAsNumber)}
                min={0}
                max={100}
              />
            </InputGroup>
          </FieldContent>
        </Field>

        <Button size="lg" onClick={() => handleSearch()}>
          {t("search-coach")}
          <Search />
        </Button>
        <div className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("coach")}</TableHead>
                <TableHead>{t("distance")}</TableHead>
                <TableHead>{t("rating")}</TableHead>
                <TableHead>{t("activities")}</TableHead>
                <TableHead>{t("page")}</TableHead>
                {withSelect ? <TableHead>{t("action")}</TableHead> : null}
                {withSelectMultiple ? (
                  <TableHead>{t("select")}</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {coachSearch.data?.map((res) => (
                <CoachRow
                  key={res.id}
                  coach={res}
                  onHover={(id) => setHoveredId(id)}
                />
              ))}
            </TableBody>
          </Table>
          {withSelectMultiple && selectedCoachs.size > 0 ? (
            <div className="mt-2 text-end">
              <Button
                type="button"
                onClick={() => onSelectMultiple(Array.from(selectedCoachs))}
              >
                {t("select")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="min-h-[30vh]">
        <div className="h-[30vh] border border-primary" ref={mapContainerRef}>
          <Map
            initialViewState={{ zoom: 9 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v9"
            mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
            attributionControl={false}
            longitude={myAddress.lng}
            latitude={myAddress.lat}
          >
            <Source type="geojson" data={circle}>
              <Layer
                type="fill"
                paint={{
                  "fill-color": cssVarToHex("var(--primary)"),
                  "fill-opacity": 0.2,
                }}
              />
              <Layer
                type="line"
                paint={{
                  "line-color": cssVarToHex("var(--primary)"),
                  "line-opacity": 1,
                  "line-width": 2,
                }}
              />
            </Source>
            {coachSearch.data?.map((res) => (
              <Marker
                key={res.id}
                latitude={res.latitude ?? LATITUDE}
                longitude={res.longitude ?? LONGITUDE}
                anchor="bottom"
              >
                <MapPin
                  className={
                    res.id === hoveredId ? "text-accent" : "text-primary"
                  }
                />
              </Marker>
            ))}
          </Map>
        </div>
      </div>
    </div>
  );
}
export default FindCoach;
