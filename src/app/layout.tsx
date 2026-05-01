import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { client as sanityClient } from "@/sanity/lib/client";
import { SITE_SETTINGS_QUERY } from "@/lib/queries";
import type { SiteSettings } from "@/lib/types";

const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Site URL is the only piece that can't reasonably live in Sanity (the host
// owns it). Everything brand-textual is pulled from siteSettings.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://demo.example.com";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityClient
    .fetch<SiteSettings | null>(SITE_SETTINGS_QUERY)
    .catch(() => null);

  const brand = settings?.businessName || "Demo Studio";
  const tagline = settings?.tagline || "";
  const title = tagline ? `${brand} | ${tagline}` : brand;
  const description =
    tagline || `${brand} — book premium beauty services online.`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: '/' },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: brand,
      locale: 'en',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch siteSettings here so the LoadingScreen can use the same brand text
  // as the rest of the marketing site without each component fetching on its
  // own. Wrapped in catch so a transient Sanity error doesn't crash the
  // entire app — the loader just falls back to its empty-string render.
  const settings = await sanityClient
    .fetch<SiteSettings | null>(SITE_SETTINGS_QUERY)
    .catch(() => null);

  return (
    <html lang="en" className={`${satoshi.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-crown-black focus:text-clean-white focus:rounded-sm"
        >
          Skip to main content
        </a>
        <LoadingScreen
          eyebrow={settings?.businessName ?? undefined}
          wordmark={settings?.logoWordmark ?? undefined}
          submark={settings?.logoSubmark ?? undefined}
          tagline={settings?.tagline ?? undefined}
        />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
