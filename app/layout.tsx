import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

/*
 * Self-hosted fonts (committed woff2). next/font/google downloads at
 * build time and dies on flaky venue wifi; these load from the repo so
 * a clean build never touches the network for type.
 */
const display = localFont({
  src: "./fonts/inter.woff2",
  variable: "--font-display",
  weight: "400 600",
  display: "swap",
});

const data = localFont({
  src: "./fonts/geist-mono.woff2",
  variable: "--font-data",
  weight: "400 500",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ZeroMargin — cross-venue margin engine",
    template: "%s — ZeroMargin",
  },
  description:
    "A non-custodial margin engine that nets a Uniswap v4 LP against an offsetting short hedge inside one Aqua virtual balance, and settles a flash crash in one transaction.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${data.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
