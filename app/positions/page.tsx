import type { Metadata } from "next";
import { PositionsStage } from "@/components/desk/PositionsStage";

export const metadata: Metadata = {
  title: "Positions",
};

export default function PositionsPage() {
  return <PositionsStage />;
}
