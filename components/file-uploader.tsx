"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileSpreadsheet, CheckCircle2, X, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import type { ExcelData, SheetData } from "@/lib/types"

interface FileUploaderProps {
  onFileLoaded: (data: ExcelData | null) => void
  excelData: ExcelData | null
}

export function FileUploader({ onFileLoaded, excelData }: FileUploaderProps) {
  const PREVIEW_ROWS = 50
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const parseSheetPreview = (sheet: XLSX.WorkSheet): { headers: string[]; previewRows: Record<string, unknown>[]; totalRows: number } => {
    const previewRows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
      sheetRows: PREVIEW_ROWS,
    }) as Record<string, unknown>[]

    const headerRow = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      range: 0,
      blankrows: false,
      defval: "",
      raw: false,
    }) as string[][]
    const headersFromSheet = (headerRow[0] || []).map((h) => String(h))
    const headersFromPreview = previewRows.length > 0 ? Object.keys(previewRows[0]) : []
    const headers = headersFromPreview.length > 0 ? headersFromPreview : headersFromSheet

    const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null
    const totalRows = range ? range.e.r - range.s.r + 1 : previewRows.length

    return { headers, previewRows, totalRows }
  }

  const processFile = useCallback(
    (file: File) => {
      setError(null)
      setIsLoading(true)
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer
          const data = new Uint8Array(buffer)
          const workbook = XLSX.read(data, { type: "array", dense: true })

          const sheetData: Record<string, SheetData> = {}
          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName]
            const { headers, previewRows, totalRows } = parseSheetPreview(sheet)
            sheetData[sheetName] = { headers, previewRows, totalRows }
          }

          onFileLoaded({
            fileName: file.name,
            fileSize: file.size,
            sheets: workbook.SheetNames,
            data: sheetData,
            fileBuffer: buffer,
          })
        } catch {
          setError("文件解析失败，请确保是有效的 Excel/CSV 文件")
        } finally {
          setIsLoading(false)
        }
      }

      reader.readAsArrayBuffer(file)
    },
    [onFileLoaded],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">上传 Excel / CSV 文件</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          支持 .xlsx、.xls、.csv 格式，文件将在浏览器中解析，不会上传到服务器
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          默认仅读取前 50 行用于预览，切换到导出步骤时会按需加载完整数据，避免大文件卡顿
        </p>
      </div>

      {!excelData ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-sm font-medium text-foreground">正在解析文件，请稍候...</p>
              <p className="mt-1 text-xs text-muted-foreground">大文件需要几秒，请勿关闭页面</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium text-foreground">拖拽文件到此处，或点击选择文件</p>
              <p className="mt-1 text-xs text-muted-foreground">支持 Excel (.xlsx, .xls) 和 CSV 文件</p>
            </>
          )}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={isLoading}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{excelData.fileName}</p>
                <p className="text-sm text-muted-foreground">{excelData.sheets.length} 个工作表</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <button
                onClick={() => onFileLoaded(null)}
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        {[
          { title: "浏览器解析", desc: "数据不离开本地" },
          { title: "多 Sheet 支持", desc: "选择任意工作表" },
          { title: "智能表头", desc: "自动识别列名" },
        ].map((feature) => (
          <div key={feature.title} className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-sm font-medium text-foreground">{feature.title}</p>
            <p className="text-xs text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
