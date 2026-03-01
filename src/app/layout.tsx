import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SecurityDeterrent from "../components/SecurityDeterrent";
import { CartProvider } from "../context/CartContext";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  title: "Majlis Hypermarket Web Pickup",
  description: "Fast hypermarket ordered pickup",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <SecurityDeterrent />
          {children}
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
