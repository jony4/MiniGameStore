import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HTML小游戏分享平台',
  description: '分享和发现有趣的HTML小游戏',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="text-2xl font-bold hover:text-primary"
                >
                  HTML小游戏平台
                </Link>
                <nav className="flex items-center space-x-6">
                  <Link
                    href="/"
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    首页
                  </Link>
                  <Link
                    href="/games"
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    游戏列表
                  </Link>
                  <Link
                    href="/submit"
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    提交游戏
                  </Link>
                  <Link
                    href="/admin"
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    管理
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
