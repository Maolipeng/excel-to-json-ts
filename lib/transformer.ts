import type { TransformConfig } from "./types"

const normalize = (value: string) => String(value).trim().toLowerCase()
const compact = (value: string) => normalize(value).replace(/[^a-z0-9]/g, "")

function matchScore(header: string, candidate: string): number {
  const hNorm = normalize(header)
  const cNorm = normalize(candidate)
  if (!cNorm) return 0
  if (hNorm === cNorm) return 3

  const hCompact = compact(header)
  const cCompact = compact(candidate)
  if (hCompact === cCompact) return 2

  if (hNorm.includes(cNorm) || hCompact.includes(cCompact)) return 1
  return 0
}

export function detectHeaders(rows: Record<string, unknown>[], config: TransformConfig): Record<string, string> {
  const headers = Object.keys(rows[0] || {})
  const map: Record<string, string> = {}

  for (const [logical, rule] of Object.entries(config.headerMapping)) {
    let bestHeader: string | null = null
    let bestScore = 0

    for (const header of headers) {
      for (const candidate of rule.candidates) {
        const score = matchScore(header, candidate)
        if (score > bestScore) {
          bestScore = score
          bestHeader = header
          if (score === 3) break
        }
      }
      if (bestScore === 3) break
    }

    if (bestHeader) {
      map[logical] = bestHeader
    }
  }
  return map
}

function getValue(row: Record<string, unknown>, headerMap: Record<string, string>, logicalField: string): string {
  return String(row[headerMap[logicalField]] ?? "").trim()
}

export function buildFromConfig(
  rows: Record<string, unknown>[],
  config: TransformConfig,
): {
  data: unknown[]
  stats: {
    totalRows: number
    usedRows: number
    skippedRows: number
    groupCounts: number[]
    leafCount: number
  }
} {
  if (!rows.length) {
    return {
      data: [],
      stats: { totalRows: 0, usedRows: 0, skippedRows: 0, groupCounts: [], leafCount: 0 },
    }
  }

  const headerMap = detectHeaders(rows, config)
  const get = (row: Record<string, unknown>, logical: string) => getValue(row, headerMap, logical)

  const groupLevels = config.groupLevels || []
  let usedRows = 0

  // No grouping - flat list
  if (groupLevels.length === 0) {
    const list = rows.map((row) => {
      usedRows++
      const obj: Record<string, unknown> = {}
      for (const field of config.leaf.fields) {
        obj[field.to] = get(row, field.from)
      }
      return obj
    })
    return {
      data: list,
      stats: {
        totalRows: rows.length,
        usedRows,
        skippedRows: rows.length - usedRows,
        groupCounts: [],
        leafCount: list.length,
      },
    }
  }

  // With grouping - hierarchical
  const rootMap = new Map<string, Record<string, unknown>>()
  let skippedRows = 0

  for (const row of rows) {
    let currentMap = rootMap
    let node: Record<string, unknown> | null = null
    let valid = true

    for (let i = 0; i < groupLevels.length; i++) {
      const level = groupLevels[i]
      const keyVal = get(row, level.keyField)

      if (!keyVal) {
        valid = false
        break
      }

      let record = currentMap.get(keyVal)
      if (!record) {
        record = {}
        if (level.nameField) record.name = get(row, level.nameField)
        if (level.codeField) record.code = get(row, level.codeField)
        if (i < groupLevels.length - 1) {
          const childKey = level.childrenKey || "children"
          record[childKey] = new Map()
        }
        currentMap.set(keyVal, record)
      }
      node = record
      if (i < groupLevels.length - 1) {
        currentMap = record[level.childrenKey || "children"] as Map<string, Record<string, unknown>>
      }
    }

    if (!valid || !node) {
      skippedRows++
      continue
    }

    usedRows++

    const leafKey = config.leaf.outputKey
    if (!Array.isArray(node[leafKey])) {
      node[leafKey] = []
      if (config.leaf.dedupeBy) {
        node._leafSet = new Set()
      }
    }

    if (config.leaf.dedupeBy && node._leafSet) {
      const k = get(row, config.leaf.dedupeBy)
      if ((node._leafSet as Set<string>).has(k)) {
        continue
      }
      ;(node._leafSet as Set<string>).add(k)
    }

    const leafObj: Record<string, unknown> = {}
    for (const f of config.leaf.fields) {
      leafObj[f.to] = get(row, f.from)
    }
    ;(node[leafKey] as unknown[]).push(leafObj)
  }

  // Map -> Array
  const groupCounts = Array(groupLevels.length).fill(0) as number[]
  let leafCount = 0

  function mapToArray(map: Map<string, Record<string, unknown>>, levelIndex: number): Record<string, unknown>[] {
    const arr: Record<string, unknown>[] = []
    for (const record of map.values()) {
      groupCounts[levelIndex]++
      const lvl = groupLevels[levelIndex]
      if (levelIndex < groupLevels.length - 1) {
        const childKey = lvl.childrenKey || "children"
        if (record[childKey] instanceof Map) {
          record[childKey] = mapToArray(record[childKey] as Map<string, Record<string, unknown>>, levelIndex + 1)
        }
      }
      if (Array.isArray(record[config.leaf.outputKey])) {
        leafCount += (record[config.leaf.outputKey] as unknown[]).length
      }
      delete record._leafSet
      arr.push(record)
    }
    return arr
  }

  const tree = mapToArray(rootMap, 0)

  return {
    data: tree,
    stats: {
      totalRows: rows.length,
      usedRows,
      skippedRows,
      groupCounts,
      leafCount,
    },
  }
}

export function generateConfigCode(config: TransformConfig): string {
  const headerMappingStr = Object.entries(config.headerMapping)
    .map(([key, val]) => `    ${key}: { candidates: ${JSON.stringify(val.candidates)}, required: ${val.required} }`)
    .join(",\n")

  const groupLevelsStr = config.groupLevels
    .map(
      (g) =>
        `    { keyField: "${g.keyField}", ${g.nameField ? `nameField: "${g.nameField}", ` : ""}${g.codeField ? `codeField: "${g.codeField}", ` : ""}childrenKey: "${g.childrenKey}", nodeName: "${g.nodeName}" }`,
    )
    .join(",\n")

  const leafFieldsStr = config.leaf.fields.map((f) => `      { from: "${f.from}", to: "${f.to}" }`).join(",\n")

  return `module.exports = {
  name: "${config.name}",
  tsExportName: "${config.tsExportName}",
  
  headerMapping: {
${headerMappingStr}
  },
  
  groupLevels: [
${groupLevelsStr}
  ],
  
  leaf: {
    outputKey: "${config.leaf.outputKey}",
    ${config.leaf.dedupeBy ? `dedupeBy: "${config.leaf.dedupeBy}",` : ""}
    fields: [
${leafFieldsStr}
    ]
  }
};`
}
