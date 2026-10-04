import { expect, test } from '@playwright/test';
import {
  expectAbove,
  expectAlignedLeft,
  expectAlignedRight,
  expectCenteredH,
  expectCenteredV,
  expectDistanceAtLeast,
  expectDistanceToEdge,
  expectInside,
  expectLeftOf,
  expectNoOverlap,
  expectOrder,
  expectToken,
} from '../support/layout';

const DEMO_PAGE = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <style>
      :root { --demo-color: rgb(1, 2, 3); }
      body { margin: 0; }
      .box { position: absolute; background: rgb(200, 200, 200); }
      #outer { position: absolute; left: 0; top: 0; width: 400px; height: 400px; border: 1px solid rgb(0, 0, 0); }
      #inner { left: 100px; top: 100px; width: 100px; height: 100px; }
      #centered { left: 150px; top: 150px; width: 100px; height: 100px; }
      #left { left: 500px; top: 20px; width: 100px; height: 60px; }
      #right { left: 700px; top: 20px; width: 100px; height: 60px; }
      #below { left: 500px; top: 200px; width: 100px; height: 60px; }
      #aligned-a { left: 500px; top: 300px; width: 80px; height: 40px; }
      #aligned-b { left: 500px; top: 360px; width: 80px; height: 40px; }
      #colored { left: 500px; top: 450px; width: 50px; height: 50px; color: var(--demo-color); }
    </style>
  </head>
  <body>
    <div id="outer"></div>
    <div id="inner" class="box"></div>
    <div id="centered" class="box"></div>
    <div id="left" class="box"></div>
    <div id="right" class="box"></div>
    <div id="below" class="box"></div>
    <div id="aligned-a" class="box"></div>
    <div id="aligned-b" class="box"></div>
    <div id="colored" class="box">x</div>
  </body>
</html>`;

async function expectFailure(run: () => Promise<void>): Promise<void> {
  let failed = false;
  try {
    await run();
  } catch {
    failed = true;
  }
  expect(failed, 'expected the layout assertion to fail').toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.setContent(DEMO_PAGE);
});

test('[T-006-AC3] validates relative positions, alignment, distance, order and tokens', async ({
  page,
}) => {
  const outer = page.locator('#outer');
  const inner = page.locator('#inner');
  const centered = page.locator('#centered');
  const left = page.locator('#left');
  const right = page.locator('#right');
  const below = page.locator('#below');
  const alignedA = page.locator('#aligned-a');
  const alignedB = page.locator('#aligned-b');
  const colored = page.locator('#colored');

  await expectLeftOf(left, right);
  await expectAbove(left, below);
  await expectInside(inner, outer);
  await expectNoOverlap(left, below);
  await expectCenteredH(centered, outer);
  await expectCenteredV(centered, outer);
  await expectAlignedLeft(alignedA, alignedB);
  await expectAlignedRight(alignedA, alignedB);
  await expectDistanceAtLeast(left, right, 90);
  await expectDistanceToEdge(left, 'left', 500, 8);
  await expectOrder([left, right], 'horizontal');
  await expectOrder([left, below], 'vertical');
  await expectToken(colored, 'color', '--demo-color');
});

test('[T-006-AC3] rejects elements that do not satisfy the layout assertions', async ({ page }) => {
  const outer = page.locator('#outer');
  const inner = page.locator('#inner');
  const left = page.locator('#left');
  const right = page.locator('#right');
  const below = page.locator('#below');
  const colored = page.locator('#colored');

  await expectFailure(() => expectLeftOf(right, left));
  await expectFailure(() => expectAbove(below, left));
  await expectFailure(() => expectInside(outer, inner));
  await expectFailure(() => expectNoOverlap(inner, outer));
  await expectFailure(() => expectCenteredH(inner, outer));
  await expectFailure(() => expectAlignedLeft(left, right));
  await expectFailure(() => expectOrder([right, left], 'horizontal'));
  await expectFailure(() => expectToken(colored, 'color', '--missing-token'));
});
