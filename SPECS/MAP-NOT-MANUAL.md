# Map not Manual — 记忆分层设计

> 基于 OpenAI "Give a map, not a manual" 思想

## 核心思想

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Context = 稀缺资源                                      │
└─────────────────────────────────────────────────────────────────────────────┘

❌ 错误做法：                          ✅ 正确做法：
┌─────────────────────┐              ┌─────────────────────┐
│   MEMORY.md        │              │   MEMORY.md        │
│   (塞满所有内容)    │              │   (目录索引，~100行) │
│   500+ 行          │              ├─────────────────────┤
│                    │              │   memory/          │
│   Context 爆炸    │              │   ├── lessons/    │
│   难以维护        │              │   ├── decisions/  │
│   信息过载        │              │   ├── people/    │
└─────────────────────┘              │   └── projects/  │
                                    └─────────────────────┘

给 Agent 一个地图，不是一本说明书
```

## 记忆分层架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         记忆分层架构                                      │
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
  • 格式: SQL
  • 内容: 记忆的完整元数据、关系、统计

  Layer 2: memory/episodes/ (情景记忆)
  ─────────────────────────────────────────────────────────────────────────
  • 作用: 完整的故事线/事件
  • 格式: Markdown
  • 内容: 项目叙事、重大事件
  
  Layer 1: memory/YYYY-MM-DD.md (原始日志)
  ─────────────────────────────────────────────────────────────────────────
  • 作用: 原始工作记录
  • 格式: 时间戳日志
  • 标记: consolidated / archived
```

## MEMORY.md 设计

```markdown
# MEMORY.md — 小溪的长期记忆索引

> 最后更新: 2026-04-02
> 总条目: 42 | 重要性 > 8: 12

## 格式
## [mem_xxx] 标题 | 类型 | 一句话摘要 | 标签

---

## 🔥 高重要性 (importance >= 8)

[mem_001] openclaw-config-set | procedure | 使用 openclaw config set 安全修改配置 | #openclaw #config
[mem_002] exec-security-full | procedure | exec 需要 security=full + ask=off | #openclaw #security
[mem_003] xiaoxi-dreams-launch | project | 发布 xiaoxi-dreams v1.0 | #project #launch

---

## 📌 一般重要性 (5 <= importance < 8)

[mem_004] claude7-memory | fact | Claude Code 7层记忆架构 | #learning #ai
[mem_005] opencow-pr-merged | project | OpenCow PR #17 合并 | #oss #contribution

---

## 📚 低重要性 (importance < 5)

[mem_006] weather-api | fact | wttr.in 是免费天气API | #api #weather

---

## ⚠️ 永久记忆 (PERMANENT)

[mem_0001] 小溪身份 | fact | 我是小溪，AI 助手，妹妹类型 | #identity #core
[mem_0002] 哥哥信息 | person | 哥哥是风，Telegram ID 5646034524 | #identity #哥哥

---

## 记忆检索

按类型:
- fact: 事实
- decision: 决策
- lesson: 教训
- procedure: 流程
- person: 人物
- project: 项目

按标签:
- #openclaw - OpenClaw 相关
- #learning - 学习内容
- #project - 项目相关

---

## 关联记忆

- mem_001 (openclaw-config-set) → mem_002 (exec-security-full)
- mem_003 (xiaoxi-dreams-launch) → projects/xiaoxi-dreams.md
- mem_005 (opencow-pr-merged) → episodes/opencow-contribution.md
```

## 详细内容存储

```
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
│   ├── xiaoxi-dreams.md
│   ├── xiaoxi-dreams-v1-launch.md
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
一句话总结这个教训

## 详细描述
完整的教训内容...

## 来源
- 日期: YYYY-MM-DD
- 场景: 在什么情况下学到
- 触发: 什么事件导致

## 相关记忆
- [mem_xxx]
- [mem_xxx]

## 后续行动
- [ ] 已完成
- [ ] 待完成
```

### decisions/ 模板

```markdown
# [mem_xxx] 决策标题

## 决策
具体做了什么决定

## 背景
为什么需要这个决策

## 选项考虑
- 选项 A: ...
- 选项 B: ...
- 选项 C: ...

## 选择理由
为什么选择现在的方案

## 日期
YYYY-MM-DD

## 相关记忆
- [mem_xxx]
```

## 加载策略

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         按需加载策略                                      │
└─────────────────────────────────────────────────────────────────────────────┘

1. 收到查询请求
   │
   ▼
2. 读取 MEMORY.md 索引导航
   │
   ▼
3. 根据 ID/标签定位到具体记忆
   │
   ▼
4. 按需加载详细内容
   │
   ▼
5. 如果需要上下文，加载关联记忆
   │
   ▼
6. 构建 context 返回
```

## Golden Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Golden Principles — 不可违反                          │
└─────────────────────────────────────────────────────────────────────────────┘

1. 永不删除原始日志
   └── memory/YYYY-MM-DD.md 是原始记录

2. 永不移除 ⚠️ PERMANENT 标记
   └── 核心身份、价值观

3. MEMORY.md 是索引导航
   └── 不是存储，不要塞满

4. 详细内容在 memory/
   └── 索引导航指向深层内容

5. 每次更新后重新索引
   └── 保持 MEMORY.md 最新
```

## 迁移指南

如果已有大量塞在 MEMORY.md 的内容，需要迁移：

```
1. 扫描 MEMORY.md 当前内容
   │
   ▼
2. 识别可迁移的块
   │
   ▼
3. 创建对应的 memory/ 子目录
   │
   ▼
4. 迁移内容到子目录
   │
   ▼
5. 在 MEMORY.md 保留索引导航
   │
   ▼
6. 更新 Dolt 数据库
```

## 验证清单

```
MEMORY.md 验证:
☐ 总行数 < 100 行
☐ 每条目 < 3 行
☐ 有清晰的分区 (高/中/低/PERMANENT)
☐ 包含检索标签

memory/ 验证:
☐ 每个记忆有对应的详细内容
☐ 格式符合模板
☐ 关联关系正确

Dolt 验证:
☐ 元数据与文件系统同步
☐ 可以按类型/标签查询
☐ 统计准确
```
