'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface GameRendererProps {
  htmlContent: string;
  title: string;
  className?: string;
}

export function GameRenderer({ htmlContent, title, className }: GameRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // 创建安全的iframe内容
    const createSecureContent = (content: string) => {
      return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f8f9fa;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `;
    };

    try {
      // 设置iframe内容
      const secureContent = createSecureContent(htmlContent);
      const blob = new Blob([secureContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      iframe.src = url;
      
      // 监听iframe加载完成
      const handleLoad = () => {
        setIsLoading(false);
        setHasError(false);
        
        // 清理blob URL
        URL.revokeObjectURL(url);
      };

      const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        URL.revokeObjectURL(url);
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      // 清理函数
      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error('Error creating game content:', error);
      setIsLoading(false);
      setHasError(true);
    }
  }, [htmlContent, title]);

  if (hasError) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">游戏加载失败</h3>
            <p className="text-muted-foreground">
              游戏内容无法正常显示，请稍后重试
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">游戏加载中...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          title={`游戏: ${title}`}
          className="w-full h-[600px] border-0 rounded-lg"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          loading="lazy"
          style={{
            minHeight: '400px',
            maxHeight: '800px',
          }}
        />
      </CardContent>
    </Card>
  );
}