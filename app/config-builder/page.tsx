"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Plus, Trash2, Copy, Check, Download, FileCog, FileSpreadsheet } from "lucide-react"
import { generateConfigCode } from "@/lib/transformer"
import type { TransformConfig } from "@/lib/types"

type HeaderEntry = { logical: string; candidates: string; required: boolean }
type GroupEntry = {
  keyField: string
  nameField?: string
  codeField?: string
  nameKey?: string
  codeKey?: string
  childrenKey: string
  nodeName: string
  extraFields: { from: string; to: string }[]
}

type LeafFieldEntry = { from: string; to: string }

const defaultHeaders: HeaderEntry[] = [
  { logical: "dealerCode", candidates: "dealer_code, code", required: true },
  { logical: "dealerName", candidates: "dealer_name, name", required: true },
  { logical: "provinceId", candidates: "province_id, provinceid", required: false },
  { logical: "province", candidates: "province, province_name", required: false },
]

const defaultLeafFields: LeafFieldEntry[] = [
  { from: "dealerCode", to: "dealerCode" },
  { from: "dealerName", to: "dealerName" },
  { from: "provinceId", to: "provinceId" },
  { from: "province", to: "province" },
]

export default function ConfigBuilderPage() {
  const [name, setName] = useState("dealer")
  const [tsExportName, setTsExportName] = useState("data")
  const [headerEntries, setHeaderEntries] = useState<HeaderEntry[]>(defaultHeaders)
  const [groupEntries, setGroupEntries] = useState<GroupEntry[]>([])
  const [leafOutputKey, setLeafOutputKey] = useState("items")
  const [leafDedupeBy, setLeafDedupeBy] = useState("")
  const [leafFields, setLeafFields] = useState<LeafFieldEntry[]>(defaultLeafFields)
  const [copied, setCopied] = useState(false)

  const parsedConfig: TransformConfig = useMemo(() => {
    const headerMapping: TransformConfig["headerMapping"] = {}
    headerEntries.forEach((entry) => {
      const key = entry.logical.trim()
      if (!key) return
      const candidates = entry.candidates
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      if (candidates.length === 0) return
      headerMapping[key] = { candidates, required: entry.required }
    })

    const groupLevels = groupEntries
      .filter((g) => g.keyField.trim())
      .map((g, idx) => ({
        keyField: g.keyField.trim(),
        nameField: g.nameField?.trim() || undefined,
        codeField: g.codeField?.trim() || undefined,
        nameKey: (g.nameKey || "name").trim() || "name",
        codeKey: (g.codeKey || "code").trim() || "code",
        childrenKey: g.childrenKey.trim() || "children",
        nodeName: g.nodeName.trim() || `第${idx + 1}级`,
        extraFields: g.extraFields.filter((f) => f.from.trim() && f.to.trim()),
      }))

    const leaf: TransformConfig["leaf"] = {
      outputKey: leafOutputKey.trim() || "items",
      dedupeBy: leafDedupeBy.trim() || undefined,
      fields: leafFields.filter((f) => f.from.trim() && f.to.trim()),
    }

    return {
      name: name.trim() || "dealer",
      tsExportName: tsExportName.trim() || "data",
      headerMapping,
      groupLevels,
      leaf,
    }
  }, [headerEntries, groupEntries, leafFields, leafOutputKey, leafDedupeBy, name, tsExportName])

  const configCode = useMemo(() => generateConfigCode(parsedConfig), [parsedConfig])

  const copyCode = () => {
    const doSet = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(configCode).then(doSet).catch(() => fallback())
      } else {
        fallback()
      }
    } catch {
      fallback()
    }

    function fallback() {
      try {
        const textarea = document.createElement("textarea")
        textarea.value = configCode
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
        doSet()
      } catch {
        // ignore
      }
    }
  }

  const downloadFile = () => {
    const blob = new Blob([configCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${parsedConfig.name || "dealer"}.config.js`
    a.click()
    URL.revokeObjectURL(url)
  }

  const addHeader = () => setHeaderEntries([...headerEntries, { logical: "", candidates: "", required: false }])
  const updateHeader = (index: number, patch: Partial<HeaderEntry>) => {
    const next = [...headerEntries]
    next[index] = { ...next[index], ...patch }
    setHeaderEntries(next)
  }
  const removeHeader = (index: number) => setHeaderEntries(headerEntries.filter((_, i) => i !== index))

  const addGroup = () =>
    setGroupEntries([
      ...groupEntries,
      {
        keyField: "",
        nameField: "",
        codeField: "",
        nameKey: "name",
        codeKey: "code",
        childrenKey: "children",
        nodeName: `第${groupEntries.length + 1}级`,
        extraFields: [],
      },
    ])
  const updateGroup = (index: number, patch: Partial<GroupEntry>) => {
    const next = [...groupEntries]
    next[index] = { ...next[index], ...patch }
    setGroupEntries(next)
  }
  const removeGroup = (index: number) => setGroupEntries(groupEntries.filter((_, i) => i !== index))

  const addGroupExtra = (groupIndex: number) => {
    const next = [...groupEntries]
    next[groupIndex].extraFields = [...next[groupIndex].extraFields, { from: "", to: "" }]
    setGroupEntries(next)
  }
  const updateGroupExtra = (groupIndex: number, extraIndex: number, patch: { from?: string; to?: string }) => {
    const next = [...groupEntries]
    const extras = [...next[groupIndex].extraFields]
    extras[extraIndex] = { ...extras[extraIndex], ...patch }
    next[groupIndex].extraFields = extras
    setGroupEntries(next)
  }
  const removeGroupExtra = (groupIndex: number, extraIndex: number) => {
    const next = [...groupEntries]
    next[groupIndex].extraFields = next[groupIndex].extraFields.filter((_, i) => i !== extraIndex)
    setGroupEntries(next)
  }

  const addLeafField = () => setLeafFields([...leafFields, { from: "", to: "" }])
  const updateLeafField = (index: number, patch: Partial<LeafFieldEntry>) => {
    const next = [...leafFields]
    next[index] = { ...next[index], ...patch }
    setLeafFields(next)
  }
  const removeLeafField = (index: number) => setLeafFields(leafFields.filter((_, i) => i !== index))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileCog className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">配置生成器</h1>
              <p className="text-sm text-muted-foreground">生成 dealer.config.js 供脚本/CLI 使用</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="rounded-md px-3 py-1.5 text-foreground hover:bg-muted transition-colors">
              数据转换
            </Link>
            <Link
              href="/config-builder"
              className="rounded-md px-3 py-1.5 bg-muted text-foreground transition-colors"
            >
              配置生成
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">dealer.config.js 可视化配置</h1>
            <p className="text-sm text-muted-foreground">
              通过表单生成 CLI 可用的配置文件，可直接复制或下载为 dealer.config.js
            </p>
          </div>
        </div>

      {/* 基础信息 */}
      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">基础信息</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">配置名称 (文件前缀)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="dealer"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">TS 导出变量名</label>
            <input
              value={tsExportName}
              onChange={(e) => setTsExportName(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="data"
            />
          </div>
        </div>
      </section>

      {/* 表头映射 */}
      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">表头映射</h2>
            <p className="text-xs text-muted-foreground">设置逻辑字段名及候选表头，候选用逗号分隔</p>
          </div>
          <button
            onClick={addHeader}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> 添加字段
          </button>
        </div>

        <div className="space-y-2">
          {headerEntries.map((h, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-5 items-center rounded-md border border-border p-3">
              <input
                value={h.logical}
                onChange={(e) => updateHeader(idx, { logical: e.target.value })}
                className="sm:col-span-1 rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="逻辑名，如 dealerCode"
              />
              <input
                value={h.candidates}
                onChange={(e) => updateHeader(idx, { candidates: e.target.value })}
                className="sm:col-span-3 rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="候选表头，逗号分隔"
              />
              <div className="flex items-center justify-between sm:col-span-1 gap-2">
                <label className="flex items-center gap-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={h.required}
                    onChange={(e) => updateHeader(idx, { required: e.target.checked })}
                    className="rounded border-border"
                  />
                  必填
                </label>
                <button
                  onClick={() => removeHeader(idx)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {headerEntries.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
              还没有字段，点击「添加字段」开始配置
            </div>
          )}
        </div>
      </section>

      {/* 分组层级 */}
      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">分组层级 (可选)</h2>
            <p className="text-xs text-muted-foreground">配置树形层级，不需要分组可留空生成平铺列表</p>
          </div>
          <button
            onClick={addGroup}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> 添加层级
          </button>
        </div>

        <div className="space-y-3">
          {groupEntries.map((g, idx) => (
            <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">第 {idx + 1} 级 · {g.nodeName}</span>
                <button
                  onClick={() => removeGroup(idx)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">分组键字段</label>
                  <input
                    value={g.keyField}
                    onChange={(e) => updateGroup(idx, { keyField: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="如 provinceId"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">节点名称</label>
                  <input
                    value={g.nodeName}
                    onChange={(e) => updateGroup(idx, { nodeName: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="如 省/市"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">显示名称字段 (可选)</label>
                  <input
                    value={g.nameField || ""}
                    onChange={(e) => updateGroup(idx, { nameField: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="如 province"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Code 字段 (可选)</label>
                  <input
                    value={g.codeField || ""}
                    onChange={(e) => updateGroup(idx, { codeField: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="如 provinceId"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">名称输出键名</label>
                  <input
                    value={g.nameKey || "name"}
                    onChange={(e) => updateGroup(idx, { nameKey: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Code 输出键名</label>
                  <input
                    value={g.codeKey || "code"}
                    onChange={(e) => updateGroup(idx, { codeKey: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="code"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">子节点数组键名</label>
                  <input
                    value={g.childrenKey}
                    onChange={(e) => updateGroup(idx, { childrenKey: e.target.value })}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="children"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">额外字段</p>
                  <button
                    onClick={() => addGroupExtra(idx)}
                    className="flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" /> 添加
                  </button>
                </div>
                {g.extraFields.length === 0 && (
                  <div className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                    暂无额外字段
                  </div>
                )}
                {g.extraFields.map((ef, eidx) => (
                  <div key={eidx} className="grid grid-cols-1 gap-2 sm:grid-cols-3 items-center">
                    <input
                      value={ef.from}
                      onChange={(e) => updateGroupExtra(idx, eidx, { from: e.target.value })}
                      className="rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="来源字段"
                    />
                    <input
                      value={ef.to}
                      onChange={(e) => updateGroupExtra(idx, eidx, { to: e.target.value })}
                      className="rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="输出键名"
                    />
                    <button
                      onClick={() => removeGroupExtra(idx, eidx)}
                      className="justify-self-end rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {groupEntries.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
              未添加分组，将生成平铺列表
            </div>
          )}
        </div>
      </section>

      {/* 叶子字段 */}
      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">叶子字段</h2>
            <p className="text-xs text-muted-foreground">配置最终数组字段名、去重字段以及字段映射</p>
          </div>
          <button
            onClick={addLeafField}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> 添加字段
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">叶子数组键名</label>
            <input
              value={leafOutputKey}
              onChange={(e) => setLeafOutputKey(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="items"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">去重字段 (可选)</label>
            <input
              value={leafDedupeBy}
              onChange={(e) => setLeafDedupeBy(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="如 dealerCode"
            />
          </div>
          <div className="flex items-end">
            <p className="text-xs text-muted-foreground">
              叶子字段来源字段应与上方表头逻辑名一致
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {leafFields.map((f, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-3 items-center">
              <input
                value={f.from}
                onChange={(e) => updateLeafField(idx, { from: e.target.value })}
                className="rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="来源字段 (逻辑名)"
              />
              <input
                value={f.to}
                onChange={(e) => updateLeafField(idx, { to: e.target.value })}
                className="rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="输出字段名"
              />
              <button
                onClick={() => removeLeafField(idx)}
                className="justify-self-end rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {leafFields.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
              还没有叶子字段，请点击添加
            </div>
          )}
        </div>
      </section>

      {/* 输出 */}
      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">生成 dealer.config.js</h2>
            <p className="text-xs text-muted-foreground">可复制到脚本或直接下载</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              onClick={downloadFile}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
              下载
            </button>
          </div>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-3 max-h-96 overflow-auto">
          <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">{configCode}</pre>
        </div>
      </section>
    </div>
    </div>
  )
}
