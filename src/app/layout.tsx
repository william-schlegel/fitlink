import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { getActualUser } from "@/lib/auth/server";

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

  const user = await getActualUser();

  return (
    <html lang={locale} data-theme="cupcake">
      <body className={`scroll-smooth antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <TRPCProvider>
            <div className="bg-base-200 grid min-h-screen grid-rows-[auto_1fr_auto]">
              <Navbar userId={user?.id} role={user?.role} />
              <main>{children}</main>
              <Footer />
            </div>
          </TRPCProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
