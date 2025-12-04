import type { TransformConfig } from "./types"
import type { UiConfig } from "./types"

const unique = <T,>(arr: T[]) => Array.from(new Set(arr.filter(Boolean)))

const slugify = (value: string, fallback: string) => {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
  return slug || fallback
}

const buildCandidates = (column: string) => unique([column, column.toUpperCase(), column.toLowerCase()])

export function uiConfigToTransformConfig(ui: UiConfig, headers: string[]): TransformConfig {
  const headerMapping: TransformConfig["headerMapping"] = {}
  const columnToLogical = new Map<string, string>()
  const outputKeyToLogical = new Map<string, string>()
  const slugCounter = new Map<string, number>()

  const nextLogical = (base: string) => {
    const count = slugCounter.get(base) || 0
    slugCounter.set(base, count + 1)
    return count === 0 ? base : `${base}_${count}`
  }

  const register = (logical: string, column: string, required = true) => {
    if (!headerMapping[logical]) {
      headerMapping[logical] = { candidates: buildCandidates(column), required }
    }
    columnToLogical.set(column, logical)
    return logical
  }

  const ensureLogicalForColumn = (column: string, hint: string, required = true) => {
    const existing = columnToLogical.get(column)
    if (existing) return existing
    const base = slugify(hint || column, "col")
    const logical = nextLogical(base)
    return register(logical, column, required)
  }

  const usedGroups = ui.mode === "flat" ? [] : ui.groups

  const groupLevels = usedGroups.map((group, index) => {
    const keyField = register(`level${index + 1}Key`, group.keyColumn, true)
    const nameField = group.labelColumn
      ? register(`level${index + 1}Name`, group.labelColumn, false)
      : undefined
    const codeField = group.codeColumn
      ? register(`level${index + 1}Code`, group.codeColumn, false)
      : undefined
    const childrenKey = group.childrenField || (index === usedGroups.length - 1 ? ui.leaf.arrayField : "children")
    const extraFields = (group.extraFields || []).map((field, extraIndex) => {
      const hint = field.outputKey || field.column || `extra_${extraIndex + 1}`
      const logical = ensureLogicalForColumn(field.column, `level${index + 1}_${hint}`, true)
      return { from: logical, to: field.outputKey || hint }
    })

    return {
      keyField,
      nameField,
      codeField,
      nameKey: group.nameKey || "name",
      codeKey: group.codeKey || "code",
      childrenKey,
      nodeName: group.name || `第${index + 1}级`,
      extraFields,
    }
  })

  const leafFields = ui.leaf.fields.map((field, index) => {
    const hint = field.outputKey || field.column || `leaf${index + 1}`
    const logical = ensureLogicalForColumn(field.column, `leaf_${hint}`, true)
    outputKeyToLogical.set(field.outputKey, logical)
    return { from: logical, to: field.outputKey }
  })

  const dedupeByLogical = ui.leaf.dedupeBy ? outputKeyToLogical.get(ui.leaf.dedupeBy) : undefined

  // Fallback: ensure every header has a mapping so detectHeaders can still find matches in flat mode
  if (ui.mode === "flat" && headers.length > 0 && Object.keys(headerMapping).length === 0) {
    headers.forEach((h, idx) => {
      const logical = ensureLogicalForColumn(h, `col_${idx}`, false)
      headerMapping[logical] = { candidates: buildCandidates(h), required: false }
    })
  }

  return {
    name: ui.name || "output",
    tsExportName: ui.tsExportName || "data",
    headerMapping,
    groupLevels,
    leaf: {
      outputKey: ui.leaf.arrayField || "items",
      dedupeBy: dedupeByLogical,
      fields: leafFields,
    },
  }
}
