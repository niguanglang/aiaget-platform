import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const topbarSource = readFileSync(join(process.cwd(), 'src/components/layout/topbar.tsx'), 'utf8');
const globalStylesSource = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

test('topbar account logout uses the expanding Uiverse-style logout button', () => {
  assert.match(topbarSource, /className="logout-button"/);
  assert.match(topbarSource, /className="logout-button-sign"/);
  assert.match(topbarSource, /className="logout-button-text"/);
  assert.match(topbarSource, />Logout</);
  assert.doesNotMatch(topbarSource, /aria-label="退出登录"[\s\S]*<ChevronDown/);

  for (const selector of [
    '.logout-button',
    '.logout-button-sign',
    '.logout-button-sign svg path',
    '.logout-button-text',
    '.logout-button:hover',
    '.logout-button:hover .logout-button-sign',
    '.logout-button:hover .logout-button-text',
    '.logout-button:active',
  ]) {
    assert.match(globalStylesSource, new RegExp(selector.replaceAll('.', '\\.')));
  }
});
