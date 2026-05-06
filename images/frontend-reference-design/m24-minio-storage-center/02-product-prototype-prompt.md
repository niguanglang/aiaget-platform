# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page group.

Project context:
- Page/routes: M24 MinIO Storage Center at `/storage`, `/storage/settings`, `/storage/upload`, `/storage/objects/[...key]`
- Users/roles: tenant operators and admins
- Main task flow: verify MinIO connection, create bucket if needed, upload a file, search/list files, download or delete an object
- API/service contract:
  - `getStorageSettings()`
  - `ensureStorageBucket()`
  - `listStorageObjects({ page, page_size, prefix, keyword })`
  - `uploadStorageObject(input)`
  - `deleteStorageObject(key)`
  - `getStorageDownloadUrl(key)`
- Data entities and fields:
  - storage settings: provider, endpoint, console URL, bucket, region, masked access key, force path style, status, bucket exists, last checked, error
  - storage summary: object count, total size, bucket exists, status
  - file object: relative key, file name, folder, size, etag, last modified
- Actions and states:
  - verify/create bucket
  - open console
  - upload file
  - search/filter
  - download
  - delete
  - loading, empty, error, disabled, success

Prototype requirements:
- Use low- to mid-fidelity wireframe style with Chinese labels.
- Show route-level boundaries clearly:
  - `/storage` list page: page header, status badges, summary metric row, search/prefix filters, file object table, row action to object detail, top actions for settings and upload.
  - `/storage/settings`: connection status, settings field groups, bucket validation/create button, open MinIO console button, error state.
  - `/storage/upload`: folder input, file selector, selected file preview, upload button, success result link to object detail.
  - `/storage/objects/[...key]`: object metadata, copy relative path, download button, delete confirmation block.
- Make component boundaries obvious and map them to existing React components.
- Show empty and error states.

Avoid:
- invented storage provider actions
- exposing secret values
- unrealistic multi-cloud settings not supported by current contract
- mixing settings/upload/detail panels back into the object list page
