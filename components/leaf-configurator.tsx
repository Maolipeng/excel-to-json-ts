"use client"

import { useMemo } from "react"
import type { UiLeafConfig } from "@/lib/types"

interface LeafConfiguratorProps {
  headers: string[]
  leaf: UiLeafConfig
  onChange: (leaf: UiLeafConfig) => void
}

const toCamel = (value: string) => {
  return value
    .split(/[\s_\-]+/)
    .map((seg, idx) => {
      const lower = seg.toLowerCase()
      return idx === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join("")
}

export function LeafConfigurator({ headers, leaf, onChange }: LeafConfiguratorProps) {
  const selectedColumns = useMemo(() => new Set(leaf.fields.map((f) => f.column)), [leaf.fields])

  const toggleColumn = (column: string) => {
    if (selectedColumns.has(column)) {
      onChange({ ...leaf, fields: leaf.fields.filter((f) => f.column !== column) })
    } else {
      const next = [...leaf.fields, { column, outputKey: toCamel(column) || column }]
      onChange({ ...leaf, fields: next })
    }
  }

  const updateOutputKey = (column: string, value: string) => {
    onChange({
      ...leaf,
      fields: leaf.fields.map((f) => (f.column === column ? { ...f, outputKey: value } : f)),
    })
  }

  const updateArrayField = (value: string) => {
    onChange({ ...leaf, arrayField: value })
  }

  const updateDedupe = (value: string) => {
    onChange({ ...leaf, dedupeBy: value || undefined })
  }

  const dedupeOptions = leaf.fields.map((f) => f.outputKey)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">叶子数组字段名</label>
          <input
            value={leaf.arrayField}
            onChange={(e) => updateArrayField(e.target.value)}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="如 dealers"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">去重字段（可选）</label>
          <select
            value={leaf.dedupeBy || ""}
            onChange={(e) => updateDedupe(e.target.value)}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">不去重</option>
            {dedupeOptions.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
          <div>
            <p className="text-sm font-semibold text-foreground">叶子字段</p>
            <p className="text-xs text-muted-foreground">勾选需要的列，并设置输出字段名</p>
          </div>
          <span className="text-xs text-muted-foreground">已选 {leaf.fields.length} 个</span>
        </div>

        <div className="divide-y divide-border max-h-96 overflow-auto">
          {headers.map((header) => {
            const selected = selectedColumns.has(header)
            const current = leaf.fields.find((f) => f.column === header)
            return (
              <div key={header} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleColumn(header)}
                    className="rounded border-border"
                  />
                  <span className="font-medium">{header}</span>
                </label>
                {selected && (
                  <input
                    value={current?.outputKey || ""}
                    onChange={(e) => updateOutputKey(header, e.target.value)}
                    className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="输出字段名"
                  />
                )}
              </div>
            )
          })}
          {headers.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">请先选择 Sheet 以加载表头</div>
          )}
        </div>
      </div>
    </div>
  )
}
