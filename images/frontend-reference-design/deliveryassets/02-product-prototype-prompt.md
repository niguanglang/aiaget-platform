# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for a Chinese enterprise admin page.

Project context:
- Page/route: 成果资产中心 at `/delivery-assets`
- Users/roles: 租户管理员、交付负责人、客户成功负责人、Agent 管理员、审计员
- Main task flow: browse reusable assets -> filter by type/status/visibility/source -> create asset from delivery review -> open detail to inspect business value, reuse guidance, source context, risk notes and linked resources -> edit or archive.
- API/service contract: `listDeliveryAssets`, `createDeliveryAsset`, `getDeliveryAsset`, `updateDeliveryAsset`, `deleteDeliveryAsset`; helper lists for users, delivery reviews, solution packages, skills, agents, knowledge bases.
- Data entities and fields: asset name/code/customer/type/status/visibility/reuse score/summary preview/reuse guidance preview/owner/linked delivery review/linked solution package/tags/updated time.

Prototype requirements:
- Low- to mid-fidelity wireframe focused on information architecture.
- Show regions: page header, permission-aware create button, four metric cards, filter toolbar, compact table, pagination, archive confirmation dialog, empty/error/loading placeholders.
- Detail route should be represented as separate page regions: hero summary, linked resources panel, grouped cards for summary, business value, reuse guidance, source context, risk notes, next action, tags and notes.
- Create/edit route should be independent form page with grouped fields: basic info, asset content, linked resources, tags/notes, save/cancel actions.
- Make component boundaries clear for mapping to existing React components.

Avoid:
- placing full business value or risk notes inside the list table
- mixing source delivery review list and asset list in one table
- inventing unrelated charts or fields
