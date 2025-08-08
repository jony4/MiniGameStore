/**
 * HTML内容安全过滤系统
 * 用于检测和过滤恶意HTML内容，确保游戏提交的安全性
 */

// 安全配置接口
export interface SecurityConfig {
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  forbiddenPatterns: RegExp[];
  maxFileSize: number; // bytes
  allowedFileTypes: string[];
}

// 安全验证结果接口
export interface SecurityValidationResult {
  isValid: boolean;
  violations: string[];
  sanitizedContent?: string;
  warnings: string[];
}

// 文件验证结果接口
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  size: number;
  type: string;
}

// 默认安全配置
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  allowedTags: [
    'div',
    'span',
    'canvas',
    'script',
    'style',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'button',
    'input',
    'textarea',
    'select',
    'option',
    'label',
    'form',
    'img',
    'audio',
    'video',
    'br',
    'hr',
    'ul',
    'ol',
    'li',
    'table',
    'tr',
    'td',
    'th',
    'thead',
    'tbody',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'a',
  ],
  allowedAttributes: {
    '*': ['class', 'id', 'style', 'data-*'],
    canvas: ['width', 'height'],
    input: ['type', 'value', 'placeholder', 'name', 'required', 'disabled'],
    button: ['type', 'disabled'],
    img: ['src', 'alt', 'width', 'height'],
    audio: ['src', 'controls', 'autoplay', 'loop'],
    video: ['src', 'controls', 'autoplay', 'loop', 'width', 'height'],
    a: ['href', 'target', 'rel'],
    form: ['action', 'method'],
    select: ['name', 'required', 'disabled'],
    option: ['value', 'selected'],
    textarea: ['name', 'placeholder', 'rows', 'cols', 'required', 'disabled'],
  },
  forbiddenPatterns: [
    // 网络请求相关
    /fetch\s*\(/gi,
    /XMLHttpRequest/gi,
    /axios\./gi,
    /\$\.ajax/gi,
    /\$\.get/gi,
    /\$\.post/gi,
    
    // 存储访问
    /document\.cookie/gi,
    /localStorage/gi,
    /sessionStorage/gi,
    /indexedDB/gi,
    
    // 危险函数
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /setTimeout\s*\(\s*["'`][^"'`]*["'`]/gi, // 字符串形式的setTimeout
    /setInterval\s*\(\s*["'`][^"'`]*["'`]/gi, // 字符串形式的setInterval
    
    // DOM操作风险
    /document\.write/gi,
    /document\.writeln/gi,
    /innerHTML\s*=\s*["'`][^"'`]*<script/gi,
    
    // 外部资源加载
    /import\s*\(/gi,
    /require\s*\(/gi,
    /loadScript/gi,
    
    // 窗口操作
    /window\.open/gi,
    /window\.location/gi,
    /location\.href/gi,
    /location\.replace/gi,
    
    // 表单提交到外部
    /action\s*=\s*["'`]https?:\/\//gi,
    
    // WebSocket连接
    /WebSocket/gi,
    /EventSource/gi,
    
    // 文件API
    /FileReader/gi,
    /FormData/gi,
    /Blob/gi,
    /URL\.createObjectURL/gi,
  ],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['text/html', 'text/plain'],
};

/**
 * 验证HTML内容的安全性
 */
export function validateHtmlContent(
  htmlContent: string,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): SecurityValidationResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  
  // 检查文件大小
  const contentSize = new Blob([htmlContent]).size;
  if (contentSize > config.maxFileSize) {
    violations.push(`FILE_TOO_LARGE: 内容大小 ${contentSize} 字节超过限制 ${config.maxFileSize} 字节`);
  }
  
  // 检查禁用模式
  for (const pattern of config.forbiddenPatterns) {
    const matches = htmlContent.match(pattern);
    if (matches) {
      violations.push(`FORBIDDEN_PATTERN: 检测到禁用模式 "${pattern.source}" - 匹配: ${matches.slice(0, 3).join(', ')}`);
    }
  }
  
  // 检查标签使用
  const tagRegex = /<(\/?[a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  let tagMatch;
  const usedTags = new Set<string>();
  
  while ((tagMatch = tagRegex.exec(htmlContent)) !== null) {
    const tagName = tagMatch[1].toLowerCase().replace('/', '');
    usedTags.add(tagName);
    
    if (!config.allowedTags.includes(tagName)) {
      warnings.push(`SUSPICIOUS_TAG: 使用了可能不安全的标签 <${tagName}>`);
    }
  }
  
  // 检查属性使用
  const attrRegex = /<[^>]+\s+([a-zA-Z-]+)\s*=/g;
  let attrMatch;
  
  while ((attrMatch = attrRegex.exec(htmlContent)) !== null) {
    const attrName = attrMatch[1].toLowerCase();
    
    // 检查事件处理器
    if (attrName.startsWith('on')) {
      violations.push(`DANGEROUS_ATTRIBUTE: 检测到事件处理器属性 "${attrName}"`);
    }
    
    // 检查javascript: 协议
    if (htmlContent.includes(`${attrName}="javascript:`)) {
      violations.push(`JAVASCRIPT_PROTOCOL: 检测到javascript:协议在属性 "${attrName}" 中`);
    }
  }
  
  // 检查内联脚本内容
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  
  while ((scriptMatch = scriptRegex.exec(htmlContent)) !== null) {
    const scriptContent = scriptMatch[1];
    
    // 检查脚本内容中的危险模式
    for (const pattern of config.forbiddenPatterns) {
      if (pattern.test(scriptContent)) {
        violations.push(`MALICIOUS_SCRIPT: 脚本中检测到危险模式 "${pattern.source}"`);
      }
    }
    
    // 检查外部脚本引用
    if (scriptMatch[0].includes('src=')) {
      const srcMatch = scriptMatch[0].match(/src\s*=\s*["'`]([^"'`]+)["'`]/i);
      if (srcMatch && srcMatch[1].startsWith('http')) {
        violations.push(`EXTERNAL_SCRIPT: 检测到外部脚本引用 "${srcMatch[1]}"`);
      }
    }
  }
  
  // 检查CSS中的危险内容
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styleMatch;
  
  while ((styleMatch = styleRegex.exec(htmlContent)) !== null) {
    const styleContent = styleMatch[1];
    
    // 检查CSS中的javascript
    if (/javascript\s*:/gi.test(styleContent)) {
      violations.push(`CSS_JAVASCRIPT: CSS中检测到javascript协议`);
    }
    
    // 检查CSS中的表达式
    if (/expression\s*\(/gi.test(styleContent)) {
      violations.push(`CSS_EXPRESSION: CSS中检测到expression表达式`);
    }
    
    // 检查CSS中的外部资源
    if (/@import\s+url\s*\(\s*["'`]?https?:/gi.test(styleContent)) {
      violations.push(`CSS_EXTERNAL_IMPORT: CSS中检测到外部资源导入`);
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations,
    warnings,
    sanitizedContent: violations.length === 0 ? htmlContent : undefined,
  };
}

/**
 * 验证文件格式和大小
 */
export function validateFile(
  file: File,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): FileValidationResult {
  const errors: string[] = [];
  
  // 检查文件大小
  if (file.size > config.maxFileSize) {
    errors.push(`文件大小 ${file.size} 字节超过限制 ${config.maxFileSize} 字节`);
  }
  
  // 检查文件类型
  if (!config.allowedFileTypes.includes(file.type)) {
    errors.push(`不支持的文件类型: ${file.type}。支持的类型: ${config.allowedFileTypes.join(', ')}`);
  }
  
  // 检查文件扩展名
  const fileName = file.name.toLowerCase();
  const allowedExtensions = ['.html', '.htm', '.txt'];
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    errors.push(`不支持的文件扩展名。支持的扩展名: ${allowedExtensions.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    size: file.size,
    type: file.type,
  };
}

/**
 * 验证字符串内容的大小和格式
 */
export function validateStringContent(
  content: string,
  maxSize: number = DEFAULT_SECURITY_CONFIG.maxFileSize
): FileValidationResult {
  const errors: string[] = [];
  const contentSize = new Blob([content]).size;
  
  // 检查内容大小
  if (contentSize > maxSize) {
    errors.push(`内容大小 ${contentSize} 字节超过限制 ${maxSize} 字节`);
  }
  
  // 检查内容是否为空
  if (content.trim().length === 0) {
    errors.push('内容不能为空');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    size: contentSize,
    type: 'text/html',
  };
}

/**
 * 清理HTML内容中的危险元素（基础版本）
 */
export function sanitizeHtmlContent(
  htmlContent: string,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): string {
  let sanitized = htmlContent;
  
  // 移除所有事件处理器属性
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // 移除javascript:协议
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  
  // 移除危险的内联样式
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');
  
  return sanitized;
}

/**
 * 生成安全报告
 */
export function generateSecurityReport(
  htmlContent: string,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): {
  summary: string;
  details: SecurityValidationResult;
  recommendations: string[];
} {
  const details = validateHtmlContent(htmlContent, config);
  const recommendations: string[] = [];
  
  if (details.violations.length > 0) {
    recommendations.push('修复所有安全违规项目后重新提交');
    recommendations.push('避免使用外部资源和网络请求');
    recommendations.push('使用安全的DOM操作方法');
  }
  
  if (details.warnings.length > 0) {
    recommendations.push('检查警告项目，确保代码安全性');
    recommendations.push('考虑使用更安全的替代方案');
  }
  
  const summary = details.isValid 
    ? '内容通过安全检查' 
    : `发现 ${details.violations.length} 个安全问题`;
  
  return {
    summary,
    details,
    recommendations,
  };
}
