import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import { TRPCProvider } from "@/lib/trpc/provider";
import { ConvexClientProvider } from "@/lib/convex/provider";
import { getActualUser } from "@/lib/auth/server";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fitlink - Coaching Platform",
  description: "A modern coaching and sports management platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const user = await getActualUser();

  return (
    <html lang={locale} data-theme="cupcake">
      <head>
        <link
          href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
          rel="stylesheet"
        />
      </head>
      <body className={`scroll-smooth antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ConvexClientProvider>
            <TRPCProvider>
              <div className="bg-base-200 grid min-h-screen grid-rows-[auto_1fr_auto]">
                <Navbar userId={user?.id} internalRole={user?.internalRole} />
                <main>{children}</main>
                <Footer />
              </div>
            </TRPCProvider>
          </ConvexClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
