# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity wireframe for the AIAget enterprise AI Agent platform console navigation refinement.

Project context:
- Page/route: global console shell around authenticated routes
- Users/roles: tenant admin, Agent admin, security admin, auditor, normal user with permission-filtered menus
- Main task flow: find a module, understand current location, switch back to recently visited pages, search for a route, navigate safely on mobile.
- API/service contract: no new API; uses existing authenticated menu tree and local browser UI state.
- Data entities and fields: menu title, path, icon, level, children, active state, external state.

Prototype requirements:
- Show desktop layout regions: collapsible left sidebar, sticky topbar search trigger, breadcrumb row, visited tab row, content area.
- Show mobile layout regions: topbar, horizontal menu level, second-level drilldown, directory button behavior, content below.
- Show command search modal states: input, results, empty result, close action.
- Show visited tab behavior: active tab, closeable inactive tab, fixed/affix tab.
- Keep component boundaries clear for frontend implementation.

Avoid:
- full page detail content unrelated to navigation
- inventing backend fields
- complex animation diagrams
