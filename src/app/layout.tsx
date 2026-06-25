import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proxy — Programmable Delegation Infrastructure on Sui",
  description:
    "Grant, constrain, and revoke authority on-chain. Every delegation is a Sui Object — enforced by Move, evidenced by Walrus, readable by any protocol.",
  keywords: [
    "programmable delegation",
    "Sui Network",
    "Sui",
    "Walrus",
    "on-chain authority",
    "Move contract",
    "compliance",
    "CLAY Hackathon",
  ],
};

import SuiProviders from "@/components/app/SuiProviders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link href="https://api.fontshare.com/v2/css?f[]=synonym@400&f[]=chillax@600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-grain">
        <SuiProviders>{children}</SuiProviders>
      </body>
    </html>
  );
}
