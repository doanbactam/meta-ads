import './globals.css';
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/common/theme-provider';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { QueryProvider } from '@/lib/client/providers/query-provider';
import { UserSettingsProvider } from '@/lib/client/contexts/user-settings-context';
import { Toaster } from 'sonner';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'ad_manager | developer dashboard',
  description: 'minimalist campaign management dashboard for developers',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: 'hsl(var(--primary))' },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={jetbrainsMono.className}>
          <QueryProvider>
            <UserSettingsProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </UserSettingsProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
