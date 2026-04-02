# xiaoxi-dreams 版本管理脚本
# 用法：
#   .\version.ps1              # 查看当前版本
#   .\version.ps1 bump         # 递增版本
#   .\version.ps1 bump minor   # 递增 minor
#   .\version.ps1 bump major   # 递增 major
#   .\version.ps1 set 1.2.3   # 设置版本

param(
    [Parameter(Position=0)]
    [ValidateSet("bump", "set", "get", "tag", "release")]
    [string]$Action = "get",
    
    [Parameter(Position=1)]
    [ValidateSet("major", "minor", "patch")]
    [string]$BumpType = "patch",
    
    [Parameter(Position=1)]
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"

$WORKSPACE = "$env:USERPROFILE\.openclaw\workspace\xiaoxi-dreams"
$VERSION_FILE = "$WORKSPACE\VERSION"
$PKG_FILE = "$WORKSPACE\package.json"
$CHANGELOG_FILE = "$WORKSPACE\CHANGELOG.md"
$DOLT = "$env:USERPROFILE\Go\bin\dolt.exe"
$API_SERVER = "$WORKSPACE\server.js"

# 读取当前版本
function Get-CurrentVersion {
    if (Test-Path $VERSION_FILE) {
        return (Get-Content $VERSION_FILE -Raw).Trim()
    }
    return "0.0.0"
}

# 保存版本
function Set-Version {
    param([string]$Version)
    
    # 验证格式
    if ($Version -notmatch '^\d+\.\d+\.\d+$') {
        Write-Host "❌ 版本格式错误，应为 x.y.z" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "📝 设置版本: $Version" -ForegroundColor Cyan
    
    # 更新 VERSION 文件
    Set-Content -Path $VERSION_FILE -Value $Version -NoNewline
    
    # 更新 package.json
    $pkg = Get-Content $PKG_FILE | ConvertFrom-Json
    $pkg.version = $Version
    $pkg | ConvertTo-Json -Depth 10 | Set-Content $PKG_FILE
    
    Write-Host "✅ 版本已更新: $Version" -ForegroundColor Green
    
    return $Version
}

# 递增版本
function Bump-Version {
    param([string]$Type = "patch")
    
    $current = Get-CurrentVersion
    $parts = $current.Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]
    
    switch ($Type) {
        "major" { $major++; $minor = 0; $patch = 0 }
        "minor" { $minor++; $patch = 0 }
        "patch" { $patch++ }
    }
    
    $newVersion = "$major.$minor.$patch"
    Set-Version -Version $newVersion
    
    return $newVersion
}

# 生成 changelog 条目
function New-ChangelogEntry {
    param([string]$Version)
    
    $date = Get-Date -Format "yyyy-MM-dd"
    $entry = @"
## [$Version] - $date

### Features
- 新功能

### Improvements
- 改进

### Bug Fixes
- Bug 修复

### Documentation
- 文档更新

---
"@
    
    return $entry
}

# 获取 git 变更统计
function Get-GitChanges {
    $stats = @{
        features = 0
        fixes = 0
        docs = 0
        scripts = 0
    }
    
    try {
        $changes = git -C $WORKSPACE diff --name-only HEAD~1 HEAD 2>$null
        if ($changes) {
            foreach ($change in $changes) {
                if ($change -match "SKILL|skills") { $stats.features++ }
                elseif ($change -match "fix|bug") { $stats.fixes++ }
                elseif ($change -match "doc|readme|md") { $stats.docs++ }
                elseif ($change -match "script") { $stats.scripts++ }
            }
        }
    } catch {
        # ignore
    }
    
    return $stats
}

# 创建 git tag
function New-GitTag {
    param([string]$Version)
    
    Write-Host "🏷️ 创建 Git Tag: v$Version" -ForegroundColor Cyan
    
    try {
        git -C $WORKSPACE config user.email "xiaoxi@agent.local"
        git -C $WORKSPACE config user.name "xiaoxi-dreams"
        
        git -C $WORKSPACE add .
        git -C $WORKSPACE commit -m "chore: prepare release v$Version"
        
        git -C $WORKSPACE tag -a "v$Version" -m "Release v$Version"
        git -C $WORKSPACE push origin main --tags
        
        Write-Host "✅ Tag 已推送" -ForegroundColor Green
    } catch {
        Write-Host "❌ Tag 失败: $_" -ForegroundColor Red
    }
}

# 创建 Release
function New-Release {
    param([string]$Version)
    
    Write-Host "🚀 创建 GitHub Release: v$Version" -ForegroundColor Cyan
    
    # 更新 CHANGELOG
    $entry = New-ChangelogEntry -Version $Version
    $changelog = Get-Content $CHANGELOG_FILE -Raw
    $newChangelog = $entry + $changelog
    Set-Content -Path $CHANGELOG_FILE -Value $newChangelog
    
    # 提交 changelog
    git -C $WORKSPACE add CHANGELOG.md
    git -C $WORKSPACE commit -m "docs: update changelog for v$Version"
    git -C $WORKSPACE push
    
    # 创建 Release
    $body = @"
## What's New

- 完整的功能和改进

## Installation

\`\`\`bash
npm install -g xiaoxi-dreams
\`\`\`

## Usage

\`\`\`bash
xiaoxi-dreams dream
\`\`\`
"@
    
    gh release create "v$Version" `
        --repo "adminlove520/xiaoxi-dreams" `
        --title "v$Version" `
        --notes "$body" `
        --target main
    
    Write-Host "✅ Release 已创建" -ForegroundColor Green
}

# 错误处理
function Handle-Error {
    param([string]$Message)
    Write-Host "❌ 错误: $Message" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor DarkGray
    exit 1
}

# 主逻辑
try {
    switch ($Action) {
        "get" {
            $version = Get-CurrentVersion
            Write-Host ""
            Write-Host "📦 xiaoxi-dreams" -ForegroundColor Cyan
            Write-Host "   版本: $version" -ForegroundColor White
            Write-Host ""
            
            # 显示统计
            $stats = Get-GitChanges
            Write-Host "   变更统计:" -ForegroundColor Gray
            Write-Host "   - Features: $($stats.features)" -ForegroundColor Gray
            Write-Host "   - Fixes: $($stats.fixes)" -ForegroundColor Gray
            Write-Host "   - Docs: $($stats.docs)" -ForegroundColor Gray
            Write-Host ""
        }
        
        "bump" {
            $newVersion = Bump-Version -Type $BumpType
            Write-Host ""
            Write-Host "✅ 版本已递增: $newVersion" -ForegroundColor Green
            Write-Host ""
            Write-Host "下一步:" -ForegroundColor Cyan
            Write-Host "  1. .\version.ps1 tag      # 创建 tag" -ForegroundColor Gray
            Write-Host "  2. .\version.ps1 release  # 创建 release" -ForegroundColor Gray
            Write-Host ""
        }
        
        "set" {
            if (-not $Version) {
                Write-Host "❌ 请指定版本号: .\version.ps1 set 1.2.3" -ForegroundColor Red
                exit 1
            }
            Set-Version -Version $Version
        }
        
        "tag" {
            $version = Get-CurrentVersion
            New-GitTag -Version $version
        }
        
        "release" {
            $version = Get-CurrentVersion
            New-Release -Version $version
        }
    }
} catch {
    Handle-Error -Message $_.Exception.Message
}
