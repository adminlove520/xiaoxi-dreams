import type { Health, HealthDimensions, HealthStatus, Trend } from './types'

/**
 * 数据驱动的健康度计算
 *
 * Score = freshness×0.25 + coverage×0.25 + coherence×0.20 + efficiency×0.15 + accessibility×0.15
 */
export function calculateHealth(
  memoryCounts: {
    total: number
    recent7d: number
    byType: Record<string, number>
    avgImportance: number
  },
  previousHealth: Health | null
): Omit<Health, 'id' | 'created_at'> {
  const { total, recent7d, byType, avgImportance } = memoryCounts

  if (total === 0) {
    return {
      date: new Date().toISOString().split('T')[0],
      score: 0,
      status: 'unknown',
      dimensions: { freshness: 0, coverage: 0, coherence: 0, efficiency: 0, accessibility: 0 },
      trend: 'stable',
    }
  }

  const lessons = byType['lesson'] || 0
  const decisions = byType['decision'] || 0
  const facts = byType['fact'] || 0
  const procedures = byType['procedure'] || 0
  const typeVariety = Object.keys(byType).length

  // 五维评分 (0-100)
  const freshness = Math.min(100, (recent7d / Math.max(total, 1)) * 60 + total * 3)
  const coverage = Math.min(100, (lessons + decisions) * 8 + typeVariety * 10)
  const coherence = Math.min(100, avgImportance * 12)
  const efficiency = Math.min(100, Math.log2(total + 1) * 15)
  const accessibility = Math.min(100, (facts + procedures) * 12)

  const score = Math.round(
    freshness * 0.25 +
    coverage * 0.25 +
    coherence * 0.20 +
    efficiency * 0.15 +
    accessibility * 0.15
  )

  let status: HealthStatus = 'unknown'
  if (score >= 70) status = 'healthy'
  else if (score >= 50) status = 'warning'
  else if (score > 0) status = 'critical'

  let trend: Trend = 'stable'
  if (previousHealth) {
    if (score > previousHealth.score + 2) trend = 'up'
    else if (score < previousHealth.score - 2) trend = 'down'
  }

  const dimensions: HealthDimensions = {
    freshness: +(freshness / 100).toFixed(3),
    coverage: +(coverage / 100).toFixed(3),
    coherence: +(coherence / 100).toFixed(3),
    efficiency: +(efficiency / 100).toFixed(3),
    accessibility: +(accessibility / 100).toFixed(3),
  }

  return {
    date: new Date().toISOString().split('T')[0],
    score,
    status,
    dimensions,
    trend,
  }
}
