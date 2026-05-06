# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell / console layout | `apps/web/src/app/(console)/departments/*` | Next.js route segments | One route per page, no drawer-based page state |
| Overview metrics | `MetricCard` | `getDepartmentOverview` | Total, active, disabled, members, roots |
| Toolbar / filters | local toolbar using `Button` and inputs | `listDepartments`, `getDepartmentTree` | Search, status, parent filter, refresh |
| Organization tree | `Card` + tree renderer in department components | `DepartmentTreeItem`, `getDepartmentTree` | Tree-only browsing and row entry actions |
| Department table | `Card` + table-like rows | `DepartmentListItem`, `listDepartments` | Dense management table with row actions |
| Create form | `DepartmentFormPanel` or new `DepartmentCreateContent` | `createDepartment`, `listUsers`, `getDepartmentTree` | Route-level create page |
| Detail view | new `DepartmentDetailContent` | `getDepartment` | Read-only department summary and related info |
| Edit form | `DepartmentFormPanel` or new `DepartmentEditContent` | `getDepartment`, `updateDepartment`, `listUsers`, `getDepartmentTree` | Route-level edit page |
| Enable/disable/delete actions | row action buttons and confirm dialogs | `enableDepartment`, `disableDepartment`, `deleteDepartment` | Keep in list/detail surfaces only |
| Status display | `department-status.ts` | `DepartmentStatus` | Label and tone helpers |
| Empty/error feedback | `EmptyState` and inline alerts | API error messages | Keep page-specific and non-modal where possible |
