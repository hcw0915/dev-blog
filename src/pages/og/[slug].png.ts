import type { APIRoute } from 'astro'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'
import { COLOR_MAP } from '@/config'

const fontPath = path.resolve('.fonts/NotoSansCJKtc-Bold.otf')

export async function getStaticPaths() {
  const modules = import.meta.glob('../posts/*.md', { eager: true }) as Record<
    string,
    any
  >
  return Object.values(modules)
    .filter(p => p.frontmatter.public)
    .map(p => ({
      params: { slug: p.frontmatter.slug },
      props: {
        title: p.frontmatter.title as string,
        tags: (p.frontmatter.tags ?? []) as string[],
        date: new Date(p.frontmatter.createdAt)
      }
    }))
}

export const GET: APIRoute = async ({ props }) => {
  if (!fs.existsSync(fontPath)) {
    throw new Error(
      `OG font missing at ${fontPath} — run \`node tools/fetch-og-font.mjs\` first`
    )
  }
  const fontData = fs.readFileSync(fontPath)
  const { title, tags, date } = props as {
    title: string
    tags: string[]
    date: Date
  }
  const accent = COLOR_MAP[(tags[0] ?? '').toLowerCase()] ?? '#22d3ee'
  const dateText = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`

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
                    style: { fontSize: '28px', color: '#a1a1aa' },
                    children: tags.length ? tags.join(' · ') : 'DevLog'
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
                lineHeight: 1.3
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
                { type: 'div', props: { children: 'Antonio - DevLog' } },
                { type: 'div', props: { children: dateText } }
              ]
            }
          }
        ]
      }
    },
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
