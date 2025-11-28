"use client"

import { useState } from "react"
import { Plus, Trash2, Sparkles, GripVertical } from "lucide-react"
import type { ColumnMapping } from "@/lib/types"

interface ColumnMapperProps {
  headers: string[]
  mappings: ColumnMapping[]
  onMappingsChange: (mappings: ColumnMapping[]) => void
}

export function ColumnMapper({ headers, mappings, onMappingsChange }: ColumnMapperProps) {
  const [newLogicalName, setNewLogicalName] = useState("")

  const addMapping = () => {
    if (!newLogicalName.trim()) return
    const newMapping: ColumnMapping = {
      logicalName: newLogicalName.trim(),
      candidates: [],
      required: true,
    }
    onMappingsChange([...mappings, newMapping])
    setNewLogicalName("")
  }

  const updateMapping = (index: number, updates: Partial<ColumnMapping>) => {
    const updated = [...mappings]
    updated[index] = { ...updated[index], ...updates }
    onMappingsChange(updated)
  }

  const removeMapping = (index: number) => {
    onMappingsChange(mappings.filter((_, i) => i !== index))
  }

  const toggleCandidate = (mappingIndex: number, header: string) => {
    const mapping = mappings[mappingIndex]
    const candidates = mapping.candidates.includes(header)
      ? mapping.candidates.filter((c) => c !== header)
      : [...mapping.candidates, header]
    updateMapping(mappingIndex, { candidates })
  }

  const autoDetect = () => {
    // Simple auto-detection based on common patterns
    const detected: ColumnMapping[] = []
    const patterns: Record<string, string[]> = {
      省份: ["省", "province"],
      城市: ["市", "city"],
      区县: ["区", "县", "district"],
      名称: ["名称", "name", "店名", "门店"],
      代码: ["代码", "code", "编码", "编号"],
      电话: ["电话", "phone", "tel", "mobile"],
      地址: ["地址", "address"],
    }

    for (const [logical, keywords] of Object.entries(patterns)) {
      const matched = headers.filter((h) => keywords.some((k) => h.toLowerCase().includes(k.toLowerCase())))
      if (matched.length > 0) {
        detected.push({
          logicalName: logical,
          candidates: matched,
          required: true,
        })
      }
    }

    if (detected.length > 0) {
      onMappingsChange(detected)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">字段映射</h2>
          <p className="mt-1 text-sm text-muted-foreground">定义逻辑字段名并选择对应的 Excel 列名候选</p>
        </div>
        <button
          onClick={autoDetect}
          className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-muted"
        >
          <Sparkles className="h-4 w-4" />
          智能识别
        </button>
      </div>

      {/* Existing Mappings */}
      <div className="space-y-3">
        {mappings.map((mapping, index) => (
          <div key={index} className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={mapping.logicalName}
                onChange={(e) => updateMapping(index, { logicalName: e.target.value })}
                className="w-32 rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="字段名"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={mapping.required}
                  onChange={(e) => updateMapping(index, { required: e.target.checked })}
                  className="rounded border-border"
                />
                必填
              </label>
              <button
                onClick={() => removeMapping(index)}
                className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Candidate Selection */}
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">选择匹配的列名候选:</p>
              <div className="flex flex-wrap gap-1.5">
                {headers.map((header) => {
                  const isSelected = mapping.candidates.includes(header)
                  return (
                    <button
                      key={header}
                      onClick={() => toggleCandidate(index, header)}
                      className={`rounded-md px-2 py-1 text-xs transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {header}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Mapping */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newLogicalName}
          onChange={(e) => setNewLogicalName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMapping()}
          className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="输入新的逻辑字段名..."
        />
        <button
          onClick={addMapping}
          disabled={!newLogicalName.trim()}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          添加
        </button>
      </div>

      {/* Quick Add Common Fields */}
      {mappings.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-4">
          <p className="mb-3 text-sm text-muted-foreground">快速添加常用字段:</p>
          <div className="flex flex-wrap gap-2">
            {["省份", "城市", "区县", "名称", "代码", "地址", "电话"].map((field) => (
              <button
                key={field}
                onClick={() => onMappingsChange([...mappings, { logicalName: field, candidates: [], required: true }])}
                className="rounded-md border border-border bg-secondary px-3 py-1 text-sm text-secondary-foreground hover:bg-muted"
              >
                + {field}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
