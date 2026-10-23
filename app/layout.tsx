import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Navbar from '@/components/site/navbar';
import Footer from '@/components/site/footer';

const aeonik = localFont({
  src: [
    { path: '../public/fonts/AeonikPro-Light.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/AeonikPro-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/AeonikPro-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/AeonikPro-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/AeonikPro-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-aeonik',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'iOS 越狱雷达 · Jailbreak Radar',
  description: '监控 iOS 越狱生态：作者动态、工具发版、漏洞情报与设备可用性分析',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={aeonik.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden font-default">
        <div className="pointer-events-none fixed inset-0 z-[-1]">
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(168,85,247,0.14)_0,rgba(168,85,247,0)_70%)]" />
          <div className="absolute inset-0 noise" />
        </div>
        <Navbar />
        <main className="relative z-0 mx-auto mt-8 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
