import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const routesRoot = join(root, 'src/app/(console)/storage');
const componentsRoot = join(root, 'src/components/storage');

const listPath = join(componentsRoot, 'storage-content.tsx');
const settingsPath = join(componentsRoot, 'storage-settings-content.tsx');
const uploadPath = join(componentsRoot, 'storage-upload-content.tsx');
const detailPath = join(componentsRoot, 'storage-object-detail-content.tsx');
const sharedPath = join(componentsRoot, 'storage-shared.tsx');

function source(path: string) {
  return readFileSync(path, 'utf8');
}

test('storage route-level pages and focused components exist', () => {
  assert.ok(existsSync(join(routesRoot, 'page.tsx')));
  assert.ok(existsSync(join(routesRoot, 'settings/page.tsx')));
  assert.ok(existsSync(join(routesRoot, 'upload/page.tsx')));
  assert.ok(existsSync(join(routesRoot, 'objects/[...key]/page.tsx')));

  assert.ok(existsSync(sharedPath));
  assert.ok(existsSync(settingsPath));
  assert.ok(existsSync(uploadPath));
  assert.ok(existsSync(detailPath));
});

test('storage list page owns only overview, filters, table, and route entry actions', () => {
  const listSource = source(listPath);

  assert.match(listSource, /文件存储中心/);
  assert.match(listSource, /listStorageObjects/);
  assert.match(listSource, /getStorageSettings/);
  assert.match(listSource, /href="\/storage\/settings"/);
  assert.match(listSource, /href="\/storage\/upload"/);
  assert.match(listSource, /storageObjectDetailHref/);

  assert.doesNotMatch(listSource, /uploadStorageObject/);
  assert.doesNotMatch(listSource, /ensureStorageBucket/);
  assert.doesNotMatch(listSource, /StorageSettingsCard/);
  assert.doesNotMatch(listSource, /UploadPanel/);
  assert.doesNotMatch(listSource, /ObjectDetailPanel/);
  assert.doesNotMatch(listSource, /selectedFile/);
  assert.doesNotMatch(listSource, /selectedObject/);
  assert.doesNotMatch(listSource, /deleteTarget/);
});

test('storage settings page owns settings and bucket initialization APIs', () => {
  const settingsSource = source(settingsPath);

  assert.match(settingsSource, /存储设置/);
  assert.match(settingsSource, /getStorageSettings/);
  assert.match(settingsSource, /ensureStorageBucket/);
  assert.match(settingsSource, /useStoragePermissions/);
  assert.match(settingsSource, /disabled=\{!storagePermissions\.canManage \|\| ensureBucketMutation\.isPending\}/);
  assert.match(settingsSource, /打开控制台/);
  assert.doesNotMatch(settingsSource, /uploadStorageObject/);
  assert.doesNotMatch(settingsSource, /deleteStorageObject/);
});

test('storage bucket initialization requires confirmation before mutation', () => {
  const settingsSource = source(settingsPath);

  assert.match(settingsSource, /ensureBucketTarget/);
  assert.match(settingsSource, /function confirmEnsureBucket/);
  assert.match(settingsSource, /确认验证或创建存储桶/);
  assert.match(settingsSource, /onConfirm=\{confirmEnsureBucket\}/);
  assert.doesNotMatch(settingsSource, /onClick=\{\(\) => ensureBucketMutation\.mutate\(\)\}/);
});

test('storage upload page owns upload form and upload API', () => {
  const uploadSource = source(uploadPath);

  assert.match(uploadSource, /上传文件/);
  assert.match(uploadSource, /uploadStorageObject/);
  assert.match(uploadSource, /fileToBase64/);
  assert.match(uploadSource, /storageObjectDetailHref/);
  assert.match(uploadSource, /useStoragePermissions/);
  assert.match(uploadSource, /disabled=\{!storagePermissions\.canManage \|\| !selectedFile \|\| uploadMutation\.isPending\}/);
  assert.doesNotMatch(uploadSource, /ensureStorageBucket/);
  assert.doesNotMatch(uploadSource, /deleteStorageObject/);
});

test('storage upload requires confirmation before mutation', () => {
  const uploadSource = source(uploadPath);

  assert.match(uploadSource, /uploadTarget/);
  assert.match(uploadSource, /function confirmUpload/);
  assert.match(uploadSource, /确认上传文件到 MinIO/);
  assert.match(uploadSource, /onConfirm=\{confirmUpload\}/);
  assert.doesNotMatch(uploadSource, /onClick=\{\(\) => uploadMutation\.mutate\(\)\}/);
});

test('storage object detail page owns object lookup, download, copy, and delete confirmation', () => {
  const detailSource = source(detailPath);

  assert.match(detailSource, /对象详情/);
  assert.match(detailSource, /listStorageObjects/);
  assert.match(detailSource, /getStorageDownloadUrl/);
  assert.match(detailSource, /deleteStorageObject/);
  assert.match(detailSource, /useStoragePermissions/);
  assert.match(detailSource, /disabled=\{!storagePermissions\.canManage\}/);
  assert.match(detailSource, /确认删除这个文件/);
  assert.doesNotMatch(detailSource, /uploadStorageObject/);
  assert.doesNotMatch(detailSource, /ensureStorageBucket/);
});
