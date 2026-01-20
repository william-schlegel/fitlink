"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source, useMap } from "react-map-gl/mapbox";
import { useHover, useLocalStorage } from "usehooks-ts";
import { useTranslations } from "next-intl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/shadcn/input-group";
import { Badge, Button, Field, FieldContent, FieldLabel } from "../ui/shadcn";
import AddressSearch, { AddressData } from "../ui/addressSearch";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { cssVarToHex } from "@/lib/colorConversion";
import { type TThemes } from "../themeSelector";
import ButtonIcon from "../ui/buttonIcon";
import { trpc } from "@/lib/trpc/client";
import generateCircle from "./utils";
import { env } from "@/env";

type FindClubProps = {
  address?: string;
};

function FindClub({ address = "" }: FindClubProps) {
  const t = useTranslations("home");
  const [myAddress, setMyAddress] = useState<AddressData>({
    address,
    lat: LATITUDE,
    lng: LONGITUDE,
  });
  const [range, setRange] = useState(25);
  const [hoveredId, setHoveredId] = useState("");
  const clubSearch = trpc.sites.getSitesFromDistance.useQuery(
    {
      locationLat: myAddress.lat,
      locationLng: myAddress.lng,
      range,
    },
    { enabled: false },
  );
  const [theme] = useLocalStorage<TThemes>("theme", "cupcake");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const map = useMap();
  const handleSearch = () => clubSearch.refetch();
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

  type TSiteItem = typeof clubSearch.data extends (infer U)[] | undefined
    ? U
    : never;

  function getGroups(site: TSiteItem) {
    const grps = site.club.activities.map((a) => a.group.name).flat();
    const set = new Set(grps);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  const circle = useMemo(() => {
    return generateCircle(myAddress.lng, myAddress.lat, range);
  }, [myAddress.lat, myAddress.lng, range]);

  function ClubRow({
    item,
    onHover,
  }: {
    item: TSiteItem;
    onHover: (id: string) => void;
  }) {
    const ref = useRef<HTMLTableRowElement>(null);
    const isHovered = useHover(ref as React.RefObject<HTMLElement>);

    useEffect(() => {
      if (isHovered) onHover(item.id);
    }, [isHovered, onHover, item]);

    return (
      <TableRow ref={ref} className="hover">
        <TableCell>
          <div className="flex flex-wrap items-center gap-2">
            <span>{item.club.name}</span>
            <Badge variant="default">{item.name}</Badge>
          </div>
        </TableCell>
        <TableCell>{item.distance.toFixed(0)}&nbsp;km</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {getGroups(item).map((g) => (
              <Badge key={g} variant="info">
                {g}
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell>
          {item.club.pages.find((p) => p.target === "HOME")?.published ? (
            <Link
              href={`/presentation-page/club/${item.clubId}/${
                item.club.pages.find((p) => p.target === "HOME")?.id
              }`}
              target="_blank"
              rel="noreferrer"
            >
              <ButtonIcon
                title={t("page-club", { name: item.club.name })}
                iconComponent={<ExternalLink />}
                size="icon"
                variant="outlines"
              />
            </Link>
          ) : (
            <span></span>
          )}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
          {t("search-club")}
          <Search />
        </Button>
        <div className="mt-8 max-h-[40vh]">
          <Table className="table-zebra table border border-shadcn">
            <TableHeader>
              <TableRow>
                <TableHead>{t("club")}</TableHead>
                <TableHead>{t("distance")}</TableHead>
                <TableHead>{t("activities")}</TableHead>
                <TableHead>{t("page")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clubSearch.data?.map((res) => (
                <ClubRow
                  key={res.id}
                  item={res}
                  onHover={(id) => setHoveredId(id)}
                />
              ))}
            </TableBody>
          </Table>
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
            onRender={(event) => event.target.resize()}
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
            {clubSearch.data?.map((res) => (
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
export default FindClub;
