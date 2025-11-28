"use client"

import { Table2, ChevronRight } from "lucide-react"
import type { SheetData } from "@/lib/types"

interface SheetSelectorProps {
  sheets: string[]
  selectedSheet: string
  onSelectSheet: (sheet: string) => void
  sheetData: Record<string, SheetData>
}

export function SheetSelector({ sheets, selectedSheet, onSelectSheet, sheetData }: SheetSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">选择工作表</h2>
        <p className="mt-1 text-sm text-muted-foreground">选择要转换的 Sheet，可以查看每个表的预览数据</p>
      </div>

      <div className="space-y-2">
        {sheets.map((sheet) => {
          const data = sheetData[sheet]
          const isSelected = selectedSheet === sheet

          return (
            <button
              key={sheet}
              onClick={() => onSelectSheet(sheet)}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <Table2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{sheet}</p>
                    <p className="text-sm text-muted-foreground">
                      {data?.rows.length || 0} 行 · {data?.headers.length || 0} 列
                    </p>
                  </div>
                </div>
                {isSelected && <ChevronRight className="h-5 w-5 text-primary" />}
              </div>

              {/* Column Preview */}
              {data && data.headers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.headers.slice(0, 8).map((header) => (
                    <span key={header} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {header}
                    </span>
                  ))}
                  {data.headers.length > 8 && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      +{data.headers.length - 8} 更多
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
