import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');
const serviceText = readFileSync(join(process.cwd(), 'src/menus/menus.service.ts'), 'utf8');
const schemaText = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
const createDtoText = readFileSync(join(process.cwd(), 'src/menus/dto/create-menu.dto.ts'), 'utf8');
const updateDtoText = readFileSync(join(process.cwd(), 'src/menus/dto/update-menu.dto.ts'), 'utf8');

test('default menu seed only exposes the menu center list route', () => {
  assert.match(seedText, /code: 'menus'[\s\S]*path: '\/menus'/);
  assert.doesNotMatch(seedText, /path: '\/menus\/create'/);
  assert.doesNotMatch(seedText, /path: '\/menus\/\[id\]\/edit'/);
  assert.doesNotMatch(seedText, /path: '\/menus\/:id\/edit'/);
});

test('menu service supports configurable multi-level menu trees instead of a three-level cap', () => {
  assert.match(serviceText, /MAX_MENU_LEVEL/);
  assert.match(serviceText, /Menu tree supports at most \$\{MAX_MENU_LEVEL\} levels/);
  assert.doesNotMatch(serviceText, /at most three levels/);
});

test('menu advanced route configuration fields are persisted and exposed by the API layer', () => {
  for (const field of ['isExternal', 'externalUrl', 'redirectPath', 'keepAlive', 'affix', 'hideBreadcrumb', 'routeMeta']) {
    assert.match(schemaText, new RegExp(`\\b${field}\\b`));
    assert.match(serviceText, new RegExp(`\\b${field}\\b`));
  }

  for (const apiField of ['is_external', 'external_url', 'redirect_path', 'keep_alive', 'affix', 'hide_breadcrumb', 'route_meta']) {
    assert.match(createDtoText, new RegExp(`\\b${apiField}\\b`));
    assert.match(updateDtoText, new RegExp(`\\b${apiField}\\b`));
    assert.match(serviceText, new RegExp(`\\b${apiField}\\b`));
  }
});

test('menu advanced route configuration migration includes column comments', () => {
  const migrationsDir = join(process.cwd(), 'prisma/migrations');
  const migrationText = readFileSync(join(migrationsDir, '20260506110000_m79_menu_advanced_route_config/migration.sql'), 'utf8');

  for (const column of ['is_external', 'external_url', 'redirect_path', 'keep_alive', 'affix', 'hide_breadcrumb', 'route_meta']) {
    assert.match(migrationText, new RegExp(`ADD COLUMN IF NOT EXISTS "${column}"`));
    assert.match(migrationText, new RegExp(`COMMENT ON COLUMN "menu"\\."${column}" IS`));
  }
});
