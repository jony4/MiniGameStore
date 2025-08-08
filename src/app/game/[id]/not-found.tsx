import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GamepadIcon, ArrowLeft } from 'lucide-react';

export default function GameNotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <GamepadIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">游戏不存在</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            您访问的游戏不存在或尚未发布。可能的原因：
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
            <li>• 游戏链接有误</li>
            <li>• 游戏正在审核中</li>
            <li>• 游戏已被删除</li>
            <li>• 游戏审核未通过</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/games">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                浏览所有游戏
              </Button>
            </Link>
            <Link href="/submit">
              <Button variant="outline">
                提交新游戏
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}