# Product Prototype / Wireframe Prompt

Create a low-fidelity Chinese product wireframe for the `/channels/providers` page.

Information architecture:
1. Header: badge "渠道运营", active submodule "渠道提供方", route `/channels/providers`, title, short description, buttons "刷新" and "返回总览".
2. Focused navigation tabs: 发布渠道, 渠道提供方, 账号凭据, 消息模板, 路由规则, 发布任务, 投递记录, 回复记录, Sender 投递, 发布治理.
3. Metrics row: 渠道提供方总数, 启用提供方, 平均成功率, 凭据轮换风险.
4. Filter bar: keyword input, status select, provider/type input, reset.
5. List rows: compact overview only; row button "更多" expands details.
6. Expanded detail: three-column detail grid plus row-level operations; create/edit form should be a separate card/drawer-style surface, not mixed into the base list rows.
7. States: loading skeleton, empty state, error alert, permission denied.

Make the prototype emphasize page boundaries: this page manages provider adapters only; accounts/templates/route rules are linked adjacent modules, not embedded complete lists.
