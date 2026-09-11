import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedPen",
  description:
    "Mark handwritten answer sheets against your rubric, with every answer highlighted on the page and every mark backed by the student's own words.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
