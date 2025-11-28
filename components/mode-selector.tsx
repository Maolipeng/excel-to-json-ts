"use client"

import { CheckCircle2, ListTree, Settings2, Rows3 } from "lucide-react"
import type { UiMode } from "@/lib/types"

interface ModeSelectorProps {
  mode: UiMode
  onChange: (mode: UiMode) => void
}

const modes: { id: UiMode; title: string; desc: string; icon: typeof Rows3 }[] = [
  { id: "flat", title: "平铺列表", desc: "生成一维数组，适合员工表、列表数据", icon: Rows3 },
  { id: "tree", title: "多级树", desc: "最多 2-3 级的省/市/门店结构", icon: ListTree },
  { id: "pro", title: "专业模式", desc: "自定义更多层级和高级设置", icon: Settings2 },
]

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">选择模式</h3>
        <p className="text-xs text-muted-foreground">非开发可选平铺或多级树，专业模式开放全部配置</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {modes.map((item) => {
          const Icon = item.icon
          const active = mode === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`relative rounded-lg border p-4 text-left transition-all ${
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/40"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-md p-2 ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
