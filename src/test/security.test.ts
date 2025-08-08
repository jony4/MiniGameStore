import { describe, it, expect } from 'vitest';
import {
  validateHtmlContent,
  validateFile,
  validateStringContent,
  sanitizeHtmlContent,
  generateSecurityReport,
  DEFAULT_SECURITY_CONFIG,
  SecurityConfig,
} from '../lib/security';

describe('HTML内容安全过滤系统', () => {
  describe('validateHtmlContent', () => {
    it('应该允许安全的HTML内容', () => {
      const safeHtml = `
        <div id="game">
          <canvas width="800" height="600"></canvas>
          <button type="button">开始游戏</button>
        </div>
        <script>
          const canvas = document.getElementById('canvas');
          const ctx = canvas.getContext('2d');
          // 安全的游戏逻辑
        </script>
      `;
      
      const result = validateHtmlContent(safeHtml);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.sanitizedContent).toBe(safeHtml);
    });

    it('应该拒绝包含fetch请求的HTML', () => {
      const maliciousHtml = `
        <script>
          fetch('/api/admin').then(res => res.json());
        </script>
      `;
      
      const result = validateHtmlContent(maliciousHtml);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('FORBIDDEN_PATTERN'))).toBe(true);
      expect(result.violations.some(v => v.includes('fetch'))).toBe(true);
    });

    it('应该拒绝包含XMLHttpRequest的HTML', () => {
      const maliciousHtml = `
        <script>
          const xhr = new XMLHttpRequest();
          xhr.open('GET', '/api/data');
        </script>
      `;
      
      const result = validateHtmlContent(maliciousHtml);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('XMLHttpRequest'))).toBe(true);
    });

    it('应该拒绝访问localStorage的HTML', () => {
      const maliciousHtml = `
        <script>
          localStorage.setItem('token', 'malicious');
        </script>
      `;
      
      const result = validateHtmlContent(maliciousHtml);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('localStorage'))).toBe(true);
    });

    it('应该拒绝访问document.cookie的HTML', () => {
      const maliciousHtml = `
        <script>
          const cookies = document.cookie;
        </script>
      `;
      
      const result = validateHtmlContent(maliciousHtml);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('document.cookie'))).toBe(true);
    });

    it('应该拒绝eval函数的HTML', () => {
      const maliciousHtml = `
        <script>
          eval('alert("xss")');
        </script>
      `;
      
      const result = validateHtmlContent(maliciousHtml);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('eval'))).toBe(true);
    });

    it('应该拒绝事件处理器属性', () => {
      const maliciousHtml = `
        <button onclick="alert('xss')">点击</button>
        <div onmouseover="maliciousFunction()">悬停</div>
      `;
      
      const result = validateHtmlContent(maliciousHtml);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('DANGEROUS_ATTRIBUTE'))).toBe(true);
      expect(result.violations.some(v => v.includes('onclick'))).toBe(true);
    });

    it('应该拒绝javascript:协议', () => {
      const maliciousHtml = `
        <a href="javascript:alert('xss')">链接</a>
      `;
      
      const result = validateHtmlContent(maliciousHtml);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('JAVASCRIPT_PROTOCOL'))).toBe(true);
    });

    it('应该拒绝外部脚本引用', () => {
      const maliciousHtml = `
        <script src="https://malicious.com/script.js"></script>
      `;
      
      const result = validateHtmlContent(maliciousHtml);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('EXTERNAL_SCRIPT'))).toBe(true);
    });

    it('应该检测CSS中的javascript协议', () => {
      const maliciousHtml = `
        <style>
          .malicious {
            background: url('javascript:alert("xss")');
          }
        </style>
      `;
      
      const result = validateHtmlContent(maliciousHtml);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('CSS_JAVASCRIPT'))).toBe(true);
    });

    it('应该检测CSS中的expression表达式', () => {
      const maliciousHtml = `
        <style>
          .malicious {
            width: expression(alert('xss'));
          }
        </style>
      `;
      
      const result = validateHtmlContent(maliciousHtml);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('CSS_EXPRESSION'))).toBe(true);
    });

    it('应该检测文件大小超限', () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      
      const result = validateHtmlContent(largeContent);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('FILE_TOO_LARGE'))).toBe(true);
    });

    it('应该警告可疑标签的使用', () => {
      const suspiciousHtml = `
        <object data="malicious.swf"></object>
        <embed src="malicious.swf"></embed>
      `;
      
      const result = validateHtmlContent(suspiciousHtml);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('SUSPICIOUS_TAG'))).toBe(true);
    });

    it('应该使用自定义安全配置', () => {
      const customConfig: SecurityConfig = {
        ...DEFAULT_SECURITY_CONFIG,
        forbiddenPatterns: [/customPattern/gi],
      };
      
      const htmlWithCustomPattern = `
        <script>
          customPattern();
        </script>
      `;
      
      const result = validateHtmlContent(htmlWithCustomPattern, customConfig);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('customPattern'))).toBe(true);
    });
  });

  describe('validateFile', () => {
    it('应该接受有效的HTML文件', () => {
      const validFile = new File(['<html></html>'], 'game.html', {
        type: 'text/html',
      });
      
      const result = validateFile(validFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.type).toBe('text/html');
    });

    it('应该拒绝过大的文件', () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      const largeFile = new File([largeContent], 'large.html', {
        type: 'text/html',
      });
      
      const result = validateFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('超过限制'))).toBe(true);
    });

    it('应该拒绝不支持的文件类型', () => {
      const invalidFile = new File(['content'], 'script.js', {
        type: 'application/javascript',
      });
      
      const result = validateFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('不支持的文件类型'))).toBe(true);
    });

    it('应该拒绝不支持的文件扩展名', () => {
      const invalidFile = new File(['content'], 'script.php', {
        type: 'text/html',
      });
      
      const result = validateFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('不支持的文件扩展名'))).toBe(true);
    });

    it('应该接受.htm扩展名', () => {
      const validFile = new File(['<html></html>'], 'game.htm', {
        type: 'text/html',
      });
      
      const result = validateFile(validFile);
      expect(result.isValid).toBe(true);
    });

    it('应该接受.txt扩展名', () => {
      const validFile = new File(['<html></html>'], 'game.txt', {
        type: 'text/plain',
      });
      
      const result = validateFile(validFile);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateStringContent', () => {
    it('应该接受有效的字符串内容', () => {
      const validContent = '<html><body>Hello World</body></html>';
      
      const result = validateStringContent(validContent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.type).toBe('text/html');
    });

    it('应该拒绝空内容', () => {
      const emptyContent = '   ';
      
      const result = validateStringContent(emptyContent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('内容不能为空');
    });

    it('应该拒绝过大的内容', () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      
      const result = validateStringContent(largeContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('超过限制'))).toBe(true);
    });

    it('应该使用自定义大小限制', () => {
      const content = 'x'.repeat(1000);
      const customLimit = 500;
      
      const result = validateStringContent(content, customLimit);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('超过限制'))).toBe(true);
    });
  });

  describe('sanitizeHtmlContent', () => {
    it('应该移除事件处理器属性', () => {
      const maliciousHtml = `
        <button onclick="alert('xss')" onmouseover="malicious()">
          点击
        </button>
      `;
      
      const sanitized = sanitizeHtmlContent(maliciousHtml);
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('onmouseover');
      expect(sanitized).toContain('<button');
      expect(sanitized).toContain('点击');
    });

    it('应该移除javascript:协议', () => {
      const maliciousHtml = `
        <a href="javascript:alert('xss')">链接</a>
      `;
      
      const sanitized = sanitizeHtmlContent(maliciousHtml);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('<a href');
      expect(sanitized).toContain('链接');
    });

    it('应该移除危险的内联样式', () => {
      const maliciousHtml = `
        <div style="width: expression(alert('xss'));">内容</div>
      `;
      
      const sanitized = sanitizeHtmlContent(maliciousHtml);
      expect(sanitized).not.toContain('expression');
      expect(sanitized).toContain('<div');
      expect(sanitized).toContain('内容');
    });

    it('应该保留安全的内容', () => {
      const safeHtml = `
        <div class="game" id="main">
          <canvas width="800" height="600"></canvas>
          <button type="button">开始</button>
        </div>
      `;
      
      const sanitized = sanitizeHtmlContent(safeHtml);
      expect(sanitized).toContain('class="game"');
      expect(sanitized).toContain('id="main"');
      expect(sanitized).toContain('<canvas');
      expect(sanitized).toContain('width="800"');
    });
  });

  describe('generateSecurityReport', () => {
    it('应该为安全内容生成正面报告', () => {
      const safeHtml = `
        <div id="game">
          <canvas></canvas>
        </div>
      `;
      
      const report = generateSecurityReport(safeHtml);
      expect(report.summary).toBe('内容通过安全检查');
      expect(report.details.isValid).toBe(true);
      expect(report.recommendations).toHaveLength(0);
    });

    it('应该为危险内容生成详细报告', () => {
      const maliciousHtml = `
        <script>
          fetch('/api/data');
          eval('malicious code');
        </script>
        <button onclick="alert('xss')">点击</button>
      `;
      
      const report = generateSecurityReport(maliciousHtml);
      expect(report.summary).toContain('发现');
      expect(report.summary).toContain('安全问题');
      expect(report.details.isValid).toBe(false);
      expect(report.details.violations.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(r => r.includes('修复所有安全违规'))).toBe(true);
    });

    it('应该为有警告的内容提供建议', () => {
      const suspiciousHtml = `
        <object data="content.swf"></object>
      `;
      
      const report = generateSecurityReport(suspiciousHtml);
      expect(report.details.warnings.length).toBeGreaterThan(0);
      expect(report.recommendations.some(r => r.includes('检查警告项目'))).toBe(true);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空字符串', () => {
      const result = validateHtmlContent('');
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('应该处理只有空白字符的内容', () => {
      const result = validateHtmlContent('   \n\t   ');
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('应该处理复杂的嵌套HTML', () => {
      const complexHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>游戏</title>
          <style>
            .game { width: 100%; }
            .button { padding: 10px; }
          </style>
        </head>
        <body>
          <div class="game">
            <canvas id="gameCanvas" width="800" height="600"></canvas>
            <div class="controls">
              <button type="button" class="button">开始</button>
              <button type="button" class="button">暂停</button>
            </div>
          </div>
          <script>
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            
            function drawGame() {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = 'blue';
              ctx.fillRect(100, 100, 50, 50);
            }
            
            drawGame();
          </script>
        </body>
        </html>
      `;
      
      const result = validateHtmlContent(complexHtml);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('应该处理Unicode字符', () => {
      const unicodeHtml = `
        <div>
          <h1>🎮 游戏标题 🎮</h1>
          <p>这是一个包含中文和emoji的游戏描述</p>
        </div>
      `;
      
      const result = validateHtmlContent(unicodeHtml);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });
});