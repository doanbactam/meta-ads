import './globals.css';
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/lib/providers/query-provider';
import { UserSettingsProvider } from '@/lib/contexts/user-settings-context';
import { Toaster } from 'sonner';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'ad_manager | developer dashboard',
  description: 'minimalist campaign management dashboard for developers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorBackground: 'hsl(var(--background))',
          colorInputBackground: 'hsl(var(--background))',
          colorInputText: 'hsl(var(--foreground))',
          colorText: 'hsl(var(--foreground))',
          colorTextSecondary: 'hsl(var(--muted-foreground))',
          colorDanger: 'hsl(var(--destructive))',
        },
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
