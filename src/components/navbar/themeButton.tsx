"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { useEffect } from "react";

import { Toggle } from "../ui/shadcn/toggle";

type ThemeMode = "light" | "dark";

export default function ThemeButton() {
  const [theme, setTheme] = useLocalStorage<ThemeMode>(
    "shadcn-theme",
    "light",
    {
      initializeWithValue: false,
    },
  );

  useEffect(() => {
    const html = document.querySelector("html");
    if (theme === "dark") {
      html?.classList.add("dark");
    } else {
      html?.classList.remove("dark");
    }
  }, [theme]);

  const onChangeTheme = (isDark: boolean) => {
    const newTheme: ThemeMode = isDark ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <Toggle
      pressed={theme === "dark"}
      onPressedChange={onChangeTheme}
      className="cursor-pointer"
    >
      {theme === "dark" ? (
        <SunIcon className="size-6" />
      ) : (
        <MoonIcon className="size-6" />
      )}
    </Toggle>
  );
}
