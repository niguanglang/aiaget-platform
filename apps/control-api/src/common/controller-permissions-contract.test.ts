import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const srcRoot = join(process.cwd(), 'src');

const publicOrInternalControllers = new Set([
  'auth/auth.controller.ts',
  'external-api/external-api.controller.ts',
  'health.controller.ts',
  'runtime-health.controller.ts',
  'runtime-execution/runtime-execution.controller.ts',
]);

function listControllerFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) return listControllerFiles(fullPath);
    return fullPath.endsWith('.controller.ts') ? [fullPath] : [];
  });
}

function toRelativeControllerPath(fullPath: string) {
  return fullPath.slice(srcRoot.length + 1);
}

function methodDecoratorStack(source: string) {
  const lines = source.split('\n');
  const stacks: Array<{ line: number; stack: string }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line || !/^\s*@(Get|Post|Put|Patch|Delete)\b/.test(line)) continue;

    const stackLines = [line];
    for (let lookahead = index + 1; lookahead < Math.min(lines.length, index + 16); lookahead += 1) {
      const nextLine = lines[lookahead];
      if (!nextLine) continue;

      const trimmed = nextLine.trim();
      if (trimmed.startsWith('@')) {
        stackLines.push(nextLine);
        continue;
      }
      if (trimmed === '') continue;
      break;
    }

    stacks.push({ line: index + 1, stack: stackLines.join('\n') });
  }

  return stacks;
}

test('all non-public control API controllers use permission guards and method permissions', () => {
  const failures: string[] = [];

  for (const controllerPath of listControllerFiles(srcRoot)) {
    const relativePath = toRelativeControllerPath(controllerPath);
    if (publicOrInternalControllers.has(relativePath)) continue;

    const source = readFileSync(controllerPath, 'utf8');

    if (!/@UseGuards\([^)]*JwtAuthGuard[^)]*PermissionsGuard/.test(source)) {
      failures.push(`${relativePath}: missing JwtAuthGuard + PermissionsGuard at controller level`);
    }

    for (const method of methodDecoratorStack(source)) {
      if (!/@Permissions\(/.test(method.stack)) {
        failures.push(`${relativePath}:${method.line}: missing @Permissions decorator`);
      }
    }
  }

  assert.deepEqual(failures, []);
});

test('intentional public and internal controllers use their own authentication boundary', () => {
  const externalApiSource = readFileSync(join(srcRoot, 'external-api/external-api.controller.ts'), 'utf8');
  const runtimeInternalSource = readFileSync(join(srcRoot, 'runtime-execution/runtime-execution.controller.ts'), 'utf8');
  const authSource = readFileSync(join(srcRoot, 'auth/auth.controller.ts'), 'utf8');

  assert.match(externalApiSource, /ExternalApiKeyService/);
  assert.match(externalApiSource, /\.authenticate/);
  assert.match(runtimeInternalSource, /@UseGuards\(RuntimeInternalGuard\)/);
  assert.match(authSource, /@UseGuards\(JwtAuthGuard\)/);
});
