'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gameSubmissionSchema, type GameSubmissionInput } from '@/lib/validation';
import { validateHtmlContent, validateStringContent, validateFile } from '@/lib/security';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface GameSubmissionFormProps {
  onSuccess?: (gameId: string) => void;
}

type SubmissionMethod = 'paste' | 'upload';

export default function GameSubmissionForm({ onSuccess }: GameSubmissionFormProps) {
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>('paste');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GameSubmissionInput>({
    resolver: zodResolver(gameSubmissionSchema),
    defaultValues: {
      title: '',
      description: '',
      htmlContent: '',
      authorName: '',
    },
  });

  const htmlContent = watch('htmlContent');

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      toast({
        title: '文件验证失败',
        description: fileValidation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
      const content = await file.text();
      
      // 验证内容大小
      const contentValidation = validateStringContent(content);
      if (!contentValidation.isValid) {
        toast({
          title: '内容验证失败',
          description: contentValidation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      // 验证HTML安全性
      const securityValidation = validateHtmlContent(content);
      if (!securityValidation.isValid) {
        toast({
          title: 'HTML内容不安全',
          description: '检测到不安全的内容，请修改后重新上传',
          variant: 'destructive',
        });
        return;
      }

      setUploadedFile(file);
      setValue('htmlContent', content);
      setSecurityWarnings(securityValidation.warnings);

      if (securityValidation.warnings.length > 0) {
        toast({
          title: '安全警告',
          description: `检测到 ${securityValidation.warnings.length} 个潜在问题，请检查代码`,
          variant: 'warning',
        });
      }
    } catch (error) {
      toast({
        title: '文件读取失败',
        description: '无法读取文件内容，请确保文件格式正确',
        variant: 'destructive',
      });
    }
  };

  // 处理HTML内容变化（粘贴模式）
  const handleHtmlContentChange = (content: string) => {
    setValue('htmlContent', content);
    
    if (content.trim()) {
      // 验证内容大小
      const contentValidation = validateStringContent(content);
      if (!contentValidation.isValid) {
        setSecurityWarnings([]);
        return;
      }

      // 验证HTML安全性
      const securityValidation = validateHtmlContent(content);
      setSecurityWarnings(securityValidation.warnings);
    } else {
      setSecurityWarnings([]);
    }
  };

  // 提交表单
  const onSubmit = async (data: GameSubmissionInput) => {
    setIsSubmitting(true);
    
    try {
      // 最终安全验证
      const securityValidation = validateHtmlContent(data.htmlContent);
      if (!securityValidation.isValid) {
        toast({
          title: '提交失败',
          description: 'HTML内容包含不安全的元素',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '提交失败');
      }

      toast({
        title: '提交成功',
        description: '游戏已提交，等待审核',
        variant: 'success',
      });

      // 重置表单
      reset();
      setUploadedFile(null);
      setSecurityWarnings([]);

      // 调用成功回调
      if (onSuccess && result.game?.id) {
        onSuccess(result.game.id);
      }

      // 显示警告信息（如果有）
      if (result.warnings && result.warnings.length > 0) {
        setTimeout(() => {
          toast({
            title: '安全提醒',
            description: `检测到 ${result.warnings.length} 个潜在问题，但游戏已成功提交`,
            variant: 'warning',
          });
        }, 1000);
      }
    } catch (error) {
      console.error('提交游戏失败:', error);
      toast({
        title: '提交失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>提交HTML小游戏</CardTitle>
        <CardDescription>
          上传您的HTML小游戏与大家分享。所有提交的游戏都需要经过审核才能发布。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 游戏标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">游戏标题 *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="请输入游戏标题"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* 游戏描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">游戏描述</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="请简单描述您的游戏（可选）"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* 作者名称 */}
          <div className="space-y-2">
            <Label htmlFor="authorName">作者名称</Label>
            <Input
              id="authorName"
              {...register('authorName')}
              placeholder="请输入您的名称（可选，留空则匿名提交）"
              className={errors.authorName ? 'border-red-500' : ''}
            />
            {errors.authorName && (
              <p className="text-sm text-red-500">{errors.authorName.message}</p>
            )}
          </div>

          {/* 提交方式选择 */}
          <div className="space-y-4">
            <Label>HTML内容提交方式</Label>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={submissionMethod === 'paste' ? 'default' : 'outline'}
                onClick={() => setSubmissionMethod('paste')}
                className="flex-1"
              >
                粘贴HTML代码
              </Button>
              <Button
                type="button"
                variant={submissionMethod === 'upload' ? 'default' : 'outline'}
                onClick={() => setSubmissionMethod('upload')}
                className="flex-1"
              >
                上传HTML文件
              </Button>
            </div>
          </div>

          {/* HTML内容输入 */}
          {submissionMethod === 'paste' ? (
            <div className="space-y-2">
              <Label htmlFor="htmlContent">HTML代码 *</Label>
              <Textarea
                id="htmlContent"
                {...register('htmlContent')}
                onChange={(e) => handleHtmlContentChange(e.target.value)}
                placeholder="请粘贴您的HTML游戏代码..."
                rows={10}
                className={`font-mono text-sm ${errors.htmlContent ? 'border-red-500' : ''}`}
              />
              {errors.htmlContent && (
                <p className="text-sm text-red-500">{errors.htmlContent.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="fileUpload">选择HTML文件 *</Label>
              <Input
                id="fileUpload"
                type="file"
                accept=".html,.htm,.txt"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {uploadedFile && (
                <p className="text-sm text-green-600">
                  已选择文件: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)}KB)
                </p>
              )}
              {errors.htmlContent && (
                <p className="text-sm text-red-500">{errors.htmlContent.message}</p>
              )}
            </div>
          )}

          {/* 安全警告 */}
          {securityWarnings.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">安全提醒</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {securityWarnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-yellow-600 mt-2">
                这些警告不会阻止提交，但建议您检查代码以确保安全性。
              </p>
            </div>
          )}

          {/* 内容预览信息 */}
          {htmlContent && (
            <div className="p-3 bg-gray-50 border rounded-md">
              <p className="text-sm text-gray-600">
                内容大小: {Math.round(new Blob([htmlContent]).size / 1024)}KB / 5MB
              </p>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setUploadedFile(null);
                setSecurityWarnings([]);
              }}
              disabled={isSubmitting}
            >
              重置
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '提交游戏'}
            </Button>
          </div>
        </form>

        {/* 提交须知 */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">提交须知</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 游戏文件大小不能超过5MB</li>
            <li>• 支持HTML、CSS、JavaScript的完整游戏</li>
            <li>• 不允许包含外部网络请求和恶意代码</li>
            <li>• 所有游戏都需要经过审核才能发布</li>
            <li>• 请确保游戏内容健康向上，适合所有年龄段</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}