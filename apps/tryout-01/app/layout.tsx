import './global.css';
import { I18nProvider } from '@/lib/i18n/context';

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
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
