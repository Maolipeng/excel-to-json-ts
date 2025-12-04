#!/usr/bin/env node
/**
 * 通用 Excel/CSV -> 任意结构 CLI（Config 驱动版）
 * 
 * 功能:
 *  - --config 驱动生成结构
 *  - --sheet name/index/all
 *  - --out 输出目录
 *  - --format json|ts|both
 *  - 支持多 sheet 导出
 *  - 支持 CSV/XLSX
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ======================== CLI ARG PARSER ========================

function parseArgs(argv) {
    const args = argv.slice(2);
    const opt = {
        input: null,
        config: null,
        sheet: null,
        outDir: null,
        format: 'both'
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        if (!opt.input && !arg.startsWith('--')) {
            opt.input = arg;
            i++;
        } else if (arg === '--config') {
            opt.config = args[++i];
            i++;
        } else if (arg === '--sheet') {
            opt.sheet = args[++i];
            i++;
        } else if (arg === '--out') {
            opt.outDir = args[++i];
            i++;
        } else if (arg === '--format') {
            opt.format = args[++i];
            i++;
        } else if (arg === '--help') {
            printHelp();
            process.exit(0);
        } else {
            console.warn('⚠️ 未识别参数:', arg);
            i++;
        }
    }

    if (!opt.input || !opt.config) {
        console.error('❌ 缺少必要参数 <input> 或 --config');
        printHelp();
        process.exit(1);
    }

    if (!['json', 'ts', 'both'].includes(opt.format)) {
        console.error('❌ --format 仅支持 json | ts | both');
        process.exit(1);
    }

    return opt;
}

function printHelp() {
    console.log(`
用法:
  node excel-cli.js <input-file> --config <config-file> [options]

参数:
  <input-file>    Excel / CSV 文件
  --config        转换配置文件 (JS/JSON/TS)

选项:
  --sheet         指定 sheet 名 / 序号 / 多个 / all
  --out           输出目录
  --format        json | ts | both
  --help

示例:
  node excel-cli.js dealers.xlsx --config dealer.config.js
  node excel-cli.js dealers.xlsx --config dealer.config.js --sheet 1128
  node excel-cli.js dealers.xlsx --config dealer.config.js --sheet 1,Sheet2
  node excel-cli.js dealers.xlsx --config dealer.config.js --out ./dist --format ts
`);
}

// ======================== CONFIG LOADER ========================

async function loadConfig(configPath) {
    const full = path.resolve(process.cwd(), configPath);
    if (!fs.existsSync(full)) {
        throw new Error(`配置文件不存在: ${full}`);
    }

    const ext = path.extname(full);

    if (ext === '.json') {
        return JSON.parse(fs.readFileSync(full, 'utf-8'));
    }

    if (ext === '.js') {
        return require(full);
    }

    if (ext === '.ts') {
        // 需要 tsx / ts-node
        console.warn('⚠️ 正在加载 TS config，请确保用 tsx / ts-node 运行');
        return (await import(full)).default;
    }

    throw new Error('配置文件仅支持 .json / .js / .ts');
}

// ======================== SHEET RESOLVER ========================

function resolveSheets(workbook, sheetOption) {
    if (!sheetOption || sheetOption === 'all') return workbook.SheetNames;

    const result = new Set();
    const all = workbook.SheetNames;
    const tokens = sheetOption.split(',');

    tokens.forEach(token => {
        token = token.trim();
        if (workbook.Sheets[token]) {
            result.add(token);
        } else if (/^\d+$/.test(token)) {
            const idx = Number(token) - 1;
            if (all[idx]) {
                console.warn(`⚠️ 使用 sheet #${token}: ${all[idx]}`);
                result.add(all[idx]);
            }
        } else {
            console.warn(`⚠️ 未找到 sheet: ${token}`);
        }
    });
    return [...result];
}

// ======================== HEADER DETECTOR ========================

const normalize = (value) => String(value).trim().toLowerCase();
const compact = (value) => normalize(value).replace(/[^a-z0-9]/g, "");

function matchScore(header, candidate) {
    const hNorm = normalize(header);
    const cNorm = normalize(candidate);
    if (!cNorm) return 0;
    if (hNorm === cNorm) return 3;

    const hCompact = compact(header);
    const cCompact = compact(candidate);
    if (hCompact === cCompact) return 2;

    if (hNorm.includes(cNorm) || hCompact.includes(cCompact)) return 1;
    return 0;
}

function detectHeaders(rows, config) {
    const headers = Object.keys(rows[0] || {});
    const map = {};

    for (const [logical, rule] of Object.entries(config.headerMapping)) {
        let bestHeader = null;
        let bestScore = 0;

        for (const header of headers) {
            for (const candidate of rule.candidates) {
                const score = matchScore(header, candidate);
                if (score > bestScore) {
                    bestScore = score;
                    bestHeader = header;
                    if (score === 3) break;
                }
            }
            if (bestScore === 3) break;
        }

        if (!bestHeader && rule.required) {
            console.error('❌ 表头匹配失败:', logical);
            console.error('   候选:', rule.candidates.join(', '));
            console.error('   当前表头:', headers.join(' | '));
            throw new Error(`无法在表头中匹配字段: ${logical}`);
        }

        if (bestHeader) map[logical] = bestHeader;
    }
    return map;
}


function getValue(row, headerMap, logicalField) {
    return String(row[headerMap[logicalField]] ?? '').trim();
}

// ======================== CORE BUILDER ========================

function buildFromConfig(rows, config) {
    if (!rows.length) {
        throw new Error('空表');
    }

    const headerMap = detectHeaders(rows, config);

    console.log('🧭 表头映射:');
    for (const [k, v] of Object.entries(headerMap)) {
        console.log(`  ${k} -> ${v}`);
    }

    const get = (row, logical) => getValue(row, headerMap, logical);
    const groupLevels = config.groupLevels || [];

    let usedRows = 0;
    let skippedRows = 0;

    // ========== 无分组 ==========
    if (groupLevels.length === 0) {
        const list = rows.map(row => {
            usedRows++;
            const obj = {};
            for (const field of config.leaf.fields) {
                const raw = get(row, field.from);
                obj[field.to] = field.transform ? field.transform(raw, row) : raw;
            }
            return obj;
        });

        return {
            data: list,
            stats: {
                totalRows: rows.length,
                usedRows,
                skippedRows: rows.length - usedRows,
                groupCounts: [],
                leafCount: list.length,
            }
        };
    }

    // ========== 有分组 ==========
    const rootMap = new Map();

    for (const row of rows) {
        let currentMap = rootMap;
        let node = null;
        let valid = true;

        for (let i = 0; i < groupLevels.length; i++) {
            const level = groupLevels[i];
            const keyVal = get(row, level.keyField);
            const nameKey = level.nameKey || 'name';
            const codeKey = level.codeKey || 'code';

            if (!keyVal) {
                valid = false;
                break;
            }

            let record = currentMap.get(keyVal);

            if (!record) {
                record = {};
                if (level.nameField) record[nameKey] = get(row, level.nameField);
                if (level.codeField) record[codeKey] = get(row, level.codeField);
                if (level.extraFields?.length) {
                    level.extraFields.forEach(f => {
                        record[f.to] = get(row, f.from);
                    });
                }
                if (i < groupLevels.length - 1) {
                    const childKey = level.childrenKey || 'children';
                    record[childKey] = new Map();
                }
                currentMap.set(keyVal, record);
            }

            if (level.extraFields?.length) {
                level.extraFields.forEach(f => {
                    if (record[f.to] === undefined || record[f.to] === "") {
                        record[f.to] = get(row, f.from);
                    }
                });
            }

            if (level.nameField && (record[nameKey] === undefined || record[nameKey] === "")) {
                record[nameKey] = get(row, level.nameField);
            }
            if (level.codeField && (record[codeKey] === undefined || record[codeKey] === "")) {
                record[codeKey] = get(row, level.codeField);
            }

            node = record;

            if (i < groupLevels.length - 1) {
                currentMap = record[level.childrenKey || 'children'];
            }
        }

        if (!valid || !node) {
            skippedRows++;
            continue;
        }

        usedRows++;

        // ====== Leaf ======
        const leafKey = config.leaf.outputKey;
        if (!Array.isArray(node[leafKey])) {
            node[leafKey] = [];
            if (config.leaf.dedupeBy) {
                node._leafSet = new Set();
            }
        }

        if (config.leaf.dedupeBy && node._leafSet) {
            const k = get(row, config.leaf.dedupeBy);
            if (node._leafSet.has(k)) {
                continue;
            }
            node._leafSet.add(k);
        }

        const leafObj = {};
        for (const f of config.leaf.fields) {
            const raw = get(row, f.from);
            leafObj[f.to] = f.transform ? f.transform(raw, row) : raw;
        }
        node[leafKey].push(leafObj);
    }

    // ========== Map -> Array ==========
    const groupCounts = Array(groupLevels.length).fill(0);
    let leafCount = 0;

    function mapToArray(map, levelIndex) {
        const arr = [];
        for (const record of map.values()) {
            groupCounts[levelIndex]++;

            const lvl = groupLevels[levelIndex];
            if (levelIndex < groupLevels.length - 1) {
                const childKey = lvl.childrenKey || 'children';
                if (record[childKey] instanceof Map) {
                    record[childKey] = mapToArray(record[childKey], levelIndex + 1);
                }
            }

            if (Array.isArray(record[config.leaf.outputKey])) {
                leafCount += record[config.leaf.outputKey].length;
            }

            delete record._leafSet;
            arr.push(record);
        }
        return arr;
    }

    const tree = mapToArray(rootMap, 0);

    return {
        data: tree,
        stats: {
            totalRows: rows.length,
            usedRows,
            skippedRows,
            groupCounts,
            leafCount,
        }
    };
}


// ======================== MAIN ========================

(async function main() {
    const opt = parseArgs(process.argv);

    const input = path.resolve(process.cwd(), opt.input);
    const outDir = opt.outDir
        ? path.resolve(process.cwd(), opt.outDir)
        : path.dirname(input);

    const config = await loadConfig(opt.config);

    fs.mkdirSync(outDir, { recursive: true });

    const workbook = XLSX.readFile(input);
    const sheets = resolveSheets(workbook, opt.sheet);

    console.log('📘 文件:', input);
    console.log('📑 Sheets:', sheets.join(', '));
    console.log('🧩 Config:', opt.config);
    console.log('📁 输出目录:', outDir);
    console.log('🎯 格式:', opt.format);

    for (const sheetName of sheets) {
        console.log('\n▶ 处理 sheet:', sheetName);

        const rows = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheetName],
            { defval: '' }
        );

        if (!rows.length) {
            console.warn('⚠️ 空 sheet，跳过');
            continue;
        }

        let data;
        let stats;
        try {
            const result = buildFromConfig(rows, config);
            data = result.data;
            stats = result.stats;
            console.log('📊 统计信息:');
            console.log('  表总行数      :', stats.totalRows);
            console.log('  有效处理行数  :', stats.usedRows);
            console.log('  跳过行数      :', stats.skippedRows);

            if (stats.groupCounts?.length) {
                stats.groupCounts.forEach((cnt, i) => {
                    const name = config.groupLevels?.[i]?.nodeName || `第${i + 1}级分组`;
                    console.log(`  ${name}数量    :`, cnt);
                });
            }

            console.log('  叶子节点数量  :', stats.leafCount);


        } catch (e) {
            console.error(`❌ 处理 sheet ${sheetName} 失败:`, e.message);
            continue;
        }

        const base = `${config.name || 'output'}_${sheetName}`;

        if (opt.format === 'json' || opt.format === 'both') {
            const jsonPath = path.join(outDir, `${base}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
            console.log('✅ JSON:', jsonPath);
        }

        if (opt.format === 'ts' || opt.format === 'both') {
            const tsName = config.tsExportName || 'data';
            const tsPath = path.join(outDir, `${base}.ts`);
            fs.writeFileSync(
                tsPath,
                `export const ${tsName} = ${JSON.stringify(data, null, 2)} as const;\n`,
                'utf-8'
            );
            console.log('✅ TS:', tsPath);
        }
    }

})();
