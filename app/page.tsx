"use client"

import { useState } from "react"
import { FileUploader } from "@/components/file-uploader"
import { SheetSelector } from "@/components/sheet-selector"
import { ColumnMapper } from "@/components/column-mapper"
import { GroupBuilder } from "@/components/group-builder"
import { PreviewPanel } from "@/components/preview-panel"
import { ExportPanel } from "@/components/export-panel"
import { Stepper } from "@/components/stepper"
import type { ExcelData, ColumnMapping, GroupLevel, TransformConfig } from "@/lib/types"
import { FileSpreadsheet } from "lucide-react"

const steps = [
  { id: 1, name: "上传文件", description: "选择 Excel/CSV 文件" },
  { id: 2, name: "选择 Sheet", description: "选择要转换的工作表" },
  { id: 3, name: "映射字段", description: "配置列名映射" },
  { id: 4, name: "设置分组", description: "定义数据层级结构" },
  { id: 5, name: "预览导出", description: "检查结果并导出" },
]

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [excelData, setExcelData] = useState<ExcelData | null>(null)
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [groupLevels, setGroupLevels] = useState<GroupLevel[]>([])
  const [leafConfig, setLeafConfig] = useState<{
    outputKey: string
    fields: { from: string; to: string }[]
    dedupeBy?: string
  }>({ outputKey: "items", fields: [] })

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return excelData !== null
      case 2:
        return selectedSheet !== ""
      case 3:
        return columnMappings.length > 0
      case 4:
        return true
      default:
        return true
    }
  }

  const getConfig = (): TransformConfig => ({
    name: "output",
    headerMapping: columnMappings.reduce(
      (acc, m) => ({
        ...acc,
        [m.logicalName]: { candidates: m.candidates, required: m.required },
      }),
      {},
    ),
    groupLevels,
    leaf: leafConfig,
    tsExportName: "data",
  })

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
              {currentStep === 1 && <FileUploader onFileLoaded={setExcelData} excelData={excelData} />}

              {currentStep === 2 && excelData && (
                <SheetSelector
                  sheets={excelData.sheets}
                  selectedSheet={selectedSheet}
                  onSelectSheet={setSelectedSheet}
                  sheetData={excelData.data}
                />
              )}

              {currentStep === 3 && excelData && selectedSheet && (
                <ColumnMapper
                  headers={excelData.data[selectedSheet]?.headers || []}
                  mappings={columnMappings}
                  onMappingsChange={setColumnMappings}
                />
              )}

              {currentStep === 4 && excelData && selectedSheet && (
                <GroupBuilder
                  mappings={columnMappings}
                  groupLevels={groupLevels}
                  onGroupLevelsChange={setGroupLevels}
                  leafConfig={leafConfig}
                  onLeafConfigChange={setLeafConfig}
                />
              )}

              {currentStep === 5 && excelData && selectedSheet && (
                <ExportPanel config={getConfig()} data={excelData.data[selectedSheet]?.rows || []} />
              )}

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
                  onClick={() => setCurrentStep((s) => Math.min(5, s + 1))}
                  disabled={!canProceed() || currentStep === 5}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {currentStep === 4 ? "预览结果" : "下一步"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-1">
            <PreviewPanel
              excelData={excelData}
              selectedSheet={selectedSheet}
              config={getConfig()}
              currentStep={currentStep}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
