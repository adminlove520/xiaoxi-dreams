# xiaoxi-dreams S3 云备份脚本
# 需要先安装 AWS CLI: https://aws.amazon.com/cli/

param(
    [Parameter(Position=0)]
    [ValidateSet("backup", "restore", "list", "clean", "setup")]
    [string]$Action = "backup",
    
    [Parameter(Position=1)]
    [string]$RestoreFile = ""
)

$ErrorActionPreference = "Stop"

# 配置
$BACKUP_DIR = "$env:USERPROFILE\.openclaw\workspace\xiaoxi-dreams\backups"
$WORKSPACE = "$env:USERPROFILE\.openclaw\workspace\xiaoxi-dreams"

# S3 配置
$S3_BUCKET = "xiaoxi-dreams-backups"
$S3_PREFIX = "backups/"
$S3_REGION = "us-east-1"

# 检查 AWS CLI
function Test-AWSCLI {
    try {
        $result = aws --version 2>&1
        return $true
    } catch {
        return $false
    }
}

# S3 上传
function Backup-S3 {
    Write-Host "☁️ 开始 S3 云备份..." -ForegroundColor Cyan
    
    if (-not (Test-AWSCLI)) {
        Write-Host "❌ AWS CLI 未安装" -ForegroundColor Red
        Write-Host "请先安装: https://aws.amazon.com/cli/" -ForegroundColor Yellow
        return
    }
    
    # 检查凭证
    try {
        aws sts get-caller-identity 2>&1 | Out-Null
    } catch {
        Write-Host "❌ AWS 凭证未配置" -ForegroundColor Red
        Write-Host "请运行: aws configure" -ForegroundColor Yellow
        return
    }
    
    # 获取最新的本地备份
    $latestBackup = Get-ChildItem -Path $BACKUP_DIR -Filter "full-*.tar.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if (-not $latestBackup) {
        Write-Host "⚠️ 没有找到本地全量备份，请先运行本地备份" -ForegroundColor Yellow
        return
    }
    
    Write-Host "📦 上传: $($latestBackup.Name)" -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $s3Key = "${S3_PREFIX}full-${timestamp}.tar.gz"
    
    # 上传到 S3
    Write-Host "☁️ 上传到 S3: s3://$S3_BUCKET/$s3Key" -ForegroundColor Cyan
    
    aws s3 cp $latestBackup.FullName "s3://$S3_BUCKET/$s3Key" `
        --region $S3_REGION `
        --storage-class GLACIER_INSTANT_RETRIEVAL
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ S3 上传完成" -ForegroundColor Green
        
        # 更新本地 manifest
        $manifestFile = "$BACKUP_DIR\manifest.json"
        if (Test-Path $manifestFile) {
            $manifest = Get-Content $manifestFile | ConvertFrom-Json
            $manifest | Add-Member -NotePropertyName "lastCloudBackup" -NotePropertyValue $timestamp -Force
            $manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestFile
        }
    } else {
        Write-Host "❌ S3 上传失败" -ForegroundColor Red
    }
}

# S3 列出备份
function List-S3Backups {
    Write-Host ""
    Write-Host "☁️ S3 备份列表" -ForegroundColor Cyan
    Write-Host "=" * 60
    Write-Host ""
    
    if (-not (Test-AWSCLI)) {
        Write-Host "❌ AWS CLI 未安装" -ForegroundColor Red
        return
    }
    
    aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX" --region $S3_REGION
}

# S3 恢复
function Restore-S3 {
    param([string]$FileName)
    
    if (-not $FileName) {
        Write-Host "❌ 请指定要恢复的文件名" -ForegroundColor Red
        Write-Host "使用: .\cloud-backup.ps1 list 查看可用文件" -ForegroundColor Yellow
        return
    }
    
    Write-Host "☁️ 从 S3 恢复: $FileName" -ForegroundColor Cyan
    
    # 创建临时目录
    $tempDir = "$env:TEMP\xd-s3-restore"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # 下载
    $localPath = "$tempDir\$FileName"
    aws s3 cp "s3://$S3_BUCKET/$S3_PREFIX$FileName" $localPath --region $S3_REGION
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 下载完成: $localPath" -ForegroundColor Green
        
        # 解压
        Write-Host "📦 解压中..." -ForegroundColor Cyan
        Expand-Archive -Path $localPath -DestinationPath $tempDir\tmp -Force
        
        # 显示解压内容
        Write-Host ""
        Write-Host "📂 解压内容:" -ForegroundColor Cyan
        Get-ChildItem "$tempDir\tmp" | ForEach-Object { Write-Host "  - $($_.Name)" }
        Write-Host ""
        
        # 提示恢复位置
        Write-Host "⚠️ 恢复将覆盖当前数据" -ForegroundColor Yellow
        Write-Host "请手动解压到目标位置" -ForegroundColor Yellow
    } else {
        Write-Host "❌ 恢复失败" -ForegroundColor Red
    }
}

# S3 清理旧备份
function Clean-S3Backups {
    Write-Host "🧹 清理 S3 旧备份 (保留最近 4 周)..." -ForegroundColor Cyan
    
    if (-not (Test-AWSCLI)) {
        Write-Host "❌ AWS CLI 未安装" -ForegroundColor Red
        return
    }
    
    # 获取所有备份
    $backups = aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX" --region $S3_REGION 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 获取备份列表失败" -ForegroundColor Red
        return
    }
    
    # 解析备份列表
    $cutoffDate = (Get-Date).AddDays(-28)  # 4 周前
    
    $removed = 0
    foreach ($line in $backups) {
        $parts = $line -split '\s+'
        if ($parts.Count -ge 4) {
            $fileName = $parts[4]
            $dateStr = $parts[0]
            
            # 解析日期
            try {
                $fileDate = [DateTime]::ParseExact($dateStr, "yyyy-MM-dd", $null)
                
                if ($fileDate -lt $cutoffDate) {
                    Write-Host "  🗑️ 删除: $fileName" -ForegroundColor Yellow
                    aws s3 rm "s3://$S3_BUCKET/$S3_PREFIX$fileName" --region $S3_REGION
                    $removed++
                }
            } catch {
                # 忽略解析错误
            }
        }
    }
    
    Write-Host "✅ 清理完成，删除 $removed 个旧备份" -ForegroundColor Green
}

# 设置向导
function Setup-S3 {
    Write-Host ""
    Write-Host "☁️ S3 备份设置向导" -ForegroundColor Cyan
    Write-Host "=" * 60
    Write-Host ""
    
    Write-Host "需要配置:" -ForegroundColor Yellow
    Write-Host "1. AWS 凭证 (Access Key + Secret Key)" -ForegroundColor Gray
    Write-Host "2. S3 Bucket 名称" -ForegroundColor Gray
    Write-Host "3. Bucket 策略 (可选)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "步骤:" -ForegroundColor Cyan
    Write-Host "1. 运行: aws configure" -ForegroundColor Gray
    Write-Host "2. 输入 Access Key 和 Secret Key" -ForegroundColor Gray
    Write-Host "3. Region: $S3_REGION" -ForegroundColor Gray
    Write-Host "4. 创建 Bucket:" -ForegroundColor Gray
    Write-Host "   aws s3 mb s3://$S3_BUCKET --region $S3_REGION" -ForegroundColor Gray
    Write-Host "5. 配置生命周期规则 (可选，自动删除30天后文件):" -ForegroundColor Gray
    Write-Host "   aws s3api put-bucket-lifecycle-configuration --bucket $S3_BUCKET --lifecycle-configuration file://lifecycle.json" -ForegroundColor Gray
    Write-Host ""
    
    # 创建示例 lifecycle 配置
    $lifecycle = @"
{
    "Rules": [
        {
            "ID": "CleanupOldBackups",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "backups/"
            },
            "Expiration": {
                "Days": 30
            }
        }
    ]
}
"@
    
    $lifecycleFile = "$WORKSPACE\lifecycle.json"
    $lifecycle | Set-Content $lifecycleFile
    
    Write-Host "✅ 已创建 lifecycle.json 配置文件" -ForegroundColor Green
    Write-Host ""
}

# 帮助
function Show-Help {
    Write-Host ""
    Write-Host "☁️ xiaoxi-dreams S3 云备份" -ForegroundColor Cyan
    Write-Host "=" * 60
    Write-Host ""
    Write-Host "用法:" -ForegroundColor Yellow
    Write-Host "  .\cloud-backup.ps1 backup    # 上传最新备份到 S3" -ForegroundColor Gray
    Write-Host "  .\cloud-backup.ps1 list      # 列出 S3 备份" -ForegroundColor Gray
    Write-Host "  .\cloud-backup.ps1 restore   # 从 S3 恢复" -ForegroundColor Gray
    Write-Host "  .\cloud-backup.ps1 clean    # 清理 30 天前备份" -ForegroundColor Gray
    Write-Host "  .\cloud-backup.ps1 setup    # 设置向导" -ForegroundColor Gray
    Write-Host ""
    Write-Host "前提条件:" -ForegroundColor Yellow
    Write-Host "  1. 安装 AWS CLI: https://aws.amazon.com/cli/" -ForegroundColor Gray
    Write-Host "  2. 配置凭证: aws configure" -ForegroundColor Gray
    Write-Host "  3. 创建 S3 Bucket" -ForegroundColor Gray
    Write-Host ""
}

# 主逻辑
switch ($Action) {
    "backup" { Backup-S3 }
    "list" { List-S3Backups }
    "restore" { Restore-S3 -RestoreFile $RestoreFile }
    "clean" { Clean-S3Backups }
    "setup" { Setup-S3 }
    default { Show-Help }
}
