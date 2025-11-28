"use client"

import { useCallback, useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { FileUploader } from "@/components/file-uploader"
import { SheetSelector } from "@/components/sheet-selector"
import { PreviewPanel } from "@/components/preview-panel"
import { ExportPanel } from "@/components/export-panel"
import { Stepper } from "@/components/stepper"
import { ModeSelector } from "@/components/mode-selector"
import { GroupConfigurator } from "@/components/group-configurator"
import { LeafConfigurator } from "@/components/leaf-configurator"
import { uiConfigToTransformConfig } from "@/lib/ui-config"
import type { ExcelData, TransformConfig, UiConfig, UiMode } from "@/lib/types"
import { FileSpreadsheet } from "lucide-react"

const steps = [
  { id: 1, name: "上传文件", description: "选择 Excel/CSV 文件" },
  { id: 2, name: "选择 Sheet", description: "选择要转换的工作表" },
  { id: 3, name: "选择模式/分组", description: "选择平铺/树形并配置层级" },
  { id: 4, name: "配置叶子字段", description: "选择需要的列并命名输出" },
  { id: 5, name: "预览导出", description: "检查结果并导出" },
]

const createDefaultUiConfig = (): UiConfig => ({
  name: "output",
  tsExportName: "data",
  mode: "tree",
  groups: [],
  leaf: {
    arrayField: "items",
    fields: [],
  },
})

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [excelData, setExcelData] = useState<ExcelData | null>(null)
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [uiConfig, setUiConfig] = useState<UiConfig>(() => createDefaultUiConfig())
  const [loadingSheet, setLoadingSheet] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isAdvancing, setIsAdvancing] = useState(false)

  const headers = excelData && selectedSheet ? excelData.data[selectedSheet]?.headers || [] : []

  const transformConfig: TransformConfig | null = useMemo(() => {
    if (!excelData || !selectedSheet) return null
    return uiConfigToTransformConfig(uiConfig, headers)
  }, [excelData, selectedSheet, uiConfig, headers])

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return excelData !== null
      case 2:
        return selectedSheet !== ""
      case 3:
        if (uiConfig.mode === "flat") return true
        return uiConfig.groups.length > 0
      case 4:
        return uiConfig.leaf.fields.length > 0
      default:
        return true
    }
  }

  const loadFullSheet = useCallback(
    async (sheetName: string) => {
      if (!excelData || !sheetName) return false
      const sheet = excelData.data[sheetName]
      if (!sheet) return false
      if (sheet.rows) return true

      setLoadingSheet(sheetName)
      setParseError(null)

      try {
        // Yield to the browser before heavy parsing to avoid jank
        await new Promise((resolve) => setTimeout(resolve, 0))
        const workbook = XLSX.read(excelData.fileBuffer, { type: "array", dense: true })
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) {
          throw new Error("无法找到指定的 Sheet")
        }
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false }) as Record<string, unknown>[]
        const headers = rows.length > 0 ? Object.keys(rows[0]) : sheet.headers

        setExcelData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            data: {
              ...prev.data,
              [sheetName]: {
                ...prev.data[sheetName],
                headers,
                rows,
              },
            },
          }
        })
        return true
      } catch (err) {
        console.error(err)
        setParseError("解析完整数据失败，请确认文件格式或尝试重新上传")
        return false
      } finally {
        setLoadingSheet(null)
      }
    },
    [excelData],
  )

  const handleNext = useCallback(async () => {
    if (!canProceed() || isAdvancing) return
    if (currentStep === 4 && excelData && selectedSheet) {
      if (!transformConfig) return
      setIsAdvancing(true)
      const ok = await loadFullSheet(selectedSheet)
      setIsAdvancing(false)
      if (!ok) return
    }
    setCurrentStep((s) => Math.min(5, s + 1))
  }, [canProceed, currentStep, excelData, loadFullSheet, selectedSheet, isAdvancing, transformConfig])

  const handleReset = () => {
    setCurrentStep(1)
    setExcelData(null)
    setSelectedSheet("")
    setUiConfig(createDefaultUiConfig())
    setParseError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Excel 数据转换器</h1>
              <p className="text-sm text-muted-foreground">可视化配置 Excel 到结构化数据的转换</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Stepper */}
        <Stepper steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

        {/* Main Content */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-6">
              {currentStep === 1 && (
                <FileUploader
                  onFileLoaded={(data) => {
                    if (!data) {
                      handleReset()
                      return
                    }
                    setExcelData(data)
                    setSelectedSheet("")
                    setUiConfig(createDefaultUiConfig())
                  }}
                  excelData={excelData}
                />
              )}

              {currentStep === 2 && excelData && (
                <SheetSelector
                  sheets={excelData.sheets}
                  selectedSheet={selectedSheet}
                  onSelectSheet={setSelectedSheet}
                  sheetData={excelData.data}
                />
              )}

              {currentStep === 3 && excelData && selectedSheet && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">方案名称</label>
                      <input
                        value={uiConfig.name}
                        onChange={(e) => setUiConfig({ ...uiConfig, name: e.target.value })}
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">TS 导出变量名</label>
                      <input
                        value={uiConfig.tsExportName}
                        onChange={(e) => setUiConfig({ ...uiConfig, tsExportName: e.target.value })}
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <ModeSelector
                    mode={uiConfig.mode}
                    onChange={(mode: UiMode) =>
                      setUiConfig((prev) => ({
                        ...prev,
                        mode,
                        groups: mode === "flat" ? [] : prev.groups,
                      }))
                    }
                  />

                  <GroupConfigurator
                    mode={uiConfig.mode}
                    headers={headers}
                    groups={uiConfig.groups}
                    onChange={(groups) => setUiConfig({ ...uiConfig, groups })}
                  />
                </div>
              )}

              {currentStep === 4 && excelData && selectedSheet && (
                <LeafConfigurator
                  headers={headers}
                  leaf={uiConfig.leaf}
                  onChange={(leaf) => setUiConfig({ ...uiConfig, leaf })}
                />
              )}

              {currentStep === 5 && excelData && selectedSheet && transformConfig && (
                <ExportPanel config={transformConfig} data={excelData.data[selectedSheet]?.rows || []} />
              )}

              {parseError && <p className="mt-4 text-sm text-destructive">{parseError}</p>}

              {/* Navigation */}
              <div className="mt-6 flex justify-between border-t border-border pt-6">
                <button
                  onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                  disabled={currentStep === 1}
                  className="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  上一步
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed() || currentStep === 5 || loadingSheet !== null || isAdvancing}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingSheet
                    ? `正在加载 ${loadingSheet}...`
                    : currentStep === 4
                      ? "预览结果"
                      : "下一步"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-1">
            <PreviewPanel
              excelData={excelData}
              selectedSheet={selectedSheet}
              config={transformConfig}
              currentStep={currentStep}
              loading={loadingSheet !== null || isAdvancing}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
