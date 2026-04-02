# xiaoxi-dreams Evaluator Script
# 用于自动评审报告质量

param(
    [Parameter(Mandatory=$true)]
    [string]$ReportPath,
    
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# 评审维度配置
$Dimensions = @{
    Completeness = @{
        Weight = 0.25
        MaxScore = 25
        Questions = @(
            "是否有遗漏的重要记忆？",
            "是否有明显的空白领域？",
            "来源是否充分？"
        )
    }
    Accuracy = @{
        Weight = 0.25
        MaxScore = 25
        Questions = @(
            "记忆分类是否正确？",
            "重要性评分是否合理？",
            "内容是否准确？"
        )
    }
    Readability = @{
        Weight = 0.20
        MaxScore = 20
        Questions = @(
            "摘要是否清晰？",
            "结构是否合理？",
            "格式是否规范？"
        )
    }
    Coherence = @{
        Weight = 0.15
        MaxScore = 15
        Questions = @(
            "与已有记忆是否矛盾？",
            "关联关系是否正确？",
            "逻辑是否连贯？"
        )
    }
    Actionability = @{
        Weight = 0.15
        MaxScore = 15
        Questions = @(
            "未来能快速检索吗？",
            "是否有足够的上下文？",
            "建议是否可执行？"
        )
    }
}

# 计算分数
function Get-DimensionScore {
    param(
        [string]$Dimension,
        [string]$ReportContent
    )
    
    $config = $Dimensions[$Dimension]
    $questions = $config.Questions
    $maxScore = $config.MaxScore
    
    # 简单评分逻辑：检查关键词
    $score = $maxScore
    $issues = @()
    
    switch ($Dimension) {
        "Completeness" {
            # 检查是否包含必要的部分
            if ($ReportContent -notmatch "## 🌀 梦境报告") {
                $score -= 5
                $issues += "缺少报告标题"
            }
            if ($ReportContent -notmatch "### 📊 统计") {
                $score -= 3
                $issues += "缺少统计部分"
            }
            if ($ReportContent -notmatch "### ❤️ 健康度") {
                $score -= 3
                $issues += "缺少健康度部分"
            }
            if ($ReportContent -notmatch "### 🔮 洞察") {
                $score -= 3
                $issues += "缺少洞察部分"
            }
            if ($ReportContent -notmatch "### 📝 重要变更") {
                $score -= 3
                $issues += "缺少变更部分"
            }
            if ($ReportContent -notmatch "### 💡 行动建议") {
                $score -= 3
                $issues += "缺少建议部分"
            }
            # 检查洞察数量
            $insights = ([regex]::Matches($ReportContent, @('\d+\. \*\*\[.*\]\*\*')).Count
            if ($insights -lt 1) {
                $score -= 5
                $issues += "洞察数量不足"
            }
        }
        "Accuracy" {
            # 检查健康度是否在合理范围
            if ($ReportContent -match "健康度:\s*(\d+)" ) {
                $health = $matches[1]
                if ($health -lt 0 -or $health -gt 100) {
                    $score -= 10
                    $issues += "健康度数值异常"
                }
            }
            # 检查是否有明确的类型标注
            if ($ReportContent -notmatch "\[lesson\]|\[decision\]|\[project\]|\[fact\]") {
                $score -= 5
                $issues += "缺少类型标注"
            }
        }
        "Readability" {
            # 检查表格格式
            if ($ReportContent -notmatch "\|.*\|") {
                $score -= 5
                $issues += "缺少表格"
            }
            # 检查长度
            $lines = ($ReportContent -split "`n").Count
            if ($lines -lt 20) {
                $score -= 5
                $issues += "报告过短"
            }
            if ($lines -gt 200) {
                $score -= 5
                $issues += "报告过长"
            }
        }
        "Coherence" {
            # 检查 MEMORY.md 是否存在矛盾
            # 简化版：只检查格式一致性
            if ($ReportContent -match "\[.*\].*\1") {
                # 可能存在重复
                $score -= 3
            }
        }
        "Actionability" {
            # 检查是否有具体建议
            $suggestions = ([regex]::Matches($ReportContent, @"### 💡 行动建议" -split "---")[1]).Count
            if ($suggestions -lt 1) {
                $score -= 5
                $issues += "缺少具体建议"
            }
        }
    }
    
    return @{
        Score = [Math]::Max(0, $score)
        MaxScore = $maxScore
        Issues = $issues
    }
}

# 主评审流程
Write-Host ""
Write-Host "🔍 xiaoxi-dreams Evaluator" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# 读取报告
if (!(Test-Path $ReportPath)) {
    Write-Host "❌ 报告文件不存在: $ReportPath" -ForegroundColor Red
    exit 1
}

$ReportContent = Get-Content $ReportPath -Raw

Write-Host "📄 报告: $ReportPath" -ForegroundColor Cyan
Write-Host ""

# 计算各维度分数
$TotalScore = 0
$TotalMaxScore = 0
$DimensionResults = @{}

foreach ($Dimension in $Dimensions.Keys) {
    $result = Get-DimensionScore -Dimension $Dimension -ReportContent $ReportContent
    
    $weightedScore = $result.Score
    $TotalScore += $weightedScore
    $TotalMaxScore += $result.MaxScore
    
    $DimensionResults[$Dimension] = $result
    
    # 颜色
    $pct = $result.Score / $result.MaxScore
    if ($pct -ge 0.8) { $color = "Green" }
    elseif ($pct -ge 0.6) { $color = "Yellow" }
    else { $color = "Red" }
    
    Write-Host "$Dimension`: $($result.Score)/$($result.MaxScore)" -ForegroundColor $color
    
    if ($Verbose -and $result.Issues.Count -gt 0) {
        foreach ($issue in $result.Issues) {
            Write-Host "  - $issue" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "-" * 60
Write-Host "总分: $TotalScore / $TotalMaxScore" -ForegroundColor Cyan

# 判断结果
$PassScore = $TotalMaxScore * 0.8
$ImproveScore = $TotalMaxScore * 0.6

if ($TotalScore -ge $PassScore) {
    $Result = "✅ PASS"
    $Color = "Green"
    $Advice = "报告通过，可以推送"
}
elseif ($TotalScore -ge $ImproveScore) {
    $Result = "🟡 IMPROVE"
    $Color = "Yellow"
    $Advice = "需要改进后推送"
}
else {
    $Result = "🔴 FAIL"
    $Color = "Red"
    $Advice = "需要重做"
}

Write-Host ""
Write-Host "评审结果: $Result" -ForegroundColor $Color
Write-Host "建议: $Advice" -ForegroundColor $Color
Write-Host ""

# 输出 JSON 结果
$resultJson = @{
    totalScore = $TotalScore
    maxScore = $TotalMaxScore
    percentage = [Math]::Round($TotalScore / $TotalMaxScore * 100, 1)
    result = $Result -replace "✅|🟡|🔴", "" -replace "\s+", ""
    dimensions = $DimensionResults
    advice = $Advice
} | ConvertTo-Json

Write-Host $resultJson

# 返回退出码
if ($Result -match "PASS") { exit 0 }
elseif ($Result -match "IMPROVE") { exit 1 }
else { exit 2 }
