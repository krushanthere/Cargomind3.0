import type { Metadata } from "next";
import "./globals.css";
import TopNavigation from "../components/navigation/TopNavigation";

export const metadata: Metadata = {
  title: "CargoMind — Logistics Intelligence",
  description:
    "AI-powered logistics intelligence, risk prediction and freight optimization platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <TopNavigation />

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}