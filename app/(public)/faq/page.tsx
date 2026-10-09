import type { Metadata } from "next";
import { FAQClient } from "./FAQClient";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about courses, admissions, fees, certificates, and the student portal at Creative X Tycoon Institute.",
};

export default function FAQPage() {
  return <FAQClient />;
}
