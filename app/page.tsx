import type { Metadata } from "next";
import { LandingStage } from "@/components/desk/LandingStage";

export const metadata: Metadata = {
  title: {
    default: "ZeroMargin — the crash settles in one transaction",
    template: "%s — ZeroMargin",
  },
};

export default function LandingPage() {
  return <LandingStage />;
}
