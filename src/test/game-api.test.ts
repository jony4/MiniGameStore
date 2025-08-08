import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/games/[id]/route';
import { GameDAL } from '@/lib/dal';

// Mock the GameDAL
vi.mock('@/lib/dal');

describe('Game API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return game data for valid approved game', async () => {
    const mockGame = {
      id: 'valid-game-id',
      title: 'Test Game',
      description: 'A test game',
      htmlContent: '<canvas></canvas>',
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

    const request = new NextRequest('http://localhost:3000/api/games/valid-game-id');
    const response = await GET(request, { params: { id: 'valid-game-id' } });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockGame);
  });

  it('should return 404 for non-existent game', async () => {
    vi.mocked(GameDAL.getByIdWithMetadata).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/games/non-existent');
    const response = await GET(request, { params: { id: 'non-existent' } });
    
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('GAME_NOT_FOUND');
  });

  it('should return 404 for pending game', async () => {
    const mockPendingGame = {
      id: 'pending-game-id',
      title: 'Pending Game',
      description: 'A pending game',
      htmlContent: '<canvas></canvas>',
      authorName: 'Test Author',
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedAt: null,
      approvedBy: null,
      rejectionReason: null,
      isApproved: false,
      isPending: true,
      isRejected: false,
      canBeShared: false,
    };

    vi.mocked(GameDAL.getByIdWithMetadata).mockResolvedValue(mockPendingGame);

    const request = new NextRequest('http://localhost:3000/api/games/pending-game-id');
    const response = await GET(request, { params: { id: 'pending-game-id' } });
    
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('GAME_NOT_FOUND');
  });

  it('should return 400 for invalid game ID format', async () => {
    const request = new NextRequest('http://localhost:3000/api/games/invalid-id');
    const response = await GET(request, { params: { id: 'invalid-id' } });
    
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('should return 500 for database errors', async () => {
    vi.mocked(GameDAL.getByIdWithMetadata).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/games/some-uuid-format-id');
    const response = await GET(request, { params: { id: 'some-uuid-format-id' } });
    
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('DATABASE_ERROR');
  });
});