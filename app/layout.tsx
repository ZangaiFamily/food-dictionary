import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Food Dictionary",
  description: "A Tinder-style recipe app backed by Markdown knowledge bases."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-3BS81LHVJ0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-3BS81LHVJ0');
`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
