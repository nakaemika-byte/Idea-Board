import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idea Board",
  description: "Milanote-style idea notebook MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
