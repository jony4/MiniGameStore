/**
 * 分享功能相关的工具函数
 */

/**
 * 生成游戏分享链接
 * @param gameId 游戏ID
 * @param baseUrl 基础URL，可选，默认使用当前域名
 * @returns 完整的游戏分享链接
 */
export function generateShareLink(gameId: string, baseUrl?: string): string {
  // 验证游戏ID格式
  if (!gameId || typeof gameId !== 'string' || gameId.trim().length === 0) {
    throw new Error('Invalid game ID');
  }

  // 清理游戏ID，移除可能的特殊字符
  const cleanGameId = gameId.trim().replace(/[^a-zA-Z0-9-_]/g, '');
  
  if (cleanGameId.length === 0) {
    throw new Error('Game ID contains no valid characters');
  }

  // 如果在浏览器环境且没有提供baseUrl，使用当前域名
  if (typeof window !== 'undefined' && !baseUrl) {
    baseUrl = window.location.origin;
  }

  // 如果仍然没有baseUrl，使用默认值（主要用于服务端渲染）
  if (!baseUrl) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  return `${baseUrl}/game/${cleanGameId}`;
}

/**
 * 验证分享链接是否有效
 * @param shareLink 分享链接
 * @returns 验证结果对象
 */
export function validateShareLink(shareLink: string): {
  isValid: boolean;
  gameId?: string;
  error?: string;
} {
  try {
    if (!shareLink || typeof shareLink !== 'string') {
      return { isValid: false, error: 'Invalid share link format' };
    }

    const url = new URL(shareLink);
    
    // 检查路径格式是否为 /game/[id]
    const pathMatch = url.pathname.match(/^\/game\/([a-zA-Z0-9-_]+)$/);
    
    if (!pathMatch) {
      return { isValid: false, error: 'Invalid game URL format' };
    }

    const gameId = pathMatch[1];
    
    // 验证游戏ID长度和格式
    if (gameId.length < 1 || gameId.length > 100) {
      return { isValid: false, error: 'Invalid game ID length' };
    }

    return { isValid: true, gameId };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * 从分享链接中提取游戏ID
 * @param shareLink 分享链接
 * @returns 游戏ID，如果无效则返回null
 */
export function extractGameIdFromShareLink(shareLink: string): string | null {
  const validation = validateShareLink(shareLink);
  return validation.isValid ? validation.gameId! : null;
}

/**
 * 检查是否为有效的游戏ID格式
 * @param gameId 游戏ID
 * @returns 是否有效
 */
export function isValidGameId(gameId: string): boolean {
  if (!gameId || typeof gameId !== 'string') {
    return false;
  }

  // 游戏ID应该只包含字母、数字、连字符和下划线
  const gameIdRegex = /^[a-zA-Z0-9-_]{1,100}$/;
  return gameIdRegex.test(gameId);
}

/**
 * 生成分享文本
 * @param gameTitle 游戏标题
 * @param shareLink 分享链接
 * @returns 格式化的分享文本
 */
export function generateShareText(gameTitle: string, shareLink: string): string {
  const cleanTitle = gameTitle.trim();
  return `来玩这个有趣的HTML小游戏：${cleanTitle}\n\n${shareLink}\n\n#HTML小游戏 #在线游戏`;
}

/**
 * 复制文本到剪贴板的工具函数
 * @param text 要复制的文本
 * @returns Promise<boolean> 是否成功复制
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 优先使用现代的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // 降级方案：使用传统的 execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}