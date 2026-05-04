# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 登录页 at `/login`
- Users/roles: 未登录企业租户用户
- Main task flow: 用户查看品牌与能力说明，填写企业域名、账号、密码，提交登录；可切换密码显示，可选择忘记密码、申请试用或企业 SSO 登录入口
- API/service contract: `useAuth().login(input)` -> `POST /auth/login`
- Data entities and fields: `tenantCode`, `email`, `password`
- Actions and states: submit, disabled/submitting, validation error, server error, password visibility toggle, SSO placeholder

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture: left brand/value proposition, background visual slice, bottom capability cards, right login panel.
- Show clear labels for the three form fields, primary submit button, secondary links, SSO separator, SSO button, and validation area.
- Include form loading and server error placeholders.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.
- Keep layout realistic for the current project and route shell.
