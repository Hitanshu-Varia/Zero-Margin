import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const display = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const data = Geist_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500"],
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
