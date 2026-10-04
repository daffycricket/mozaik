import { afterEach, describe, expect, test } from 'vitest';
import { useToolStore } from './tool-store';

afterEach(() => {
  useToolStore.setState({ tool: 'select' });
});

describe('[F02-S1-AC2] tool store', () => {
  test('[F02-S1-AC2] defaults to the selection tool and switches to the hand tool', () => {
    expect(useToolStore.getState().tool).toBe('select');
    useToolStore.getState().setTool('hand');
    expect(useToolStore.getState().tool).toBe('hand');
  });
});
