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

const url = import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL
const token = import.meta.env.KV_REST_API_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN
const hasStore = Boolean(url && token)

/** slug 只允許小寫英數與 -，避免被拿去組任意 Redis key */
const isValidSlug = (s: string) => /^[a-z0-9][a-z0-9-]{0,80}$/.test(s)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  })

async function redis(command: string[]): Promise<number> {
  const res = await fetch(`${url}/${command.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(`upstash ${res.status}`)
  const data = (await res.json()) as { result: string | number | null }
  return Number(data.result ?? 0)
}

export const GET: APIRoute = async ({ url: reqUrl }) => {
  const slug = reqUrl.searchParams.get("slug") ?? ""
  if (!isValidSlug(slug)) return json({ error: "bad slug" }, 400)
  if (!hasStore) return json({ slug, count: 0, store: false })
  try {
    return json({ slug, count: await redis(["get", `views:${slug}`]), store: true })
  } catch {
    return json({ slug, count: 0, store: true, error: true })
  }
}

export const POST: APIRoute = async ({ url: reqUrl }) => {
  const slug = reqUrl.searchParams.get("slug") ?? ""
  if (!isValidSlug(slug)) return json({ error: "bad slug" }, 400)
  if (!hasStore) return json({ slug, count: 0, store: false })
  try {
    return json({ slug, count: await redis(["incr", `views:${slug}`]), store: true })
  } catch {
    return json({ slug, count: 0, store: true, error: true })
  }
}
