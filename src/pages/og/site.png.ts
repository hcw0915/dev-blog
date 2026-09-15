import type { APIRoute } from "astro"
import { ogCard } from "@/lib/og"

/**
 * 沒有自己 OG 圖的頁面（首頁、關於、列表頁、404）共用這張。
 * 先前它們吃的是一張沒有任何文字的漸層 public/cover.png，分享出去看不出是什麼站。
 */
export const GET: APIRoute = () =>
  ogCard({
    label: "antonio-blog-one.vercel.app",
    title: "前端工程筆記與作品集",
    accent: "#8b5cf6"
  })
