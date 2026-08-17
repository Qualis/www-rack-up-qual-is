import Footer from "@/app/_components/footer";
import { Navigation } from "@/app/_components/navigation";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import cn from "classnames";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "RackUp — Home Strength Trainer",
    template: "%s | RackUp",
  },
  description:
    "Run a Push/Pull/Legs strength program: check off sets, track progress, and rest on a timer. Everything stays in your browser.",
  metadataBase: new URL("https://www.qual.is"),
  applicationName: "RackUp",
  manifest: "/favicon/site.webmanifest",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      {
        url: "/favicon/android-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: [
      { url: "/favicon/apple-icon-152x152.png", sizes: "152x152" },
      { url: "/favicon/apple-icon-180x180.png", sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-mode="system">
      <head>
        <meta name="msapplication-TileColor" content="#005FCC" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="theme-color" content="#005FCC" />
      </head>
      <body
        className={cn(
          inter.className,
          "bg-accent-1 text-accent-3 dark:bg-accent-3 dark:text-accent-1"
        )}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-accent-1"
        >
          Skip to main content
        </a>
        <div id="__next" className="min-h-screen">
          <Navigation />
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
