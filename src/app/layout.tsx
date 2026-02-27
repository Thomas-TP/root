import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./global_styles.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thomas Prud'homme — Apprenti CFC Informaticien",
  description:
    "Apprenti CFC Informaticien en Exploitation & Infrastructure, basé dans l'Arc lémanique. Liens, compétences et projets.",
  keywords: [
    "informaticien",
    "CFC",
    "apprenti",
    "infrastructure",
    "Suisse",
    "Thomas Prud'homme",
  ],
  openGraph: {
    title: "Thomas Prud'homme — Apprenti CFC Informaticien",
    description:
      "Apprenti CFC Informaticien en Exploitation & Infrastructure, basé dans l'Arc lémanique.",
    type: "website",
  },
  icons: [
    {
      rel: "icon",
      url: "/favicon-light.svg",
      media: "(prefers-color-scheme: light)",
    },
    {
      rel: "icon",
      url: "/favicon.svg",
      media: "(prefers-color-scheme: dark)",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme-preference');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.add('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${outfit.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
