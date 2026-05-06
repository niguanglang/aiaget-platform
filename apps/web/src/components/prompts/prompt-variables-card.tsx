'use client';

import type {
  PromptTemplateDetail,
  PromptVariableItem,
} from '@aiaget/shared-types';
import { Edit, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import {
  formatDateTime,
  promptVariableTypeLabel,
} from './prompt-status';

export function PromptVariablesCard({
  canWrite,
  deletePending,
  prompt,
  onCreate,
  onDelete,
  onEdit,
}: {
  canWrite: boolean;
  deletePending: boolean;
  prompt: PromptTemplateDetail;
  onCreate: () => void;
  onDelete: (variableId: string) => void;
  onEdit: (variable: PromptVariableItem) => void;
}) {
  return (
    <Card>
      <div className="flex flex-col justify-between gap-3 border-b p-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-sm font-semibold">变量</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            定义 <code>{'{{name}}'}</code> 与 <code>{'{name}'}</code> 占位符使用的渲染输入。
          </p>
        </div>
        <Button disabled={!canWrite} onClick={onCreate} variant="outline">
          <Plus className="size-4" />
          新建变量
        </Button>
      </div>
      {prompt.variables.length === 0 ? (
        <EmptyState
          action={
            <Button disabled={!canWrite} onClick={onCreate} variant="outline">
              <Plus className="size-4" />
              新建变量
            </Button>
          }
          description="变量为每个模板提供带类型的渲染契约，并在运行前暴露缺失输入。"
          title="暂无变量"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['名称', '类型', '必填', '默认值', '更新时间', '操作'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prompt.variables.map((variable) => (
                <tr className="border-b last:border-0 hover:bg-muted/25" key={variable.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{variable.name}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {variable.description ?? '暂无描述。'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{promptVariableTypeLabel(variable.variable_type)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{variable.required ? '是' : '否'}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                    {variable.default_value ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(variable.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        disabled={!canWrite}
                        onClick={() => onEdit(variable)}
                        size="sm"
                        title="编辑变量"
                        variant="outline"
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        disabled={!canWrite || deletePending}
                        onClick={() => onDelete(variable.id)}
                        size="sm"
                        title="删除变量"
                        variant="outline"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
