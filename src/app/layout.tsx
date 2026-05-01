import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import LoadingScreen from "@/components/ui/LoadingScreen";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://demo.example.com"),
  title: "Atelier Lumière | Demo Beauty Studio",
  description:
    "Demo site showcasing a luxury beauty studio template. Premium nail, lash, waxing, facial and permanent makeup services. Sample content only.",
  alternates: {
    canonical: '/',
  },
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
    title: "Atelier Lumière | Demo Beauty Studio",
    description:
      "Demo site showcasing a luxury beauty studio template. Sample content only.",
    url: "https://demo.example.com",
    siteName: "Atelier Lumière",
    locale: "en",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atelier Lumière | Demo Beauty Studio",
    description:
      "Demo site showcasing a luxury beauty studio template. Sample content only.",
  },
};



// ... (existing imports)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${satoshi.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-crown-black focus:text-clean-white focus:rounded-sm"
        >
          Skip to main content
        </a>
        <LoadingScreen />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
