import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Bungee } from "next/font/google";
import "./globals.css";

/** Arcade marquee display face: logo, headlines, scores. */
const display = Bungee({
  variable: "--font-bungee",
  weight: "400",
  subsets: ["latin"],
});

/** Chunky but highly legible: body copy and the phrases themselves. */
const body = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catch Phrase",
  description:
    "Pass-and-play party game: describe the phrase, beat the buzzer!",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Catch Phrase",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0c0820",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
