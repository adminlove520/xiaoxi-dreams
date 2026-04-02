# xiaoxi-dreams Dolt Helper Commands
# 用法: .\xd.ps1 <command>

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$BD = "$env:USERPROFILE\Go\bin\bd.exe"
$DOLT = "$env:USERPROFILE\Go\bin\dolt.exe"
$DB_PATH = "$env:USERPROFILE\.openclaw\workspace\xiaoxi-dreams\.beads\xiaoxi_dreams"

function Show-Help {
    Write-Host @"
🌀 xiaoxi-dreams Commands
=========================

  .\xd.ps1 init       - 初始化 Dolt 表结构
  .\xd.ps1 status     - 查看 Dream 状态
  .\xd.ps1 history    - 查看做梦历史
  .\xd.ps1 health     - 查看健康度趋势
  .\xd.ps1 stats      - 记忆统计
  .\xd.ps1 log        - 查看最近变更
  .\xd.ps1 commit     - 提交变更到 Dolt
  .\xd.ps1 push       - 推送到远程
  .\xd.ps1 pull       - 从远程拉取
  .\xd.ps1 sql        - 打开 SQL REPL
  .\xd.ps1 backup     - 备份数据库

"@
}

function Invoke-Init {
    Write-Host "📦 初始化 Dolt 表结构..." -ForegroundColor Cyan
    & $DOLT sql -q "CREATE DATABASE IF NOT EXISTS xiaoxi_dreams;"
    & $DOLT sql -q "USE xiaoxi_dreams;"
    & $DOLT sql -q "source scripts/dolt-helpers.sql"
    Write-Host "✅ 初始化完成！" -ForegroundColor Green
}

function Invoke-Status {
    Write-Host "📊 Dream 状态" -ForegroundColor Cyan
    Write-Host "============" -ForegroundColor Cyan
    & $DOLT sql -q "SELECT id, date, status, health_score, new_entries, updated_entries FROM dream_sessions ORDER BY date DESC LIMIT 5;"
}

function Invoke-History {
    Write-Host "📅 做梦历史" -ForegroundColor Cyan
    Write-Host "==========" -ForegroundColor Cyan
    & $DOLT sql -q "SELECT date, status, health_score, scanned_files, new_entries, updated_entries FROM dream_sessions ORDER BY date DESC LIMIT 10;"
}

function Invoke-Health {
    Write-Host "❤️  健康度趋势" -ForegroundColor Cyan
    Write-Host "=============" -ForegroundColor Cyan
    & $DOLT sql -q "SELECT date, overall_score, freshness, coverage, coherence FROM health_metrics ORDER BY date DESC LIMIT 7;"
}

function Invoke-Stats {
    Write-Host "📈 记忆统计" -ForegroundColor Cyan
    Write-Host "===========" -ForegroundColor Cyan
    
    Write-Host "`n按类型统计:" -ForegroundColor Yellow
    & $DOLT sql -q "SELECT type, COUNT(*) as count FROM memory_entries GROUP BY type ORDER BY count DESC;"
    
    Write-Host "`n高重要性记忆 (importance >= 8):" -ForegroundColor Yellow
    & $DOLT sql -q "SELECT id, name, type, importance FROM memory_entries WHERE importance >= 8 ORDER BY importance DESC LIMIT 10;"
    
    Write-Host "`n永久记忆:" -ForegroundColor Yellow
    & $DOLT sql -q "SELECT id, name, type FROM memory_entries WHERE is_permanent = TRUE;"
}

function Invoke-Log {
    Write-Host "📝 最近变更" -ForegroundColor Cyan
    Write-Host "==========" -ForegroundColor Cyan
    & $DOLT sql -q "SELECT dc.id, dc.action, dc.change_summary, dc.changed_at, me.name FROM dream_changes dc LEFT JOIN memory_entries me ON dc.memory_id = me.id ORDER BY dc.changed_at DESC LIMIT 20;"
}

function Invoke-Commit {
    Write-Host "💾 提交变更..." -ForegroundColor Cyan
    & $DOLT add .
    & $DOLT commit -m "Dream update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    Write-Host "✅ 提交完成！" -ForegroundColor Green
}

function Invoke-Push {
    Write-Host "🚀 推送到远程..." -ForegroundColor Cyan
    & $DOLT push origin main
    Write-Host "✅ 推送完成！" -ForegroundColor Green
}

function Invoke-Pull {
    Write-Host "📥 从远程拉取..." -ForegroundColor Cyan
    & $DOLT pull origin main
    Write-Host "✅ 拉取完成！" -ForegroundColor Green
}

function Invoke-SQL {
    Write-Host "🔓 打开 SQL REPL (输入 exit 退出)..." -ForegroundColor Cyan
    & $DOLT sql
}

function Invoke-Backup {
    $BACKUP_DIR = "$env:USERPROFILE\.openclaw\workspace\xiaoxi-dreams\backups"
    $TIMESTAMP = Get-Date -Format 'yyyyMMdd-HHmmss'
    $BACKUP_FILE = "$BACKUP_DIR\backup-$TIMESTAMP.tar.gz"
    
    if (!(Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    }
    
    Write-Host "💾 创建备份: $BACKUP_FILE" -ForegroundColor Cyan
    # 备份 .beads 目录
    Compress-Archive -Path "$env:USERPROFILE\.openclaw\workspace\xiaoxi-dreams\.beads" -DestinationPath $BACKUP_FILE -Force
    Write-Host "✅ 备份完成: $BACKUP_FILE" -ForegroundColor Green
}

# 执行命令
switch ($Command) {
    "init"    { Invoke-Init }
    "status"  { Invoke-Status }
    "history" { Invoke-History }
    "health"  { Invoke-Health }
    "stats"   { Invoke-Stats }
    "log"     { Invoke-Log }
    "commit"  { Invoke-Commit }
    "push"    { Invoke-Push }
    "pull"    { Invoke-Pull }
    "sql"     { Invoke-SQL }
    "backup"  { Invoke-Backup }
    default   { Show-Help }
}
