# 🧩 模块清单与进度

## 模块概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         xiaoxi-dreams 模块矩阵                              │
└─────────────────────────────────────────────────────────────────────────────┘

  模块大类              子模块              状态          优先级
  ─────────────────────────────────────────────────────────────────────
  📦 核心功能
  ├─ Dream SKILL        ✅ 已完成         P0
  ├─ Cron 调度          ✅ 已完成         P0
  ├─ 健康度评分         ✅ 已完成         P1
  └─ 重要性评分         ✅ 已完成         P1

  💾 数据层
  ├─ memory/ 文件系统   ✅ 已完成         P0
  ├─ Dolt 数据库        ✅ 已完成         P1
  ├─ Beads 集成         ✅ 已完成         P1
  └─ Git 版本控制       ✅ 已完成         P1

  🔧 工具
  ├─ xd.ps1 CLI         ✅ 已完成         P1
  ├─ dolt-helpers.sql   ✅ 已完成         P1
  └─ backup 脚本        ⏳ 待增强        P2

  📚 文档
  ├─ README            ✅ 已完成         P0
  ├─ ARCHITECTURE.md   ✅ 已完成         P1
  ├─ INSTALL.md        ✅ 已完成         P1
  ├─ WORKFLOW.md       ✅ 已完成         P1
  ├─ scoring.md        ✅ 已完成         P1
  ├─ BEADS_INTEGRATION.md ✅ 已完成       P2
  ├─ DOLT_INTEGRATION.md ✅ 已完成       P2
  └─ ARCHITECTURE-*.md ⭐ 进行中        P2

  🚀 高级功能
  ├─ Web UI            ❌ 未做          P3
  ├─ API Server        ❌ 未做          P3
  ├─ 多 Agent 协作     ❌ 未做          P3
  └─ 记忆可视化         ❌ 未做          P3
```

## 详细模块清单

### 1. 核心功能模块

| 功能 | 文件 | 状态 | 说明 | 待办 |
|------|------|------|------|------|
| Dream SKILL | SKILLS/dream.md | ✅ | 核心做梦逻辑 | 完善报告模板 |
| Cron 调度 | Gateway cron | ✅ | 每天 04:00 | 无 |
| 健康度评分 | scoring.md | ✅ | 5 维指标 | 无 |
| 重要性评分 | scoring.md | ✅ | 3 因子模型 | 无 |
| 智能跳过 | dream.md | ✅ | 7天/健康度/6小时 | 无 |
| 报告生成 | dream.md | ✅ | Markdown 格式 | 添加更多洞察类型 |

### 2. 数据层模块

| 功能 | 文件 | 状态 | 说明 | 待办 |
|------|------|------|------|------|
| 日志存储 | memory/YYYY-MM-DD.md | ✅ | 原始日志 | 无 |
| 整合标记 | dream.md | ✅ | consolidated 标记 | 无 |
| Dolt 表结构 | scripts/dolt-helpers.sql | ✅ | 5 张表 | 无 |
| Dolt 提交 | xd.ps1 | ✅ | auto-commit | 无 |
| Beads 集成 | SKILLS/bd.md | ✅ | 任务追踪 | 无 |

### 3. 工具模块

| 功能 | 文件 | 状态 | 说明 | 待办 |
|------|------|------|------|------|
| CLI 主命令 | scripts/xd.ps1 | ✅ | 10 个子命令 | 无 |
| SQL 脚本 | scripts/dolt-helpers.sql | ✅ | 表创建 | 无 |
| 安装脚本 | scripts/setup.ps1 | ✅ | Windows | 无 |
| 安装脚本 | scripts/setup.sh | ✅ | Linux/macOS | 无 |
| 版本递增 | scripts/bump-version.sh | ✅ | 自动化 | 无 |
| 备份 | xd.ps1 backup | ⏳ | 基础备份 | 增量备份、云备份 |

### 4. 文档模块

| 文档 | 文件 | 状态 | 说明 | 待办 |
|------|------|------|------|------|
| 主 README | README.md | ✅ | 项目介绍 | 无 |
| 安装指南 | docs/INSTALL.md | ✅ | 详细步骤 | 无 |
| 工作流 | docs/WORKFLOW.md | ✅ | Dream 流程 | 无 |
| 架构设计 | docs/ARCHITECTURE.md | ✅ | 7层+5层 | ⭐ 细化中 |
| 评分算法 | docs/scoring.md | ✅ | 数学公式 | 无 |
| Beads 集成 | docs/BEADS_INTEGRATION.md | ✅ | 完整指南 | 无 |
| Dolt 集成 | docs/DOLT_INTEGRATION.md | ✅ | 架构设计 | 无 |
| 记忆模板 | docs/memory-TEMPLATE.md | ✅ | 条目模板 | 无 |
| Agent 指南 | CLAUDE.md | ✅ | AI 使用 | 无 |

### 5. CI/CD 模块

| 功能 | 文件 | 状态 | 说明 | 待办 |
|------|------|------|------|------|
| GitHub Release | .github/workflows/release.yml | ✅ | 自动发布 | 无 |
| PR 模板 | PULL_REQUEST_TEMPLATE.md | ✅ | 标准化 | 无 |
| Issue 模板 | ISSUE_TEMPLATE/ | ✅ | Bug/Feature | 无 |

### 6. 高级功能 (未做)

| 功能 | 状态 | 优先级 | 说明 | 估计工作量 |
|------|------|--------|------|-----------|
| Web UI | ❌ | P3 | 可视化面板 | 8h+ |
| REST API | ❌ | P3 | 外部接口 | 6h+ |
| 多 Agent 协作 | ❌ | P3 | 分布式 Dream | 12h+ |
| 记忆可视化 | ❌ | P3 | 知识图谱 | 10h+ |
| 增量备份 | ❌ | P2 | diff 备份 | 2h |
| 云备份 (S3) | ❌ | P3 | 远程容灾 | 4h |
| 健康度告警 | ❌ | P2 | 阈值通知 | 1h |

## 优化清单

### 已完成优化 ✅

1. **分层记忆架构** - 5 层设计，职责分离
2. **Dolt 版本控制** - 可回滚、可审计
3. **智能跳过** - 节省 token
4. **Beads 集成** - 任务追踪
5. **CLI 工具** - 便捷操作

### 可优化项 🔧

| 优化项 | 当前 | 目标 | 优先级 |
|--------|------|------|--------|
| 报告模板 | 基础 | 更丰富洞察 | P1 |
| 备份策略 | 全量 | 增量 + 定时 | P2 |
| 监控告警 | 无 | 健康度阈值 | P2 |
| 性能 | 全量扫描 | 增量检查 | P2 |
| 文档完整性 | 90% | 100% | P1 |

## 架构图清单

| 图名 | 文件 | 状态 |
|------|------|------|
| 架构总览 | ARCHITECTURE-01-OVERVIEW.md | ✅ |
| Dream 流程 | ARCHITECTURE-02-DREAM-FLOW.md | ✅ |
| 数据流图 | ARCHITECTURE-03-DATA-FLOW.md | ✅ |
| 记忆层级 | ARCHITECTURE-04-MEMORY-HIERARCHY.md | ✅ |
| 模块清单 | ARCHITECTURE-05-MODULES.md | ⭐ 本文件 |
| Dolt ER 图 | ARCHITECTURE-06-DOLT-ER.md | ❌ 待做 |
| Beads 集成图 | ARCHITECTURE-07-BEADS-INTEGRATION.md | ❌ 待做 |
| 部署架构 | ARCHITECTURE-08-DEPLOYMENT.md | ❌ 待做 |
