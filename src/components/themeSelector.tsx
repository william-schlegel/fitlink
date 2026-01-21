"use client";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

import {
  Button,
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/shadcn";

export const Themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
] as const;
export type TThemes = (typeof Themes)[number];

type Props = {
  onSelect: (t: TThemes) => void;
  onSave?: (t: TThemes) => void;
};

const ThemeSelector = ({ onSelect, onSave }: Props) => {
  const [theme, setTheme] = useLocalStorage<TThemes>("pageTheme", "cupcake");
  const t = useTranslations("pages");

  function handleChangeTheme(theme: TThemes) {
    setTheme(theme);
    onSelect(theme);
  }

  useEffect(() => {
    onSelect(theme);
  }, [theme, onSelect]);

  return (
    <Field orientation="horizontal">
      <Select
        value={theme}
        onValueChange={(value) => handleChangeTheme(value as TThemes)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent>
          {Themes.map((theme) => (
            <SelectItem key={theme} value={theme}>
              {theme}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onSave ? (
        <Button onClick={() => onSave(theme)}>{t("save-style")}</Button>
      ) : null}
    </Field>
  );
};

export default ThemeSelector;
