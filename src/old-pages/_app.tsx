import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { appWithTranslation } from "next-i18next";
import { ToastContainer } from "react-toastify";

import "../styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import "mapbox-gl/dist/mapbox-gl.css";

import nextI18nConfig from "../../next-i18next.config.mjs";
import { trpc } from "@trpcclient/trpc";
import useLocalStorage from "@lib/useLocalstorage";
import { type TThemes } from "../components/themeSelector";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const [theme] = useLocalStorage<TThemes>("theme", "cupcake");
  return (
    <>
      <SessionProvider session={session}>
        <Component {...pageProps} />
        <ToastContainer
          autoClose={3000}
          theme={theme === "dark" ? "dark" : "colored"}
        />
      </SessionProvider>
    </>
  );
};

const I18nApp = appWithTranslation(MyApp, nextI18nConfig);
const TRPCApp = trpc.withTRPC(I18nApp);

export default TRPCApp;
