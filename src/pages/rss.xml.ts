import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { SITE_TITLE, SITE_DESCRIPTION } from '@/config'

export async function GET(context: APIContext) {
  const modules = import.meta.glob('./posts/*.md', { eager: true }) as Record<
    string,
    any
  >
  const posts = Object.values(modules)
    .filter(p => p.frontmatter.public)
    .sort((a, b) => b.frontmatter.createdAt - a.frontmatter.createdAt)

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: posts.map(p => ({
      title: p.frontmatter.title,
      pubDate: new Date(p.frontmatter.createdAt),
      link: `/posts/${p.frontmatter.slug}/`,
      categories: p.frontmatter.tags ?? []
    }))
  })
}
