# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M24 MinIO Storage Center at `/storage`
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
- Layout:
  - page header and milestone badges
  - summary metric row
  - left storage settings card
  - right upload card
  - file manager table with toolbar
  - selected file detail / delete confirmation region
- Make component boundaries obvious and map them to existing React components.
- Show empty and error states.

Avoid:
- invented storage provider actions
- exposing secret values
- unrealistic multi-cloud settings not supported by current contract
