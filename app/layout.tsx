import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZENTO Seller CRM",
  description: "ZENTO seller acquisition va CRM boshqaruv paneli",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
