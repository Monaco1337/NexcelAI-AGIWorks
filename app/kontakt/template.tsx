// NXL_CONTACT_PREMIUM_V1
import type { ReactNode } from "react";
import "./nexcel-contact-premium.css";

export default function NexcelContactPremiumLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="nxl-contact-premium">{children}</div>;
}
