/** 從 since（YYYY-MM）到 now 的年資，顯示成「3Y 10M」；整年時省略月份 */
export function tenure(since: string, now = new Date()): string {
  const [y, m] = since.split("-").map(Number)
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m)
  const Y = Math.floor(months / 12), M = months % 12
  return M ? `${Y}Y ${M}M` : `${Y}Y`
}
