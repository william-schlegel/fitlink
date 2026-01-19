import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import { ConvexClientProvider } from "@/lib/convex/provider";
import { ErrorProviders } from "@/components/providers";
import { TRPCProvider } from "@/lib/trpc/provider";
import { getActualUser } from "@/lib/auth/server";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "./globals.css";

import { Toaster } from "@/components/ui/shadcn/sonner";

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
    <html lang={locale}>
      <body className={`scroll-smooth antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ErrorProviders>
            <ConvexClientProvider>
              <TRPCProvider>
                <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
                  <Navbar userId={user?.id} internalRole={user?.internalRole} />
                  <main>{children}</main>
                  <Footer />
                  <Toaster position="top-center" richColors />
                </div>
              </TRPCProvider>
            </ConvexClientProvider>
          </ErrorProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
