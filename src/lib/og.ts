/**
 * OG 分享圖的共用版型。文章、playground 與站台預設圖都由這裡產生：
 * 頂緣一條主題色、分頁籤上的笑臉當識別、中間大標，底部站名與日期。
 *
 * 抽出來的原因是三種卡片的 satori 樣板本來是逐字複製的，改一次版型要改三個地方。
 */
import satori from "satori"
import { Resvg } from "@resvg/resvg-js"
import fs from "node:fs"
import path from "node:path"
import { SITE_TITLE } from "@/config"

const fontPath = path.resolve(".fonts/NotoSansCJKtc-Bold.otf")

// 字型與圖示在 module 載入時各讀一次，不隨每張圖重複 I/O
if (!fs.existsSync(fontPath)) {
  throw new Error(`OG font missing at ${fontPath} — run \`node tools/fetch-og-font.mjs\` first`)
}
const fontData = fs.readFileSync(fontPath)

// 分頁籤上的那個笑臉。satori 不會去讀檔案系統，圖要以 data URI 傳進去；
// 取 512 的那份而不是 32x32 的 favicon，縮到 OG 尺寸才不會糊。
const mark = `data:image/png;base64,${fs.readFileSync(path.resolve("public/android-chrome-512x512.png")).toString("base64")}`

export interface OgCardOptions {
  /** 頂部小字：文章放標籤列，playground 放類型與標籤 */
  label: string
  /** 中間大標 */
  title: string
  /** 右下角，通常是日期；站台預設圖留空 */
  footerNote?: string
  /** 主題色，畫成頂緣橫條 */
  accent: string
}

export async function ogCard({ label, title, footerNote = "", accent }: OgCardOptions): Promise<Response> {
  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "Noto Sans TC"
        },
        children: [
          { type: "div", props: { style: { width: "100%", height: "10px", backgroundColor: accent } } },
          {
            type: "div",
            props: {
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "62px 72px 72px"
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { display: "flex", alignItems: "center", gap: "18px" },
                    children: [
                      { type: "img", props: { src: mark, width: 48, height: 48 } },
                      { type: "div", props: { style: { fontSize: "26px", color: "#a1a1aa" }, children: label } }
                    ]
                  }
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: title.length > 24 ? "60px" : "76px",
                      fontWeight: 700,
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    },
                    children: title
                  }
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "28px",
                      color: "#71717a"
                    },
                    children: [
                      { type: "div", props: { children: SITE_TITLE } },
                      { type: "div", props: { children: footerNote } }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
      // satori 的參數型別是 ReactNode，這裡傳的是手寫的 element 物件，型別對不上但執行沒問題
    } as unknown as Parameters<typeof satori>[0],
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Noto Sans TC", data: fontData, weight: 700, style: "normal" }]
    }
  )

  return new Response(new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng(), {
    headers: { "Content-Type": "image/png" }
  })
}
