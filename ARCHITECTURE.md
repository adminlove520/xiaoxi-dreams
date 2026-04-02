# xiaoxi-dreams 完整架构设计

> 日期：2026-04-02
> 版本：v3.0.0

---

## 一、项目愿景

**目标**：为 AI Agent 小溪打造的认知记忆系统

**核心价值**：
- 记忆持久化：不再每次从零开始
- 知识结构化：日志 → 记忆 → 知识
- 成长可视化：Web Dashboard 展示健康度和成长轨迹
- 主动学习：定期"Dream"整合记忆

---

## 二、技术架构

### 2.1 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **前端** | Next.js 14 + React 18 + TypeScript | Latest |
| **样式** | Tailwind CSS + CSS Variables | 3.4+ |
| **动画** | Framer Motion | 11+ |
| **后端** | Express.js + TypeScript | 4+ |
| **数据库** | SQLite + better-sqlite3 | Latest |
| **API** | REST API | v1 |
| **部署** | Vercel (前端) + Railway (后端) | - |

### 2.2 目录结构

```
xiaoxi-dreams/
├── web/                      # Next.js Web UI
│   ├── app/                  # App Router
│   │   ├── page.tsx         # 首页 Dashboard
│   │   ├── memories/        # 记忆列表/详情
│   │   ├── dreams/          # Dream 历史
│   │   └── api/             # API Routes (可选)
│   ├── components/          # React 组件
│   │   ├── ui/             # 基础组件
│   │   ├── dashboard/       # Dashboard 组件
│   │   └── memories/        # 记忆组件
│   └── lib/                 # 工具函数
│       └── api.ts           # API 客户端
│
├── api/                      # Express API Server
│   ├── routes/              # 路由
│   │   ├── health.ts       # 健康度 API
│   │   ├── memories.ts      # 记忆 API
│   │   ├── dreams.ts       # Dream API
│   │   └── stats.ts         # 统计 API
│   ├── db/                  # 数据库
│   │   └── index.ts        # SQLite 连接
│   └── index.ts             # Express 入口
│
├── scripts/                  # 工具脚本
│   ├── dream.ts             # Dream 执行脚本
│   └── backup.ts            # 备份脚本
│
└── package.json             # 根目录 scripts
```

### 2.3 数据模型

```sql
-- 健康度记录
CREATE TABLE health_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL,
  freshness REAL,
  coverage REAL,
  coherence REAL,
  efficiency REAL,
  accessibility REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 记忆表
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- lesson, decision, fact, procedure, person, project
  name TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  importance INTEGER DEFAULT 5,
  tags TEXT, -- JSON array
  source_file TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Dream 历史
CREATE TABLE dreams (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  status TEXT NOT NULL, -- running, completed, failed
  health_score INTEGER,
  scanned_files INTEGER,
  new_entries INTEGER,
  updated_entries INTEGER,
  report TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_memories_type ON memories(type);
CREATE INDEX idx_memories_created ON memories(created_at);
CREATE INDEX idx_dreams_date ON dreams(date);
```

---

## 三、API 设计

### 3.1 健康度 API

```
GET  /api/health              → 当前健康度
GET  /api/health/history      → 历史记录
GET  /api/health/trend       → 趋势分析
```

**响应示例**：
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

### 3.2 记忆 API

```
GET    /api/memories          → 列表 (支持分页、筛选)
GET    /api/memories/:id      → 详情
POST   /api/memories          → 创建
PATCH  /api/memories/:id      → 更新
DELETE /api/memories/:id       → 删除
GET    /api/memories/search   → 搜索
```

**响应示例**：
```json
{
  "memories": [
    {
      "id": "mem_001",
      "type": "lesson",
      "name": "openclaw config set 更安全",
      "summary": "使用 config set 比手动编辑更安全...",
      "importance": 8,
      "tags": ["openclaw", "安全"],
      "createdAt": "2026-04-02T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

### 3.3 Dream API

```
GET  /api/dreams              → Dream 历史
GET  /api/dreams/:id          → Dream 详情
POST /api/dreams/trigger      → 触发 Dream
```

### 3.4 统计 API

```
GET /api/stats                → 全局统计
```

---

## 四、Web UI 设计

### 4.1 页面结构

```
/                       → Dashboard 首页
├── Hero: 健康度环形图
├── Stats: 4 个统计卡片
├── Recent Dreams: 最近 5 条
└── Recent Memories: 最近 5 条

/memories               → 记忆列表
├── 筛选器 (类型、标签)
├── 搜索框
└── 记忆卡片列表

/memories/:id           → 记忆详情
├── 记忆内容
├── 相关记忆
└── 元信息

/dreams                → Dream 历史
├── 时间线
└── 统计图表
```

### 4.2 组件设计

| 组件 | 说明 |
|------|------|
| `HealthRing` | 健康度环形图，动画效果 |
| `StatsGrid` | 4 格统计卡片 |
| `MemoryCard` | 记忆卡片，支持类型图标 |
| `DreamTimeline` | Dream 时间线 |
| `DimensionChart` | 维度分析图表 |

### 4.3 设计系统

**色彩**：
- Primary: `#22c55e` (小溪绿)
- Secondary: `#3b82f6` (蓝色)
- Accent: `#f97316` (橙色)
- Background: `#09090b` (深色)
- Card: `#18181b` / `#27272a`

**字体**：
- Inter (UI)
- JetBrains Mono (数据)

---

## 五、部署方案

### 5.1 前端部署 (Vercel)

```
✅ 自动 HTTPS
✅ CDN 加速
✅ 自动构建
✅ 预览部署
```

### 5.2 后端部署 (Railway)

```
✅ 单命令部署
✅ 自动 HTTPS
✅ SQLite 支持
✅ 免费额度
```

**Railway 特点**：
- 支持 SQLite 数据库文件
- 内网 IP 自动分配
- 自定义域名
- GitHub 集成

### 5.3 替代方案

| 平台 | 前端 | 后端 | 数据库 |
|------|------|------|--------|
| **Vercel** | ✅ | ❌ | ❌ |
| **Railway** | ❌ | ✅ | ✅ SQLite |
| **Render** | ❌ | ✅ | ✅ PostgreSQL |
| **Fly.io** | ❌ | ✅ | ✅ SQLite |
| **本地** | ✅ dev | ✅ | ✅ |

---

## 六、Dream 系统

### 6.1 执行流程

```
1. 触发 (手动/定时)
   ↓
2. 扫描日志文件
   ↓
3. 提取记忆片段 (GPT/Claude)
   ↓
4. 存入数据库
   ↓
5. 计算健康度
   ↓
6. 生成报告
   ↓
7. 推送通知
```

### 6.2 健康度计算

```
Score = (新鲜度×0.25 + 连贯性×0.25 + 覆盖度×0.20 + 效率×0.15 + 可达性×0.15) × 100
```

---

## 七、实现计划

### Phase 1: 基础架构 (1天)
- [ ] SQLite 数据库初始化
- [ ] Express API Server
- [ ] 基础 CRUD API

### Phase 2: Web UI (1天)
- [ ] Next.js 项目初始化
- [ ] Dashboard 页面
- [ ] 组件开发

### Phase 3: 完整功能 (1天)
- [ ] 健康度 API + UI
- [ ] 记忆管理
- [ ] Dream 历史

### Phase 4: 部署 (1天)
- [ ] Vercel 前端部署
- [ ] Railway 后端部署
- [ ] 域名配置

---

## 八、里程碑

| 版本 | 内容 | 日期 |
|------|------|------|
| v2.0 | 现有架构 (Dolt + 原生 HTML) | 2026-04-02 |
| v3.0 | 新架构 (SQLite + Next.js + Express) | 2026-04-02 |
