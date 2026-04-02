# 🗄️ Dolt 数据库 ER 图

## 表结构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Dolt ER 图                                         │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────┐         ┌─────────────────────┐
  │   dream_sessions    │         │   memory_entries    │
  ├─────────────────────┤         ├─────────────────────┤
  │ PK id                │         │ PK id                │
  │     date             │         │     type             │
  │     status            │         │     name             │
  │     health_score      │         │     summary           │
  │     scanned_files     │         │     content           │
  │     new_entries       │    1──┐│     importance        │
  │     updated_entries   │       ││     is_permanent      │
  │     started_at        │       ││     content_hash      │
  │     completed_at      │       │└─────────────────────┘
  │     error_message     │       │
  └──────────┬──────────┘       │ 1:N
               │                 │
               │ 1:N             │
               ▼                 │
  ┌─────────────────────┐         │
  │   dream_changes     │         │
  ├─────────────────────┤         │
  │ PK id                │◄────────┘
  │     dream_id (FK)    │
  │ FK memory_id ─────────┘
  │     action            
  │     change_summary    
  │     changed_at        
  └─────────────────────┘

  ┌─────────────────────┐         ┌─────────────────────┐
  │   health_metrics    │         │     access_log      │
  ├─────────────────────┤         ├─────────────────────┤
  │ PK date              │         │ PK id                │
  │     freshness         │         │ FK memory_id ────────┘
  │     coverage          │         │     accessed_at       │
  │     coherence         │         └─────────────────────┘
  │     efficiency        │
  │     accessibility     │
  │     overall_score     │
  └─────────────────────┘
```

## 表详情

### dream_sessions (做梦会话)

```sql
CREATE TABLE dream_sessions (
    id              VARCHAR(20) PRIMARY KEY,      -- 格式: dream-xxxxxxxx
    date            DATE NOT NULL,                  -- 做梦日期
    status          ENUM('running','completed','failed') DEFAULT 'running',
    health_score    INT DEFAULT 0,                  -- 健康度 0-100
    scanned_files   INT DEFAULT 0,                  -- 扫描文件数
    new_entries     INT DEFAULT 0,                  -- 新增条目
    updated_entries INT DEFAULT 0,                  -- 更新条目
    started_at      DATETIME DEFAULT NOW(),
    completed_at    DATETIME,
    error_message   TEXT,
    content_hash    VARCHAR(64),                   -- 去重用
    
    INDEX idx_date (date),
    INDEX idx_status (status)
);
```

### memory_entries (记忆条目)

```sql
CREATE TABLE memory_entries (
    id              VARCHAR(20) PRIMARY KEY,      -- 格式: mem-xxxxxxxx
    type            ENUM('fact','decision','lesson','procedure','person','project'),
    name            VARCHAR(100) NOT NULL,        -- slug
    summary         TEXT,                         -- 一句话摘要
    content         LONGTEXT,                     -- 详细内容
    source_file     VARCHAR(255),                 -- 来源文件
    created_at      DATETIME DEFAULT NOW(),
    updated_at      DATETIME DEFAULT NOW(),
    last_accessed   DATETIME,
    access_count    INT DEFAULT 0,                -- 访问次数
    importance      INT DEFAULT 5,                 -- 1-10
    tags            JSON,                         -- 标签数组
    is_permanent    BOOLEAN DEFAULT FALSE,        -- 永久保留
    is_consolidated BOOLEAN DEFAULT FALSE,        -- 已整合
    content_hash    VARCHAR(64),                  -- 去重用
    
    INDEX idx_type (type),
    INDEX idx_created (created_at),
    INDEX idx_importance (importance),
    INDEX idx_permanent (is_permanent),
    FULLTEXT idx_content (content)
);
```

### health_metrics (健康指标)

```sql
CREATE TABLE health_metrics (
    date            DATE PRIMARY KEY,              -- 日期
    freshness       FLOAT DEFAULT 0,              -- 0-1
    coverage        FLOAT DEFAULT 0,              -- 0-1
    coherence       FLOAT DEFAULT 0,              -- 0-1
    efficiency      FLOAT DEFAULT 0,              -- 0-1
    accessibility   FLOAT DEFAULT 0,              -- 0-1
    overall_score   INT DEFAULT 0,                -- 0-100
    
    INDEX idx_score (overall_score)
);
```

### dream_changes (变更记录)

```sql
CREATE TABLE dream_changes (
    id              VARCHAR(20) PRIMARY KEY,
    dream_id        VARCHAR(20),                  -- FK -> dream_sessions.id
    memory_id       VARCHAR(20),                   -- FK -> memory_entries.id
    action          ENUM('created','updated','archived','deleted'),
    change_summary  TEXT,
    changed_at      DATETIME DEFAULT NOW(),
    
    FOREIGN KEY (dream_id) REFERENCES dream_sessions(id),
    FOREIGN KEY (memory_id) REFERENCES memory_entries(id),
    INDEX idx_dream (dream_id),
    INDEX idx_memory (memory_id)
);
```

### access_log (访问日志)

```sql
CREATE TABLE access_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    memory_id       VARCHAR(20),                   -- FK -> memory_entries.id
    accessed_at     DATETIME DEFAULT NOW(),
    
    FOREIGN KEY (memory_id) REFERENCES memory_entries(id),
    INDEX idx_memory_time (memory_id, accessed_at)
);
```

## 关联关系

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              关系说明                                         │
└─────────────────────────────────────────────────────────────────────────────┘

  dream_sessions ──1:N──► dream_changes
  │
  │  每个 Dream 会产生多个变更记录
  │
  │
  memory_entries ──1:N──► dream_changes
  │
  │  每个记忆条目可以有多个版本变更
  │
  │
  memory_entries ──1:N──► access_log
  │
  │  追踪每个记忆的访问情况
  │
  │


  health_metrics ──独立表
  │
  │  每天的健康度快照
  │  用于趋势分析
  │
```

## 常用查询

```sql
-- 1. 获取最近 7 天的记忆
SELECT * FROM memory_entries 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY importance DESC;

-- 2. 健康度趋势 (最近 30 天)
SELECT date, overall_score, freshness, coverage 
FROM health_metrics 
ORDER BY date DESC 
LIMIT 30;

-- 3. 高价值记忆 (importance >= 8)
SELECT id, name, type, importance, created_at
FROM memory_entries 
WHERE importance >= 8
ORDER BY importance DESC;

-- 4. 永久记忆
SELECT * FROM memory_entries WHERE is_permanent = TRUE;

-- 5. 最近 10 次 Dream 统计
SELECT id, date, status, health_score, new_entries, updated_entries
FROM dream_sessions 
ORDER BY date DESC 
LIMIT 10;

-- 6. 记忆按类型统计
SELECT type, COUNT(*) as count, AVG(importance) as avg_importance
FROM memory_entries 
GROUP BY type;

-- 7. 未被访问的记忆 (30天以上)
SELECT id, name, last_accessed
FROM memory_entries 
WHERE last_accessed < DATE_SUB(NOW(), INTERVAL 30 DAY)
OR last_accessed IS NULL;

-- 8. 时间旅行：查看某天记忆状态
SELECT * FROM memory_entries AS OF '2026-04-01';

-- 9. 变更历史
SELECT dc.*, me.name 
FROM dream_changes dc
LEFT JOIN memory_entries me ON dc.memory_id = me.id
ORDER BY dc.changed_at DESC
LIMIT 20;

-- 10. 热门记忆 (访问次数最多)
SELECT id, name, access_count, last_accessed
FROM memory_entries 
ORDER BY access_count DESC
LIMIT 10;
```
