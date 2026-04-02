# xiaoxi-dreams 性能测试脚本

param(
    [switch]$Verbose,
    [switch]$Quick
)

$ErrorActionPreference = "Stop"

$WORKSPACE = "$env:USERPROFILE\.openclaw\workspace\xiaoxi-dreams"
$MEMORY_DIR = "$env:USERPROFILE\.openclaw\workspace\memory"
$DOLT = "$env:USERPROFILE\Go\bin\dolt.exe"

Write-Host ""
Write-Host "⚡ xiaoxi-dreams 性能测试" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

$results = @{}

# 1. 内存扫描测试
Write-Host "1. 内存扫描测试..." -ForegroundColor Yellow

if (-not $Quick) {
    # 全量扫描
    $start = Get-Date
    $files = Get-ChildItem -Path $MEMORY_DIR -Filter "*.md" -Recurse -ErrorAction SilentlyContinue
    $elapsed = ((Get-Date) - $start).TotalMilliseconds
    $results["full_scan"] = $elapsed
    Write-Host "  全量扫描: $($elapsed.ToString('F1'))ms ($($files.Count) 文件)" -ForegroundColor Gray
    
    # 增量扫描 (假设最近 3 天有新文件)
    $start = Get-Date
    $recentFiles = $files | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-3) }
    foreach ($file in $recentFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    }
    $elapsed = ((Get-Date) - $start).TotalMilliseconds
    $results["incr_scan"] = $elapsed
    Write-Host "  增量扫描: $($elapsed.ToString('F1'))ms ($($recentFiles.Count) 文件)" -ForegroundColor Gray
}

# 2. Dolt 查询测试
Write-Host ""
Write-Host "2. Dolt 查询测试..." -ForegroundColor Yellow

$start = Get-Date
$doltResult = & $DOLT sql -q "SELECT COUNT(*) as cnt FROM memory_entries;" --raw 2>&1
$elapsed = ((Get-Date) - $start).TotalMilliseconds
$results["dolt_query"] = $elapsed
Write-Host "  记忆计数: $($elapsed.ToString('F1'))ms" -ForegroundColor Gray

$start = Get-Date
$doltResult = & $DOLT sql -q "SELECT date, health_score FROM health_metrics ORDER BY date DESC LIMIT 7;" --raw 2>&1
$elapsed = ((Get-Date) - $start).TotalMilliseconds
$results["dolt_health"] = $elapsed
Write-Host "  健康度历史: $($elapsed.ToString('F1'))ms" -ForegroundColor Gray

# 3. MEMORY.md 读取测试
Write-Host ""
Write-Host "3. MEMORY.md 读取测试..." -ForegroundColor Yellow

$start = Get-Date
$memory = Get-Content "$WORKSPACE\MEMORY.md" -Raw -ErrorAction SilentlyContinue
$elapsed = ((Get-Date) - $start).TotalMilliseconds
$results["memory_read"] = $elapsed
$lines = if ($memory) { ($memory -split "`n").Count } else { 0 }
Write-Host "  读取: $($elapsed.ToString('F1'))ms ($lines 行)" -ForegroundColor Gray

# 4. 文件系统测试
Write-Host ""
Write-Host "4. 文件系统测试..." -ForegroundColor Yellow

$start = Get-Date
$testFile = "$env:TEMP\xd-benchmark-test.txt"
"test content" | Set-Content $testFile
$result = Get-Content $testFile -Raw
Remove-Item $testFile -Force
$elapsed = ((Get-Date) - $start).TotalMilliseconds
$results["fs_latency"] = $elapsed
Write-Host "  文件系统延迟: $($elapsed.ToString('F1'))ms" -ForegroundColor Gray

# 5. 估算 Token
Write-Host ""
Write-Host "5. Token 估算..." -ForegroundColor Yellow

$avgCharsPerToken = 4  # 约 4 字符 = 1 token
$memoryTokens = if ($memory) { [Math]::Ceiling($memory.Length / $avgCharsPerToken) } else { 0 }
$results["memory_tokens"] = $memoryTokens
Write-Host "  MEMORY.md: ~$memoryTokens tokens" -ForegroundColor Gray

# 计算报告 prompt 估算
$reportTokens = 800 + $memoryTokens
$results["report_tokens"] = $reportTokens
Write-Host "  报告生成: ~$reportTokens tokens" -ForegroundColor Gray

# 输出汇总
Write-Host ""
Write-Host "=" * 60
Write-Host "📊 性能汇总" -ForegroundColor Cyan
Write-Host ""

$totalTime = 0

if ($results["full_scan"]) { $totalTime += $results["full_scan"] }
if ($results["dolt_query"]) { $totalTime += $results["dolt_query"] }
if ($results["memory_read"]) { $totalTime += $results["memory_read"] }

Write-Host "总耗时: $($totalTime.ToString('F1'))ms" -ForegroundColor White

if ($results["incr_scan"] -and $results["full_scan"]) {
    $improvement = (1 - $results["incr_scan"] / $results["full_scan"]) * 100
    Write-Host "增量扫描提升: $($improvement.ToString('F0'))%" -ForegroundColor Green
}

Write-Host ""

# 性能评估
Write-Host "📈 性能评估:" -ForegroundColor Cyan

$allGood = $true
foreach ($key in $results.Keys) {
    $value = $results[$key]
    
    if ($key -match "scan" -and $value -gt 5000) {
        Write-Host "  ⚠️ $key 较慢: ${value}ms" -ForegroundColor Yellow
        $allGood = $false
    }
    elseif ($key -match "dolt" -and $value -gt 500) {
        Write-Host "  ⚠️ $key 较慢: ${value}ms" -ForegroundColor Yellow
        $allGood = $false
    }
}

if ($allGood) {
    Write-Host "  ✅ 性能正常" -ForegroundColor Green
}

Write-Host ""

# Verbose 输出
if ($Verbose) {
    Write-Host "详细数据:" -ForegroundColor Cyan
    foreach ($key in $results.Keys) {
        Write-Host "  $key`: $($results[$key])" -ForegroundColor Gray
    }
    Write-Host ""
}

# 优化建议
Write-Host "💡 优化建议:" -ForegroundColor Cyan

if ($results["full_scan"] -gt 2000) {
    Write-Host "  - 考虑使用增量扫描，减少扫描时间" -ForegroundColor Gray
}

if ($results["memory_tokens"] -gt 2000) {
    Write-Host "  - MEMORY.md 较大，考虑精简或分层加载" -ForegroundColor Gray
}

if ($results["dolt_query"] -gt 200) {
    Write-Host "  - Dolt 查询慢，考虑添加缓存" -ForegroundColor Gray
}

Write-Host ""
