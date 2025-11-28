export interface SheetData {
  headers: string[]
  rows: Record<string, unknown>[]
}

export interface ExcelData {
  fileName: string
  sheets: string[]
  data: Record<string, SheetData>
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
