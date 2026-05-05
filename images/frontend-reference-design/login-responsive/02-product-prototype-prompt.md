# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Login Responsive at `/login`
- Users/roles: tenant administrators and enterprise operators
- Main task flow: enter enterprise domain, email, password, optionally reveal password, submit, see validation/server feedback, redirect to console.
- API/service contract: `useAuth().login` with `tenantCode`, `email`, `password`; redirect to safe `next` or `/dashboard`.
- Data fields: tenant code, email, password; server error message; submitting state.
- Actions and states: login, forgot password, request trial, SSO placeholder, validation errors, disabled submit, loading fallback.

Prototype requirements:
- Show desktop, tablet, and mobile layout boundaries in one responsive wireframe.
- Desktop: brand mark and headline on the left, login card on the right, feature cards below the headline.
- Tablet: constrained centered content or lighter two-column layout with wrapped feature cards.
- Mobile: brand header, short headline, login card, then compact feature chips/cards; page scrolls naturally.
- Mark where the background image is softened or reduced on small screens to preserve contrast.
- Use clear component boundaries for `BrandMark`, `LoginPageBackground`, `Card`, form fields, action links, alert, and feature cards.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation, sidebar, or additional auth providers not present in the current page
