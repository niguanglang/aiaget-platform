# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity wireframe for focused channel operation pages:

- `/channels/replies`: header + nav + metrics + filters + reply rows with expandable detail.
- `/channels/sender`: header + nav + task overview metrics + filters + sender delivery list + selected delivery detail panel + task action buttons.
- `/channels/release`: header + nav + channel selector + scheduler summary + cards for release pipeline, release gate, automation, self healing, report summary.

Wireframe requirements:
- Show component boundaries and route responsibilities.
- Keep create/edit forms out of these list pages.
- Put dangerous or mutating actions as explicit buttons with disabled states.
- Include loading, empty, error, permission denied placeholders.
- Use only fields supported by the current API types.
