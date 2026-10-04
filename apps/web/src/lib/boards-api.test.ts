import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  BoardNotFoundError,
  createBoard,
  DEFAULT_BOARD_NAME,
  getBoard,
  listBoards,
} from './boards-api';

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

describe('listBoards', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('reads and parses the board list', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([board]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await listBoards();

    expect(fetchMock).toHaveBeenCalledWith('/api/boards');
    expect(result).toEqual([board]);
  });

  test('throws when the server rejects the list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));

    await expect(listBoards()).rejects.toThrow('500');
  });
});

describe('getBoard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('reads and parses a single board', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(board), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await getBoard(board.id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/boards/${board.id}`);
    expect(result).toEqual(board);
  });

  test('throws when the board does not exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));

    await expect(getBoard('missing')).rejects.toThrow('404');
  });

  test('[F01-S5-AC1] throws a typed not found error on a missing board', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));

    await expect(getBoard('missing')).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});
