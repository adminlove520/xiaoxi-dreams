# 🌀 xiaoxi-dreams

> 小溪的认知记忆系统 — 周期性做梦，让 AI 更聪明地醒来

基于 [Auto-Dream](https://github.com/LeoYeAI/openclaw-auto-dream) 理念构建，专为小溪优化。

---

## 是什么

小溪每天会在后台"做梦" — 扫描每日日志、提取关键知识、整理成长期记忆，并发送报告给你。

**解决问题：**
- 日志堆积但从不回顾
- 重要决策找不到
- 不知道小溪学到了什么

---

## 核心功能

- 🧠 **智能记忆整合** — 日志 → 结构化记忆
- 📊 **健康评分** — 5维指标追踪记忆系统健康度
- 🔔 **推送报告** — 每次 Dream 后主动汇报
- 📈 **成长追踪** — 记录连续做梦次数、记忆增长

---

## 项目结构

```
xiaoxi-dreams/
├── SKILLS/
│   └── dream.md              # 核心做梦技能
├── docs/
│   ├── memory-template.md     # 记忆模板
│   └── scoring.md           # 评分算法
├── scripts/
│   └── setup.sh              # 安装脚本
└── README.md
```

---

## 安装

```bash
# 克隆到 skills 目录
git clone https://github.com/adminlove520/xiaoxi-dreams.git \
  ~/.openclaw/workspace/skills/xiaoxi-dreams

# 重启 Gateway
openclaw gateway restart
```

---

## 工作流程

```
每天 Cron (默认 04:00)
       │
       ▼
┌─────────────────┐
│  收集 Collect   │  扫描7天内未处理的日志
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  整合 Consolidate│  路由到对应记忆层、去重、分配ID
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  评估 Evaluate  │  重要性评分、生成洞察、更新健康度
└────────┬────────┘
         │
         ▼
      🔔 推送报告
```

---

## 记忆层级

| 层级 | 文件 | 内容 |
|------|------|------|
| 长期记忆 | `MEMORY.md` | 事实、决策、人物、战略 |
| 程序记忆 | `memory/procedures.md` | 工作流、偏好、工具用法 |
| 情景记忆 | `memory/episodes/*.md` | 项目叙事、事件时间线 |

---

## 安全规则

1. 永不删除每日日志 — 只标记 `<!-- consolidated -->`
2. 永不移除 `⚠️ PERMANENT` 标记的条目
3. 变更超过 30% 自动备份

---

## 相关项目

- [Superxiaoxi](https://github.com/adminlove520/superxiaoxi) — 小溪增强版 SKILLs
- [Auto-Dream](https://github.com/LeoYeAI/openclaw-auto-dream) — 原始项目

---

🦞 Made by **小溪**
