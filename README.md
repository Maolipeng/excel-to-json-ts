# Excel 数据配置与导出工具

基于 Next.js + React + SheetJS 的前端小工具，给非开发同事用来把 Excel/CSV 一键转成 JSON/TS 数据或 `dealer.config.js` 配置。上传后在浏览器本地解析，无需服务端。

## 功能亮点
- Excel/CSV 本地解析：仅读取前 50 行做预览，大文件懒加载全量数据，避免页面卡死。
- 模式选择：平铺列表、2–3 级树形（省/市/门店）、专业模式（更多层级）。
- 纯 UI 配置：选列 → 选分组层级（主键/名称/code/子节点字段名） → 选叶子字段/输出名/去重字段。
- 实时预览与统计：右侧展示前几条 JSON、分组数量、跳过行数等。
- 一键导出：JSON、TypeScript 数据，或生成 `dealer.config.js`（供 CLI/CI 使用）。

## 快速开始
```bash
# 安装依赖（推荐 pnpm）
pnpm install

# 开发
pnpm dev    # http://localhost:3000

# 构建 / 启动
pnpm build
pnpm start

# 代码检查
pnpm lint
```

## 使用步骤（非开发视角）
1. **上传文件**：拖拽或选择 Excel/CSV，自动读取前 50 行预览。
2. **选择 Sheet**：查看每个 Sheet 的表头、预览行，点击进入配置。
3. **选择模式/分组**：平铺或树形；树形模式下为每级选择主键/名称/code列，并输入子节点数组字段名（如 citys/dealers）。
4. **配置叶子字段**：勾选需要的列，填写输出字段名；可设置去重字段、叶子数组字段名。
5. **预览 & 导出**：右侧查看 JSON 预览与统计，导出 JSON / TS / `dealer.config.js`。

## 技术栈
- Next.js 16（App Router）、React 19
- SheetJS (`xlsx`) 浏览器解析
- Tailwind CSS + shadcn 风格组件

## 目录结构
- `app/page.tsx`：流程向导与状态管理（模式/分组/叶子/预览/导出）。
- `components/`：上传、Sheet 选择、模式选择、分组/叶子配置、预览、导出等 UI 组件。
- `lib/ui-config.ts`：UI 配置 (`UiConfig`) 自动转换为内部 `TransformConfig`，自动生成 headerMapping。
- `lib/transformer.ts`：基于 `TransformConfig` 的数据构建与统计。
- `excel-cli.js`（可选）：Node 端 CLI，读取 Excel/CSV + `dealer.config.js` 批量导出 JSON/TS。

## 工作原理
- 上传时只读取少量行做预览，保存文件 buffer；进入导出前再按需全量解析。
- UI 仅暴露 `UiConfig`（模式/分组/叶子），内部通过 `uiConfigToTransformConfig` 自动生成 `headerMapping` / `groupLevels` / `leaf`，隐藏复杂度。
- `buildFromConfig` 使用 `headerMapping` 匹配表头，按分组层级和叶子映射生成树或扁平数据，并统计行数/分组/叶子数量。

## Docker 部署
已提供 `Dockerfile`，基于 Node 20 + pnpm，多阶段构建 + Next `standalone` 输出。

```bash
# 构建镜像
docker build -t excel-to-json .

# 启动容器
docker run -p 3000:3000 excel-to-json

# 或指定环境变量
docker run -e PORT=4000 -p 4000:4000 excel-to-json
```

### 一键脚本
使用 `scripts/docker-up.sh` 一键构建/更新镜像并重启容器（默认端口 3000，可通过环境变量覆盖）：

```bash
chmod +x scripts/docker-up.sh
PORT=4000 IMAGE_NAME=excel-to-json CONTAINER_NAME=excel-to-json ./scripts/docker-up.sh
```

## 开发者备注
- Node 版本：建议 ≥18。
- 样式：Tailwind 4；组件在 `components/` 下，保持无状态 + 外部数据传入。
- 若需要 CLI：`node excel-cli.js <input> --config dealer.config.js --sheet 1128 --format both --out dist`。

## 常见问题
- **大文件卡顿**：已启用懒加载与加载态；导出前会全量解析，需等待片刻。
- **表头匹配失败**：确保选择的列存在；自动候选包含原列名及大小写变体，可在 UI 中重新选择列。
- **导出为空**：检查叶子字段是否勾选、分组主键是否为空、是否选择了正确的 Sheet。 
