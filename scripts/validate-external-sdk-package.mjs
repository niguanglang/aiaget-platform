import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_PACKAGE_FIELDS = ['name', 'version', 'description', 'license', 'type', 'exports', 'types', 'files'];

export async function collectExternalSdkPackageIssues(packageJsonPath = 'packages/external-api-sdk/package.json') {
  const packageText = await readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageText);
  const issues = [];

  for (const field of REQUIRED_PACKAGE_FIELDS) {
    if (!hasValue(packageJson[field])) {
      issues.push(`package.json is missing required field: ${field}`);
    }
  }

  if (packageJson.private === true) {
    issues.push('package.json must not be private before npm publishing');
  }

  const files = Array.isArray(packageJson.files) ? packageJson.files : [];
  for (const requiredFile of ['dist', 'README.md']) {
    if (!files.includes(requiredFile)) {
      issues.push(`package.json files must include ${requiredFile}`);
    }
  }

  if (packageJson.types !== './dist/index.d.ts') {
    issues.push('package.json types must point to ./dist/index.d.ts');
  }

  const rootExport = packageJson.exports?.['.'];
  if (!rootExport || rootExport.types !== './dist/index.d.ts' || rootExport.default !== './dist/index.js') {
    issues.push('package.json exports["."] must expose ./dist/index.js and ./dist/index.d.ts');
  }

  if (packageJson.publishConfig?.access !== 'public') {
    issues.push('package.json publishConfig.access must be public');
  }

  const scripts = packageJson.scripts ?? {};
  for (const scriptName of ['build', 'typecheck', 'prepack', 'pack:check']) {
    if (!hasValue(scripts[scriptName])) {
      issues.push(`package.json scripts must include ${scriptName}`);
    }
  }

  for (const [section, dependencies] of Object.entries(dependencySections(packageJson))) {
    for (const [name, version] of Object.entries(dependencies)) {
      if (typeof version === 'string' && version.startsWith('workspace:')) {
        issues.push(`${section}.${name} uses workspace protocol and is not publishable to npm`);
      }
    }
  }

  if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
    issues.push('external API SDK should stay dependency-free for npm publishing');
  }

  return issues;
}

export async function collectExternalSdkPublishDocIssues(
  readmePath = 'packages/external-api-sdk/README.md',
  milestoneDocPath = 'docs/product/m60-external-api-sdk.md',
) {
  const [readme, milestoneDoc] = await Promise.all([
    readFile(readmePath, 'utf8'),
    readFile(milestoneDocPath, 'utf8'),
  ]);
  const issues = [];

  for (const [label, content] of [
    ['README', readme],
    ['M60 document', milestoneDoc],
  ]) {
    if (!content.includes('pnpm --filter @aiaget/external-api-sdk pack:check')) {
      issues.push(`${label} must document the SDK pack check command`);
    }
    if (!content.includes('pnpm --filter @aiaget/external-api-sdk build')) {
      issues.push(`${label} must document the SDK build command`);
    }
  }

  if (milestoneDoc.includes('SDK 当前是 workspace 内部包')) {
    issues.push('M60 document must not describe the SDK as workspace-only after publish readiness is complete');
  }

  return issues;
}

function dependencySections(packageJson) {
  return {
    dependencies: packageJson.dependencies ?? {},
    devDependencies: packageJson.devDependencies ?? {},
    peerDependencies: packageJson.peerDependencies ?? {},
    optionalDependencies: packageJson.optionalDependencies ?? {},
  };
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
}

const currentFilePath = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  const issues = [
    ...(await collectExternalSdkPackageIssues()),
    ...(await collectExternalSdkPublishDocIssues()),
  ];

  if (issues.length > 0) {
    console.error(issues.map((issue) => `- ${issue}`).join('\n'));
    process.exitCode = 1;
  }
}
