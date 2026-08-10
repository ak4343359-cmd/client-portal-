import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RDB IT Services — Client Portal",
  description: "Support ticketing portal for RDB IT Services clients.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-canvas text-deep-navy">{children}</body>
    </html>
  );
}
