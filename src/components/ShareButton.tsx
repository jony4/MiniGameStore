'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Link, QrCode, Check, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { generateShareLink, copyToClipboard, generateShareText } from '@/lib/share';

interface ShareButtonProps {
  gameId: string;
  gameTitle: string;
  className?: string;
}

export function ShareButton({ gameId, gameTitle, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // 使用工具函数生成分享链接
  const gameUrl = generateShareLink(gameId);

  const trackShare = async (shareType: 'link' | 'qrcode' | 'text') => {
    try {
      await fetch('/api/share/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          shareType,
        }),
      });
    } catch (error) {
      // 静默处理跟踪错误，不影响用户体验
      console.warn('Failed to track share event:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      const success = await copyToClipboard(gameUrl);
      
      if (success) {
        setCopied(true);
        toast({
          title: '链接已复制',
          description: '游戏链接已复制到剪贴板',
        });
        
        // 跟踪分享事件
        trackShare('link');
        
        // 重置复制状态
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Copy failed');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: '复制失败',
        description: '无法复制链接到剪贴板，请手动复制',
        variant: 'destructive',
      });
    }
  };

  const handleCopyShareText = async () => {
    try {
      const shareText = generateShareText(gameTitle, gameUrl);
      const success = await copyToClipboard(shareText);
      
      if (success) {
        toast({
          title: '分享文本已复制',
          description: '包含游戏介绍的分享文本已复制到剪贴板',
        });
        
        // 跟踪分享事件
        trackShare('text');
      } else {
        throw new Error('Copy failed');
      }
    } catch (error) {
      console.error('Failed to copy share text:', error);
      toast({
        title: '复制失败',
        description: '无法复制分享文本，请手动复制',
        variant: 'destructive',
      });
    }
  };

  const generateQRCode = async () => {
    try {
      // 使用本地qrcode库生成二维码
      const qrDataUrl = await QRCode.toDataURL(gameUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // 在新窗口中打开二维码
      const newWindow = window.open('', '_blank', 'width=300,height=350');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>游戏二维码 - ${gameTitle}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  text-align: center;
                  background: #f8f9fa;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .container {
                  background: white;
                  padding: 24px;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  display: inline-block;
                  max-width: 280px;
                }
                h3 {
                  margin: 0 0 16px 0;
                  color: #333;
                  font-size: 18px;
                  font-weight: 600;
                  word-break: break-word;
                }
                .qr-container {
                  margin: 16px 0;
                  padding: 12px;
                  background: #f8f9fa;
                  border-radius: 8px;
                  display: inline-block;
                }
                img {
                  display: block;
                  border-radius: 4px;
                }
                p {
                  color: #666;
                  font-size: 14px;
                  margin: 16px 0 0 0;
                  line-height: 1.4;
                }
                .url {
                  font-size: 12px;
                  color: #888;
                  word-break: break-all;
                  margin-top: 8px;
                  padding: 8px;
                  background: #f0f0f0;
                  border-radius: 4px;
                }
                @media (max-width: 320px) {
                  .container {
                    padding: 16px;
                    max-width: 240px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h3>${gameTitle}</h3>
                <div class="qr-container">
                  <img src="${qrDataUrl}" alt="游戏二维码" />
                </div>
                <p>扫描二维码访问游戏</p>
                <div class="url">${gameUrl}</div>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
        
        toast({
          title: '二维码已生成',
          description: '二维码已在新窗口中打开',
        });
        
        // 跟踪分享事件
        trackShare('qrcode');
      } else {
        toast({
          title: '无法打开二维码',
          description: '请允许弹出窗口以显示二维码',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: '生成失败',
        description: '无法生成二维码，请稍后重试',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          分享游戏
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Link className="h-4 w-4 mr-2" />
          )}
          {copied ? '已复制链接' : '复制链接'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyShareText} className="cursor-pointer">
          <MessageSquare className="h-4 w-4 mr-2" />
          复制分享文本
        </DropdownMenuItem>
        <DropdownMenuItem onClick={generateQRCode} className="cursor-pointer">
          <QrCode className="h-4 w-4 mr-2" />
          生成二维码
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}