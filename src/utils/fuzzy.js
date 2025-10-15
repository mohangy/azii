// small fuzzy utilities: Levenshtein distance and normalized score
export function levenshtein(a, b) {
  const la = a.length, lb = b.length
  if (la === 0) return lb
  if (lb === 0) return la
  const dp = Array(la + 1).fill(null).map(() => Array(lb + 1).fill(0))
  for (let i = 0; i <= la; i++) dp[i][0] = i
  for (let j = 0; j <= lb; j++) dp[0][j] = j
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[la][lb]
}

export function normalizedDistance(a, b) {
  if (!a && !b) return 0
  const aa = String(a || '').toLowerCase()
  const bb = String(b || '').toLowerCase()
  const d = levenshtein(aa, bb)
  return d / Math.max(aa.length, bb.length, 1)
}

// compute best (lowest) normalized distance across multiple fields
export function bestNormalizedDistance(query, fields) {
  if (!query) return 0
  const q = String(query || '').toLowerCase()
  let best = 1
  for (const f of fields) {
    if (!f) continue
    const n = normalizedDistance(q, String(f).toLowerCase())
    if (n < best) best = n
    if (best === 0) break
  }
  return best
}
