import './global.css';
import { HtmlLangSync, I18nProvider } from '@imbustai/i18n';
import en from '../lib/i18n/en.json';
import it from '../lib/i18n/it.json';
import { ThemeProvider } from '@/lib/theme-context';

export const metadata = {
  title: 'Imbustai - Tryout',
  description: 'An AI-powered letter-based storytelling experience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider>
          <I18nProvider
            messages={{
              en: en as Record<string, unknown>,
              it: it as Record<string, unknown>,
            }}
          >
            <HtmlLangSync />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
