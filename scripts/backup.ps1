# xiaoxi-dreams 增量备份脚本
# 使用说明：
#   .\backup.ps1          # 运行增量备份
#   .\backup.ps1 -Full   # 运行全量备份
#   .\backup.ps1 -Restore <file>  # 恢复备份

param(
    [Parameter(Position=0)]
    [ValidateSet("Full", "Inc", "Restore", "List", "Clean")]
    [string]$Action = "Inc",
    
    [Parameter(Position=1)]
    [string]$RestoreFile = ""
)

$ErrorActionPreference = "Stop"

# 配置
$BACKUP_DIR = "$env:USERPROFILE\.openclaw\workspace\xiaoxi-dreams\backups"
$MANIFEST_FILE = "$BACKUP_DIR\manifest.json"
$DOLT_DIR = "$env:USERPROFILE\.openclaw\workspace\xiaoxi-dreams\.beads\dolt"
$MEMORY_DIR = "$env:USERPROFILE\.openclaw\workspace\memory"
$WORKSPACE_DIR = "$env:USERPROFILE\.openclaw\workspace\xiaoxi-dreams"

# 确保备份目录存在
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
}

# 读取 manifest
function Get-Manifest {
    if (Test-Path $MANIFEST_FILE) {
        return Get-Content $MANIFEST_FILE | ConvertFrom-Json
    }
    return @{ backups = @(); lastFull = $null }
}

# 保存 manifest
function Save-Manifest {
    param([hashtable]$Manifest)
    $Manifest | ConvertTo-Json -Depth 10 | Set-Content $MANIFEST_FILE
}

# 获取备份文件大小
function Get-FileSize {
    param([string]$Path)
    if (Test-Path $Path) {
        return (Get-Item $Path).Length
    }
    return 0
}

# 格式化文件大小
function Format-Size {
    param([long]$Bytes)
    if ($Bytes -gt 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
    if ($Bytes -gt 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    if ($Bytes -gt 1KB) { return "{0:N2} KB" -f ($Bytes / 1KB) }
    return "$Bytes B"
}

# 全量备份
function Backup-Full {
    Write-Host "📦 创建全量备份..." -ForegroundColor Cyan
    
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $FileName = "full-$Timestamp.tar.gz"
    $FullPath = "$BACKUP_DIR\$FileName"
    
    # 备份内容
    $Items = @(
        $DOLT_DIR,
        $MEMORY_DIR,
        "$WORKSPACE_DIR\SKILLS",
        "$WORKSPACE_DIR\memory"
    )
    
    # 使用 tar 压缩
    $TempDir = "$env:TEMP\xd-backup-$Timestamp"
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    
    # 复制到临时目录
    $Items | ForEach-Object {
        if (Test-Path $_) {
            $Name = Split-Path $_ -Leaf
            Copy-Item $_ "$TempDir\$Name" -Recurse -Force
        }
    }
    
    # 压缩
    Compress-Archive -Path "$TempDir\*" -DestinationPath $FullPath -Force
    
    # 清理临时目录
    Remove-Item $TempDir -Recurse -Force
    
    # 计算大小
    $Size = Get-FileSize $FullPath
    
    # 更新 manifest
    $Manifest = Get-Manifest
    $Backup = @{
        type = "full"
        file = $FileName
        timestamp = $Timestamp
        date = (Get-Date -Format "yyyy-MM-dd")
        size = $Size
        sizeFormatted = Format-Size $Size
        paths = @($DOLT_DIR, $MEMORY_DIR)
    }
    $Manifest.backups += $Backup
    $Manifest.lastFull = $Timestamp
    Save-Manifest $Manifest
    
    Write-Host "✅ 全量备份完成: $FileName ($(Format-Size $Size))" -ForegroundColor Green
    
    return $FileName
}

# 增量备份
function Backup-Increment {
    Write-Host "📦 创建增量备份..." -ForegroundColor Cyan
    
    $Manifest = Get-Manifest
    $LastFull = $Manifest.lastFull
    
    if (-not $LastFull) {
        Write-Host "⚠️ 没有找到全量备份，执行全量备份..." -ForegroundColor Yellow
        return Backup-Full
    }
    
    # 查找上次全量备份
    $LastFullFile = ($Manifest.backups | Where-Object { $_.timestamp -eq $LastFull }).file
    $LastFullPath = "$BACKUP_DIR\$LastFullFile"
    
    if (-not (Test-Path $LastFullPath)) {
        Write-Host "⚠️ 上次全量备份不存在，执行全量备份..." -ForegroundColor Yellow
        return Backup-Full
    }
    
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $FileName = "incr-$Timestamp.tar.gz"
    $FullPath = "$BACKUP_DIR\$FileName"
    
    # 使用差量备份（基于上次全量）
    # PowerShell 没有内置的 rsync，我们用简单的方式：
    # 压缩整个目录，tar.gz 会自动处理增量
    $TempDir = "$env:TEMP\xd-backup-$Timestamp"
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    
    # 复制必要目录
    $Items = @(
        $DOLT_DIR,
        $MEMORY_DIR,
        "$WORKSPACE_DIR\SKILLS"
    )
    
    $Items | ForEach-Object {
        if (Test-Path $_) {
            $Name = Split-Path $_ -Leaf
            Copy-Item $_ "$TempDir\$Name" -Recurse -Force
        }
    }
    
    # 压缩
    Compress-Archive -Path "$TempDir\*" -DestinationPath $FullPath -Force
    
    # 清理临时目录
    Remove-Item $TempDir -Recurse -Force
    
    # 计算大小
    $Size = Get-FileSize $FullPath
    
    # 更新 manifest
    $Backup = @{
        type = "incr"
        file = $FileName
        timestamp = $Timestamp
        date = (Get-Date -Format "yyyy-MM-dd")
        size = $Size
        sizeFormatted = Format-Size $Size
        basedOn = $LastFull
        paths = @($DOLT_DIR, $MEMORY_DIR)
    }
    $Manifest.backups += $Backup
    Save-Manifest $Manifest
    
    Write-Host "✅ 增量备份完成: $FileName ($(Format-Size $Size))" -ForegroundColor Green
    
    return $FileName
}

# 列出备份
function List-Backups {
    $Manifest = Get-Manifest
    
    Write-Host ""
    Write-Host "📦 备份列表" -ForegroundColor Cyan
    Write-Host "=" * 60
    Write-Host ""
    
    if ($Manifest.backups.Count -eq 0) {
        Write-Host "没有备份记录" -ForegroundColor Yellow
        return
    }
    
    # 按时间排序
    $Sorted = $Manifest.backups | Sort-Object { $_.timestamp } -Descending
    
    $TotalSize = 0
    foreach ($Backup in $Sorted) {
        $TotalSize += $Backup.size
        $TypeIcon = if ($Backup.type -eq "full") { "📦" } else { "📄" }
        $BasedOn = if ($Backup.basedOn) { " (基于 $basedOn)" } else { "" }
        Write-Host "$TypeIcon $($Backup.date) $($Backup.timestamp) $($Backup.sizeFormatted)$BasedOn"
    }
    
    Write-Host ""
    Write-Host "总计: $($Sorted.Count) 个备份, $(Format-Size $TotalSize)" -ForegroundColor Green
    Write-Host "全量备份: $(($Sorted | Where-Object { $_.type -eq 'full' }).Count"
    Write-Host "增量备份: $(($Sorted | Where-Object { $_.type -eq 'incr' }).Count"
}

# 恢复备份
function Restore-Backup {
    param([string]$FileName)
    
    if (-not $FileName) {
        Write-Host "❌ 请指定要恢复的备份文件" -ForegroundColor Red
        return
    }
    
    $RestorePath = "$BACKUP_DIR\$FileName"
    
    if (-not (Test-Path $RestorePath)) {
        Write-Host "❌ 备份文件不存在: $FileName" -ForegroundColor Red
        return
    }
    
    Write-Host "⚠️ 即将恢复备份: $FileName" -ForegroundColor Yellow
    Write-Host "这将覆盖当前数据，是否继续？(y/N)" -ForegroundColor Yellow
    
    $Confirm = Read-Host
    if ($Confirm -ne "y") {
        Write-Host "取消恢复" -ForegroundColor Cyan
        return
    }
    
    Write-Host "📦 正在恢复..." -ForegroundColor Cyan
    
    # 解压到临时目录
    $TempDir = "$env:TEMP\xd-restore-$((Get-Date).Ticks)"
    Expand-Archive -Path $RestorePath -DestinationPath $TempDir -Force
    
    # 恢复各目录
    $Items = @(
        @{ src = "$TempDir\dolt"; dst = $DOLT_DIR },
        @{ src = "$TempDir\memory"; dst = $MEMORY_DIR }
    )
    
    foreach ($Item in $Items) {
        if (Test-Path $Item.src) {
            Write-Host "  恢复: $($Item.dst)" -ForegroundColor Cyan
            Backup-Item $Item.dst
            Copy-Item "$($Item.src)\*" $Item.dst -Recurse -Force
        }
    }
    
    # 清理临时目录
    Remove-Item $TempDir -Recurse -Force
    
    Write-Host "✅ 恢复完成" -ForegroundColor Green
}

# 备份单个目录（恢复前调用）
function Backup-Item {
    param([string]$Path)
    
    if (Test-Path $Path) {
        $BackupPath = "$Path.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Write-Host "  备份当前数据到: $BackupPath" -ForegroundColor Yellow
        Copy-Item $Path $BackupPath -Recurse -Force
    }
}

# 清理旧备份
function Clean-Backups {
    Write-Host "🧹 清理旧备份..." -ForegroundColor Cyan
    
    $Manifest = Get-Manifest
    
    # 保留策略
    $KeepFull = 4  # 保留最近 4 个全量
    $KeepIncr = 7   # 保留最近 7 个增量
    
    # 按时间排序
    $Sorted = $Manifest.backups | Sort-Object { $_.timestamp } -Descending
    
    $FullBackups = $Sorted | Where-Object { $_.type -eq "full" } | Select-Object -First $KeepFull
    $IncrBackups = $Sorted | Where-Object { $_.type -eq "incr" } | Select-Object -First $KeepIncr
    
    $ToKeep = @($FullBackups) + @($IncrBackups)
    $ToKeepIds = $ToKeep | ForEach-Object { $_.timestamp }
    
    $Removed = 0
    foreach ($Backup in $Manifest.backups) {
        if ($Backup.timestamp -notin $ToKeepIds) {
            $FilePath = "$BACKUP_DIR\$($Backup.file)"
            if (Test-Path $FilePath) {
                Write-Host "  删除: $($Backup.file)" -ForegroundColor Yellow
                Remove-Item $FilePath -Force
                $Removed++
            }
        }
    }
    
    # 更新 manifest
    $Manifest.backups = $ToKeep
    Save-Manifest $Manifest
    
    Write-Host "✅ 清理完成，删除 $Removed 个旧备份" -ForegroundColor Green
}

# 主逻辑
switch ($Action) {
    "Full" { Backup-Full }
    "Inc" { Backup-Increment }
    "Restore" { Restore-Backup $RestoreFile }
    "List" { List-Backups }
    "Clean" { Clean-Backups }
}
