import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  BoardNotFoundError,
  createBoard,
  DEFAULT_BOARD_NAME,
  deleteBoard,
  getBoard,
  listBoards,
  nextBoardName,
  renameBoard,
  validateBoardName,
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

describe('validateBoardName', () => {
  test('accepts a trimmed name and returns the trimmed value', () => {
    expect(validateBoardName('  Atelier vision  ')).toEqual({ ok: true, name: 'Atelier vision' });
  });

  test('rejects an empty or whitespace-only name', () => {
    expect(validateBoardName('')).toEqual({ ok: false });
    expect(validateBoardName('   ')).toEqual({ ok: false });
  });

  test('rejects a name longer than 100 characters', () => {
    expect(validateBoardName('a'.repeat(101))).toEqual({ ok: false });
  });
});

describe('nextBoardName', () => {
  test('returns the trimmed name when it is valid and different', () => {
    expect(nextBoardName('Rétro S12', '  Atelier vision ')).toBe('Atelier vision');
  });

  test('ignores an invalid name', () => {
    expect(nextBoardName('Rétro S12', '   ')).toBeNull();
  });

  test('ignores a name identical to the current one', () => {
    expect(nextBoardName('Rétro S12', ' Rétro S12 ')).toBeNull();
  });
});

describe('renameBoard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('[F01-S3-AC1] patches the name and returns the updated board', async () => {
    const renamed = { ...board, name: 'Atelier vision' };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(renamed), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await renameBoard(board.id, 'Atelier vision');

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/boards/${board.id}`,
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(result).toEqual(renamed);
  });

  test('throws when the server rejects the rename', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));

    await expect(renameBoard(board.id, '')).rejects.toThrow('400');
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

describe('deleteBoard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('[F01-S4-AC1] sends a DELETE request for the board', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await deleteBoard(board.id);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/boards/${board.id}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('throws when the server rejects the deletion', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));

    await expect(deleteBoard(board.id)).rejects.toThrow('404');
  });
});
