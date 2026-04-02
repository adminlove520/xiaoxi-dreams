# Dolt 数据库集成设计

> 参考 [Beads 架构](https://github.com/steveyegge/beads) 设计

## 为什么用 Dolt

- **版本控制的 SQL**：像 Git 一样管理数据历史
- **Branch/Merge**：多人协作不冲突
- **时间旅行**：回滚到任意版本
- **审计追踪**：完整的变更历史

## xiaoxi-dreams 数据模型

### Dream Session（做梦会话）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(20) | 主键，格式 `dream-xxxxxxxx`（8位hash） |
| `date` | DATE | 做梦日期 |
| `status` | ENUM | `running`, `completed`, `failed` |
| `health_score` | INT | 健康度评分 0-100 |
| `scanned_files` | INT | 扫描的文件数 |
| `new_entries` | INT | 新增条目数 |
| `updated_entries` | INT | 更新条目数 |
| `started_at` | DATETIME | 开始时间 |
| `completed_at` | DATETIME | 结束时间 |
| `error_message` | TEXT | 错误信息（如有） |
| `content_hash` | VARCHAR(64) | 内容哈希（去重用） |

### Memory Entry（记忆条目）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(20) | 主键，格式 `mem-xxxxxxxx` |
| `type` | ENUM | `fact`, `decision`, `lesson`, `procedure`, `person`, `project` |
| `name` | VARCHAR(100) | 记忆名称（slug） |
| `summary` | TEXT | 一句话摘要 |
| `content` | LONGTEXT | 详细内容 |
| `source_file` | VARCHAR(255) | 来源文件 |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |
| `last_accessed` | DATETIME | 最后访问时间 |
| `access_count` | INT | 访问次数 |
| `importance` | INT | 重要性 1-10 |
| `tags` | JSON | 标签数组 |
| `is_permanent` | BOOLEAN | 是否永久保留 |
| `is_consolidated` | BOOLEAN | 是否已整合 |
| `content_hash` | VARCHAR(64) | 内容哈希 |

### Health Metrics（健康指标）

| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | DATE | 日期 |
| `freshness` | FLOAT | 新鲜度 0-1 |
| `coverage` | FLOAT | 覆盖度 0-1 |
| `coherence` | FLOAT | 连贯度 0-1 |
| `efficiency` | FLOAT | 效率 0-1 |
| `accessibility` | FLOAT | 可达性 0-1 |
| `overall_score` | INT | 综合评分 0-100 |

### Dream Change（变更记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(20) | 主键 |
| `dream_id` | VARCHAR(20) | 关联的 Dream Session |
| `memory_id` | VARCHAR(20) | 关联的 Memory Entry |
| `action` | ENUM | `created`, `updated`, `archived`, `deleted` |
| `change_summary` | TEXT | 变更摘要 |
| `changed_at` | DATETIME | 变更时间 |

## 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                     xiaoxi-dreams Layer                          │
│                                                                  │
│  Dream SKILL                                                     │
│  ├── Collect: 扫描 memory/ 日志                                  │
│  ├── Consolidate: 写入/更新记忆条目                              │
│  ├── Evaluate: 计算健康度                                         │
│  └── Report: 生成报告推送                                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────────┐
│                      Dolt Database                               │
│                      (.xiaoxi-dreams/dolt/)                      │
│                                                                  │
│  Tables:                                                         │
│  ├── dream_sessions    — 做梦会话记录                            │
│  ├── memory_entries    — 记忆条目                                │
│  ├── health_metrics    — 健康指标历史                            │
│  └── dream_changes     — 变更记录                                │
│                                                                  │
│  Features:                                                       │
│  ├── 自动 commit（每次写入）                                     │
│  ├── Branch/merge 支持                                            │
│  └── 时间旅行查询                                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                        Dolt push/pull
                               │
                               v
┌─────────────────────────────────────────────────────────────────┐
│                     Git Remote                                   │
│                     (与代码仓库同步)                             │
└─────────────────────────────────────────────────────────────────┘
```

## 与 Beads 的集成点

Beads 已经初始化了 `xiaoxi-dreams` 数据库，我们可以：

1. **共享 Dolt 数据库**：xiaoxi-dreams 和 Beads 共用同一个 Dolt 实例
2. **独立表空间**：xiaoxi-dreams 用 `xd_` 前缀的表
3. **Beads 管理任务，xiaoxi-dreams 管理记忆**

## Dolt SQL 示例

```sql
-- 创建记忆
INSERT INTO memory_entries (
  id, type, name, summary, content, 
  source_file, created_at, importance, tags, content_hash
) VALUES (
  'mem-a1b2c3d4',
  'procedure',
  'openclaw-config-set',
  '使用 openclaw config set 安全修改配置',
  'openclaw config set 会自动创建 .bak 备份...',
  'memory/2026-04-02.md',
  NOW(),
  8,
  '["openclaw", "config", "safety"]',
  'sha256:abc123...'
);

-- 查询最近7天的记忆
SELECT * FROM memory_entries 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY importance DESC;

-- 健康度趋势
SELECT date, overall_score, freshness, coverage 
FROM health_metrics 
ORDER BY date DESC 
LIMIT 30;

-- 时间旅行：查看某天的记忆状态
SELECT * FROM memory_entries AS OF '2026-04-01';
```

## 集成到 SKILL

```bash
# 初始化 Dolt（已由 Beads 完成）
bd init

# 手动运行 Dream
bd xd dream

# 查看 Dream 历史
bd xd history

# 健康度趋势
bd xd health

# 记忆统计
bd xd stats
```

## 优势

1. **版本化记忆**：每次 Dream 都是一个 commit，可以回滚
2. **Branch 实验**：可以在独立分支测试记忆整合策略
3. **去重**：content_hash 防止重复记忆
4. **审计**：完整的变更历史
5. **共享基础设施**：与 Beads 共用 Dolt，资源利用率高
