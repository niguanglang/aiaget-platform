# Product Prototype / Wireframe Prompt

Create a low-fidelity Chinese wireframe for `/security/archives`.

Information architecture:
1. Header: back to 安全总览, badge "归档治理", title "归档治理", description, refresh button.
2. Source segmented tabs: 告警通知归档, 自愈审计归档, SLA 死信归档.
3. Metric cards: 归档文件, 归档容量, 删除待审, 删除生效.
4. Archive list: file name, folder, size, last modified, download/delete actions.
5. Delete approval list: status, archive file, requester, reviewer, requested/reviewed time, approve/reject actions.
6. Confirmation: delete application modal/card before mutation.
7. States: loading rows, permission denied, empty list, API error.

Keep page responsibilities narrow: archive files and delete approvals only; do not include alert triage, task recovery, policy editing, or event tracing.
