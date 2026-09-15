import type { APIRoute } from "astro"
import { paletteForTags } from "@/lib/tags"
import { ogCard } from "@/lib/og"

export async function getStaticPaths() {
  const modules = import.meta.glob("../posts/*.md", { eager: true }) as Record<string, any>
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

export const GET: APIRoute = ({ props }) => {
  const { title, tags, date } = props as { title: string; tags: string[]; date: Date }
  return ogCard({
    label: tags.length ? tags.join(" · ") : "Antonio.dev",
    title,
    footerNote: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`,
    // 主題色統一由 lib/tags 的權重表決定，沒收錄的標籤退回品牌青色
    accent: paletteForTags(tags)[0]?.base ?? "#22d3ee"
  })
}
