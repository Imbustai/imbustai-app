import './global.css';
import localFont from 'next/font/local';
import type { Metadata } from 'next';
import { I18nLayoutShell } from '@/components/i18n-layout-shell';
import { SiteChrome } from '@/components/site-chrome';
import { ThemeProvider } from '@/components/theme-provider';

const clashGrotesk = localFont({
  src: './fonts/ClashGrotesk-Bold.woff2',
  weight: '700',
  variable: '--font-clash-grotesk',
  display: 'swap',
});

const archivo = localFont({
  src: './fonts/Archivo-Regular.ttf',
  weight: '400',
  variable: '--font-archivo',
  display: 'swap',
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
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${clashGrotesk.variable} ${archivo.variable}`}
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
