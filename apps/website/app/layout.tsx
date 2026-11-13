import './global.css';
import '@imbustai/ds';
import localFont from 'next/font/local';
import type { Metadata } from 'next';
import { I18nLayoutShell } from '@/components/i18n-layout-shell';
import { SiteChrome } from '@/components/site-chrome';
import { ThemeProvider } from '@/components/theme-provider';

const archivo = localFont({
  src: './fonts/Archivo-Regular.ttf',
  weight: '400',
  variable: '--font-archivo',
  display: 'swap',
});

// League Gothic has one weight. Declaring the whole range stops the browser
// from faking a bold when a heading asks for 500–700.
const leagueGothic = localFont({
  src: './fonts/LeagueGothic-Variable.ttf',
  weight: '400 900',
  variable: '--font-league-gothic',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

export const metadata: Metadata = {
  title: 'Imbustai — Epistolary stories at your door',
  description:
    'Physical letters, AI-shaped narrative, and a slower rhythm — in Italian or English.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // data-palette: "imbustai" (brand) | "default" (shadcn neutral) — see global.css
  return (
    <html
      lang="it"
      data-palette="imbustai"
      suppressHydrationWarning
      className={`${archivo.variable} ${leagueGothic.variable}`}
    >
      <body className="min-h-screen">
        <I18nLayoutShell>
          <ThemeProvider>
            <SiteChrome>{children}</SiteChrome>
          </ThemeProvider>
        </I18nLayoutShell>
      </body>
    </html>
  );
}
