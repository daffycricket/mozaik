import { type APIRequestContext, expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 800 } });

async function createBoard(
  request: APIRequestContext,
  name: string,
): Promise<{ id: string; name: string }> {
  const response = await request.post('/api/boards', { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string; name: string };
}

test('[UI-BOARD-11] turns the board name into an input at the same position on click', async ({
  page,
  request,
}) => {
  const board = await createBoard(request, `Position ${Date.now()}`);

  await page.goto(`/b/${board.id}`);
  const name = page.getByTestId('board-name');
  await expect(name).toBeVisible();
  const before = await name.boundingBox();

  await name.click();
  const input = page.getByTestId('board-name-input');
  await expect(input).toBeVisible();
  const after = await input.boundingBox();

  if (before === null || after === null) {
    throw new Error('Expected the name and the input to have a bounding box');
  }
  expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(4);
  expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(4);
});
