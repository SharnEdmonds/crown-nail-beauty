import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";

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
  metadataBase: new URL("https://crownnails.co.nz"),
  title: "Crown Nail & Beauty | Nail, Lash & Beauty Services in Glendene, Auckland",
  description:
    "Where meticulous craftsmanship meets serene luxury. Premium nail, eyelash, waxing, facial and permanent makeup services in Glendene, Auckland. Open Mon-Sat 9am-6pm, Sun 10am-5:30pm.",
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Crown Nail & Beauty | Nail, Lash & Beauty Services in Glendene, Auckland",
    description:
      "Where meticulous craftsmanship meets serene luxury. Premium nail, eyelash, waxing, facial and permanent makeup services in Glendene, Auckland.",
    url: "https://crownnails.co.nz",
    siteName: "Crown Nail & Beauty",
    locale: "en_NZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crown Nail & Beauty | Nail, Lash & Beauty Services in Glendene, Auckland",
    description:
      "Where meticulous craftsmanship meets serene luxury. Premium nail and beauty services in Glendene, Auckland.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${satoshi.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-crown-black focus:text-clean-white focus:rounded-sm"
        >
          Skip to main content
        </a>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
