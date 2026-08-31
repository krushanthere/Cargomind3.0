import type { Metadata } from "next";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "../../i18n/routing";
import TopNavigation from "../../components/navigation/TopNavigation";

export const metadata: Metadata = {
  title: "CargoMind — Freight Intelligence & Autonomous Optimization",
  description:
    "Next-generation freight logistics intelligence, real-time Arrhenius cold-chain decay prediction, and multi-modal CP-SAT combinatorial optimization.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate that the incoming locale is supported
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Load messages for the client provider
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-[#0a0a0a] antialiased selection:bg-neutral-900 selection:text-white font-sans">
        <NextIntlClientProvider messages={messages}>
          <TopNavigation />
          <div className="relative min-h-[calc(100vh-76px)]">{children}</div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}