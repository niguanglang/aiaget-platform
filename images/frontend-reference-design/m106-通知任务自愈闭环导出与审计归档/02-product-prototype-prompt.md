# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the real `/security` page section.

Scope:
- Module: 安全中心 / 自愈闭环审计检索 / 审计归档
- Milestone: M106
- Placement: below M105 audit table.

Wireframe layout:
1. Existing M105 card header keeps action buttons: 导出 CSV, 刷新审计.
2. Add “审计归档” sub-panel below table.
3. Archive sub-panel header:
   - badges: M106, 归档数量
   - buttons: 生成归档, 刷新归档
4. Summary metrics:
   - 归档文件
   - 总容量
5. Message area:
   - success after export/create/download
   - error on failure
6. Archive list rows:
   - file name
   - size
   - last modified
   - folder
   - download button
7. Empty state when no archive exists.

Interaction flow:
- 导出 CSV downloads current filtered audit rows.
- 生成归档 creates a CSV archive using current filters.
- 下载 opens signed download URL in a new browser tab.
- 刷新归档 reloads archive list.

Constraints:
- Read-only archive list; no delete in M106.
- No database migration.
- Chinese labels only.
