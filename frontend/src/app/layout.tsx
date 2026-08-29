import type { Metadata } from "next";
import { Mulish, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontSans = Mulish({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Razor-Relay",
  description: "The Sovereign Gateway for Agentic Commerce.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const antiTrackerScript = `
    if (typeof document !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
            mutation.target.removeAttribute('bis_skin_checked');
          }
        });
      });
      observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['bis_skin_checked'] });
      document.querySelectorAll('[bis_skin_checked]').forEach(el => el.removeAttribute('bis_skin_checked'));
    }
  `;

  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('razorpay_theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          })();
        ` }} suppressHydrationWarning />
        <script dangerouslySetInnerHTML={{ __html: antiTrackerScript }} suppressHydrationWarning />
        {children}
      </body>
    </html>
  );
}
