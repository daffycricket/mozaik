import { afterEach, describe, expect, test, vi } from 'vitest';
import { createBoard, DEFAULT_BOARD_NAME } from './boards-api';

const board = {
  id: 'abc123456789',
  name: 'Rétro S12',
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
};

describe('createBoard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('posts the name and returns the created board', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(board), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await createBoard(DEFAULT_BOARD_NAME);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/boards',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual(board);
  });

  test('throws when the server rejects the creation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));

    await expect(createBoard('')).rejects.toThrow('400');
  });
});
