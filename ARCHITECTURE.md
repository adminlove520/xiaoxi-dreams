# xiaoxi-dreams v3.0 完整架构

> 重写日期：2026-04-02

---

## 一、核心问题

### 1.1 xiaoxi-dreams 是什么？

**定义**：AI Agent 小溪的认知记忆系统

**核心价值**：
- 让 AI 真正记住经验（不是每次从零开始）
- 周期性"做梦"整合日志 → 提取知识 → 更新记忆
- 可视化展示成长轨迹

### 1.2 为什么需要 Web UI？

**用户视角**：让哥哥看到小溪的"内心世界"
- 信任感：看到 AI 在"成长"
- 可观测性：理解 AI 的决策过程
- 参与感：看到记忆网络

**不是**：普通的数据管理工具

### 1.3 为什么要做 API？

**连接层**：Web UI ↔ 数据存储
- 提供结构化数据访问
- 解耦前端和存储
- 支持未来多端扩展

### 1.4 做梦的目的是什么？

**核心流程**：
```
日志输入 → 扫描 → 提取 → 整合 → 存储 → 健康度 → 报告
```

**价值**：
- 信息压缩：从大量日志提取精华
- 知识结构化：分类、关联、更新健康度
- 主动学习：发现模式、总结经验

---

## 二、架构设计

### 2.1 为什么这样设计？

| 选择 | 原因 |
|------|------|
| **JSON 文件存储** | Vercel Serverless 无法持久化，JSON 简单可靠 |
| **Next.js API Routes** | Vercel 原生支持，无需独立后端服务 |
| **Next.js App Router** | 现代 React 框架，SEO友好 |
| **Tailwind CSS** | 快速开发，一致设计 |

### 2.2 目录结构

```
xiaoxi-dreams/
├── web/                      # Next.js 全栈应用
│   ├── app/
│   │   ├── page.tsx         # Dashboard 首页
│   │   ├── memories/         # 记忆管理
│   │   ├── dreams/          # Dream 历史
│   │   └── api/             # API Routes
│   │       ├── health/
│   │       ├── memories/
│   │       ├── dreams/
│   │       └── stats/
│   ├── components/          # React 组件
│   │   ├── dashboard/
│   │   └── ui/
│   └── lib/
│       └── db.ts            # JSON 文件存储
│
├── data/                     # 数据目录 (Git 版本控制)
│   ├── health.json
│   ├── memories.json
│   └── dreams.json
│
├── scripts/                  # 工具脚本
│   └── dream.ts             # Dream 执行脚本
│
└── docs/                    # 文档
```

---

## 三、数据模型

### 3.1 健康度 (health.json)

```json
{
  "score": 82,
  "status": "healthy",
  "dimensions": {
    "freshness": 0.75,
    "coverage": 0.80,
    "coherence": 0.72,
    "efficiency": 0.85,
    "accessibility": 0.78
  },
  "trend": "up",
  "date": "2026-04-02"
}
```

### 3.2 记忆 (memories.json)

```json
[
  {
    "id": "mem_001",
    "type": "lesson",
    "name": "openclaw config set 更安全",
    "summary": "使用 config set 比手动编辑更安全...",
    "importance": 8,
    "tags": ["openclaw", "安全"],
    "createdAt": "2026-04-02T10:00:00Z",
    "updatedAt": "2026-04-02T10:00:00Z"
  }
]
```

### 3.3 Dream 历史 (dreams.json)

```json
[
  {
    "id": "dream_001",
    "date": "2026-04-02",
    "status": "completed",
    "healthScore": 82,
    "scannedFiles": 15,
    "newEntries": 3,
    "updatedEntries": 5,
    "report": "## 梦境报告..."
  }
]
```

---

## 四、API 设计

### 4.1 健康度 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 当前健康度 |
| `/api/health/history` | GET | 历史记录 |

### 4.2 记忆 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/memories` | GET | 记忆列表 |
| `/api/memories/:id` | GET | 记忆详情 |
| `/api/memories` | POST | 创建记忆 |
| `/api/memories/:id` | DELETE | 删除记忆 |

### 4.3 Dream API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/dreams` | GET | Dream 历史 |
| `/api/dreams/trigger` | POST | 触发 Dream |

### 4.4 统计 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/stats` | GET | 全局统计 |

---

## 五、Web UI 设计

### 5.1 页面结构

```
/                   → Dashboard 首页
├── Hero           → 健康度环形图
├── Stats          → 统计卡片
├── Recent Dreams  → 最近 5 条 Dream
└── Recent Memories → 最近 5 条记忆

/memories          → 记忆列表
/memories/:id     → 记忆详情
/dreams           → Dream 历史
```

### 5.2 组件设计

| 组件 | 说明 |
|------|------|
| `HealthRing` | 健康度环形图，带动画 |
| `StatsGrid` | 4 格统计卡片 |
| `MemoryCard` | 记忆卡片，类型图标 |
| `DreamTimeline` | Dream 时间线 |
| `DreamReport` | Dream 报告详情 |

### 5.3 设计系统

**色彩**：
- Primary: `#22c55e` (小溪绿)
- Accent: `#f97316` (橙色)
- Background: `#09090b`
- Card: `#18181b`

**字体**：
- UI: Inter
- 数据: JetBrains Mono

---

## 六、Dream 系统

### 6.1 执行流程

```
1. 触发 (手动/定时)
   ↓
2. 读取日志文件
   ↓
3. 提取记忆片段 (LLM)
   ↓
4. 更新 memories.json
   ↓
5. 计算健康度
   ↓
6. 更新 health.json
   ↓
7. 记录 Dream
   ↓
8. 生成报告
   ↓
9. 推送通知 (Telegram)
```

### 6.2 健康度计算

```
Score = (新鲜度×0.25 + 连贯性×0.25 + 覆盖度×0.20 + 效率×0.15 + 可达性×0.15) × 100
```

---

## 七、部署方案

### 7.1 Vercel 部署

```bash
cd web
vercel --prod
```

**优势**：
- 前端 + API 一起部署
- 自动 HTTPS
- 全球 CDN
- 免费额度充足

### 7.2 数据存储

**JSON 文件在 Git 版本控制**：
- `data/health.json`
- `data/memories.json`
- `data/dreams.json`

**优点**：
- 简单可靠
- 可追溯历史
- 易于备份

---

## 八、里程碑

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 项目重构，JSON 存储 | ⏳ 进行中 |
| Phase 2 | API Routes 实现 | ⏳ 进行中 |
| Phase 3 | Web UI 实现 | ⏳ 进行中 |
| Phase 4 | Dream 脚本 | ⏳ 进行中 |
| Phase 5 | Vercel 部署 | ⏳ 进行中 |

---

## 九、验收标准

```
✅ JSON 文件存储正常读写
✅ API Routes 返回正确数据
✅ Web UI 显示健康度、记忆、Dream
✅ 触发 Dream 后数据更新
✅ 部署到 Vercel 成功
```
