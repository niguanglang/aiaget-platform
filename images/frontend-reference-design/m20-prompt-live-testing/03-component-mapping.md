# Component Mapping

Reference images are not committed yet for M20. This implementation follows the current prompt detail and prompt center testing surfaces.

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Prompt detail test card | `apps/web/src/components/prompts/prompt-detail-content.tsx` | `TestPromptResult` | Existing testing card now surfaces real provider/model metadata. |
| Prompt center selected detail card | `apps/web/src/components/prompts/prompts-content.tsx` | `TestPromptResult` | Compact list-side panel aligned to the same live testing behavior. |
| Prompt test backend | `apps/control-api/src/prompts/prompts.service.ts` | `POST /prompt-templates/:id/test` | Reuses the shared OpenAI-compatible model execution client and model call log pipeline. |
