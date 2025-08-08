import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameDAL } from '@/lib/dal';
import { validateHtmlContent } from '@/lib/security';

// Mock the database
vi.mock('@/lib/dal');

describe('Game Rendering System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Game Data Fetching', () => {
    it('should fetch game data with metadata', async () => {
      const mockGame = {
        id: 'test-game-id',
        title: 'Test Game',
        description: 'A test game',
        htmlContent: '<canvas id="game"></canvas>',
        authorName: 'Test Author',
        status: 'approved' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: 'admin',
        rejectionReason: null,
        isApproved: true,
        isPending: false,
        isRejected: false,
        canBeShared: true,
      };

      vi.mocked(GameDAL.getByIdWithMetadata).mockResolvedValue(mockGame);

      const result = await GameDAL.getByIdWithMetadata('test-game-id');
      
      expect(result).toEqual(mockGame);
      expect(result?.isApproved).toBe(true);
      expect(result?.canBeShared).toBe(true);
    });

    it('should return null for non-existent game', async () => {
      vi.mocked(GameDAL.getByIdWithMetadata).mockResolvedValue(null);

      const result = await GameDAL.getByIdWithMetadata('non-existent-id');
      
      expect(result).toBeNull();
    });
  });

  describe('HTML Content Security', () => {
    it('should validate safe HTML content', () => {
      const safeHtml = `
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        <script>
          const canvas = document.getElementById('gameCanvas');
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'red';
          ctx.fillRect(10, 10, 50, 50);
        </script>
      `;

      const result = validateHtmlContent(safeHtml);
      
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect malicious HTML content', () => {
      const maliciousHtml = `
        <script>
          fetch('/api/admin/secret').then(r => r.json()).then(console.log);
        </script>
      `;

      const result = validateHtmlContent(maliciousHtml);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.includes('FORBIDDEN_PATTERN'))).toBe(true);
    });

    it('should detect dangerous attributes', () => {
      const dangerousHtml = `
        <div onclick="alert('xss')">Click me</div>
        <img src="x" onerror="alert('xss')">
      `;

      const result = validateHtmlContent(dangerousHtml);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('DANGEROUS_ATTRIBUTE'))).toBe(true);
    });

    it('should detect external script sources', () => {
      const externalScriptHtml = `
        <script src="https://evil.com/malicious.js"></script>
      `;

      const result = validateHtmlContent(externalScriptHtml);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('EXTERNAL_SCRIPT'))).toBe(true);
    });
  });

  describe('Content Size Validation', () => {
    it('should reject content that is too large', () => {
      // Create a large HTML content (over 5MB)
      const largeContent = '<div>' + 'x'.repeat(6 * 1024 * 1024) + '</div>';

      const result = validateHtmlContent(largeContent);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('FILE_TOO_LARGE'))).toBe(true);
    });

    it('should accept content within size limits', () => {
      const normalContent = '<canvas id="game"></canvas><script>console.log("Hello");</script>';

      const result = validateHtmlContent(normalContent);
      
      // Should not fail due to size (may fail due to other security checks)
      expect(result.violations.some(v => v.includes('FILE_TOO_LARGE'))).toBe(false);
    });
  });
});

describe('Game Metadata Display', () => {
  it('should format dates correctly', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');
    const formatted = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(testDate);

    expect(formatted).toContain('2024');
    expect(formatted).toContain('1月');
    expect(formatted).toContain('15');
  });

  it('should handle null dates gracefully', () => {
    const formatDate = (date: Date | null) => {
      if (!date) return '未知';
      return new Intl.DateTimeFormat('zh-CN').format(new Date(date));
    };

    expect(formatDate(null)).toBe('未知');
    expect(formatDate(new Date('2024-01-15'))).toContain('2024');
  });
});

describe('Share Functionality', () => {
  it('should generate correct game URLs', () => {
    const gameId = 'test-game-123';
    const expectedUrl = `${window.location.origin}/game/${gameId}`;
    
    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://example.com'
      },
      writable: true
    });

    const gameUrl = `${window.location.origin}/game/${gameId}`;
    
    expect(gameUrl).toBe('https://example.com/game/test-game-123');
  });

  it('should generate QR code URLs correctly', () => {
    const gameUrl = 'https://example.com/game/test-123';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(gameUrl)}`;
    
    expect(qrUrl).toContain('api.qrserver.com');
    expect(qrUrl).toContain(encodeURIComponent(gameUrl));
  });
});