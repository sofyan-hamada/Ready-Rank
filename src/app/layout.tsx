import type { Metadata, Viewport } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Ready Rank - Premium Ranked Ready Gaming Accounts",
  description: "Buy ready-to-play ranked gaming accounts for Marvel Rivals, Valorant, Rainbow Six Siege, Overwatch, and League of Legends. Automated instant delivery.",
  keywords: ["ranked accounts", "gaming accounts", "marvel rivals", "valorant", "rainbow six siege", "overwatch", "league of legends", "egp accounts"],
  authors: [{ name: "Ready Rank" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#05050a] text-gray-100 selection:bg-neon-purple selection:text-white">
        {children}
      </body>
    </html>
  );
}
