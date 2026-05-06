# Product UI Design Image Prompt

Create a high-fidelity Chinese-language enterprise admin UI for a department organization module.

Page context:
- Route: `/departments`
- Feature: department organization management
- Target users: tenant admins and authorized operators
- Design system: restrained Tailwind + shadcn admin console, crisp spacing, compact typography, subtle borders, muted surfaces, blue/neutral accents, no marketing styling

Required interface:
- Left/main area shows department overview metrics, search and filters, organization tree, and a paginated or dense data table
- Row actions show view, edit, enable/disable, delete
- A dedicated create entry points to `/departments/create`
- A dedicated detail page exists at `/departments/[id]`
- A dedicated edit page exists at `/departments/[id]/edit`
- Detail and form content should not be embedded as persistent drawers on the list page

Visible data:
- Department total, active count, disabled count, member count, root department count
- Tree hierarchy with parent/child indentation
- Table columns for department name, code, leader, member count, status, sort order, updated time, actions
- Status chips for active and disabled departments

Interaction states:
- Search keyword and status filters
- Empty tree/list states
- Disabled/permission-limited actions
- Confirmation affordances for delete
- Clear loading skeletons or subdued placeholders while data loads

Visual direction:
- Production SaaS console, dense and utilitarian
- Use panels, tables, compact toolbars, segmented filters, and well-scanned rows
- Chinese labels throughout
- Avoid decorative hero composition, oversized cards, or floating editor drawers
