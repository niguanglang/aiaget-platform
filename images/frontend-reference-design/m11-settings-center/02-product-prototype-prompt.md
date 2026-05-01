# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Settings Center at `/settings`
- Users/roles: tenant admins and operators
- Main task flow: inspect tenant summary, update tenant name, manage users, review roles, create/delete machine API keys
- API/service contract: tenant detail/update, users CRUD, roles list, tenant API keys list/create/delete
- Data entities and fields: tenant card, user table, role cards, API key table, one-time key reveal
- Actions and states: edit tenant, create user, update user, delete user, create key, delete key, loading, empty, error, validation

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and settings workflows.
- Show these regions clearly:
  - page header and metrics
  - tenant profile card
  - user management table and side form
  - role catalog
  - API key management panel
  - one-time secret reveal state
- Include placeholders for no API keys, no roles, permission-denied, and validation failure.
- Make component boundaries obvious so a frontend engineer can map each region to current components.

Avoid:
- decorative rendering
- invented backend fields
- generic profile-page patterns
