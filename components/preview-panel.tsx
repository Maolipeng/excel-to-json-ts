"use client"

import { useMemo } from "react"
import { Eye, Code2, Table, BarChart3 } from "lucide-react"
import type { ExcelData, TransformConfig } from "@/lib/types"
import { buildFromConfig } from "@/lib/transformer"

interface PreviewPanelProps {
  excelData: ExcelData | null
  selectedSheet: string
  config: TransformConfig
  currentStep: number
}

export function PreviewPanel({ excelData, selectedSheet, config, currentStep }: PreviewPanelProps) {
  const result = useMemo(() => {
    if (!excelData || !selectedSheet || currentStep < 3) return null
    const rows = excelData.data[selectedSheet]?.rows || []
    if (rows.length === 0 || config.leaf.fields.length === 0) return null

    try {
      return buildFromConfig(rows.slice(0, 100), config)
    } catch {
      return null
    }
  }, [excelData, selectedSheet, config, currentStep])

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-foreground">实时预览</h3>
        </div>
      </div>

      <div className="p-4">
        {currentStep === 1 && (
          <div className="text-center py-8">
            <Table className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">上传文件后查看数据预览</p>
          </div>
        )}

        {currentStep === 2 && excelData && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">选择 Sheet 后查看数据</p>
            {selectedSheet && excelData.data[selectedSheet] && (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        {excelData.data[selectedSheet].headers.slice(0, 5).map((h) => (
                          <th key={h} className="px-2 py-1.5 text-left font-medium text-foreground">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.data[selectedSheet].rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          {excelData.data[selectedSheet].headers.slice(0, 5).map((h) => (
                            <td key={h} className="px-2 py-1.5 text-muted-foreground truncate max-w-24">
                              {String(row[h] || "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep >= 3 && !result && (
          <div className="text-center py-8">
            <Code2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">完成字段映射后查看转换结果</p>
          </div>
        )}

        {currentStep >= 3 && result && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">总行数</p>
                <p className="text-lg font-semibold text-foreground">{result.stats.totalRows}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">处理行数</p>
                <p className="text-lg font-semibold text-primary">{result.stats.usedRows}</p>
              </div>
              {result.stats.groupCounts.map((count, i) => (
                <div key={i} className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">{config.groupLevels[i]?.nodeName || `第${i + 1}级`}</p>
                  <p className="text-lg font-semibold text-foreground">{count}</p>
                </div>
              ))}
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">叶子节点</p>
                <p className="text-lg font-semibold text-foreground">{result.stats.leafCount}</p>
              </div>
            </div>

            {/* JSON Preview */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">数据预览</span>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3 max-h-48 overflow-auto">
                <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                  {JSON.stringify(result.data.slice(0, 2), null, 2)}
                  {result.data.length > 2 && "\n// ... 更多数据"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
