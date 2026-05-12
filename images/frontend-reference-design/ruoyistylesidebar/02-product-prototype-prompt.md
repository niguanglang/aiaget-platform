Create a product prototype / wireframe image for the AIAget console shell sidebar.

Project context:
- Page/route: shared console layout around `/dashboard`
- Users/roles: authenticated tenant users, menu tree already filtered by backend permissions
- Main task flow: user scans first-level domains, expands a domain, drills into second/third/fourth-level pages, collapses the whole sidebar for more workspace, reopens it later
- Data contract: `NavigationLink[]` tree with `id`, `title`, `href`, `external`, `icon`, `level`, `children`
- Actions/states: whole-sidebar collapse toggle, per-parent expand/collapse toggle, active route highlight, active ancestor open, icon-only collapsed rail, external link target

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show desktop regions: sidebar header, collapse button, recursive menu tree, topbar, main content area.
- Show sidebar expanded state and collapsed icon-only state side-by-side.
- Show one deep active path expanded across multiple levels.
- Label interaction states clearly: active item, active ancestor, collapsed parent, expanded parent, hover target.
- Keep component boundaries obvious for implementation in `ConsoleShell` and `Sidebar`.

Avoid:
- changing backend menu data
- changing page routing
- putting mobile behavior into desktop sidebar
