import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TicketAlert Norge | Spor billetter til konserter",
  description: "Finn konserter i Norge og få varsel når videresolgte billetter blir tilgjengelige på Ticketmaster.",
  keywords: ["konserter", "billetter", "Norge", "Ticketmaster", "resale", "videresalg"],
  authors: [{ name: "TicketAlert Norge" }],
  openGraph: {
    title: "TicketAlert Norge",
    description: "Spor billetter til konserter og få varsel når de blir tilgjengelige",
    type: "website",
    locale: "nb_NO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
