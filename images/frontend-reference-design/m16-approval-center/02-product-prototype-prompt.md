# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Approval center at `/approvals`
- Users/roles: tenant admins and operators
- Main task flow:
  - open pending queue
  - search and filter requests
  - inspect selected request
  - review raw request and response data
  - approve and execute or reject
  - optionally jump to linked tool or conversation
- API/service contract:
  - approval overview
  - paginated approval list
  - approval detail
  - approve action
  - reject action
- Data fields:
  - approval status
  - execution status
  - trigger source
  - request URL/method
  - requester/reviewer
  - payload previews
  - linked tool and conversation

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and the review workflow.
- Show the page as:
  - page header
  - metric strip
  - left queue table
  - right detail panel
  - reviewer note field
  - approve/reject actions
- Include empty queue state, load state, and disabled action state.
- Make component boundaries obvious enough for direct mapping to the current codebase.

Avoid:
- decorative illustration
- modal-heavy approval flow
- invented extra entities not present in the real API
