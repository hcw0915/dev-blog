import type { APIRoute } from 'astro'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'
import { paletteForTags } from '@/lib/tags'
import { SITE_TITLE } from '@/config'
import { playgrounds } from '@/data/playgrounds/index'

const fontPath = path.resolve('.fonts/NotoSansCJKtc-Bold.otf')

// 字型資料在 module 載入時讀取一次，避免每個 id 重複 I/O
if (!fs.existsSync(fontPath)) {
  throw new Error(
    `OG font missing at ${fontPath} — run \`node tools/fetch-og-font.mjs\` first`
  )
}
const fontData = fs.readFileSync(fontPath)

export async function getStaticPaths() {
  return playgrounds.map(p => ({
    params: { id: p.id },
    props: {
      title: p.title,
      tags: p.tags,
      template: p.template,
      date: p.createdAt
    }
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const { title, tags, template, date } = props as {
    title: string
    tags: string[]
    template: string
    date: string
  }
  // 跟文章 OG 圖同一條規則：主題色由標籤權重表決定，沒收錄的標籤退回品牌青色
  const accent = paletteForTags(tags)[0]?.base ?? '#22d3ee'
  const label = [`PLAYGROUND · ${template}`, ...tags].join('  ·  ')

  // satori 的參數型別是 ReactNode，這裡傳的是手寫的 element 物件，型別對不上但執行沒問題
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: 'Noto Sans TC'
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '16px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      backgroundColor: accent
                    }
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '26px', color: '#a1a1aa' },
                    children: label
                  }
                }
              ]
            }
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: title.length > 24 ? '60px' : '76px',
                fontWeight: 700,
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              },
              children: title
            }
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '28px',
                color: '#71717a'
              },
              children: [
                { type: 'div', props: { children: SITE_TITLE } },
                { type: 'div', props: { children: date.replace(/-/g, '.') } }
              ]
            }
          }
        ]
      }
    } as unknown as Parameters<typeof satori>[0],
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Noto Sans TC', data: fontData, weight: 700, style: 'normal' }
      ]
    }
  )

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 }
  })
    .render()
    .asPng()

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' }
  })
}
