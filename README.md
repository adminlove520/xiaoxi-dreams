# 🌀 SuperDreams 超梦

> AI Agent 认知记忆系统 — 通过"做梦"实现记忆整合、反思与进化

[![Version](https://img.shields.io/badge/version-4.1.0-green)](https://github.com/adminlove520/SuperDreams)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 什么是 SuperDreams？

SuperDreams 为 AI Agent（我们称之为**龙虾 🦞**）提供真正的记忆系统。每个 Agent 可以周期性地"做梦"——扫描日志、提取知识、整合记忆、评估健康度——从而实现持续的认知进化。

### 核心特性

- **🧠 真实做梦引擎** — 扫描日志 → 提取记忆 → 去重 → 评分 → 生成报告
- **📊 五维健康度评估** — 新鲜度、覆盖度、连贯度、效率、可达性
- **🦞 龙虾 Agent Dashboard** — 每只龙虾有自己的记忆可视化面板
- **🏢 Control Center** — 多 Agent 管理中心，跨 Agent 搜索，赛博永生
- **🔐 JWT + API Key 鉴权** — Agent 安全注册与通信
- **💾 SQLite 存储** — Fork 即用，每人一个数据库文件
- **☁️ Vercel 兼容** — 前端即服务，全球 CDN

## 架构

```
SuperDreams/
├── agent/          # 🦞 龙虾 Agent (Next.js + SQLite)
│   ├── app/        #    Dashboard + API Routes
│   ├── components/ #    UI Components (MemoryMatrix, SyncLog, etc.)
│   ├── lib/        #    核心引擎 (db, types, dream-engine, health)
│   └── data/       #    SQLite 数据库
├── center/         # 🏢 Control Center (Next.js + SQLite)
│   ├── app/        #    中控 Dashboard + API
│   └── lib/        #    Auth + DB
├── scripts/        #    CLI 工具
│   └── dream.js    #    命令行做梦脚本
└── memory/         #    日志文件 (做梦扫描源)
```

## 快速开始

### 1. 克隆 & 安装

```bash
git clone https://github.com/adminlove520/SuperDreams.git
cd SuperDreams

# Agent Dashboard
cd agent && npm install

# Control Center (可选)
cd ../center && npm install
```

### 2. 启动 Agent Dashboard

```bash
cd agent
npm run dev
# 访问 http://localhost:3000
```

### 3. 触发第一次做梦

```bash
# 在根目录运行
node scripts/dream.js
```

## 路线图

- [x] v4.0 架构重构 (SQLite + Monorepo)
- [x] 真实做梦引擎实现
- [x] 五维健康度量化
- [x] v4.1 霓虹发光 UI + 记忆矩阵 + 同步日志 + Vercel KV
- [ ] 记忆向量化搜索 (RAG)
- [ ] 自动化推文/周报生成

## 贡献

欢迎提交 PR 或 Issue。让我们一起构建 AI 的赛博记忆。

## 许可证

[MIT](LICENSE)
