"use client";

import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import type { TThemes } from "./themeSelector";
import Navbar from "./navbar";
import Footer from "./footer";

export default function AppWrapper({ children }: Readonly<PropsWithChildren>) {
  const [theme, setTheme] = useLocalStorage<TThemes>("theme", "cupcake");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wrapperRef.current?.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div
      ref={wrapperRef}
      className="bg-base-200 grid min-h-screen grid-rows-[auto_1fr_auto]"
      data-theme={theme}
    >
      <Navbar theme={theme} onChangeTheme={(newTheme) => setTheme(newTheme)} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
