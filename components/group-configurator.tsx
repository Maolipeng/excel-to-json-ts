"use client"

import { Plus, Trash2 } from "lucide-react"
import type { UiGroupLevel, UiMode } from "@/lib/types"

interface GroupConfiguratorProps {
  mode: UiMode
  headers: string[]
  groups: UiGroupLevel[]
  onChange: (groups: UiGroupLevel[]) => void
  maxLevels?: number
}

const defaultChildren = ["children", "citys", "dealers"]

export function GroupConfigurator({ mode, headers, groups, onChange, maxLevels = 3 }: GroupConfiguratorProps) {
  const canAdd = (mode === "tree" || mode === "pro") && groups.length < maxLevels

  const addGroup = () => {
    if (!canAdd) return
    const idx = groups.length
    onChange([
      ...groups,
      {
        name: `第${idx + 1}级`,
        keyColumn: headers[0] || "",
        labelColumn: headers[1] || headers[0] || "",
        codeColumn: headers[0] || "",
        childrenField: defaultChildren[Math.min(idx, defaultChildren.length - 1)] || "children",
      },
    ])
  }

  const updateGroup = (index: number, partial: Partial<UiGroupLevel>) => {
    const next = [...groups]
    next[index] = { ...next[index], ...partial }
    onChange(next)
  }

  const removeGroup = (index: number) => {
    onChange(groups.filter((_, i) => i !== index))
  }

  if (mode === "flat") {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        平铺模式无需分组，直接进入叶子字段配置。
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">分组层级</h3>
          <p className="text-xs text-muted-foreground">为每一层选择主键、名称、编码列，以及子节点数组字段名</p>
        </div>
        <button
          onClick={addGroup}
          disabled={!canAdd || headers.length === 0}
          className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          添加层级
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          点击「添加层级」设置省/市/门店等分组。建议不超过 3 级。
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, index) => (
            <div key={index} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">第 {index + 1} 级 · {group.name || "分组"}</div>
                <button
                  onClick={() => removeGroup(index)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">分组名称</label>
                  <input
                    value={group.name}
                    onChange={(e) => updateGroup(index, { name: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="例：省 / 市"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">子节点数组字段名</label>
                  <input
                    value={group.childrenField}
                    onChange={(e) => updateGroup(index, { childrenField: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="例：citys / dealers"
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">分组主键列</label>
                  <select
                    value={group.keyColumn}
                    onChange={(e) => updateGroup(index, { keyColumn: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">显示名称列</label>
                  <select
                    value={group.labelColumn || ""}
                    onChange={(e) => updateGroup(index, { labelColumn: e.target.value || undefined })}
                    className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">不使用</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Code 列</label>
                  <select
                    value={group.codeColumn || ""}
                    onChange={(e) => updateGroup(index, { codeColumn: e.target.value || undefined })}
                    className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">不使用</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
