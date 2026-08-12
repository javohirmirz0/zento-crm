import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZENTO Command Center",
  description: "ZENTO Business Operating System — vazifalar, xodimlar, KPI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
