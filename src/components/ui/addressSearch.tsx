"use client";

import { startTransition, useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Button } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/utils";
import { env } from "@/env";

type Props = {
  label?: string;
  defaultAddress?: string;
  onSearch: (adr: AddressData) => void;
  required?: boolean;
  iconSearch?: boolean;
  error?: string;
  className?: string;
};

export type AddressData = {
  lat: number;
  lng: number;
  address: string;
};

const AddressSearch = ({
  defaultAddress,
  label,
  onSearch,
  required,
  iconSearch = true,
  error,
  className,
}: Props) => {
  const [address, setAddress] = useState("");
  const [debouncedAddress] = useDebounceValue<string>(address, 500);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("common");

  useEffect(() => {
    if (defaultAddress) {
      startTransition(() => {
        setAddress(defaultAddress);
      });
    }
  }, [defaultAddress]);

  useEffect(() => {
    if (debouncedAddress) {
      searchAddresses(debouncedAddress).then((found) => {
        startTransition(() => {
          setAddresses(found);
          setIsOpen(found.length > 0);
        });
      });
    } else {
      startTransition(() => {
        setAddresses([]);
        setIsOpen(false);
      });
    }
  }, [debouncedAddress]);

  function handleSelect(value: string) {
    setAddress(value);
  }

  function handleClickIcon() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const address = t("your-location");
      setAddress(address);
      setAddresses([]);
      setIsOpen(false);
      onSearch({
        address,
        lng: position.coords.longitude,
        lat: position.coords.latitude,
      });
    });
  }

  return (
    <div className={cn("relative", className)}>
      <div className="space-y-2">
        {label && (
          <Label
            className={cn(
              required && "after:content-['*'] after:text-error after:ml-0.5"
            )}
          >
            {label}
          </Label>
        )}
        <div className="flex gap-2">
          {iconSearch && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleClickIcon}
              className="shrink-0"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
          <Input
            value={address}
            onChange={(e) => handleSelect(e.currentTarget.value)}
            placeholder={t("location") ?? ""}
            required={required}
          />
        </div>
      </div>
      {error && <p className="text-sm text-error mt-1">{error}</p>}
      {isOpen && addresses.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-base-300 bg-base-100 shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {addresses.map((adr, idx) => (
              <li key={`ADR-${idx}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 transition-colors"
                  onClick={() => {
                    setAddress(adr.address);
                    onSearch(adr);
                    setAddresses([]);
                    setIsOpen(false);
                  }}
                >
                  {adr.address}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddressSearch;

async function searchAddresses(address: string): Promise<AddressData[]> {
  const url = new URL("http://www.mapquestapi.com/geocoding/v1/address");
  url.searchParams.append("key", env.NEXT_PUBLIC_MAPQUEST_KEY);
  url.searchParams.append("location", address);
  const res = await fetch(url.href);
  const data = await res.json();
  const chunks: string[] = [];
  const locations =
    data.results?.[0]?.locations?.map(
      (location: {
        street: string;
        postalCode: string;
        adminArea5: string;
        latLng: { lat: number; lng: number };
      }) => {
        if (location.street) chunks.push(location.street);
        if (location.postalCode) chunks.push(location.postalCode);
        if (location.adminArea5) chunks.push(location.adminArea5);
        return {
          lat: location.latLng.lat,
          lng: location.latLng.lng,
          address: chunks.reduce(
            (prev, chunk) => (prev ? `${prev}, ${chunk}` : chunk),
            "",
          ),
        };
      },
    ) ?? [];

  return locations;
}
