import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import AppWrapper from "./_components/appWrapper";

export const metadata: Metadata = {
  title: "VideoAch - Coaching Platform",
  description: "A modern coaching and sports management platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} data-theme="cupcake">
      <body className={`scroll-smooth antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <TRPCProvider>
            <AppWrapper>{children}</AppWrapper>
          </TRPCProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
