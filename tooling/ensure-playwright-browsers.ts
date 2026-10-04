import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const executable = chromium.executablePath();

if (existsSync(executable)) {
  process.stdout.write('playwright: chromium is already installed\n');
} else {
  process.stdout.write('playwright: installing chromium\n');
  execFileSync('pnpm', ['exec', 'playwright', 'install', 'chromium'], { stdio: 'inherit' });
}
