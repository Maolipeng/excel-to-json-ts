export interface SheetData {
  headers: string[]
  previewRows: Record<string, unknown>[]
  rows?: Record<string, unknown>[]
  totalRows: number
}

export interface ExcelData {
  fileName: string
  fileSize: number
  sheets: string[]
  data: Record<string, SheetData>
  fileBuffer: ArrayBuffer
}

export type UiMode = "flat" | "tree" | "pro"

export interface UiGroupLevel {
  name: string
  keyColumn: string
  labelColumn?: string
  codeColumn?: string
  childrenField?: string
}

export interface UiLeafField {
  column: string
  outputKey: string
}

export interface UiLeafConfig {
  arrayField: string
  dedupeBy?: string
  fields: UiLeafField[]
}

export interface UiConfig {
  name: string
  tsExportName: string
  mode: UiMode
  groups: UiGroupLevel[]
  leaf: UiLeafConfig
}

export interface ColumnMapping {
  logicalName: string
  candidates: string[]
  required: boolean
  matchedHeader?: string
}

export interface GroupLevel {
  keyField: string
  nameField?: string
  codeField?: string
  childrenKey: string
  nodeName: string
}

export interface LeafConfig {
  outputKey: string
  fields: { from: string; to: string }[]
  dedupeBy?: string
}

export interface TransformConfig {
  name: string
  headerMapping: Record<string, { candidates: string[]; required: boolean }>
  groupLevels: GroupLevel[]
  leaf: LeafConfig
  tsExportName: string
}
