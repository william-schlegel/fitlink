"use client";

import { startTransition, useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./shadcn/input-group";
import { Button, Field, FieldContent, FieldError, FieldLabel } from "./shadcn";
import { Popover, PopoverContent, PopoverTrigger } from "./shadcn/popover";
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
  const [isFocused, setIsFocused] = useState(false);
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
          setIsOpen(isFocused && found.length > 0);
        });
      });
    } else {
      startTransition(() => {
        setAddresses([]);
        setIsOpen(false);
      });
    }
  }, [debouncedAddress, isFocused]);

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
    <Popover
      open={isOpen && isFocused && addresses.length > 0}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger className={className} asChild>
        <Field>
          {label && <FieldLabel>{label}</FieldLabel>}
          <FieldContent className="bg-background text-foreground">
            <InputGroup>
              <InputGroupInput
                value={address}
                onChange={(e) => handleSelect(e.currentTarget.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t("location") ?? ""}
                required={required}
              />
              {iconSearch && (
                <InputGroupAddon>
                  <InputGroupButton onClick={handleClickIcon}>
                    <MapPin />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          </FieldContent>
          {error && <FieldError>{error}</FieldError>}
        </Field>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width)"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ul>
          {addresses.map((adr, idx) => (
            <Button
              asChild
              key={`ADR-${idx}`}
              onClick={() => {
                setAddress(adr.address);
                onSearch(adr);
                setAddresses([]);
                setIsOpen(false);
              }}
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              type="button"
            >
              <li>{adr.address}</li>
            </Button>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
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
