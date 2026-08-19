import type { Metadata } from "next";
import "./globals.css";
import TopNavigation from "../components/navigation/TopNavigation";

export const metadata: Metadata = {
  title: "CargoMind — Freight Intelligence & Autonomous Optimization",
  description:
    "Next-generation freight logistics intelligence, real-time Arrhenius cold-chain decay prediction, and multi-modal CP-SAT combinatorial optimization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-[#0a0a0a] antialiased selection:bg-neutral-900 selection:text-white font-sans">
        <TopNavigation />
        <div className="relative min-h-[calc(100vh-76px)]">{children}</div>
      </body>
    </html>
  );
}