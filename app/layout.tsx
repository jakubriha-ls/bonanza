import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flashscore — In-App Message Booking",
  description: "Book in-app message campaigns for Flashscore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
