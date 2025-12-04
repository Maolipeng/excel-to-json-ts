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

const toCamel = (value: string) =>
  value
    .split(/[\s_\-]+/)
    .map((seg, idx) => {
      const lower = seg.toLowerCase()
      return idx === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join("")

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
        nameKey: "name",
        codeKey: "code",
        childrenField: defaultChildren[Math.min(idx, defaultChildren.length - 1)] || "children",
        extraFields: [],
      },
    ])
  }

  const updateGroup = (index: number, partial: Partial<UiGroupLevel>) => {
    const next = [...groups]
    next[index] = { ...next[index], ...partial }
    onChange(next)
  }

  const toggleExtraField = (index: number, column: string) => {
    const group = groups[index]
    const extras = group.extraFields || []
    const exists = extras.some((f) => f.column === column)
    const nextExtras = exists ? extras.filter((f) => f.column !== column) : [...extras, { column, outputKey: toCamel(column) }]
    updateGroup(index, { extraFields: nextExtras })
  }

  const updateExtraOutputKey = (index: number, column: string, value: string) => {
    const group = groups[index]
    const extras = group.extraFields || []
    updateGroup(index, {
      extraFields: extras.map((f) => (f.column === column ? { ...f, outputKey: value } : f)),
    })
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

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">名称输出键名</label>
                  <input
                    value={group.nameKey || "name"}
                    onChange={(e) => updateGroup(index, { nameKey: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="默认 name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Code 输出键名</label>
                  <input
                    value={group.codeKey || "code"}
                    onChange={(e) => updateGroup(index, { codeKey: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="默认 code"
                  />
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border">
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">额外字段</p>
                    <p className="text-xs text-muted-foreground">为该层添加更多字段并自定义输出键名</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    已选 {(group.extraFields || []).length} 个
                  </span>
                </div>
                <div className="max-h-64 divide-y divide-border overflow-auto">
                  {headers.map((header) => {
                    const selected = (group.extraFields || []).some((f) => f.column === header)
                    const current = (group.extraFields || []).find((f) => f.column === header)
                    return (
                      <div key={header} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleExtraField(index, header)}
                            className="rounded border-border"
                          />
                          <span className="font-medium">{header}</span>
                        </label>
                        {selected && (
                          <input
                            value={current?.outputKey || ""}
                            onChange={(e) => updateExtraOutputKey(index, header, e.target.value)}
                            className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            placeholder="输出字段名"
                          />
                        )}
                      </div>
                    )
                  })}
                  {headers.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">请先选择 Sheet 以加载表头</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
