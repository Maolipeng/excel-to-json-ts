"use client"

import { useMemo, useState } from "react"
import { Download, Copy, Check, FileJson, FileCode, Settings2 } from "lucide-react"
import type { TransformConfig } from "@/lib/types"
import { buildFromConfig, generateConfigCode } from "@/lib/transformer"

interface ExportPanelProps {
  config: TransformConfig
  data: Record<string, unknown>[]
}

export function ExportPanel({ config, data }: ExportPanelProps) {
  const [activeTab, setActiveTab] = useState<"json" | "ts" | "config">("json")
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (data.length === 0 || config.leaf.fields.length === 0) return null
    try {
      return buildFromConfig(data, config)
    } catch {
      return null
    }
  }, [data, config])

  const jsonOutput = useMemo(() => {
    if (!result) return ""
    return JSON.stringify(result.data, null, 2)
  }, [result])

  const tsOutput = useMemo(() => {
    if (!result) return ""
    return `export const ${config.tsExportName} = ${JSON.stringify(result.data, null, 2)} as const;\n`
  }, [result, config.tsExportName])

  const configOutput = useMemo(() => {
    return generateConfigCode(config)
  }, [config])

  const currentOutput = activeTab === "json" ? jsonOutput : activeTab === "ts" ? tsOutput : configOutput

  const copyToClipboard = () => {
    const doSetCopied = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(currentOutput).then(doSetCopied).catch(() => {
          // fallback below
          fallbackCopy()
        })
        return
      }
      fallbackCopy()
    } catch {
      fallbackCopy()
    }

    function fallbackCopy() {
      try {
        const textarea = document.createElement("textarea")
        textarea.value = currentOutput
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
        doSetCopied()
      } catch {
        // ignore if copy fails
      }
    }
  }

  const downloadFile = () => {
    const ext = activeTab === "json" ? "json" : activeTab === "ts" ? "ts" : "config.js"
    const mime = activeTab === "json" ? "application/json" : "text/plain"
    const blob = new Blob([currentOutput], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${config.name}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">预览与导出</h2>
        <p className="mt-1 text-sm text-muted-foreground">查看转换结果，下载 JSON/TypeScript 文件或配置文件</p>
      </div>

      {/* Stats Summary */}
      {result && (
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{result.stats.totalRows}</p>
            <p className="text-xs text-muted-foreground">总行数</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{result.stats.usedRows}</p>
            <p className="text-xs text-muted-foreground">处理行数</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-accent">{result.stats.skippedRows}</p>
            <p className="text-xs text-muted-foreground">跳过行数</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{result.stats.leafCount}</p>
            <p className="text-xs text-muted-foreground">叶子节点</p>
          </div>
        </div>
      )}

      {/* Tab Selection */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {[
          { id: "json", icon: FileJson, label: "JSON" },
          { id: "ts", icon: FileCode, label: "TypeScript" },
          { id: "config", icon: Settings2, label: "配置文件" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Output */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium text-foreground">
            {activeTab === "config" ? "dealer.config.js" : `output.${activeTab}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              onClick={downloadFile}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
              下载
            </button>
          </div>
        </div>
        <div className="max-h-96 overflow-auto bg-muted/20 p-4">
          <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">{currentOutput}</pre>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <h4 className="text-sm font-medium text-foreground mb-2">💡 使用提示</h4>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• JSON 格式适合直接在应用中使用或通过 API 加载</li>
          <li>• TypeScript 格式提供类型安全，适合前端项目</li>
          <li>• 配置文件可与 CLI 工具配合使用，支持批量处理</li>
        </ul>
      </div>
    </div>
  )
}
