import { useLocalStorage } from "usehooks-ts";

export type ThemeMode = "light" | "dark";

export default function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemeMode>(
    "shadcn-theme",
    "light",
    {
      initializeWithValue: false,
    },
  );
  return [theme, setTheme] as const;
}
