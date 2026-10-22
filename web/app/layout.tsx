import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import MobileZoomDisabler from "@/components/MobileZoomDisabler";
import AnnouncementTicker from "@/components/ticker/AnnouncementTicker";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0B2A8A",
};

export const metadata: Metadata = {
  title: "SHASHI HULIKUNTEMUTT · Electoral Lookup - South-East Graduates' Constituency",
  description: "Official portal for voter profile lookup and polling updates for candidate Shashi Hulikuntemutt across Karnataka Legislative Council rolls",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SHASHI HULIKUNTEMUTT",
  },
  icons: {
    icon: [
      { url: "/app-logo.png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/app-logo.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Noto Sans Kannada & Noto Sans Google Fonts with display=swap */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;600;700;800&family=Noto+Sans:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />

        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" href="/app-logo.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SHASHI HULIKUNTEMUTT" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__pwaInstallPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__pwaInstallPrompt = e;
                window.dispatchEvent(new CustomEvent('pwa-prompt-available', { detail: e }));
              });
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(reg) {
                  if (reg && reg.update) reg.update();
                }).catch(function(){});
              }
            `,
          }}
        />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans">
        <MobileZoomDisabler />
        <LanguageProvider>
          {/* 1. Full-width Announcement Ticker at the very top, above any header */}
          <AnnouncementTicker />

          {/* 2. Main Page Content Viewport */}
          {children}

          {/* 3. Non-intrusive Opt-in Push Notification Prompt */}
          <PushNotificationPrompt />
        </LanguageProvider>
      </body>
    </html>
  );
}
