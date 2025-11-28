"use client"

import { Plus, Trash2, ChevronDown, ChevronRight, Layers } from "lucide-react"
import type { ColumnMapping, GroupLevel, LeafConfig } from "@/lib/types"

interface GroupBuilderProps {
  mappings: ColumnMapping[]
  groupLevels: GroupLevel[]
  onGroupLevelsChange: (levels: GroupLevel[]) => void
  leafConfig: LeafConfig
  onLeafConfigChange: (config: LeafConfig) => void
}

export function GroupBuilder({
  mappings,
  groupLevels,
  onGroupLevelsChange,
  leafConfig,
  onLeafConfigChange,
}: GroupBuilderProps) {
  const fieldOptions = mappings.map((m) => m.logicalName)

  const addGroupLevel = () => {
    const newLevel: GroupLevel = {
      keyField: fieldOptions[0] || "",
      childrenKey: "children",
      nodeName: `第${groupLevels.length + 1}级`,
    }
    onGroupLevelsChange([...groupLevels, newLevel])
  }

  const updateGroupLevel = (index: number, updates: Partial<GroupLevel>) => {
    const updated = [...groupLevels]
    updated[index] = { ...updated[index], ...updates }
    onGroupLevelsChange(updated)
  }

  const removeGroupLevel = (index: number) => {
    onGroupLevelsChange(groupLevels.filter((_, i) => i !== index))
  }

  const addLeafField = () => {
    const newField = { from: fieldOptions[0] || "", to: fieldOptions[0] || "" }
    onLeafConfigChange({
      ...leafConfig,
      fields: [...leafConfig.fields, newField],
    })
  }

  const updateLeafField = (index: number, updates: { from?: string; to?: string }) => {
    const fields = [...leafConfig.fields]
    fields[index] = { ...fields[index], ...updates }
    onLeafConfigChange({ ...leafConfig, fields })
  }

  const removeLeafField = (index: number) => {
    onLeafConfigChange({
      ...leafConfig,
      fields: leafConfig.fields.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">数据层级结构</h2>
        <p className="mt-1 text-sm text-muted-foreground">定义数据的分组层级，可以创建树形结构或扁平列表</p>
      </div>

      {/* Structure Preview */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">结构预览:</span>
          {groupLevels.length === 0 ? (
            <span className="text-muted-foreground">扁平列表 (无分组)</span>
          ) : (
            <span className="text-muted-foreground">
              {groupLevels.map((g) => g.nodeName || g.keyField).join(" → ")} → {leafConfig.outputKey}
            </span>
          )}
        </div>
      </div>

      {/* Group Levels */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">分组层级</h3>
          <button
            onClick={addGroupLevel}
            disabled={fieldOptions.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            添加层级
          </button>
        </div>

        {groupLevels.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">不添加分组层级将生成扁平的数据列表</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groupLevels.map((level, index) => (
              <div key={index} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {index < groupLevels.length - 1 ? (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-sm font-medium text-foreground">第 {index + 1} 级分组</span>
                  </div>
                  <button
                    onClick={() => removeGroupLevel(index)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">分组键字段</label>
                    <select
                      value={level.keyField}
                      onChange={(e) => updateGroupLevel(index, { keyField: e.target.value })}
                      className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    >
                      {fieldOptions.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">名称字段 (可选)</label>
                    <select
                      value={level.nameField || ""}
                      onChange={(e) => updateGroupLevel(index, { nameField: e.target.value || undefined })}
                      className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="">不使用</option>
                      {fieldOptions.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">子节点键名</label>
                    <input
                      type="text"
                      value={level.childrenKey}
                      onChange={(e) => updateGroupLevel(index, { childrenKey: e.target.value })}
                      className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">节点名称</label>
                    <input
                      type="text"
                      value={level.nodeName}
                      onChange={(e) => updateGroupLevel(index, { nodeName: e.target.value })}
                      className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaf Configuration */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">叶子节点配置</h3>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">输出键名</label>
              <input
                type="text"
                value={leafConfig.outputKey}
                onChange={(e) => onLeafConfigChange({ ...leafConfig, outputKey: e.target.value })}
                className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">去重字段 (可选)</label>
              <select
                value={leafConfig.dedupeBy || ""}
                onChange={(e) => onLeafConfigChange({ ...leafConfig, dedupeBy: e.target.value || undefined })}
                className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">不去重</option>
                {fieldOptions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs text-muted-foreground">输出字段映射</label>
              <button
                onClick={addLeafField}
                disabled={fieldOptions.length === 0}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                添加字段
              </button>
            </div>

            <div className="space-y-2">
              {leafConfig.fields.map((field, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={field.from}
                    onChange={(e) => updateLeafField(index, { from: e.target.value })}
                    className="flex-1 rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    {fieldOptions.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted-foreground">→</span>
                  <input
                    type="text"
                    value={field.to}
                    onChange={(e) => updateLeafField(index, { to: e.target.value })}
                    className="flex-1 rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="输出字段名"
                  />
                  <button
                    onClick={() => removeLeafField(index)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {leafConfig.fields.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-2">请添加至少一个输出字段</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
