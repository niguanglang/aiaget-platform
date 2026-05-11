# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Knowledge failed task row | `WorkflowBackendCard` in `monitor-shared-panels.tsx` | `RuntimeWorkflowRecoverableTaskItem` | UI already supports failure deep links from M166. |
| Backend task-event join | `runtime-execution.service.ts` | `knowledgeEmbeddingTask` + `platformEvent` | Map latest failed knowledge task event by task id. |
| Contract test | `runtime-execution.service.test.ts` | `getWorkflowStatus` | Ensures knowledge task exposes workflow and monitor identifiers. |
