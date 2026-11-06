import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Public_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { ApiProvider } from './api-provider';
import './globals.css';

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-public-sans',
});

export const metadata: Metadata = {
  title: 'Doctor Tracker',
  description: 'Hospital patient and doctor management portal.',
  icons: {
    icon: '/logo.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value;
  const isDark = theme === 'dark';

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full bg-canvas overflow-x-hidden ${isDark ? 'dark' : ''} ${publicSans.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)theme=(dark|light)/);var t=m?m[1]:localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');document.cookie='theme=dark;path=/;max-age=31536000;SameSite=Lax';}else if(t==='light'){document.documentElement.classList.remove('dark');document.cookie='theme=light;path=/;max-age=31536000;SameSite=Lax';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full font-sans text-ink antialiased overflow-x-hidden">
        <ApiProvider>{children}</ApiProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
