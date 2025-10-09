import turfCircle from "@turf/circle";

import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";

export default function generateCircle(
  lng: number,
  lat: number,
  range: number,
) {
  const center = [lng ?? LONGITUDE, lat ?? LATITUDE];
  const c = turfCircle(center, range ?? 10, {
    steps: 64,
    units: "kilometers",
    properties: {},
  });
  return c;
}
