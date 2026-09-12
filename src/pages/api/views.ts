import type { APIRoute } from "astro"

/**
 * 文章瀏覽數。這是全站唯一的動態路由，其餘頁面照舊預先渲染。
 *
 * 為什麼不用 Vercel Web Analytics 的數字：它只進 Vercel 後台，這個方案沒有可查詢的 API
 * （實測 web-analytics 的查詢 API 回 404），所以頁面上要顯示就得自己存一份。
 *
 * 儲存用 Upstash Redis REST：在 Vercel 開 Redis 之後，環境變數會自動注入，
 * 這支路由不用改。還沒開之前 hasStore 是 false，一律回 0 —— 頁面顯示 0，不是壞掉。
 */
export const prerender = false

/**
 * 執行階段才讀變數：Astro 的 import.meta.env 只在建置時內聯 PUBLIC_ 開頭的值，
 * serverless 上要拿非公開變數得走 process.env。兩個都查，本機與雲端都適用。
 *
 * 名稱也不寫死一組：Upstash 走 Vercel 整合時可能是 KV_REST_API_*、UPSTASH_REDIS_REST_*，
 * 或使用者自訂前綴（例如 STORAGE_）。找不到就掃一遍找出長得像 REST 端點的那組。
 */
const readEnv = (): { url?: string; token?: string; source?: string } => {
  const env: Record<string, string | undefined> = {
    ...(typeof process !== "undefined" ? process.env : {}),
    ...(import.meta.env as Record<string, string | undefined>)
  }
  const pairs: [string, string][] = [
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]
  ]
  for (const [u, t] of pairs) {
    if (env[u] && env[t]) return { url: env[u], token: env[t], source: u }
  }
  // 自訂前綴：找 *_REST_API_URL 或 *_URL 且值是 https 的，再配同前綴的 token
  const urlKey = Object.keys(env).find(
    k => /(_REST_API_URL|_KV_REST_API_URL)$/.test(k) && String(env[k]).startsWith("https://")
  )
  if (urlKey) {
    const tokenKey = urlKey.replace(/_URL$/, "_TOKEN")
    if (env[tokenKey]) return { url: env[urlKey], token: env[tokenKey], source: urlKey }
  }
  return {}
}

/** 只回報名稱，不回報值：用來確認雲端到底注入了哪些變數 */
const envNames = () =>
  Object.keys({
    ...(typeof process !== "undefined" ? process.env : {}),
    ...(import.meta.env as Record<string, unknown>)
  })
    .filter(k => /KV|UPSTASH|REDIS|STORAGE/i.test(k))
    .sort()

/** slug 只允許小寫英數與 -，避免被拿去組任意 Redis key */
const isValidSlug = (s: string) => /^[a-z0-9][a-z0-9-]{0,80}$/.test(s)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  })

async function redis(url: string, token: string, command: string[]): Promise<number> {
  const res = await fetch(`${url}/${command.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(`upstash ${res.status}`)
  const data = (await res.json()) as { result: string | number | null }
  return Number(data.result ?? 0)
}

export const GET: APIRoute = async ({ url: reqUrl }) => {
  const slug = reqUrl.searchParams.get("slug") ?? ""
  if (reqUrl.searchParams.has("debug")) return json({ envNames: envNames(), resolved: Boolean(readEnv().url) })
  if (!isValidSlug(slug)) return json({ error: "bad slug" }, 400)
  const { url, token, source } = readEnv()
  if (!url || !token) return json({ slug, count: 0, store: false })
  try {
    return json({ slug, count: await redis(url, token, ["get", `views:${slug}`]), store: true, source })
  } catch {
    return json({ slug, count: 0, store: true, error: true })
  }
}

export const POST: APIRoute = async ({ url: reqUrl }) => {
  const slug = reqUrl.searchParams.get("slug") ?? ""
  if (!isValidSlug(slug)) return json({ error: "bad slug" }, 400)
  const { url, token, source } = readEnv()
  if (!url || !token) return json({ slug, count: 0, store: false })
  try {
    return json({ slug, count: await redis(url, token, ["incr", `views:${slug}`]), store: true, source })
  } catch {
    return json({ slug, count: 0, store: true, error: true })
  }
}
