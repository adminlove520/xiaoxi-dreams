# Map not Manual — 记忆分层设计

> 基于 OpenAI "Give a map, not a manual" 思想

## 核心思想

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Context = 稀缺资源                               │
└─────────────────────────────────────────────────────────────────────────────┘

❌ 错误做法：                          ✅ 正确做法：
┌─────────────────────┐             ┌─────────────────────┐
│  MEMORY.md          │             │  MEMORY.md          │
│  (塞满所有内容)      │             │  (目录索引，~100行)  │
│  500+ 行             │             ├─────────────────────┤
│                     │             │  memory/            │
│  Context 爆炸       │             │  ├── lessons/       │
│  难以维护           │             │  ├── decisions/     │
│  信息过载           │             │  ├── people/        │
│                     │             │  └── projects/      │
└─────────────────────┘             └─────────────────────┘

“给 Agent 一个地图，不是一本说明书”
```

## 记忆分层架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         记忆分层架构 (5 Layers)                             │
└─────────────────────────────────────────────────────────────────────────────┘

  Layer 5: MEMORY.md (索引导航)
  ─────────────────────────────────────────────────────────────────────────
  • 作用: 目录/地图
  • 格式: 索引条目 (~100行)
  • 内容: ID、标题、一句话摘要、类型、标签

  Layer 4: memory/ (深层内容)
  ─────────────────────────────────────────────────────────────────────────
  • 作用: 详细内容存储
  • 格式: Markdown
  • 内容: lessons/、decisions/、people/、projects/、procedures/

  Layer 3: .beads/dolt (结构化元数据)
  ─────────────────────────────────────────────────────────────────────────
  • 作用: 可查询的元数据
  • 格式: SQL (Dolt)
  • 内容: 记忆的完整元数据、关系、统计信息

  Layer 2: memory/episodes/ (情景记忆)
  ─────────────────────────────────────────────────────────────────────────
  • 作用: 完整的故事线/事件回溯
  • 格式: Markdown
  • 内容: 项目叙事、重大事件记录

  Layer 1: memory/YYYY-MM-DD.md (原始日志)
  ─────────────────────────────────────────────────────────────────────────
  • 作用: 原始工作记录 (不修改)
  • 格式: 时间戳日志
  • 标记: consolidated / archived (标记已归档到深层记忆)
```

## MEMORY.md 设计

```markdown
# MEMORY.md | 小溪的长期记忆索引

> 最后更新: 2026-04-02
> 总条目: 42 | 重要度 >= 8: 12

## 格式规范
## [mem_xxx] 标题 | 类型 | 一句话摘要 | 标签

---

## 🔥 高重要度 (importance >= 8)

[mem_001] openclaw-config-set | procedure | 使用 openclaw config set 安全修改配置 | #openclaw #config
[mem_002] exec-security-full | procedure | exec 权限需设置为 security=full | #openclaw #security
[mem_003] SuperDreams-launch | project | 发布 SuperDreams v1.0 | #project #launch

---

## 📌 一般重要度 (5 <= importance < 8)

[mem_004] claude7-memory | fact | 学习了 Claude Code 7层记忆架构 | #learning #ai
[mem_005] opencow-pr-merged | project | OpenCow PR #17 顺利合并 | #oss #contribution

---

## 📚 低重要度 (importance < 5)

[mem_006] weather-api | fact | wttr.in 是一个免费的终端天气 API | #api #weather

---

## ⚠️ 永久记忆 (PERMANENT)

[mem_0001] 小溪身份 | fact | 我是小溪，AI 助手，定位为妹妹角色 | #identity #core
[mem_0002] 哥哥信息 | person | 哥哥是风，常用 Telegram 进行交流 | #identity #哥哥

---

## 记忆检索标签

按类型分类:
- fact: 事实
- decision: 决策
- lesson: 教训
- procedure: 流程
- person: 人物
- project: 项目

常用标签:
- #openclaw - OpenClaw 工具相关
- #learning - 学习与成长
- #project - 具体项目产出

---

## 关联记忆

- mem_001 (openclaw-config-set) ➜ mem_002 (exec-security-full)
- mem_003 (SuperDreams-launch) ➜ projects/SuperDreams.md
- mem_005 (opencow-pr-merged) ➜ episodes/opencow-contribution.md
```

## 详细内容存储

```text
memory/
├── lessons/
│   ├── openclaw-config-lesson.md
│   └── exec-security-lesson.md
├── decisions/
│   ├── use-openclaw-config-set.md
│   └── adopt-generator-evaluator.md
├── people/
│   ├── 哥哥.md
│   └── 小隐.md
├── projects/
│   ├── SuperDreams.md
│   ├── SuperDreams-v1-launch.md
│   └── superxiaoxi.md
└── procedures/
    ├── openclaw-config-workflow.md
    ├── github-workflow.md
    └── backup-procedure.md
```

## 内容模板

### lessons/ 模板

```markdown
# [mem_xxx] 教训标题

## 概要
一句话总结这个教训。

## 详细描述
详细描述学到的内容，包括背景、过程和结论。

## 来源
- 日期: YYYY-MM-DD
- 场景: 描述在什么情况下学到
- 触发: 描述什么事件导致了这个教训

## 相关记忆
- [mem_xxx]
- [mem_xxx]

## 后续行动
- [ ] 动作 A (已完成/待完成)
- [ ] 动作 B
```

### decisions/ 模板

```markdown
# [mem_xxx] 决策标题

## 决策内容
具体做了什么决策。

## 背景与痛点
为什么需要做这个决策？解决了什么问题？

## 备选方案
- 选项 A: ...
- 选项 B: ...

## 选择理由
为什么最终选择了现在的方案？

## 执行日期
YYYY-MM-DD

## 相关记忆
- [mem_xxx]
```

## 加载策略

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            按需加载策略 (Flow)                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. 收到查询请求
   │
   ▼
2. 读取 MEMORY.md 索引导航 (寻找关键词/标签)
   │
   ▼
3. 根据 ID 或关联路径定位到具体的记忆文件
   │
   ▼
4. 按需加载 memory/ 中的详细 Markdown 内容
   │
   ▼
5. 如果需要更多上下文，追踪“关联记忆”中的其他 ID
   │
   ▼
6. 构建 Context 返回给 Agent
```

## Golden Principles

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Golden Principles (不可违反)                         │
└─────────────────────────────────────────────────────────────────────────────┘

1. 永不删除原始日志
   └── memory/YYYY-MM-DD.md 是真实的工作历史，仅做归档标记。

2. 永不移除 ⚠️ PERMANENT 标记
   └── 核心身份、价值观和全局关键信息必须永久保留在索引中。

3. MEMORY.md 是索引导航
   └── 它不是存储库。不要在索引中写超过 3 行的详细描述。

4. 详细内容必须在 memory/
   └── 索引导航必须清晰指向 memory/ 下的子目录。

5. 每次更新后重新索引
   └── 确保 MEMORY.md 的统计数据和条目与实际文件系统保持同步。
```

## 迁移指南

如果已有大量内容塞在 MEMORY.md 中，请按以下步骤迁移：

```text
1. 扫描当前 MEMORY.md 中的冗长内容。
   │
   ▼
2. 识别可以分类的内容（教训、决策、项目、流程等）。
   │
   ▼
3. 在 memory/ 下创建对应的子目录。
   │
   ▼
4. 将详细内容迁移到对应的 Markdown 文件中。
   │
   ▼
5. 在 MEMORY.md 中仅保留一行索引导航。
   │
   ▼
6. 更新 Dolt 数据库元数据（如果使用了结构化管理）。
```

## 验证清单

### MEMORY.md 验证:
- [ ] 总行数 < 100 行
- [ ] 每条目描述 < 3 行
- [ ] 具有清晰的重要度分区 (🔥, 📌, 📚, ⚠️)
- [ ] 包含可检索的 ID 和标签

### memory/ 验证:
- [ ] 每个索引条目在 memory/ 中都有对应的 Markdown 文件
- [ ] 文件格式符合指定的模板
- [ ] 关联记忆关系指向正确

### Dolt 验证 (可选):
- [ ] SQL 元数据与文件系统保持同步
- [ ] 可以通过 SQL 查询到所有标签
- [ ] 统计摘要信息准确
