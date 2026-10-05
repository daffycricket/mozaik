import { expect, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { installProbe, maximum, median, readLongTasks, resetProbe } from '../support/probe';

type BoardElement = { type: string };
type BoardApi = { getElements: () => BoardElement[] };

async function elementCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getElements().length ?? 0,
  );
}

async function elementTypes(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(
    () =>
      (globalThis as { __board?: BoardApi }).__board
        ?.getElements()
        .map((element) => element.type) ?? [],
  );
}

test('[F02-S3-AC1] opens a 300-element mixed board within the fluidity targets', async ({
  page,
  request,
}, testInfo) => {
  await installProbe(page);

  const name = `Fluidité ouverture ${Date.now()}`;
  const response = await request.post('/api/test/seed', {
    data: { name, elements: 300, mixed: true },
  });
  expect(response.status()).toBe(201);

  const durations: number[] = [];
  const longTasks: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    await page.goto('/');
    const row = page.getByTestId('board-item').filter({ hasText: name });
    await expect(row).toBeVisible();
    await resetProbe(page);
    durations.push(
      await measureActionToEffect(
        page,
        () => row.getByRole('link').click(),
        async () => {
          await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
          await expect.poll(() => elementCount(page)).toBe(300);
        },
      ),
    );
    longTasks.push(...(await readLongTasks(page)));
  }

  expect(new Set(await elementTypes(page))).toEqual(
    new Set(['sticky', 'rect', 'ellipse', 'text', 'arrow']),
  );

  const medianOpenMs = median(durations);
  const maxLongTaskMs = maximum(longTasks);
  recordFluidityMeasure({
    requirement: 'FL-7',
    scenario: 'Ouverture d’un board de 300 éléments mélangés depuis le menu',
    measuredMs: medianOpenMs,
    threshold: '≤ 3000 ms',
    video: videoPathFor(testInfo),
  });
  recordFluidityMeasure({
    requirement: 'FL-3',
    scenario: 'Ouverture d’un board de 300 éléments mélangés (tâche longue max)',
    measuredMs: maxLongTaskMs,
    threshold: '≤ 200 ms',
    video: videoPathFor(testInfo),
  });

  expect(medianOpenMs).toBeLessThanOrEqual(3000);
  expect(maxLongTaskMs).toBeLessThanOrEqual(200);
});
