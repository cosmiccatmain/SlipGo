import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;
  const title = "BoatGoat | Find your place on the water";
  const description =
    "Explore marinas, yacht clubs, sample slip pricing, amenities, and events in Marina del Rey.";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: `${baseUrl}/og.png`, width: 1536, height: 1024, alt: "BoatGoat marina marketplace in Marina del Rey" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
