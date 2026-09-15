import type { APIRoute } from "astro"
import { paletteForTags } from "@/lib/tags"
import { playgrounds } from "@/data/playgrounds/index"
import { ogCard } from "@/lib/og"

export async function getStaticPaths() {
  return playgrounds.map(p => ({
    params: { id: p.id },
    props: { title: p.title, tags: p.tags, template: p.template, date: p.createdAt }
  }))
}

export const GET: APIRoute = ({ props }) => {
  const { title, tags, template, date } = props as {
    title: string
    tags: string[]
    template: string
    date: string
  }
  return ogCard({
    label: [`PLAYGROUND · ${template}`, ...tags].join("  ·  "),
    title,
    footerNote: date.replace(/-/g, "."),
    // 跟文章 OG 圖同一條規則
    accent: paletteForTags(tags)[0]?.base ?? "#22d3ee"
  })
}
