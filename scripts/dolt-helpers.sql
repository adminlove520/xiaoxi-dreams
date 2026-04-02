-- xiaoxi-dreams Dolt Schema
-- 创建记忆表空间

-- 1. Dream Sessions（做梦会话）
CREATE TABLE IF NOT EXISTS dream_sessions (
    id VARCHAR(20) PRIMARY KEY,
    date DATE NOT NULL,
    status ENUM('running', 'completed', 'failed') DEFAULT 'running',
    health_score INT DEFAULT 0,
    scanned_files INT DEFAULT 0,
    new_entries INT DEFAULT 0,
    updated_entries INT DEFAULT 0,
    started_at DATETIME DEFAULT NOW(),
    completed_at DATETIME,
    error_message TEXT,
    content_hash VARCHAR(64),
    INDEX idx_date (date),
    INDEX idx_status (status)
);

-- 2. Memory Entries（记忆条目）
CREATE TABLE IF NOT EXISTS memory_entries (
    id VARCHAR(20) PRIMARY KEY,
    type ENUM('fact', 'decision', 'lesson', 'procedure', 'person', 'project') NOT NULL,
    name VARCHAR(100) NOT NULL,
    summary TEXT,
    content LONGTEXT,
    source_file VARCHAR(255),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW(),
    last_accessed DATETIME,
    access_count INT DEFAULT 0,
    importance INT DEFAULT 5,
    tags JSON,
    is_permanent BOOLEAN DEFAULT FALSE,
    is_consolidated BOOLEAN DEFAULT FALSE,
    content_hash VARCHAR(64),
    INDEX idx_type (type),
    INDEX idx_created (created_at),
    INDEX idx_importance (importance),
    INDEX idx_permanent (is_permanent),
    FULLTEXT INDEX idx_content (content)
);

-- 3. Health Metrics（健康指标）
CREATE TABLE IF NOT EXISTS health_metrics (
    date DATE PRIMARY KEY,
    freshness FLOAT DEFAULT 0,
    coverage FLOAT DEFAULT 0,
    coherence FLOAT DEFAULT 0,
    efficiency FLOAT DEFAULT 0,
    accessibility FLOAT DEFAULT 0,
    overall_score INT DEFAULT 0,
    INDEX idx_score (overall_score)
);

-- 4. Dream Changes（变更记录）
CREATE TABLE IF NOT EXISTS dream_changes (
    id VARCHAR(20) PRIMARY KEY,
    dream_id VARCHAR(20),
    memory_id VARCHAR(20),
    action ENUM('created', 'updated', 'archived', 'deleted') NOT NULL,
    change_summary TEXT,
    changed_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (dream_id) REFERENCES dream_sessions(id),
    FOREIGN KEY (memory_id) REFERENCES memory_entries(id),
    INDEX idx_dream (dream_id),
    INDEX idx_memory (memory_id)
);

-- 5. Access Log（访问日志，用于追踪记忆使用）
CREATE TABLE IF NOT EXISTS access_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    memory_id VARCHAR(20),
    accessed_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (memory_id) REFERENCES memory_entries(id),
    INDEX idx_memory_time (memory_id, accessed_at)
);
