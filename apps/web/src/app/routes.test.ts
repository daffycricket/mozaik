import { afterEach, describe, expect, test, vi } from 'vitest';
import { getLocationPath, navigate, parsePath, subscribeToLocation } from './routes';

describe('parsePath', () => {
  test('maps the root to the board list', () => {
    expect(parsePath('/')).toEqual({ kind: 'board-list' });
  });

  test('maps /b/:id to a board route', () => {
    expect(parsePath('/b/abc123')).toEqual({ kind: 'board', boardId: 'abc123' });
    expect(parsePath('/b/abc123/')).toEqual({ kind: 'board', boardId: 'abc123' });
  });

  test('falls back to the board list for unknown paths', () => {
    expect(parsePath('/unknown')).toEqual({ kind: 'board-list' });
  });
});

describe('navigate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('pushes a history entry and notifies the router', () => {
    const pushState = vi.fn();
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { history: { pushState }, dispatchEvent });

    navigate('/b/abc123');

    expect(pushState).toHaveBeenCalledWith({}, '', '/b/abc123');
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
  });
});

describe('subscribeToLocation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('listens to back/forward and internal navigation, then cleans up', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal('window', { addEventListener, removeEventListener });
    const onChange = vi.fn();

    const unsubscribe = subscribeToLocation(onChange);

    expect(addEventListener).toHaveBeenCalledWith('popstate', onChange);
    expect(addEventListener).toHaveBeenCalledWith('mozaik:navigate', onChange);

    unsubscribe();

    expect(removeEventListener).toHaveBeenCalledWith('popstate', onChange);
    expect(removeEventListener).toHaveBeenCalledWith('mozaik:navigate', onChange);
  });
});

describe('getLocationPath', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('returns the current pathname', () => {
    vi.stubGlobal('window', { location: { pathname: '/b/abc' } });

    expect(getLocationPath()).toBe('/b/abc');
  });
});
